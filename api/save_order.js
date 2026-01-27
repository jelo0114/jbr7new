// api/save_order.js
// Saves an order + order_items using Supabase

import { saveOrderWithItems } from '../supabse-conn/index';

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
    const result = await saveOrderWithItems(userId, body);
    return res.status(200).json({ success: true, ...result });
  } catch (e) {
    console.error('save_order error:', e);
    return res.status(500).json({ success: false, error: 'Failed to save order' });
  }
}

