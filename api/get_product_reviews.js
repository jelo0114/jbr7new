// Vercel route: GET /api/get_product_reviews?product=Envelope%20Bags
// Returns reviews and summary for view.html; uses Supabase (reviews table + users for names).

import { getProductReviews } from '../supabse-conn/index.js';
import { supabase } from '../lib/supabaseClient.js';

function buildSummary(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const total = list.length;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  list.forEach((r) => {
    const rating = Number(r.rating) || 0;
    if (rating >= 0.5 && rating <= 5) {
      const bucket = Math.round(rating);
      breakdown[bucket] = (breakdown[bucket] || 0) + 1;
      sum += rating;
    }
  });
  const average = total > 0 ? sum / total : 0;
  return { total, average, breakdown };
}

function formatReviewDate(createdAt) {
  if (!createdAt) return 'Recently';
  try {
    return new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

function initials(name) {
  if (!name || typeof name !== 'string') return 'AN';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return (name[0] || 'A').toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const product = (req.query.product || '').trim();
  const empty = { success: true, reviews: [], summary: buildSummary([]) };

  if (!product) {
    return res.status(200).json(empty);
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return res.status(200).json(empty);
    }
    const rawReviews = await getProductReviews(product);
    const list = Array.isArray(rawReviews) ? rawReviews : [];
    const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))];
    let userMap = {};
    if (userIds.length > 0 && supabase) {
      const { data: users } = await supabase.from('users').select('id, username').in('id', userIds);
      (users || []).forEach((u) => {
        userMap[u.id] = u.username || 'Anonymous';
      });
    }
    const reviews = list.map((r) => ({
      ...r,
      name: userMap[r.user_id] || 'Anonymous',
      initials: initials(userMap[r.user_id]),
      date: formatReviewDate(r.created_at),
      content: r.comment || r.content || '',
      verified: !!r.is_verified_purchase,
      helpful: Number(r.helpfulness_count) || 0,
    }));
    const summary = buildSummary(reviews);
    return res.status(200).json({ success: true, reviews, summary });
  } catch (err) {
    console.error('get_product_reviews error:', err);
    return res.status(200).json(empty);
  }
}
