// api/profile.js
// Supabase-based replacement for profile.php

import { supabase } from '../lib/supabaseClient';
import { getSavedItems, getOrdersForUser } from '../supabse-conn/index';

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, created_at, points')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Stats
    const [ordersCountRes, savedCountRes, reviewsCountRes] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const totalOrders = ordersCountRes.count || 0;
    const savedCount = savedCountRes.count || 0;
    const reviewsCount = reviewsCountRes.count || 0;

    // Saved items & orders
    const [savedItemsRaw, ordersRaw] = await Promise.all([
      getSavedItems(userId),
      getOrdersForUser(userId),
    ]);

    const savedItems = (savedItemsRaw || []).map((row) => ({
      id: row.id,
      title: row.title,
      price: row.price != null ? String(row.price) : '0',
      metadata: row.metadata || null,
      created_at: row.created_at,
    }));

    const orders = (ordersRaw || []).slice(0, 20).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total: String(o.total ?? 0),
      status: o.status,
      created_at: o.created_at,
    }));

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: '', // no phone column by default in Supabase schema
        created_at: user.created_at,
        points: user.points ?? 0,
        profile_picture: '', // file uploads not wired yet
      },
      stats: {
        orders: totalOrders,
        total_orders: totalOrders,
        saved: savedCount,
        saved_items: savedCount,
        reviews: reviewsCount,
        favorites: 0,
      },
      items: savedItems,
      saved_items: savedItems,
      orders,
    });
  } catch (e) {
    console.error('profile api error:', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}

