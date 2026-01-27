// api/get_notification_preference.js
// Returns notification_preferences row for the current user

import { getNotificationPreference } from '../supabse-conn/index';

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
    const preferences = await getNotificationPreference(userId);
    return res.status(200).json({ success: true, preferences });
  } catch (e) {
    console.error('get_notification_preference error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load notification preferences' });
  }
}

