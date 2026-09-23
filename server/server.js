const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

const db = require('./db');

const app = express();
// ... all your API routes above ...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));

// Export Express app for Vercel Serverless Functions
module.exports = app;

// ============================================================================
// 1. CORS CONFIGURATION (Fixes React Vite 5173 <-> Express 5000 mismatch)
// ============================================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost');
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ============================================================================
// 2. MULTER & CLOUDINARY CONFIGURATION (With Resilient Fallback Engine)
// ============================================================================
// Memory storage handles uploads in memory without stream-level abort crashes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Resilient processor: uploads to Cloudinary if credentials are valid,
// but gracefully falls back to Data URI if Cloudinary credentials mismatch or offline!
async function processImageUpload(file, folder = 'echo_note_app') {
  if (!file) return { url: null, publicId: null };

  if (hasCloudinaryCredentials) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      console.log('☁️ [Cloudinary] Upload success:', uploadResult.secure_url);
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      };
    } catch (cloudErr) {
      console.warn(`⚠️ [Cloudinary] Upload failed (${cloudErr.message}). Activating resilient fallback.`);
    }
  }

  // Resilient fallback: base64 Data URI stored safely in PostgreSQL TEXT column
  const mimeType = file.mimetype || 'image/jpeg';
  const base64 = file.buffer.toString('base64');
  return {
    url: `data:${mimeType};base64,${base64}`,
    publicId: `fallback_${Date.now()}`
  };
}

// ============================================================================
// 3. API ENDPOINTS
// ============================================================================

// Health & Diagnostic Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db.getStatus(),
    cloudinary: {
      hasCredentials: hasCloudinaryCredentials,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'unconfigured'
    },
    version: '1.0.0'
  });
});

// GET: Fetch all user profiles
app.get('/api/users', async (req, res, next) => {
  try {
    const users = await db.getUsers();
    const formatted = users.map((u) => ({
      ...u,
      avatar_url: u.profile_pic_url || u.avatar_url
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// PUT: Upload or update user profile picture
app.put('/api/users/:id/avatar', upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { url, publicId } = await processImageUpload(req.file, 'echo_avatars');
    const updatedUser = await db.updateUserAvatar(id, url, publicId);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const formatted = {
      ...updatedUser,
      avatar_url: updatedUser.profile_pic_url || updatedUser.avatar_url
    };
    console.log(`🖼️ [Avatar Updated] User ID ${id} profile picture updated.`);
    res.json(formatted);
  } catch (err) {
    console.error('Avatar update route error:', err);
    next(err);
  }
});

// PUT: Full profile dashboard update (name, bio, optional new avatar)
app.put('/api/users/:id', upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { display_name, bio, profile_pic_url } = req.body;

    const updatePayload = {};
    if (display_name !== undefined) {
      if (!display_name.trim()) {
        return res.status(400).json({ error: 'Display name cannot be empty' });
      }
      updatePayload.display_name = display_name;
    }
    if (bio !== undefined) {
      updatePayload.bio = bio;
    }

    if (req.file) {
      const { url, publicId } = await processImageUpload(req.file, 'echo_avatars');
      updatePayload.profile_pic_url = url;
      updatePayload.profile_pic_public_id = publicId;
    } else if (profile_pic_url !== undefined) {
      updatePayload.profile_pic_url = profile_pic_url;
    }

    const updatedUser = await db.updateUserProfile(id, updatePayload);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const formatted = {
      ...updatedUser,
      avatar_url: updatedUser.profile_pic_url || updatedUser.avatar_url
    };
    console.log(`✨ [Profile Updated] User ID ${id} (${updatedUser.display_name}) profile saved.`);
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET: Fetch all notes
app.get('/api/notes', async (req, res, next) => {
  try {
    const notes = await db.getNotes();
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

// POST: Create a note with optional photo attachment
app.post('/api/notes', upload.single('image'), async (req, res, next) => {
  try {
    const { sender_name, content, category } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty' });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const processed = await processImageUpload(req.file, 'echo_notes');
      imageUrl = processed.url;
      imagePublicId = processed.publicId;
    }

    const note = await db.createNote({
      sender_name: sender_name || 'Me',
      content: content.trim(),
      category: category || 'thought',
      image_url: imageUrl,
      image_public_id: imagePublicId
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
});

// DELETE: Delete a note by ID
app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteNote(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

// GET: Fetch all "Open-When" letters
app.get('/api/letters', async (req, res, next) => {
  try {
    const letters = await db.getLetters();
    res.json(letters);
  } catch (err) {
    next(err);
  }
});

// POST: Create and seal a new "Open-When" letter
app.post('/api/letters', async (req, res, next) => {
  try {
    const { sender_name, trigger_label, content } = req.body;

    if (!trigger_label || !trigger_label.trim()) {
      return res.status(400).json({ error: 'Trigger label is required (e.g. "Open when you miss me")' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Letter content cannot be empty' });
    }

    const letter = await db.createLetter({
      sender_name: sender_name || 'Me',
      trigger_label: trigger_label.trim(),
      content: content.trim()
    });

    res.status(201).json(letter);
  } catch (err) {
    next(err);
  }
});

// PUT: Mark a letter as opened
app.put('/api/letters/:id/open', async (req, res, next) => {
  try {
    const { id } = req.params;
    const openedLetter = await db.openLetter(id);

    if (!openedLetter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    res.json(openedLetter);
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. ERROR HANDLING MIDDLEWARE
// ============================================================================

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('⚠️ Multer upload error:', err.message);
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  next(err);
});

// Global API error handler
app.use((err, req, res, next) => {
  console.error('🔥 [Server Error]:', err.stack || err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================================
// 5. SERVER BOOTSTRAP
// ============================================================================
async function startServer() {
  // Initialize database schema and verify connections
  await db.initDatabase();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌹 Echo & Note API Server running on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer();

module.exports = app;