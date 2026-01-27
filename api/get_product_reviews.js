// api/get_product_reviews.js
// Returns reviews for a given product (by title or item_id)

import { getProductReviews } from '../supabse-conn/index';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const product = req.query?.product || req.query?.title || null;
  if (!product) {
    return res.status(400).json({ success: false, error: 'Missing product parameter' });
  }

  try {
    const reviews = await getProductReviews(product);
    return res.status(200).json({ success: true, reviews });
  } catch (e) {
    console.error('get_product_reviews error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load product reviews' });
  }
}

