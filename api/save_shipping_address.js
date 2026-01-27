// api/save_shipping_address.js
// Inserts or updates a shipping address for the current user

import { saveShippingAddress } from '../supabse-conn/index';

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
    // For now we always insert; you can extend this to do updates by id if needed
    await saveShippingAddress(userId, body);
    return res.status(200).json({ success: true, message: 'Address saved' });
  } catch (e) {
    console.error('save_shipping_address error:', e);
    return res.status(500).json({ success: false, error: 'Failed to save address' });
  }
}

