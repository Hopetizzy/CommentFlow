import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Bulletproof CORS headers for flexibility
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
      // Check if email already exists in Vercel KV Set
      const exists = await kv.sismember('commentflow_emails_set', cleanEmail);
      if (exists) {
        return res.status(409).json({ error: 'This email is already registered.' });
      }

      const entry = {
        email: cleanEmail,
        timestamp: new Date().toISOString()
      };

      // Add to set (for quick duplicate check)
      await kv.sadd('commentflow_emails_set', cleanEmail);
      
      // Push to list (to preserve chronological order)
      await kv.rpush('commentflow_emails_list', JSON.stringify(entry));

      return res.status(201).json({ message: 'Success! You have joined the waitlist.', entry });
    } catch (error) {
      console.error('Vercel KV POST error:', error);
      return res.status(500).json({ error: 'Database storage error. Please check your KV config.' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Fetch all entries from chronological list
      const list = await kv.lrange('commentflow_emails_list', 0, -1);
      
      // Parse items since they are stored as JSON strings
      const parsed = list.map(item => {
        try {
          return typeof item === 'string' ? JSON.parse(item) : item;
        } catch (e) {
          return { email: item, timestamp: new Date().toISOString() };
        }
      });

      return res.status(200).json(parsed);
    } catch (error) {
      console.error('Vercel KV GET error:', error);
      return res.status(500).json({ error: 'Database retrieval error. Please check your KV config.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
