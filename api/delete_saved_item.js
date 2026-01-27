// api/delete_saved_item.js
// Removes a single saved item for the current user

import { deleteSavedItem } from '../supabse-conn/index';

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

    if (!title) {
      return res.status(400).json({ success: false, error: 'Missing title' });
    }

    await deleteSavedItem(userId, title);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('delete_saved_item error:', e);
    return res.status(500).json({ success: false, error: 'Failed to delete saved item' });
  }
}

