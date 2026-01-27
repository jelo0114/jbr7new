// api/create_order_notification.js
// Creates an order_status notification row for the current user

import { createOrderNotification } from '../supabse-conn/index';

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
    await createOrderNotification(userId, {
      order_id: body.order_id || null,
      order_number: body.order_number || null,
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('create_order_notification error:', e);
    return res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
}

