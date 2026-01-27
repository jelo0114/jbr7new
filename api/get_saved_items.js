// api/get_saved_items.js
// Returns server-side saved items for the current user

import { getSavedItems } from '../supabse-conn/index';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userIdHeader = req.headers['x-user-id'] || req.headers['x-userid'];
  const userId = userIdHeader ? Number(userIdHeader) : null;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const items = await getSavedItems(userId);
    return res.status(200).json({ success: true, items });
  } catch (e) {
    console.error('get_saved_items error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load saved items' });
  }
}

