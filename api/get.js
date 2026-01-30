// pages/api/get.js - UPDATED with orders and receipts support
import {
  getItemsWithRatings,
  getSavedItems,
  getOrdersForUser,
  getShippingAddresses,
  getUserPreferences,
  getNotificationPreference,
  getProductReviews,
  getUserActivities,
  getUserProfile,
  getUserReviews,
  getUserCoupons,
  getPointsHistory,
  getLoginHistory,
} from '../supabse-conn/index';

import { supabase } from '../lib/supabaseClient';

export default async function handler(req, res) {
// Only allow GET requests
if (req.method !== 'GET') {
  return res.status(405).json({ error: 'Method not allowed' });
}

const { action, userId, itemId, orderId, orderNumber, receiptId } = req.query;

// Validate required parameters
if (!action) {
  return res.status(400).json({ error: 'Action parameter is required' });
}

try {
  let result;

  switch (action) {
    case 'items':
      result = await getItemsWithRatings();
      return res.status(200).json({ success: true, data: result });
    
    case 'saved-items':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for saved-items' });
      }
      result = await getSavedItems(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'orders':
      if (!userId && !orderId && !orderNumber) {
        return res.status(400).json({ error: 'userId, orderId, or orderNumber is required for orders' });
      }
      
      // Use existing function or direct Supabase query
      if (userId && !orderId && !orderNumber) {
        // Get all orders for user (existing function)
        result = await getOrdersForUser(userId);
        return res.status(200).json({ success: true, orders: result });
      } else {
        // Get specific order by ID or number (new functionality)
        return await handleGetOrders(req, res, { userId, orderId, orderNumber });
      }
    
    case 'shipping-addresses':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for shipping-addresses' });
      }
      result = await getShippingAddresses(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'user-preferences':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for user-preferences' });
      }
      result = await getUserPreferences(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'notification-preference':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for notification-preference' });
      }
      result = await getNotificationPreference(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'product-reviews':
      if (!itemId) {
        return res.status(400).json({ error: 'itemId is required for product-reviews' });
      }
      result = await getProductReviews(itemId);
      return res.status(200).json({ success: true, data: result });
    
    case 'user-activities':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for user-activities' });
      }
      result = await getUserActivities(userId);
      return res.status(200).json({ success: true, ...result });
    
    case 'profile':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for profile' });
      }
      result = await getUserProfile(userId);
      return res.status(200).json({ success: true, ...result });
    
    case 'user-reviews':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for user-reviews' });
      }
      result = await getUserReviews(userId);
      return res.status(200).json({ success: true, reviews: result });
    
    case 'user-coupons':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for user-coupons' });
      }
      result = await getUserCoupons(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'points-history':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for points-history' });
      }
      result = await getPointsHistory(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'login-history':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for login-history' });
      }
      result = await getLoginHistory(userId);
      return res.status(200).json({ success: true, data: result });
    
    case 'export-user-data':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for export-user-data' });
      }
      return await handleExportUserData(req, res, userId);
    
    // ==================== NEW: RECEIPTS ACTION ====================
    case 'receipts':
      if (!userId && !orderId && !receiptId) {
        return res.status(400).json({ 
          error: 'userId, orderId, or receiptId is required for receipts' 
        });
      }
      return await handleGetReceipts(req, res, { userId, orderId, receiptId });
    
    default:
      return res.status(400).json({ error: `Invalid action: ${action}` });
  }
} catch (error) {
  console.error('API Error:', error);
  return res.status(500).json({ 
    success: false, 
    error: error.message || 'Internal server error' 
  });
}
}

// ==================== GET ORDERS HELPER ====================
async function handleGetOrders(req, res, { userId, orderId, orderNumber }) {
if (!supabase) {
  return res.status(503).json({
    success: false,
    error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  });
}

try {
  let query = supabase.from('orders').select('*, order_items(*)');

  if (orderId) {
    query = query.eq('id', parseInt(orderId)).limit(1);
  } else if (orderNumber) {
    query = query.eq('order_number', orderNumber).limit(1);
  } else if (userId) {
    query = query.eq('user_id', parseInt(userId)).order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get orders error:', error);
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
  console.error('handleGetOrders error:', err);
  return res.status(500).json({ 
    success: false, 
    error: 'Failed to fetch orders: ' + err.message 
  });
}
}

// ==================== GET RECEIPTS HELPER ====================
async function handleGetReceipts(req, res, { userId, orderId, receiptId }) {
if (!supabase) {
  return res.status(503).json({
    success: false,
    error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  });
}

try {
  let query = supabase.from('receipts').select('*');

  if (receiptId) {
    query = query.eq('id', parseInt(receiptId)).limit(1);
  } else if (orderId) {
    query = query.eq('order_id', parseInt(orderId));
  } else if (userId) {
    query = query.eq('user_id', parseInt(userId)).order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get receipts error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Database query failed: ' + error.message 
    });
  }

  if (receiptId && (!data || data.length === 0)) {
    return res.status(404).json({ success: false, error: 'Receipt not found' });
  }

  return res.status(200).json({ success: true, data: data || [] });
} catch (err) {
  console.error('handleGetReceipts error:', err);
  return res.status(500).json({
    success: false,
    error: err.message || 'Failed to get receipts'
  });
}
}

// ==================== EXPORT USER DATA (download all user data) ====================
async function handleExportUserData(req, res, userId) {
  try {
    const [profile, orders, addresses, reviews, savedItems, coupons, pointsHistory, loginHistory, preferences] = await Promise.all([
      getUserProfile(userId).catch(() => null),
      getOrdersForUser(userId).catch(() => []),
      getShippingAddresses(userId).catch(() => []),
      getUserReviews(userId).catch(() => []),
      getSavedItems(userId).catch(() => []),
      getUserCoupons(userId).catch(() => []),
      getPointsHistory(userId).catch(() => []),
      getLoginHistory(userId).catch(() => []),
      getUserPreferences(userId).catch(() => null),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile || null,
      orders: Array.isArray(orders) ? orders : [],
      shipping_addresses: Array.isArray(addresses) ? addresses : [],
      reviews: Array.isArray(reviews) ? reviews : [],
      saved_items: Array.isArray(savedItems) ? savedItems : [],
      coupons: Array.isArray(coupons) ? coupons : [],
      points_history: Array.isArray(pointsHistory) ? pointsHistory : [],
      login_history: Array.isArray(loginHistory) ? loginHistory : [],
      preferences: preferences || null,
    };
    return res.status(200).json({ success: true, data: payload });
  } catch (err) {
    console.error('handleExportUserData error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Export failed' });
  }
}