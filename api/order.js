// pages/api/orders.js
// Orders endpoint for creating and managing orders

import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // Only allow POST and GET requests
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

// ==================== GET ORDERS ====================
async function handleGetOrders(req, res) {
  const { userId, orderId, orderNumber } = req.query;

  if (!userId && !orderId && !orderNumber) {
    return res.status(400).json({ error: 'userId, orderId, or orderNumber is required' });
  }

  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_shipping_addresses (*)
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

// ==================== CREATE ORDER ====================
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

  // Validation
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required and cannot be empty' });
  }

  try {
    // Start a transaction-like operation
    // 1. Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_id: orderId,
        order_number: orderNumber || orderId,
        status: 'processing',
        payment_method: payment || null,
        courier_service: courier || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        subtotal: parseFloat(subtotal) || 0,
        shipping: parseFloat(shipping) || 0,
        total: parseFloat(total) || 0
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw orderError;
    }

    const dbOrderId = orderData.id;

    // 2. Insert order items
    const orderItems = items.map(item => ({
      order_id: dbOrderId,
      product_name: item.name || 'Unknown Product',
      product_image: item.image || null,
      size: item.size || null,
      color: item.color || null,
      quantity: parseInt(item.quantity) || 1,
      unit_price: parseFloat(item.unitPrice) || 0,
      line_total: parseFloat(item.lineTotal) || 0
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', dbOrderId);
      throw itemsError;
    }

    // 3. Insert shipping address if provided
    if (shippingAddress) {
      const { error: addressError } = await supabase
        .from('order_shipping_addresses')
        .insert({
          order_id: dbOrderId,
          full_name: shippingAddress.full_name || null,
          phone: shippingAddress.phone || null,
          address_line1: shippingAddress.address_line1 || null,
          address_line2: shippingAddress.address_line2 || null,
          city: shippingAddress.city || null,
          province: shippingAddress.province || null,
          postal_code: shippingAddress.postal_code || null,
          country: shippingAddress.country || 'Philippines'
        });

      if (addressError) {
        console.error('Shipping address insert error:', addressError);
        // Continue anyway - shipping address is not critical
      }
    }

    // 4. Create notification
    const { error: notifError } = await supabase
      .from('order_notifications')
      .insert({
        user_id: userId,
        order_id: dbOrderId,
        notification_type: 'order_placed',
        title: 'Order Placed Successfully',
        message: `Your order ${orderNumber || orderId} has been placed and is being processed.`,
        is_read: false
      });

    if (notifError) {
      console.error('Notification insert error:', notifError);
      // Continue anyway - notification is not critical
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