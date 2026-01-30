// pages/api/orders.js - FIXED VERSION
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
let supabase;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error('Supabase initialization error:', err);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Supabase is configured
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING');
    
    return res.status(503).json({
      success: false,
      error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables in Vercel.',
      debug: {
        url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
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
    console.error('❌ Orders API error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// GET orders by userId or orderId
async function handleGetOrders(req, res) {
  const { userId, orderId, orderNumber } = req.query;

  if (!userId && !orderId && !orderNumber) {
    return res.status(400).json({ 
      success: false, 
      error: 'userId, orderId, or orderNumber is required' 
    });
  }

  try {
    let query = supabase.from('orders').select('*, order_items(*)');

    if (userId) {
      query = query.eq('user_id', parseInt(userId)).order('created_at', { ascending: false });
    } else if (orderId) {
      query = query.eq('id', parseInt(orderId)).limit(1);
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber).limit(1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Get orders error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database query failed: ' + error.message 
      });
    }

    if ((orderId || orderNumber) && (!data || data.length === 0)) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('❌ handleGetOrders error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders: ' + err.message 
    });
  }
}

// POST - Create new order
async function handleCreateOrder(req, res) {
  console.log('=== ORDER CREATE ATTEMPT ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

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
    console.error('❌ Validation failed: userId is required');
    return res.status(400).json({ success: false, error: 'userId is required' });
  }
  if (!orderId && !orderNumber) {
    console.error('❌ Validation failed: orderId or orderNumber is required');
    return res.status(400).json({ success: false, error: 'orderId or orderNumber is required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.error('❌ Validation failed: items array is required');
    return res.status(400).json({ success: false, error: 'items array is required and cannot be empty' });
  }

  try {
    // Prepare order record
    const orderRecord = {
      user_id: parseInt(userId),
      order_number: orderNumber || orderId,
      status: 'processing',
      payment_method: payment || null,
      courier_service: courier || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      subtotal: parseFloat(subtotal) || 0,
      shipping: parseFloat(shipping) || 0,
      total: parseFloat(total) || 0,
      created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      items_json: items // Store items as JSON for backup
    };

    console.log('📝 Inserting order:', orderRecord);

    // Insert order
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order insert error:', orderError);
      console.error('Error details:', JSON.stringify(orderError, null, 2));
      
      // Check if it's a table/schema error
      if (orderError.message && /relation|does not exist|table|column/i.test(orderError.message)) {
        return res.status(503).json({ 
          success: false, 
          error: 'Orders table not set up. Please create the orders table in Supabase.',
          details: orderError.message
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create order: ' + orderError.message 
      });
    }

    console.log('✅ Order created:', createdOrder.id);

    // Prepare order items
    const orderItemsPayload = items.map(item => ({
      order_id: createdOrder.id,
      item_name: item.name || '',
      item_image: item.image || null,
      item_price: parseFloat(item.unitPrice) || 0,
      quantity: parseInt(item.quantity) || 1,
      size: item.size || null,
      color: item.color || item.selectedColor || null,
      line_total: parseFloat(item.lineTotal) || 0,
      status: 'processing',
      created_at: new Date().toISOString()
    }));

    console.log('📝 Inserting order items:', orderItemsPayload.length, 'items');

    // Insert order items
    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload)
      .select();

    if (itemsError) {
      console.error('❌ Order items insert error:', itemsError);
      console.error('Error details:', JSON.stringify(itemsError, null, 2));
      
      // Rollback order
      await supabase.from('orders').delete().eq('id', createdOrder.id);
      
      const isConfigError = itemsError.message && /relation|does not exist|table|column/i.test(itemsError.message);
      const status = isConfigError ? 503 : 500;
      return res.status(status).json({
        success: false,
        error: isConfigError ? 'Order items table not set up. Please create the order_items table in Supabase.' : ('Failed to create order items: ' + itemsError.message)
      });
    }

    console.log('✅ Order items created:', insertedItems.length, 'items');

    // Optionally save shipping address if provided
    if (shippingAddress && typeof shippingAddress === 'object') {
      try {
        const addressRecord = {
          user_id: parseInt(userId),
          address_type: 'home',
          first_name: shippingAddress.full_name || '',
          mobile_number: shippingAddress.phone || '',
          house_unit_number: shippingAddress.address_line1 || '',
          street_name: shippingAddress.address_line2 || '',
          barangay: '',
          city_municipality: shippingAddress.city || '',
          province_state: shippingAddress.province || '',
          postal_zip_code: shippingAddress.postal_code || '',
          country: shippingAddress.country || 'Philippines',
          is_default: false
        };

        await supabase.from('shipping_addresses').insert(addressRecord);
        console.log('✅ Shipping address saved');
      } catch (addrErr) {
        console.warn('⚠️ Failed to save shipping address:', addrErr);
        // Continue - shipping address save is optional
      }
    }

    // Create notification (optional)
    try {
      await supabase.from('notifications').insert({
        user_id: parseInt(userId),
        notification_type: 'order_status',
        title: 'Order Placed',
        message: `Your order ${orderNumber || orderId} has been placed successfully.`,
        related_id: createdOrder.id,
        created_at: new Date().toISOString()
      });
      console.log('✅ Notification created');
    } catch (notifErr) {
      console.warn('⚠️ Failed to create notification:', notifErr);
      // Continue - notification is optional
    }

    console.log('✅ Order creation complete!');

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      order_id: createdOrder.id,
      order_number: createdOrder.order_number,
      data: {
        order: createdOrder,
        items: insertedItems
      }
    });

  } catch (err) {
    console.error('❌ Create order error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create order: ' + err.message 
    });
  }
}