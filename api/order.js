// api/orders.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGetOrders(req, res);
    } else if (req.method === 'POST') {
      return await handleCreateOrder(req, res);
    }
  } catch (error) {
    console.error('Orders API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

async function handleGetOrders(req, res) {
  const { userId, orderId, orderNumber } = req.query;

  if (!userId && !orderId && !orderNumber) {
    return res.status(400).json({ 
      success: false,
      error: 'userId, orderId, or orderNumber is required' 
    });
  }

  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        shipping_addresses (*)
      `);

    if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false });
    } else if (orderId) {
      query = query.eq('id', orderId).single();
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber).single();
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function handleCreateOrder(req, res) {
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
  } = req.body;

  // Input validation
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      error: 'userId is required' 
    });
  }
  if (!orderId) {
    return res.status(400).json({ 
      success: false,
      error: 'orderId is required' 
    });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'items array is required and cannot be empty' 
    });
  }

  try {
    // Get default shipping address
    let shippingAddressId = null;
    const { data: addresses, error: addressError } = await supabase
      .from('shipping_addresses')
      .select('id')
      .eq('user_id', userId)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();
    
    if (addressError && addressError.code !== 'PGRST116') {
      console.error('Error fetching shipping address:', addressError);
    }
    
    if (addresses) {
      shippingAddressId = addresses.id;
    }

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: parseInt(userId),
        order_id: orderId,
        order_number: orderNumber || orderId,
        status: 'processing',
        payment_method: payment || null,
        courier_service: courier || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        subtotal: parseFloat(subtotal) || 0,
        shipping: parseFloat(shipping) || 0,
        total_amount: parseFloat(total) || 0,
        shipping_address_id: shippingAddressId,
        placed_at: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw orderError;
    }

    const dbOrderId = orderData.id;

    // Validate and sanitize order items
    const orderItems = items.map(item => ({
      order_id: dbOrderId,
      product_name: String(item.name || 'Unknown Product').substring(0, 255),
      product_image: item.image ? String(item.image).substring(0, 500) : null,
      size: item.size ? String(item.size).substring(0, 50) : null,
      color: item.color ? String(item.color).substring(0, 50) : null,
      quantity: Math.max(1, parseInt(item.quantity) || 1),
      unit_price: Math.max(0, parseFloat(item.unitPrice) || 0),
      line_total: Math.max(0, parseFloat(item.lineTotal) || 0)
    }));

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      // Rollback - delete the order
      await supabase.from('orders').delete().eq('id', dbOrderId);
      throw itemsError;
    }

    // Create notification
    const { error: notifError } = await supabase
      .from('order_notifications')
      .insert({
        user_id: parseInt(userId),
        order_id: dbOrderId,
        notification_type: 'order_placed',
        title: 'Order Placed Successfully',
        message: `Your order ${orderNumber || orderId} has been placed and is being processed.`,
        is_read: false
      });

    if (notifError) {
      console.error('Notification insert error:', notifError);
      // Don't fail the whole order if notification fails
    }

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      order_id: dbOrderId,
      order_number: orderNumber || orderId,
      data: orderData
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
}