import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'emails.json');

// Body parsers
app.use(express.json());

// Bulletproof CORS headers middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize database file if it doesn't exist
async function initDb() {
  try {
    await fs.access(DB_FILE);
  } catch (err) {
    // If file doesn't exist, initialize with empty array
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
  }
}

// POST endpoint: add email to waitlist
app.post('/api/waitlist', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    await initDb();
    const data = await fs.readFile(DB_FILE, 'utf8');
    const waitlist = JSON.parse(data);

    // Duplicate check
    const exists = waitlist.some(item => item.email === cleanEmail);
    if (exists) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // Add entry
    const entry = {
      email: cleanEmail,
      timestamp: new Date().toISOString()
    };
    waitlist.push(entry);

    // Write back atomically
    await fs.writeFile(DB_FILE, JSON.stringify(waitlist, null, 2));

    return res.status(201).json({ message: 'Success! You have joined the waitlist.', entry });
  } catch (error) {
    console.error('Waitlist POST error:', error);
    return res.status(500).json({ error: 'Server database error. Please try again.' });
  }
});

// GET endpoint: list waitlist emails (for admin panel view)
app.get('/api/waitlist', async (req, res) => {
  try {
    await initDb();
    const data = await fs.readFile(DB_FILE, 'utf8');
    const waitlist = JSON.parse(data);
    return res.status(200).json(waitlist);
  } catch (error) {
    console.error('Waitlist GET error:', error);
    return res.status(500).json({ error: 'Server database error.' });
  }
});

// Start listening
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Waitlist Database server running on http://localhost:${PORT}`);
  });
});
