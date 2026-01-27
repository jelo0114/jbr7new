// api/session_user.js
// Lightweight "who am I" endpoint used by the header and landing page.
// For Supabase deployment we infer the user from an X-User-Id header.

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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, created_at, points')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Basic stats (orders/saved/reviews counts)
    const [ordersCount, savedCount, reviewsCount] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const stats = {
      orders: ordersCount.count || 0,
      saved: savedCount.count || 0,
      reviews: reviewsCount.count || 0,
    };

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        points: user.points ?? 0,
      },
      stats,
    });
  } catch (e) {
    console.error('session_user error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

