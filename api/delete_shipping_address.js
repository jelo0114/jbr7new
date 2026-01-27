// api/delete_shipping_address.js
// Deletes a shipping address row for the current user

import { deleteShippingAddress } from '../supabse-conn/index';

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
    const id = body.id ? Number(body.id) : null;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing address id' });
    }

    await deleteShippingAddress(userId, id);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('delete_shipping_address error:', e);
    return res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
}

