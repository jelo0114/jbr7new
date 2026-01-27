// api/get_shipping_addresses.js
// Returns shipping_addresses rows for the current user

import { getShippingAddresses } from '../supabse-conn/index';

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
    const addresses = await getShippingAddresses(userId);
    return res.status(200).json({ success: true, addresses });
  } catch (e) {
    console.error('get_shipping_addresses error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load addresses' });
  }
}

