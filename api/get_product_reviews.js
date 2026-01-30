// Vercel route: GET /api/get_product_reviews?product=Envelope%20Bags
// Returns reviews and summary for view.html; uses Supabase when configured.

import { getProductReviews } from '../supabse-conn/index.js';

function buildSummary(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const total = list.length;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  list.forEach((r) => {
    const rating = Number(r.rating) || 0;
    if (rating >= 1 && rating <= 5) {
      breakdown[rating] = (breakdown[rating] || 0) + 1;
      sum += rating;
    }
  });
  const average = total > 0 ? sum / total : 0;
  return { total, average, breakdown };
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
    const reviews = await getProductReviews(product);
    const summary = buildSummary(reviews);
    return res.status(200).json({ success: true, reviews: reviews || [], summary });
  } catch (err) {
    console.error('get_product_reviews error:', err);
    return res.status(200).json(empty);
  }
}
