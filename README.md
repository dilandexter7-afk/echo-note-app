# 🌹 Echo & Note — Private Shared Couples Space

A modern, private, and romantic PERN-stack (PostgreSQL, Express, React, Node.js) web application designed exclusively for two people.

---

## ✨ Features
1. **Romantic Dark Sanctuary**: Styled in deep midnight slate (`#0F172A`), warm amber gold (`#F59E0B`), and romantic rose (`#FB7185`), with responsive layouts and subtle micro-interactions.
2. **Top Profile Header & Camera Upload**: Displays both partner avatars with real-time Cloudinary photo replacement via camera badge.
3. **Active User Switcher**: Seamless 1-click toggle to post notes and seal letters as "Me" or "Her".
4. **Interactive Note & Moments Feed**: Post sweet thoughts, love notes, inside jokes, songs, and memories with optional photo attachments, category pills, search bar, and heart reactions.
5. **"Open-When" Letter Vault**: Interactive digital envelopes with wax-seal aesthetics. Click sealed envelopes to trigger celebratory confetti bursts and reveal locked romantic letters, updating `is_opened` and `opened_at` in the database.
6. **Autonomous Error Resilience**: Built-in fallbacks for Supabase SSL connections (`ssl: { rejectUnauthorized: false }`), Multer file handling, and in-memory demo fallback mode if database credentials are pending.

---

## 📁 Project Structure

```
echo-note-app/
├── client/                     # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── App.jsx             # Main interactive application
│   │   ├── App.css             # Romantic dark mode design system
│   │   ├── LetterVault.jsx     # Open-When envelope vault & modal
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML5 with Google Fonts (Playfair & Jakarta)
│   ├── vite.config.js          # Vite configuration with /api proxy
│   ├── vercel.json             # Vercel SPA rewrites
│   └── package.json
│
├── server/                     # Backend API (Node.js + Express)
│   ├── server.js               # Express app, Multer, Cloudinary, & routes
│   ├── db.js                   # Supabase Pool, SSL, & auto-migrations
│   ├── schema.sql              # Safe PostgreSQL schema & seeds
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── render.yaml                 # 1-Click Render deployment blueprint
└── README.md
```

---

## 🚀 Quick Start (Local Run)

### 1. Backend Setup
1. Open a terminal in `/server`:
   ```bash
   cd server
   npm install
   ```
2. Create your `.env` file (copy from `.env.example`):
   ```env
   PORT=5000
   DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLIENT_URL=http://localhost:5173
   ```
   > **Note**: If you don't have a Supabase database yet, the server will automatically activate a resilient in-memory store so you can test all features immediately!

3. Run the backend:
   ```bash
   npm start
   # Server runs on http://localhost:5000
   ```

### 2. Frontend Setup
1. Open another terminal in `/client`:
   ```bash
   cd client
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   # App opens on http://localhost:5173
   ```

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Create a free project on [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Paste the contents of `server/schema.sql` and click **Run**.
4. Retrieve your connection string from **Project Settings > Database > Connection String (URI)** and update `DATABASE_URL` in `server/.env`.

---

## ☁️ Free Production Deployment

### Backend (Render.com)
1. Push your code to GitHub.
2. Sign up on [Render.com](https://render.com) (Free Tier).
3. Click **New + > Web Service** and connect your GitHub repository.
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string.
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary Cloud Name.
   - `CLOUDINARY_API_KEY`: Your Cloudinary API Key.
   - `CLOUDINARY_API_SECRET`: Your Cloudinary Secret.
   - `CLIENT_URL`: Your Vercel frontend URL.

### Frontend (Vercel.com)
1. Sign up on [Vercel.com](https://vercel.com) (Free Tier).
2. Click **Add New... > Project** and import your GitHub repository.
3. Set:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
4. Add Environment Variable:
   - `VITE_API_URL`: Your Render backend URL (e.g. `https://echo-note-server.onrender.com`).
5. Click **Deploy**!

---

## 🔒 Security & Best Practices
- Supabase SSL is configured with `rejectUnauthorized: false` to avoid proxy drops on modern serverless hosts.
- File uploads are validated with a 10MB limit and restricted to images (`jpg`, `png`, `webp`, `jpeg`, `gif`).
- Safe SQL queries with parameterized statements (`$1`, `$2`) to prevent SQL injection.
