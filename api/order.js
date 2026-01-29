// api/orders.js - SECURED VERSION
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Constants for validation
const VALIDATION_RULES = {
  MAX_PRODUCT_NAME_LENGTH: 255,
  MAX_IMAGE_URL_LENGTH: 500,
  MAX_SIZE_LENGTH: 50,
  MAX_COLOR_LENGTH: 50,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_ORDER_ID_LENGTH: 50,
  MIN_PRICE: 0,
  MAX_PRICE: 999999.99,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9999,
  MAX_ITEMS_PER_ORDER: 100
};

const ALLOWED_ORDER_STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_NOTIFICATION_TYPES = ['order_placed', 'order_updated', 'order_shipped', 'order_delivered'];

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
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    if (req.method === 'GET') {
      return await handleGetOrders(req, res);
    } else if (req.method === 'POST') {
      return await handleCreateOrder(req, res);
    }
  } catch (error) {
    console.error('Orders API Error:', error);
    
    // Don't expose internal error details to client in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack })
    });
  }
}

async function handleGetOrders(req, res) {
  const { userId, orderId, orderNumber } = req.query;

  // Validate at least one parameter is provided
  if (!userId && !orderId && !orderNumber) {
    return res.status(400).json({ 
      success: false,
      error: 'userId, orderId, or orderNumber is required' 
    });
  }

  // Validate parameter types and formats
  if (userId && (!Number.isInteger(Number(userId)) || Number(userId) <= 0)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid userId format'
    });
  }

  if (orderId && (!Number.isInteger(Number(orderId)) || Number(orderId) <= 0)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid orderId format'
    });
  }

  if (orderNumber && typeof orderNumber !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid orderNumber format'
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
      query = query.eq('user_id', parseInt(userId)).order('created_at', { ascending: false });
    } else if (orderId) {
      query = query.eq('id', parseInt(orderId)).maybeSingle();
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber).maybeSingle();
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      throw new Error('Failed to fetch orders');
    }

    // Handle case where no data is found for single queries
    if ((orderId || orderNumber) && !data) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve orders'
    });
  }
}

// Input validation helpers
function sanitizeString(value, maxLength) {
  if (!value) return null;
  return String(value).trim().substring(0, maxLength);
}

function validateEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length <= VALIDATION_RULES.MAX_PHONE_LENGTH;
}

function validatePrice(price) {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && 
         numPrice >= VALIDATION_RULES.MIN_PRICE && 
         numPrice <= VALIDATION_RULES.MAX_PRICE;
}

function validateQuantity(quantity) {
  const numQty = parseInt(quantity);
  return Number.isInteger(numQty) && 
         numQty >= VALIDATION_RULES.MIN_QUANTITY && 
         numQty <= VALIDATION_RULES.MAX_QUANTITY;
}

