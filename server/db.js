const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let isPostgresConnected = false;
let dbErrorDetails = null;

// ============================================================================
// RESILIENT IN-MEMORY STORE (Fallback if PostgreSQL / Supabase credentials pending)
// ============================================================================
const memoryStore = {
  users: [
    {
      id: 1,
      username: 'me',
      display_name: 'Me',
      profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      profile_pic_public_id: null,
      bio: 'Always thinking of you ✨',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'her',
      display_name: 'Her',
      profile_pic_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      profile_pic_public_id: null,
      bio: 'My favorite human & sanctuary 🌙',
      created_at: new Date().toISOString()
    }
  ],
  notes: [
    {
      id: 1,
      sender_name: 'Her',
      content: 'Just wanted to remind you how deeply loved and appreciated you are today. Keep shining!',
      category: 'love',
      image_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
      image_public_id: null,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      sender_name: 'Me',
      content: 'Listening to our favorite song on the way home and smiling like an idiot thinking of you. ❤️',
      category: 'song',
      image_url: null,
      image_public_id: null,
      created_at: new Date().toISOString()
    }
  ],
  letters: [
    {
      id: 1,
      sender_name: 'Me',
      trigger_label: 'Open when you miss me most',
      content: 'Close your eyes for three seconds and breathe. Wherever we are in the world, under the exact same sky, my heart is right next to yours. I cannot wait to hold your hand again soon. You are my forever home. 💕',
      is_opened: false,
      opened_at: null,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      sender_name: 'Her',
      trigger_label: 'Open when you had an exhausting day',
      content: 'Take off your shoes, grab a cup of warm tea, and let the weight of the day roll off your shoulders. You worked so hard today, and I am so proud of your resilience. Tonight, you rest. I love you endlessly. ☕✨',
      is_opened: false,
      opened_at: null,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      sender_name: 'Me',
      trigger_label: 'Open when you need a little reminder why I love you',
      content: 'I love the way your eyes light up when you laugh, the warmth of your touch, the kindness you show everyone around you, and how safe you make me feel. There are a million reasons, and every single one is true. 🌟',
      is_opened: false,
      opened_at: null,
      created_at: new Date().toISOString()
    }
  ]
};

// ============================================================================
// POSTGRESQL POOL CONFIGURATION (Supabase Compatible)
// ============================================================================
const rawUrl = process.env.DATABASE_URL;
// Defensive sanitizer: remove accidental [ ] around password if entered from Supabase docs
const connectionString = rawUrl ? rawUrl.replace(/\[([^\]]+)\]/, '$1') : null;

const isPlaceholderUrl = !connectionString || 
  connectionString.includes('YOUR-SUPABASE-PASSWORD') || 
  connectionString.includes('your-password') ||
  connectionString.includes('postgres://postgres:password@');

if (!isPlaceholderUrl && connectionString) {
  try {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString: connectionString,
      // Critical Supabase SSL requirement: rejectUnauthorized: false prevents self-signed/proxy cert drops
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    });

    pool.on('error', (err) => {
      console.warn('⚠️ [Database] Idle client warning:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ [Database] Pool initialization error:', err.message);
    pool = null;
  }
} else {
  console.log('ℹ️ [Database] DATABASE_URL is unconfigured or contains placeholder. Resilient in-memory storage is active.');
}

