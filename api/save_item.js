// api/save_item.js
// Saves an item to the user's saved_items table

import { addSavedItem } from '../supabse-conn/index';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userIdHeader = req.headers['x-user-id'] || req.headers['x-userid'];
  const userId = userIdHeader ? Number(userIdHeader) : null;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const body = req.body || {};
    const title = body.title || '';
    const price = body.price != null ? Number(body.price) : null;
    const image = body.image || null;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Missing title' });
    }

    await addSavedItem(userId, {
      title,
      price,
      metadata: { image },
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('save_item error:', e);
    return res.status(500).json({ success: false, error: 'Failed to save item' });
  }
}

