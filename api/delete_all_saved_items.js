// api/delete_all_saved_items.js
// Clears all saved_items rows for the current user

import { deleteAllSavedItems } from '../supabse-conn/index';

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
    await deleteAllSavedItems(userId);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('delete_all_saved_items error:', e);
    return res.status(500).json({ success: false, error: 'Failed to clear saved items' });
  }
}