function validateOrderId(orderId) {
  if (!orderId || typeof orderId !== 'string') return false;
  // Allow alphanumeric, hyphens, and underscores only
  const orderIdRegex = /^[A-Za-z0-9\-_]+$/;
  return orderIdRegex.test(orderId) && orderId.length <= VALIDATION_RULES.MAX_ORDER_ID_LENGTH;
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

  // ========================================
  // COMPREHENSIVE INPUT VALIDATION
  // ========================================

  // Validate required fields
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      error: 'userId is required' 
    });
  }

  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid userId: must be a positive integer'
    });
  }

  if (!orderId) {
    return res.status(400).json({ 
      success: false,
      error: 'orderId is required' 
    });
  }

  if (!validateOrderId(orderId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid orderId format: must be alphanumeric with hyphens/underscores only'
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false,
      error: 'items array is required and cannot be empty' 
    });
  }

  if (items.length > VALIDATION_RULES.MAX_ITEMS_PER_ORDER) {
    return res.status(400).json({
      success: false,
      error: `Too many items: maximum ${VALIDATION_RULES.MAX_ITEMS_PER_ORDER} items per order`
    });
  }

  // Validate financial amounts
  if (!validatePrice(subtotal)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid subtotal amount'
    });
  }

  if (!validatePrice(shipping)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid shipping amount'
    });
  }

  if (!validatePrice(total)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid total amount'
    });
  }

  // Validate email if provided
  if (customerEmail && !validateEmail(customerEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  // Validate phone if provided
  if (customerPhone && !validatePhone(customerPhone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number format'
    });
  }

  // Validate timestamp
  let orderTimestamp = timestamp;
  if (timestamp) {
    const parsedDate = new Date(timestamp);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timestamp format'
      });
    }
    orderTimestamp = parsedDate.toISOString();
  } else {
    orderTimestamp = new Date().toISOString();
  }

  // Validate each item in the order
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Product name is required`
      });
    }

    if (item.unitPrice !== undefined && !validatePrice(item.unitPrice)) {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Invalid unit price`
      });
    }

    if (item.lineTotal !== undefined && !validatePrice(item.lineTotal)) {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Invalid line total`
      });
    }

    if (item.quantity !== undefined && !validateQuantity(item.quantity)) {
      return res.status(400).json({
        success: false,
        error: `Item ${i + 1}: Invalid quantity (must be between ${VALIDATION_RULES.MIN_QUANTITY} and ${VALIDATION_RULES.MAX_QUANTITY})`
      });
    }
  }

  // Verify total calculation matches items
  const calculatedSubtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.lineTotal) || 0);
  }, 0);

  const providedSubtotal = parseFloat(subtotal);
  const tolerance = 0.01; // Allow 1 cent difference for rounding

  if (Math.abs(calculatedSubtotal - providedSubtotal) > tolerance) {
    return res.status(400).json({
      success: false,
      error: 'Subtotal mismatch: calculated subtotal does not match provided subtotal'
    });
  }

  // ========================================
  // DATABASE OPERATIONS
  // ========================================

  try {
    // Get default shipping address
    let shippingAddressId = null;
    
    try {
      const { data: addresses, error: addressError } = await supabase
        .from('shipping_addresses')
        .select('id')
        .eq('user_id', parseInt(userId))
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();
      
      if (addressError && addressError.code !== 'PGRST116') {
        console.error('Error fetching shipping address:', addressError);
        // Don't fail the order if we can't fetch address, just log it
      }
      
      if (addresses) {
        shippingAddressId = addresses.id;
      }
    } catch (addressFetchError) {
      console.error('Failed to fetch shipping address:', addressFetchError);
      // Continue with order creation even if address fetch fails
    }

    // Sanitize and prepare order data
    const orderData = {
      user_id: parseInt(userId),
      order_id: sanitizeString(orderId, VALIDATION_RULES.MAX_ORDER_ID_LENGTH),
      order_number: sanitizeString(orderNumber || orderId, VALIDATION_RULES.MAX_ORDER_ID_LENGTH),
      status: 'processing',
      payment_method: sanitizeString(payment, 50),
      courier_service: sanitizeString(courier, 50),
      customer_email: sanitizeString(customerEmail, VALIDATION_RULES.MAX_EMAIL_LENGTH),
      customer_phone: sanitizeString(customerPhone, VALIDATION_RULES.MAX_PHONE_LENGTH),
      subtotal: parseFloat(subtotal) || 0,
      shipping: parseFloat(shipping) || 0,
      total_amount: parseFloat(total) || 0,
      shipping_address_id: shippingAddressId,
      placed_at: orderTimestamp
    };

    // Create order in database
    const { data: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (!createdOrder || !createdOrder.id) {
      throw new Error('Order created but no ID returned');
    }

    const dbOrderId = createdOrder.id;

    // Validate and sanitize order items
    const orderItems = items.map((item, index) => {
      const sanitizedItem = {
        order_id: dbOrderId,
        product_name: sanitizeString(item.name, VALIDATION_RULES.MAX_PRODUCT_NAME_LENGTH) || 'Unknown Product',
        product_image: sanitizeString(item.image, VALIDATION_RULES.MAX_IMAGE_URL_LENGTH),
        size: sanitizeString(item.size, VALIDATION_RULES.MAX_SIZE_LENGTH),
        color: sanitizeString(item.color, VALIDATION_RULES.MAX_COLOR_LENGTH),
        quantity: Math.max(VALIDATION_RULES.MIN_QUANTITY, Math.min(parseInt(item.quantity) || 1, VALIDATION_RULES.MAX_QUANTITY)),
        unit_price: Math.max(0, Math.min(parseFloat(item.unitPrice) || 0, VALIDATION_RULES.MAX_PRICE)),
        line_total: Math.max(0, Math.min(parseFloat(item.lineTotal) || 0, VALIDATION_RULES.MAX_PRICE))
      };

      return sanitizedItem;
    });

    // Insert order items with error handling
    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
      
      // Rollback - delete the order
      try {
        await supabase
          .from('orders')
          .delete()
          .eq('id', dbOrderId);
        console.log('Order rolled back successfully');
      } catch (rollbackError) {
        console.error('Failed to rollback order:', rollbackError);
      }
      
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Verify all items were inserted
    if (!insertedItems || insertedItems.length !== items.length) {
      console.error('Items count mismatch:', {
        expected: items.length,
        inserted: insertedItems?.length || 0
      });
      
      // Rollback
      try {
        await supabase.from('orders').delete().eq('id', dbOrderId);
      } catch (rollbackError) {
        console.error('Failed to rollback order:', rollbackError);
      }
      
      throw new Error('Failed to insert all order items');
    }

    // Create notification (non-critical - don't fail order if this fails)
    try {
      const { error: notifError } = await supabase
        .from('order_notifications')
        .insert({
          user_id: parseInt(userId),
          order_id: dbOrderId,
          notification_type: 'order_placed',
          title: 'Order Placed Successfully',
          message: `Your order ${sanitizeString(orderNumber || orderId, 100)} has been placed and is being processed.`,
          is_read: false
        });

      if (notifError) {
        console.error('Notification insert error:', notifError);
        // Don't fail the order, just log the error
      }
    } catch (notifException) {
      console.error('Failed to create notification:', notifException);
      // Don't fail the order
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      order_id: dbOrderId,
      order_number: orderData.order_number,
      data: {
        ...createdOrder,
        items_count: insertedItems.length
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Failed to create order'
    });
  }
}