// api/get_orders.js
// Returns orders (with items) for the current user

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

  const status = req.query?.status || null;

  try {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    const ids = (orders || []).map((o) => o.id);
    let itemsByOrder = {};

    if (ids.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids);
      if (itemsError) throw itemsError;
      itemsByOrder = (items || []).reduce((acc, it) => {
        (acc[it.order_id] = acc[it.order_id] || []).push(it);
        return acc;
      }, {});
    }

    const enriched = (orders || []).map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
      can_cancel: o.status === 'processing',
    }));

    return res.status(200).json({ success: true, orders: enriched });
  } catch (e) {
    console.error('get_orders error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
}

