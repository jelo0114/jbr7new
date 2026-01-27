// api/get_user_reviews.js
// Returns all reviews written by the current user

import { supabase } from '../lib/supabaseClient';

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
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = (data || []).map((r) => ({
      id: r.id,
      item_id: r.item_id,
      rating: r.rating,
      comment: r.comment,
      product_title: r.product_title,
      date: r.created_at,
      item_title: r.product_title,
      item_price: 0,
      item_image: 'totebag.avif',
    }));

    return res.status(200).json({ success: true, reviews });
  } catch (e) {
    console.error('get_user_reviews error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load reviews' });
  }
}

// api/get_user_reviews.js
// Returns all reviews written by the current user

import { supabase } from '../lib/supabaseClient';

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
    const { data, error } = await supabase
      .from('reviews')
      .select('id, item_id, rating, comment, product_title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = (data || []).map((r) => ({
      id: r.id,
      item_id: r.item_id,
      rating: r.rating,
      comment: r.comment,
      product_title: r.product_title,
      date: r.created_at,
      item_title: r.product_title,
      item_price: 0,
      item_image: 'totebag.avif',
    }));

    return res.status(200).json({ success: true, reviews });
  } catch (e) {
    console.error('get_user_reviews error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load reviews' });
  }
}

