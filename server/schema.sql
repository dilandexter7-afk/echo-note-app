-- =========================================================
-- ECHO & NOTE: Database Schema & Initial Migrations
-- PostgreSQL (Compatible with Supabase / Neon / Render)
-- =========================================================

-- 1. USERS TABLE
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

-- 2. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  sender_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'thought', -- 'thought', 'love', 'quote', 'joke', 'song', 'memory'
  image_url TEXT,
  image_public_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. LETTERS TABLE ("Open-When" Vault)
CREATE TABLE IF NOT EXISTS letters (
  id SERIAL PRIMARY KEY,
  sender_name VARCHAR(100) NOT NULL,
  trigger_label VARCHAR(255) NOT NULL, -- e.g. "Open when you miss me"
  content TEXT NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SAFE SEED DATA (Safe re-runs with ON CONFLICT DO NOTHING)
-- =========================================================

-- Seed Two Default User Accounts ('Me' and 'Her')
INSERT INTO users (username, display_name, profile_pic_url, bio)
VALUES 
  (
    'me', 
    'Me', 
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 
    'Always thinking of you ✨'
  ),
  (
    'her', 
    'Her', 
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 
    'My favorite human & sanctuary 🌙'
  )
ON CONFLICT (username) DO NOTHING;

-- Seed Initial Starter Notes if table is empty
INSERT INTO notes (sender_name, content, category, image_url)
SELECT 'Her', 'Just wanted to remind you how deeply loved and appreciated you are today. Keep shining!', 'love', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80'
WHERE NOT EXISTS (SELECT 1 FROM notes);

INSERT INTO notes (sender_name, content, category)
SELECT 'Me', 'Listening to our favorite song on the way home and smiling like an idiot thinking of you. ❤️', 'song'
WHERE (SELECT COUNT(*) FROM notes) = 1;

-- Seed Initial "Open-When" Letters if table is empty
INSERT INTO letters (sender_name, trigger_label, content, is_opened)
SELECT 
  'Me',
  'Open when you miss me most',
  'Close your eyes for three seconds and breathe. Wherever we are in the world, under the exact same sky, my heart is right next to yours. I cannot wait to hold your hand again soon. You are my forever home. 💕',
  FALSE
WHERE NOT EXISTS (SELECT 1 FROM letters);

INSERT INTO letters (sender_name, trigger_label, content, is_opened)
SELECT 
  'Her',
  'Open when you had a exhausting day',
  'Take off your shoes, grab a cup of warm tea, and let the weight of the day roll off your shoulders. You worked so hard today, and I am so proud of your resilience. Tonight, you rest. I love you endlessly. ☕✨',
  FALSE
WHERE (SELECT COUNT(*) FROM letters) = 1;

INSERT INTO letters (sender_name, trigger_label, content, is_opened)
SELECT 
  'Me',
  'Open when you need a little reminder why I love you',
  'I love the way your eyes light up when you laugh, the warmth of your touch, the kindness you show everyone around you, and how safe you make me feel. There are a million reasons, and every single one is true. 🌟',
  FALSE
WHERE (SELECT COUNT(*) FROM letters) = 2;
