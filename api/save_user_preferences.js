// api/save_user_preferences.js
// Updates default payment / courier preferences for the current user

import { setUserPreferences } from '../supabse-conn/index';

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
    const default_payment = body.default_payment ?? null;
    const default_courier = body.default_courier ?? null;

    await setUserPreferences(userId, { default_payment, default_courier });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('save_user_preferences error:', e);
    return res.status(500).json({ success: false, error: 'Failed to save preferences' });
  }
}

