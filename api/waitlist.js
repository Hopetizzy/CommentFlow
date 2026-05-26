import { list, put } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

// Check if we should fall back to local disk (when running locally without Blob Token)
const useLocalFs = !process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DB_FILE = path.join(process.cwd(), 'emails.json');

async function initLocalDb() {
  try {
    await fs.access(LOCAL_DB_FILE);
  } catch (err) {
    await fs.writeFile(LOCAL_DB_FILE, JSON.stringify([], null, 2));
  }
}

async function getWaitlist() {
  if (useLocalFs) {
    try {
      await initLocalDb();
      const data = await fs.readFile(LOCAL_DB_FILE, 'utf8');
      return { waitlist: JSON.parse(data), url: null };
    } catch (err) {
      console.error("Error reading local waitlist:", err);
      return { waitlist: [], url: null };
    }
  }

  // Vercel Blob storage in production
  try {
    const { blobs } = await list();
    const fileBlob = blobs.find(b => b.pathname === 'emails.json');
    if (!fileBlob) return { waitlist: [], url: null };

    const res = await fetch(fileBlob.url);
    if (res.ok) {
      const waitlist = await res.json();
      return { waitlist, url: fileBlob.url };
    }
  } catch (err) {
    console.error("Error reading blob waitlist:", err);
  }
  return { waitlist: [], url: null };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { waitlist } = await getWaitlist();

      // Check duplicates
      const exists = waitlist.some(item => item.email === cleanEmail);
      if (exists) {
        return res.status(409).json({ error: 'This email is already registered.' });
      }

      const entry = {
        email: cleanEmail,
        timestamp: new Date().toISOString()
      };

      waitlist.push(entry);

      // Save database
      if (useLocalFs) {
        await fs.writeFile(LOCAL_DB_FILE, JSON.stringify(waitlist, null, 2));
      } else {
        // Upload and overwrite emails.json in Vercel Blob
        await put('emails.json', JSON.stringify(waitlist, null, 2), {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'application/json'
        });
      }

      return res.status(201).json({ message: 'Success! You have joined the waitlist.', entry });
    } catch (error) {
      console.error('Database write error:', error);
      return res.status(500).json({ error: 'Database storage error. Please check your Blob store configuration.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { waitlist } = await getWaitlist();
      return res.status(200).json(waitlist);
    } catch (error) {
      console.error('Database read error:', error);
      return res.status(500).json({ error: 'Database retrieval error.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
