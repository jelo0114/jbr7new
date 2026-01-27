// api/get_user_preferences.js
// Returns default payment / courier preferences for the current user

import { getUserPreferences } from '../supabse-conn/index';

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
    const preferences = await getUserPreferences(userId);
    return res.status(200).json({ success: true, preferences });
  } catch (e) {
    console.error('get_user_preferences error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load preferences' });
  }
}

