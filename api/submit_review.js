// POST /api/submit_review — save review to Supabase reviews table (SQL: supabase_reviews_table.sql)
// Body: item_title, rating, content; userId from body or X-User-Id header.

import { submitReview, addUserPoints } from '../supabse-conn/index.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }

  const itemTitle = (body.item_title || body.product_title || '').trim();
  const rating = body.rating != null ? Number(body.rating) : NaN;
  const content = (body.content || body.comment || '').trim();
  let userId = body.userId != null ? String(body.userId).trim() : (req.headers['x-user-id'] || '').trim();
  if (!userId || userId === 'undefined') {
    return res.status(400).json({ success: false, error: 'Please log in to leave a review' });
  }

  if (!itemTitle) {
    return res.status(400).json({ success: false, error: 'Product title is required' });
  }
  if (isNaN(rating) || rating < 0.5 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Please select a valid rating (0.5 to 5 stars)' });
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return res.status(503).json({ success: false, error: 'Reviews are not configured' });
    }
    await submitReview(userId, {
      product_title: itemTitle,
      item_id: itemTitle,
      rating,
      comment: content || null,
    });
    try {
      await addUserPoints(userId, 20);
    } catch (e) {
      console.warn('submit_review: add points failed', e);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit_review error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to submit review' });
  }
}
