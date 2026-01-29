// pages/api/orders.js
import { createClient } from '@supabase/supabase-js';

// Prefer using service role on server-side for writes. If you have a lib/supabaseServer export, replace this.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create supabase client (server-side)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Utility validators
const MAX_ITEMS = 200;
const isPositiveInteger = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
};
const isNonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0;
const sanitize = (s, max = 255) => (s === null || s === undefined) ? null : String(s).trim().slice(0, max);

export default async function handler(req, res) {
  // Basic CORS (adjust origin as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      return await handleGetOrders(req, res);
    } else if (req.method === 'POST') {
      return await handleCreateOrder(req, res);
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Unexpected handler error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function handleGetOrders(req, res) {
  const { userId, orderId, orderNumber } = req.query;

  if (!userId && !orderId && !orderNumber) {
    return res.status(400).json({ success: false, error: 'userId, orderId, or orderNumber is required' });
  }

  try {
    // Build base query selecting common relations
    // Use select string that won't fail if relations don't exist; supabase ignores unknown columns when selecting simple columns
    let query = supabase.from('orders').select(`
      *,
      order_items (*)
    `);

    if (userId) {
      // accept numeric or string user ids
      const maybeInt = parseInt(userId);
      if (isPositiveInteger(maybeInt)) {
        query = query.eq('user_id', maybeInt).order('created_at', { ascending: false });
      } else {
        // maybe stored as text
        query = query.eq('user_id', String(userId)).order('created_at', { ascending: false });
      }
    } else if (orderId) {
      // Try numeric id first, then uuid/text
      const maybeInt = parseInt(orderId);
      if (isPositiveInteger(maybeInt)) {
        query = query.eq('id', maybeInt).limit(1);
      } else {
        // try order_id or id as text/uuid or order_number
        query = query.or(`id.eq.${orderId},order_id.eq.${orderId},order_number.eq.${orderId}`).limit(1);
      }
    } else if (orderNumber) {
      query = query.or(`order_number.eq.${orderNumber},order_id.eq.${orderNumber}`).limit(1);
    }

    const { data, error, status } = await query;
    if (error) {
      console.error('Get orders DB error:', error);
      return res.status(500).json({ success: false, error: 'Database query failed' });
    }

    // If single queries return arrays with 0 items
    if ((orderId || orderNumber) && (!data || (Array.isArray(data) && data.length === 0))) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('handleGetOrders error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}

async function handleCreateOrder(req, res) {
  const body = req.body || {};
  const {
    userId,
    orderId,
    orderNumber,
    items,
    subtotal,
    shipping,
    total,
    payment,
    courier,
    customerEmail,
    customerPhone,
    shippingAddress,
    timestamp
  } = body;

  // Basic validation
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
  if (!orderId) return res.status(400).json({ success: false, error: 'orderId is required' });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'items array is required' });
  }
  if (items.length > MAX_ITEMS) return res.status(400).json({ success: false, error: `Too many items (max ${MAX_ITEMS})` });

  // Validate numeric-ish amounts loosely
  const parsedSubtotal = parseFloat(subtotal) || 0;
  const parsedShipping = parseFloat(shipping) || 0;
  const parsedTotal = parseFloat(total) || 0;
  if (parsedSubtotal < 0 || parsedShipping < 0 || parsedTotal < 0) {
    return res.status(400).json({ success: false, error: 'Invalid monetary amounts' });
  }

  // Validate items minimal shape
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.name || it.quantity == null) {
      return res.status(400).json({ success: false, error: `Each item must have name and quantity (error at index ${i})` });
    }
  }

  // Verify subtotal math within tolerance
  const computed = items.reduce((s, it) => s + (parseFloat(it.lineTotal) || (parseFloat(it.unitPrice || 0) * (parseInt(it.quantity || 1)))), 0);
  if (Math.abs(computed - parsedSubtotal) > 0.5) { // allow larger tolerance if prices/rounding differ
    console.warn('Provided subtotal differs from computed subtotal', { computed, provided: parsedSubtotal });
    // Don't fail — just log; you can change to strict if desired
  }

  // Prepare order record
  const orderRecord = {
    user_id: isPositiveInteger(userId) ? parseInt(userId) : String(userId),
    // try to store both order_id and order_number fields to maximize compatibility
    order_id: sanitize(orderId, 100),
    order_number: sanitize(orderNumber || orderId, 100),
    status: 'processing',
    payment_method: sanitize(payment, 100),
    courier_service: sanitize(courier, 100),
    customer_email: sanitize(customerEmail, 255),
    customer_phone: sanitize(customerPhone, 50),
    subtotal: parsedSubtotal,
    shipping: parsedShipping,
    total_amount: parsedTotal,
    placed_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
  };

  // Try creating order and items
  let createdOrder = null;
  try {
    const { data: insertedOrders, error: orderInsertErr } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select();

    if (orderInsertErr) {
      console.error('Order insert error:', orderInsertErr);
      return res.status(500).json({ success: false, error: 'Failed to create order' });
    }
    createdOrder = Array.isArray(insertedOrders) ? insertedOrders[0] : insertedOrders;
    const dbOrderId = createdOrder && (createdOrder.id || createdOrder.order_id || createdOrder.order_number);

    if (!dbOrderId) {
      console.warn('Inserted order did not return an id field. Returning created data anyway.');
    }

    // Prepare order_items payload
    const orderItemsPayload = items.map(it => {
      const qty = parseInt(it.quantity) || 1;
      return {
        order_id: createdOrder.id || createdOrder.order_id || dbOrderId,
        product_name: sanitize(it.name, 255),
        product_image: sanitize(it.image || '', 500),
        size: sanitize(it.size || '', 100),
        color: sanitize(it.color || '', 100),
        quantity: qty,
        unit_price: parseFloat(it.unitPrice) || 0,
        line_total: parseFloat(it.lineTotal) || 0
      };
    });

    // Insert items
    const { data: insertedItems, error: itemsInsertErr } = await supabase
      .from('order_items')
      .insert(orderItemsPayload)
      .select();

    if (itemsInsertErr) {
      console.error('Order items insert error:', itemsInsertErr);
      // Attempt rollback (best effort)
      try {
        if (createdOrder && createdOrder.id) {
          await supabase.from('orders').delete().eq('id', createdOrder.id);
          console.log('Rolled back order after items insert failure');
        }
      } catch (rbErr) {
        console.error('Rollback failed:', rbErr);
      }
      return res.status(500).json({ success: false, error: 'Failed to create order items' });
    }

    // Optionally insert shipping address if your table exists and shippingAddress provided
    if (shippingAddress && typeof shippingAddress === 'object') {
      try {
        const addr = {
          user_id: isPositiveInteger(userId) ? parseInt(userId) : String(userId),
          order_id: createdOrder.id || createdOrder.order_id || dbOrderId,
          recipient_name: sanitize(shippingAddress.full_name || shippingAddress.recipient_name || '', 255),
          mobile_number: sanitize(shippingAddress.phone || '', 50),
          address_line1: sanitize(shippingAddress.address_line1 || '', 500),
          address_line2: sanitize(shippingAddress.address_line2 || '', 500),
          city: sanitize(shippingAddress.city || '', 100),
          province_state: sanitize(shippingAddress.province || '', 100),
          postal_zip_code: sanitize(shippingAddress.postal_code || '', 30),
          country: sanitize(shippingAddress.country || 'Philippines', 100),
          is_default: false
        };
        await supabase.from('shipping_addresses').insert(addr);
      } catch (addrErr) {
        console.warn('Failed to insert shipping address (continuing):', addrErr.message || addrErr);
      }
    }

    // Create a notification row if table exists (best-effort)
    try {
      await supabase.from('order_notifications').insert({
        user_id: isPositiveInteger(userId) ? parseInt(userId) : String(userId),
        order_id: createdOrder.id || createdOrder.order_id || dbOrderId,
        notification_type: 'order_placed',
        title: 'Order Placed',
        message: `Your order ${sanitize(orderNumber || orderId, 100)} has been placed.`,
        is_read: false
      });
    } catch (notifErr) {
      // ignore - optional functionality
      console.warn('Notification insert failed (not critical):', notifErr.message || notifErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      order_id: createdOrder.id || createdOrder.order_id || dbOrderId,
      data: {
        order: createdOrder,
        items_created: Array.isArray(insertedItems) ? insertedItems.length : (insertedItems ? 1 : 0)
      }
    });
  } catch (err) {
    console.error('Create order unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create order' });
  }
}