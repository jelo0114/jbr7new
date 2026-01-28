// api/cancel_order.js
// Cancels an order for the current user

import { cancelOrder } from '../supabse-conn/index';

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
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Missing order_id' });
    }

    await cancelOrder(userId, Number(order_id));
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('cancel_order error:', e);
    return res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
}

