// pages/api/get.js - UPDATED with orders and receipts support
import {
  getItemsWithRatings,
  getItemsWithRatingsSorted,
  getSavedItems,
  getOrdersForUser,
  getShippingAddresses,
  getUserPreferences,
  getNotificationPreference,
  getNotifications,
  getProductReviews,
  getUserActivities,
  getUserProfile,
  getUserReviews,
  getUserCoupons,
  getPointsHistory,
  getLoginHistory,
  searchItems,
  getAdminById,
  getAllUsers,
  getAllOrders,
  getAllReviews,
} from '../supabse-conn/index';

import { supabase } from '../lib/supabaseClient';

export default async function handler(req, res) {
// Only allow GET requests
if (req.method !== 'GET') {
  return res.status(405).json({ error: 'Method not allowed' });
}

const { action, userId, itemId, orderId, orderNumber, receiptId, q, sort, adminId } = req.query;

// Validate required parameters
if (!action) {
  return res.status(400).json({ error: 'Action parameter is required' });
}

try {
  let result;

  switch (action) {
    case 'items':
      result = sort
        ? await getItemsWithRatingsSorted(String(sort).trim() || undefined)
        : await getItemsWithRatings();
      return res.status(200).json({ success: true, data: result });
    
    case 'search':
      return await handleSearch(req, res, (q != null ? String(q).trim() : ''));
    
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
    
    case 'notifications':
      if (!userId) {
        return res.status(400).json({ error: 'userId is required for notifications' });
      }
      result = await getNotifications(userId);
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

    // ==================== ADMIN (require adminId) ====================
    case 'admin-users':
      if (!adminId) return res.status(400).json({ success: false, error: 'adminId required' });
      if (!(await getAdminById(adminId))) return res.status(401).json({ success: false, error: 'Unauthorized' });
      result = await getAllUsers();
      return res.status(200).json({ success: true, data: result });

    case 'admin-orders':
      if (!adminId) return res.status(400).json({ success: false, error: 'adminId required' });
      if (!(await getAdminById(adminId))) return res.status(401).json({ success: false, error: 'Unauthorized' });
      result = await getAllOrders();
      return res.status(200).json({ success: true, data: result });

    case 'admin-items':
      if (!adminId) return res.status(400).json({ success: false, error: 'adminId required' });
      if (!(await getAdminById(adminId))) return res.status(401).json({ success: false, error: 'Unauthorized' });
      result = sort ? await getItemsWithRatingsSorted(String(sort).trim()) : await getItemsWithRatings();
      return res.status(200).json({ success: true, data: result });

    case 'admin-reviews':
      if (!adminId) return res.status(400).json({ success: false, error: 'adminId required' });
      if (!(await getAdminById(adminId))) return res.status(401).json({ success: false, error: 'Unauthorized' });
      result = await getAllReviews();
      return res.status(200).json({ success: true, data: result });
    
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

// ==================== SEARCH (products + page/settings suggestions) ====================
const SYSTEM_SUGGESTIONS = [
  { text: 'Home', url: 'home.html', icon: 'fa-home', match: ['home', 'main', 'landing', 'start'] },
  { text: 'Explore Products', url: 'explore.html', icon: 'fa-compass', match: ['explore', 'products', 'shop', 'browse', 'catalog', 'collection'] },
  { text: 'My Cart', url: 'cart.html', icon: 'fa-shopping-cart', match: ['cart', 'basket', 'checkout', 'buy', 'purchase'] },
  { text: 'Saved Items', url: 'saved.html', icon: 'fa-bookmark', match: ['saved', 'bookmark', 'wishlist', 'favorite', 'favourite'] },
  { text: 'My Profile', url: 'profile.html', icon: 'fa-user-circle', match: ['profile', 'account', 'user', 'my profile', 'my account'] },
  { text: 'Track Order', url: 'track-order.html', icon: 'fa-truck', match: ['track', 'order', 'tracking', 'status', 'delivery', 'shipment'] },
  { text: 'Notifications', url: 'notification.html', icon: 'fa-bell', match: ['notification', 'alert', 'reminder', 'notify', 'message'] },
  { text: 'Contact Us', url: 'contact.html', icon: 'fa-envelope', match: ['contact', 'help', 'support', 'faq', 'question', 'inquiry'] },
  { text: 'About Us', url: 'about.html', icon: 'fa-info-circle', match: ['about', 'company', 'us', 'information'] },
  { text: 'Receipt', url: 'receipt.html', icon: 'fa-receipt', match: ['receipt', 'invoice', 'order confirmation', 'purchase'] },
  { text: 'Settings > Shipping Addresses', url: 'settings.html#shipping', icon: 'fa-truck', match: ['address', 'shipping address', 'delivery address', 'location', 'where'] },
  { text: 'Settings > Payment Methods', url: 'settings.html#payment', icon: 'fa-credit-card', match: ['payment', 'card', 'pay', 'method', 'credit', 'debit', 'billing'] },
  { text: 'Settings > Account Information', url: 'settings.html#account', icon: 'fa-user-circle', match: ['account info', 'account information', 'personal', 'details', 'name', 'email', 'phone'] },
  { text: 'Settings > Privacy & Security', url: 'settings.html#privacy', icon: 'fa-lock', match: ['privacy', 'security', 'password', 'login', 'change password', 'secure'] },
  { text: 'Settings > Notifications', url: 'settings.html#notifications', icon: 'fa-bell', match: ['notification settings', 'alert settings', 'preferences'] },
  { text: 'Settings > Couriers', url: 'settings.html#couriers', icon: 'fa-truck', match: ['courier', 'courier settings', 'delivery option'] },
  { text: 'Settings > Help & Support', url: 'settings.html#help', icon: 'fa-question-circle', match: ['help', 'support', 'assistance'] },
  { text: 'Privacy Policy', url: 'privacy-policy.html', icon: 'fa-shield-alt', match: ['privacy policy', 'privacy', 'data protection'] },
  { text: 'Terms of Service', url: 'terms-of-service.html', icon: 'fa-file-contract', match: ['terms', 'terms of service', 'conditions', 'agreement'] },
  { text: 'Warranty', url: 'warranty.html', icon: 'fa-certificate', match: ['warranty', 'guarantee', 'return', 'refund'] },
  { text: 'Sign In', url: 'signin.html', icon: 'fa-sign-in-alt', match: ['sign in', 'login', 'log in', 'signin'] },
  { text: 'Sign Up', url: 'signup.html', icon: 'fa-user-plus', match: ['sign up', 'register', 'registration', 'signup', 'create account'] },
];

function scoreSuggestion(queryLower, suggestion) {
  let score = 0;
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  for (const matchTerm of suggestion.match) {
    const matchLower = matchTerm.toLowerCase();
    if (matchLower === queryLower) return 100;
    if (queryLower.includes(matchLower)) score += 50;
    else if (matchLower.includes(queryLower)) score += 30;
    for (const word of queryWords) {
      if (word.length > 2 && matchLower.includes(word)) score += 10;
    }
  }
  return score;
}

async function handleSearch(req, res, q) {
  if (!q) {
    return res.status(400).json({ success: false, error: 'Search query required' });
  }
  try {
    const [products, _] = await Promise.all([
      searchItems(q),
      Promise.resolve(),
    ]);
    const queryLower = q.toLowerCase();
    const scored = SYSTEM_SUGGESTIONS.map((s) => ({ ...s, score: scoreSuggestion(queryLower, s) })).filter((s) => s.score > 0);
    scored.sort((a, b) => b.score - a.score);
    const suggestions = scored.slice(0, 10).map(({ text, url, icon }) => ({ text, url, icon }));
    return res.status(200).json({
      success: true,
      query: q,
      results: { products, suggestions },
      count: { products: products.length, suggestions: suggestions.length },
    });
  } catch (err) {
    console.error('handleSearch error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Search failed' });
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