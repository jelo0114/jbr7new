// api/update_notification_preference.js
// Updates notification_preferences for the current user

import { setNotificationPreference } from '../supabse-conn/index';

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
    const type = body.notification_type;
    const enabled = body.enabled ? 1 : 0;

    if (!type) {
      return res.status(400).json({ success: false, error: 'Missing notification_type' });
    }

    const current = {
      order_status: true,
      cart_reminder: true,
    };

    if (type === 'order_status') {
      current.order_status = !!enabled;
    }
    if (type === 'cart_reminder') {
      current.cart_reminder = !!enabled;
    }

    await setNotificationPreference(userId, current);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('update_notification_preference error:', e);
    return res.status(500).json({ success: false, error: 'Failed to update notification preference' });
  }
}

