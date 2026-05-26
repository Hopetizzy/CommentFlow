# 🌊 CommentFlow

> **CommentFlow** is a premium, high-performance social asset creation studio and comment scrub engine. It transforms messy social media comments (from TikTok, YouTube, and more) into styled, visually compelling quote cards.

---

## ✨ Features

- **🚀 Smart Scrub Engine**: Cleans timestamp indicators (e.g. `1yr ago`, `now`, `2d to 5d`, `1 yr`), duplicate items, emojis, and styling elements automatically.
- **🎨 Glassmorphic Customization**: Modify cards dynamically with multiple aspect ratios (`1:1` Square, `9:16` Vertical, `16:9` Landscape), premium theme gradients, custom fonts, rounded bounds, shadows, custom avatars, and global user handle overrides.
- **🎭 Canvas Backgrounds**: High-performance animated background featuring glowing orbit circles, micro-particles, cursor deflection proximity, and a floating brand watermark.
- **💾 Local Waitlist Database**: Lightweight backend Express server saving registrations locally with email syntax validation and duplicate verification.
- **📱 PWA Shell Capabilities**: Registered Service Workers (`sw.js`) for offline execution support.

---

## 📂 Project Structure

```text
commentflow/
├── public/
│   ├── manifest.json         # PWA config
│   └── sw.js                 # Service worker
├── src/
│   ├── components/
│   │   ├── BackgroundFlow.tsx# Canvas floating animation
│   │   ├── CardPreview.tsx   # Glassmorphic card previewer
│   │   └── LandingPage.tsx   # Landing waitlist page
│   ├── parser.ts             # Scrub engine rules
│   ├── presets.ts            # Platform demo texts
│   ├── index.css             # Gradient animations & styling definitions
│   └── App.tsx               # Workspace routing & layout engine
├── server.js                 # Express server + JSON database backend
└── README.md                 # Project guide
```

---

## 🛠️ Local Development Setup

To run CommentFlow locally, you need [Node.js](https://nodejs.org) installed on your system.

### 1. Install Dependencies
Run this in the root directory:
```bash
npm install
```

### 2. Start the Frontend Dev Server
Runs the client-side SPA on `http://localhost:3001` (or next available port):
```bash
npm run dev
```

### 3. Start the Database Backend
Launches the Express API server on `http://localhost:5000` to process waitlist registrations:
```bash
node server.js
```

---

## 📱 PWA Standalone App Installation

CommentFlow is optimized to be installed directly onto your device as a standalone application. Install it from the browser address bar while visiting the application workspace.

---

## 📦 Production Deployment

### 1. Build the Frontend Assets
Compile code and bundle visual assets:
```bash
npm run build
```
This builds static assets into the `/dist` directory.

### 2. Live Host Options

- **Option A: Monolith Server (Recommended for VPS)**
  Serve static files using your Express backend. Update `server.js` to serve index fallback files:
  ```javascript
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
  ```
  Then deploy and execute:
  ```bash
  node server.js
  ```

- **Option B: Jamstack / Static Host (e.g. Vercel, Netlify)**
  Deploy the generated `/dist` directory to a static provider, and deploy `server.js` as serverless functions or on a hosting service (e.g. Render, Heroku) pointing the frontend environment requests to the API domain.
