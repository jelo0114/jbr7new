// pages/api/get.js
// GET endpoint for fetching user data from Supabase - FIXED VERSION

import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userId, itemId, status } = req.query;

  // Validate required parameters
  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required' });
  }

  try {
    let result;

    switch (action) {
      // ==================== GET ITEMS ====================
      case 'items':
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });

        if (itemsError) throw itemsError;
        return res.status(200).json({ success: true, data: items });

      // ==================== GET SAVED ITEMS ====================
      case 'saved-items':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const { data: savedItems, error: savedError } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (savedError) throw savedError;
        return res.status(200).json({ success: true, data: savedItems });

      // ==================== GET ORDERS ====================
      case 'orders':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        let ordersQuery = supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (status && status !== 'all') {
          ordersQuery = ordersQuery.eq('status', status);
        }

        const { data: orders, error: ordersError } = await ordersQuery;

        if (ordersError) throw ordersError;

        // Transform orders to include items array
        const transformedOrders = orders.map(order => ({
          ...order,
          items: order.order_items || [],
          can_cancel: order.status === 'processing'
        }));

        return res.status(200).json({ success: true, orders: transformedOrders });

      // ==================== GET SHIPPING ADDRESSES ====================
      case 'shipping-addresses':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const { data: addresses, error: addressError } = await supabase
          .from('shipping_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false });

        if (addressError) throw addressError;
        return res.status(200).json({ success: true, data: addresses });

      // ==================== GET USER PREFERENCES ====================
      case 'user-preferences':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const { data: prefs, error: prefsError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (prefsError && prefsError.code !== 'PGRST116') throw prefsError;
        return res.status(200).json({ success: true, data: prefs || {} });

      // ==================== GET NOTIFICATION PREFERENCES ====================
      case 'notification-preference':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const { data: notifPrefs, error: notifError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (notifError && notifError.code !== 'PGRST116') throw notifError;
        return res.status(200).json({ success: true, data: notifPrefs || { order_status: true, cart_reminder: true } });

      // ==================== GET PRODUCT REVIEWS ====================
      case 'product-reviews':
        if (!itemId) {
          return res.status(400).json({ error: 'itemId is required' });
        }

        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            users (username)
          `)
          .eq('item_id', itemId)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;
        return res.status(200).json({ success: true, data: reviews });

      // ==================== GET USER REVIEWS ====================
      case 'user-reviews':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        const { data: userReviews, error: userReviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (userReviewsError) throw userReviewsError;

        // Format reviews with date
        const formattedReviews = userReviews.map(review => ({
          ...review,
          date: new Date(review.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        }));

        return res.status(200).json({ success: true, reviews: formattedReviews });

      // ==================== GET USER ACTIVITIES ====================
      case 'user-activities':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        // Get user points
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        // Get recent activities (orders and reviews)
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('order_number, created_at, total')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: recentReviews } = await supabase
          .from('reviews')
          .select('product_title, created_at, rating')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        // Combine and format activities
        const activities = [];
        
        if (recentOrders) {
          recentOrders.forEach(order => {
            activities.push({
              type: 'order',
              description: `Order #${order.order_number}`,
              time_ago: formatTimeAgo(order.created_at),
              date: new Date(order.created_at).toLocaleDateString(),
              points: 150
            });
          });
        }

        if (recentReviews) {
          recentReviews.forEach(review => {
            activities.push({
              type: 'review',
              description: `Reviewed ${review.product_title}`,
              time_ago: formatTimeAgo(review.created_at),
              date: new Date(review.created_at).toLocaleDateString(),
              points: 50
            });
          });
        }

        // Sort by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json({ 
          success: true, 
          points: userData.points || 0,
          activities: activities 
        });

      // ==================== GET USER PROFILE ====================
      case 'profile':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }

        console.log('Fetching profile for userId:', userId);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, username, email, points, created_at, profile_picture')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        console.log('Profile fetched:', profile);

        // Get orders count - FIXED
        const { count: ordersCount, error: ordersCountError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (ordersCountError) {
          console.error('Orders count error:', ordersCountError);
        }

        // Get saved items count - FIXED
        const { count: savedCount, error: savedCountError } = await supabase
          .from('saved_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (savedCountError) {
          console.error('Saved items count error:', savedCountError);
        }

        // Get reviews count - FIXED
        const { count: reviewsCount, error: reviewsCountError } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (reviewsCountError) {
          console.error('Reviews count error:', reviewsCountError);
        }

        // Get actual saved items for the wishlist
        const { data: savedItemsData, error: savedItemsError } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (savedItemsError) {
          console.error('Saved items fetch error:', savedItemsError);
        }

        // Format saved items
        const formattedSavedItems = (savedItemsData || []).map(item => ({
          title: item.title,
          price: item.price,
          metadata: {
            image: item.image || 'totebag.avif'
          }
        }));

        // Get recent orders for display
        const { data: recentOrdersData, error: recentOrdersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentOrdersError) {
          console.error('Recent orders fetch error:', recentOrdersError);
        }

        console.log('Stats:', { ordersCount, savedCount, reviewsCount });

        return res.status(200).json({
          success: true,
          user: {
            username: profile.username,
            email: profile.email,
            points: profile.points || 0,
            created_at: profile.created_at,
            profile_picture: profile.profile_picture || null
          },
          stats: {
            orders: ordersCount || 0,
            saved: savedCount || 0,
            reviews: reviewsCount || 0,
            favorites: 0
          },
          items: formattedSavedItems,
          orders: recentOrdersData || []
        });

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

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}