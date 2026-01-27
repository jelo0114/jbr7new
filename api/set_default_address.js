// api/set_default_address.js
// Marks one shipping address as default for the current user

import { setDefaultShippingAddress } from '../supabse-conn/index';

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

    await setDefaultShippingAddress(userId, id);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('set_default_address error:', e);
    return res.status(500).json({ success: false, error: 'Failed to set default address' });
  }
}