// ============================================================================
// AUTOMATIC SCHEMA INITIALIZATION & MIGRATIONS
// ============================================================================
async function initDatabase() {
  if (!pool) {
    isPostgresConnected = false;
    dbErrorDetails = 'DATABASE_URL contains placeholder or is missing';
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      console.log('🔗 [Database] Connecting to PostgreSQL (Supabase)...');

      // Create Tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          display_name VARCHAR(100) NOT NULL,
          profile_pic_url TEXT,
          profile_pic_public_id TEXT,
          bio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          sender_name VARCHAR(100) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(50) DEFAULT 'thought',
          image_url TEXT,
          image_public_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS letters (
          id SERIAL PRIMARY KEY,
          sender_name VARCHAR(100) NOT NULL,
          trigger_label VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          is_opened BOOLEAN DEFAULT FALSE,
          opened_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Ensure password_hash allows NULL or default
      await client.query(`
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
      `).catch(() => {});

      // Safe Seed: Default Users ('Me' and 'Her') if none exist
      const userCountRes = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO users (username, display_name, profile_pic_url, bio, password_hash)
          VALUES 
            ('me', 'Me', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'Always thinking of you ✨', 'password123'),
            ('her', 'Her', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 'My favorite human & sanctuary 🌙', 'password123');
        `);
      }

      // Safe Seed: Initial Starter Notes if none exist
      await client.query(`
        INSERT INTO notes (sender_name, content, category, image_url)
        SELECT 'Her', 'Just wanted to remind you how deeply loved and appreciated you are today. Keep shining!', 'love', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80'
        WHERE NOT EXISTS (SELECT 1 FROM notes);
      `);

      // Safe Seed: Initial Starter Letters if none exist
      await client.query(`
        INSERT INTO letters (sender_name, trigger_label, content, is_opened)
        SELECT 'Me', 'Open when you miss me most', 'Close your eyes for three seconds and breathe. Wherever we are in the world, under the exact same sky, my heart is right next to yours. I cannot wait to hold your hand again soon. You are my forever home. 💕', FALSE
        WHERE NOT EXISTS (SELECT 1 FROM letters);

        INSERT INTO letters (sender_name, trigger_label, content, is_opened)
        SELECT 'Her', 'Open when you had an exhausting day', 'Take off your shoes, grab a cup of warm tea, and let the weight of the day roll off your shoulders. You worked so hard today, and I am so proud of your resilience. Tonight, you rest. I love you endlessly. ☕✨', FALSE
        WHERE (SELECT COUNT(*) FROM letters) = 1;
      `);

      isPostgresConnected = true;
      dbErrorDetails = null;
      console.log('✅ [Database] PostgreSQL connected and schemas verified successfully on Supabase.');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isPostgresConnected = false;
    dbErrorDetails = err.message;
    console.warn(`⚠️ [Database] Connection to PostgreSQL failed: ${err.message}`);
    console.log('💡 [Database] Resilient in-memory storage will serve all requests seamlessly.');
    return false;
  }
}

// ============================================================================
// RESILIENT REPOSITORY API (Directly serves Controllers)
// ============================================================================
const db = {
  // Check health / status
  getStatus: () => ({
    type: isPostgresConnected ? 'PostgreSQL (Supabase)' : 'In-Memory Resilient Store',
    connected: isPostgresConnected,
    mode: isPostgresConnected ? 'production' : 'fallback-dev',
    error: dbErrorDetails
  }),

  // USERS
  getUsers: async () => {
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query('SELECT id, username, display_name, profile_pic_url, bio, created_at FROM users ORDER BY id ASC');
      return rows;
    }
    return memoryStore.users;
  },

  updateUserAvatar: async (id, imageUrl, publicId) => {
    const numId = parseInt(id, 10);
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query(
        'UPDATE users SET profile_pic_url = $1, profile_pic_public_id = $2 WHERE id = $3 RETURNING id, username, display_name, profile_pic_url, bio, created_at',
        [imageUrl, publicId, numId]
      );
      if (rows && rows.length > 0) return rows[0];
    }
    const user = memoryStore.users.find(u => u.id === numId);
    if (user) {
      user.profile_pic_url = imageUrl;
      user.profile_pic_public_id = publicId;
      return { ...user };
    }
    return null;
  },

  updateUserProfile: async (id, { display_name, bio, profile_pic_url, profile_pic_public_id }) => {
    const numId = parseInt(id, 10);
    if (isPostgresConnected && pool) {
      let query = 'UPDATE users SET ';
      const values = [];
      let idx = 1;

      if (display_name !== undefined) {
        query += `display_name = $${idx++}, `;
        values.push(display_name.trim());
      }
      if (bio !== undefined) {
        query += `bio = $${idx++}, `;
        values.push(bio ? bio.trim() : null);
      }
      if (profile_pic_url !== undefined) {
        query += `profile_pic_url = $${idx++}, `;
        values.push(profile_pic_url);
      }
      if (profile_pic_public_id !== undefined) {
        query += `profile_pic_public_id = $${idx++}, `;
        values.push(profile_pic_public_id);
      }

      query = query.replace(/, $/, '');
      query += ` WHERE id = $${idx} RETURNING id, username, display_name, profile_pic_url, bio, created_at`;
      values.push(numId);

      const { rows } = await pool.query(query, values);
      if (rows && rows.length > 0) return rows[0];
    }

    const user = memoryStore.users.find(u => u.id === numId);
    if (user) {
      if (display_name !== undefined) user.display_name = display_name.trim();
      if (bio !== undefined) user.bio = bio ? bio.trim() : null;
      if (profile_pic_url !== undefined) user.profile_pic_url = profile_pic_url;
      if (profile_pic_public_id !== undefined) user.profile_pic_public_id = profile_pic_public_id;
      return { ...user };
    }
    return null;
  },

  // NOTES
  getNotes: async () => {
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
      return rows;
    }
    return [...memoryStore.notes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  createNote: async ({ sender_name, content, category, image_url, image_public_id }) => {
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query(
        'INSERT INTO notes (sender_name, content, category, image_url, image_public_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [sender_name, content, category || 'thought', image_url, image_public_id]
      );
      return rows[0];
    }
    const newNote = {
      id: Date.now(),
      sender_name,
      content,
      category: category || 'thought',
      image_url: image_url || null,
      image_public_id: image_public_id || null,
      created_at: new Date().toISOString()
    };
    memoryStore.notes.unshift(newNote);
    return newNote;
  },

  deleteNote: async (id) => {
    const numId = parseInt(id, 10);
    if (isPostgresConnected && pool) {
      const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [numId]);
      return rowCount > 0;
    }
    const idx = memoryStore.notes.findIndex(n => n.id === numId);
    if (idx !== -1) {
      memoryStore.notes.splice(idx, 1);
      return true;
    }
    return false;
  },

  // LETTERS ("Open-When" Vault)
  getLetters: async () => {
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query('SELECT * FROM letters ORDER BY created_at DESC');
      return rows;
    }
    return [...memoryStore.letters].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  createLetter: async ({ sender_name, trigger_label, content }) => {
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query(
        'INSERT INTO letters (sender_name, trigger_label, content, is_opened) VALUES ($1, $2, $3, FALSE) RETURNING *',
        [sender_name, trigger_label, content]
      );
      return rows[0];
    }
    const newLetter = {
      id: Date.now(),
      sender_name,
      trigger_label,
      content,
      is_opened: false,
      opened_at: null,
      created_at: new Date().toISOString()
    };
    memoryStore.letters.unshift(newLetter);
    return newLetter;
  },

  openLetter: async (id) => {
    const numId = parseInt(id, 10);
    const openedAt = new Date().toISOString();
    if (isPostgresConnected && pool) {
      const { rows } = await pool.query(
        'UPDATE letters SET is_opened = TRUE, opened_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [numId]
      );
      return rows[0];
    }
    const letter = memoryStore.letters.find(l => l.id === numId);
    if (letter) {
      letter.is_opened = true;
      letter.opened_at = openedAt;
      return { ...letter };
    }
    return null;
  },

  // Direct pool access for custom queries if needed
  pool,
  initDatabase
};

module.exports = db;