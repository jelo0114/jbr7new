// api/receipt.js
// Saves a rendered receipt snapshot into the receipts table

import { supabase } from '../lib/supabaseClient';

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
    const body = req.body || {};

    const { data, error } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        order_id: null,
        order_number: body.orderId || null,
        receipt_data: body,
        shipping_address: body.shippingAddress || null,
        subtotal: body.subtotal ?? null,
        shipping: body.shipping ?? null,
        total: body.total ?? null,
        payment_method: body.payment || null,
        courier_service: body.courier || null,
        customer_email: body.customerEmail || null,
        customer_phone: body.customerPhone || null,
      })
      .select('id')
      .maybeSingle();

    if (error) throw error;

    return res
      .status(200)
      .json({ success: true, receipt_id: data ? data.id : null });
  } catch (e) {
    console.error('receipt api error:', e);
    return res
      .status(500)
      .json({ success: false, error: 'Failed to save receipt' });
  }
}

