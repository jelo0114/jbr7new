// api/submit_review.js
// Submits or updates a review for the current user

import { submitReview } from '../supabse-conn/index';

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
    const { product_title, item_id, rating, comment } = req.body || {};

    if (!product_title || !item_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'product_title, item_id and rating are required',
      });
    }

    await submitReview(userId, {
      product_title,
      item_id,
      rating,
      comment: comment || '',
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('submit_review error:', e);
    return res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
}

