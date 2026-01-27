// api/update_order_status.js
// Placeholder endpoint for periodic status polling

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // In a real system this would update orders based on time or external status.
  // For now, just return no changes so the UI polling doesn't break.
  return res.status(200).json({
    success: true,
    updated: {
      shipped: 0,
      delivered: 0,
    },
  });
}

// api/update_order_status.js
// Updates an order's status (e.g. shipped / delivered)

import { updateOrderStatus } from '../supabse-conn/index';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const orderId = body.order_id || body.id || null;
    const status = body.status || 'shipped';

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Missing order_id' });
    }

    await updateOrderStatus(Number(orderId), status);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('update_order_status error:', e);
    return res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
}

