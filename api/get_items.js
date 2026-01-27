// api/get_items.js
// Returns all catalog items with ratings for explore page (Supabase)

import { getItemsWithRatings } from '../supabse-conn/index';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const items = await getItemsWithRatings();
    return res.status(200).json({
      success: true,
      items,
      count: items.length,
    });
  } catch (e) {
    console.error('get_items error:', e);
    return res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
}

