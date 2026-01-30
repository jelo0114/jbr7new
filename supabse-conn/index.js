// Central Supabase connection helpers for migrating PHP endpoints
// Folder: supabse-conn
// UPDATED VERSION - Handles missing profile_picture column gracefully

import { supabase } from '../lib/supabaseClient';

// -----------------------------
// ITEMS + RATINGS (get_items.php)
// -----------------------------

export async function getItemsWithRatings() {
  const { data, error } = await supabase
    .from('items')
    .select(
      'id, item_id, title, description, price, image, category, rating, review_count, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`getItemsWithRatings failed: ${error.message}`);
  }

  return data || [];
}

// -----------------------------
// SAVED ITEMS (get_saved_items.php, save_item.php, delete_saved_item.php, delete_all_saved_items.php)
// -----------------------------

export async function getSavedItems(userId) {
  const { data, error } = await supabase
    .from('saved_items')
    .select('id, title, price, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`getSavedItems failed: ${error.message}`);
  }

  return data || [];
}

export async function addSavedItem(userId, { title, price, metadata = {} }) {
  const { error } = await supabase.from('saved_items').insert({
    user_id: userId,
    title,
    price,
    metadata,
  });

  if (error) {
    throw new Error(`addSavedItem failed: ${error.message}`);
  }
}

export async function deleteSavedItem(userId, title) {
  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', userId)
    .eq('title', title);

  if (error) {
    throw new Error(`deleteSavedItem failed: ${error.message}`);
  }
}

export async function deleteAllSavedItems(userId) {
  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`deleteAllSavedItems failed: ${error.message}`);
  }
}

// -----------------------------
// SHIPPING ADDRESSES (get_shipping_addresses.php, save_shipping_address.php, delete_shipping_address.php, set_default_address.php)
// -----------------------------

export async function getShippingAddresses(userId) {
  const { data, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`getShippingAddresses failed: ${error.message}`);
  }

  return data || [];
}

export async function saveShippingAddress(userId, addressData) {
  // Remove API-only fields before inserting into DB
  const { action, userId: _ignoreUserId, ...cleanData } = addressData;

  const { error } = await supabase
    .from('shipping_addresses')
    .insert({
      user_id: userId,
      ...cleanData
    });

  if (error) throw error;
}


export async function deleteShippingAddress(userId, id) {
  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    throw new Error(`deleteShippingAddress failed: ${error.message}`);
  }
}

export async function setDefaultShippingAddress(userId, id) {
  // Clear previous defaults, then set one address as default
  const { error: clearError } = await supabase
    .from('shipping_addresses')
    .update({ is_default: false })
    .eq('user_id', userId);

  if (clearError) {
    throw new Error(`setDefaultShippingAddress (clear) failed: ${clearError.message}`);
  }

  const { error } = await supabase
    .from('shipping_addresses')
    .update({ is_default: true })
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    throw new Error(`setDefaultShippingAddress failed: ${error.message}`);
  }
}

// -----------------------------
// USER PREFERENCES (get_user_preferences.php, save_user_preferences.php)
// -----------------------------

export async function getUserPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(`getUserPreferences failed: ${error.message}`);
  }

  return data || null;
}

export async function setUserPreferences(userId, { default_payment, default_courier }) {
  const existing = await getUserPreferences(userId);
  if (existing) {
    const { error } = await supabase
      .from('user_preferences')
      .update({
        default_payment,
        default_courier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`setUserPreferences (update) failed: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('user_preferences').insert({
      user_id: userId,
      default_payment,
      default_courier,
    });

    if (error) {
      throw new Error(`setUserPreferences (insert) failed: ${error.message}`);
    }
  }
}

// -----------------------------
// NOTIFICATION PREFERENCES + NOTIFICATIONS
// (get_notification_preference.php, update_notification_preference.php, create_order_notification.php)
// -----------------------------

export async function getNotificationPreference(userId) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`getNotificationPreference failed: ${error.message}`);
  }

  return data || null;
}

export async function setNotificationPreference(
  userId,
  { order_status = true, cart_reminder = true }
) {
  const existing = await getNotificationPreference(userId);

  if (existing) {
    const { error } = await supabase
      .from('notification_preferences')
      .update({
        order_status,
        cart_reminder,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`setNotificationPreference (update) failed: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('notification_preferences').insert({
      user_id: userId,
      order_status,
      cart_reminder,
    });

    if (error) {
      throw new Error(`setNotificationPreference (insert) failed: ${error.message}`);
    }
  }
}

export async function createOrderNotification(userId, { order_id, order_number }) {
  const title = 'Order placed';
  const message = `Your order ${order_number || order_id} has been placed successfully.`;

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    notification_type: 'order_status',
    title,
    message,
    related_id: order_id || null,
  });

  if (error) {
    throw new Error(`createOrderNotification failed: ${error.message}`);
  }
}

// -----------------------------
// ORDERS + ORDER ITEMS (save_order.php, get_orders.php, cancel_order.php, update_order_status.php)
// -----------------------------

export async function saveOrderWithItems(userId, payload) {
  // payload expected similar to checkoutData in cart.js
  const {
    orderId,
    subtotal,
    shipping,
    total,
    payment,
    courier,
    customerEmail,
    customerPhone,
    items,
  } = payload;

  const now = new Date().toISOString();

  // Insert into orders
  const { data: orderRows, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderId,
      status: 'processing',
      subtotal,
      shipping,
      total,
      items_json: items || [],
      created_at: now,
      payment_method: payment,
      courier_service: courier,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
    })
    .select('id')
    .maybeSingle();

  if (orderError || !orderRows) {
    throw new Error(`saveOrderWithItems (orders) failed: ${
      orderError ? orderError.message : 'no order row returned'
    }`);
  }

  const orderIdDb = orderRows.id;

  // Insert into order_items
  if (items && items.length) {
    const itemRows = items.map((it) => ({
      order_id: orderIdDb,
      item_name: it.name || '',
      item_image: it.image || null,
      item_price: it.unitPrice || 0,
      quantity: it.quantity || 1,
      size: it.size || null,
      color: it.color || null,
      line_total: it.lineTotal || 0,
      status: 'processing',
      created_at: now,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemRows);
    if (itemsError) {
      throw new Error(`saveOrderWithItems (order_items) failed: ${itemsError.message}`);
    }
  }

  return { order_id: orderIdDb, order_number: orderId };
}

export async function getOrdersForUser(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`getOrdersForUser failed: ${error.message}`);
  }

  return data || [];
}

export async function cancelOrder(userId, orderId) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', status_updated_at: now })
    .eq('user_id', userId)
    .eq('id', orderId);

  if (error) {
    throw new Error(`cancelOrder failed: ${error.message}`);
  }
}

export async function updateOrderStatus(orderId, status) {
  const now = new Date().toISOString();

  const patch = {
    status,
    status_updated_at: now,
  };

  if (status === 'shipped') {
    patch.shipped_at = now;
  } else if (status === 'delivered') {
    patch.delivered_at = now;
  }

  const { error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId);

  if (error) {
    throw new Error(`updateOrderStatus failed: ${error.message}`);
  }
}

// -----------------------------
// REVIEWS (get_product_reviews_new.php, submit_review_new.php)
// -----------------------------

export async function getProductReviews(itemIdOrTitle) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .or(`item_id.eq.${itemIdOrTitle},product_title.eq.${itemIdOrTitle}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`getProductReviews failed: ${error.message}`);
  }

  return data || [];
}

export async function submitReview(userId, { product_title, item_id, rating, comment }) {
  const now = new Date().toISOString();

  const { error } = await supabase.from('reviews').upsert(
    {
      user_id: userId,
      product_title,
      item_id,
      rating,
      comment,
      created_at: now,
      updated_at: now,
    },
    {
      onConflict: 'user_id,item_id',
    }
  );

  if (error) {
    throw new Error(`submitReview failed: ${error.message}`);
  }
}

// -----------------------------
// USER ACTIVITIES / REWARDS (get_user_activities.php)
// -----------------------------

export async function logUserActivity(userId, { activity_type, description, points_awarded }) {
  const { error } = await supabase.from('user_activities').insert({
    user_id: userId,
    activity_type,
    description: description || null,
    points_awarded: points_awarded || 0,
  });

  if (error) {
    throw new Error(`logUserActivity failed: ${error.message}`);
  }
}

export async function getUserActivities(userId) {
  try {
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

    return {
      points: userData.points || 0,
      activities: activities
    };
  } catch (error) {
    console.error('getUserActivities error:', error);
    throw error;
  }
}

// -----------------------------
// USER PROFILE (NEW - for profile page)
// UPDATED: Doesn't require profile_picture column
// -----------------------------

export async function getUserProfile(userId) {
  try {
    console.log('Fetching profile for userId:', userId);

    // Try to get profile with profile_picture first
    let profile;
    let profileError;
    
    // First attempt: with profile_picture and phone
    const result = await supabase
      .from('users')
      .select('id, username, email, phone, points, created_at, profile_picture')
      .eq('id', userId)
      .single();
    
    profile = result.data;
    profileError = result.error;
    
    // If profile_picture or phone column doesn't exist, try without them
    if (profileError && (profileError.message.includes('profile_picture') || profileError.message.includes('phone'))) {
      console.log('Some columns not found, fetching without them');
      const fallbackResult = await supabase
        .from('users')
        .select('id, username, email, points, created_at')
        .eq('id', userId)
        .single();
      
      profile = fallbackResult.data;
      profileError = fallbackResult.error;
      
      if (profile) {
        if (!('profile_picture' in profile)) profile.profile_picture = null;
        if (!('phone' in profile)) profile.phone = null;
      }
    }

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw profileError;
    }

    console.log('Profile fetched:', profile);

    // Get orders count
    const { count: ordersCount, error: ordersCountError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (ordersCountError) {
      console.error('Orders count error:', ordersCountError);
    }

    // Get saved items count
    const { count: savedCount, error: savedCountError } = await supabase
      .from('saved_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (savedCountError) {
      console.error('Saved items count error:', savedCountError);
    }

    // Get reviews count
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
      metadata: item.metadata || {
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

    return {
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        phone: profile.phone ?? profile.mobile ?? profile.phone_number ?? profile.number ?? null,
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
    };
  } catch (error) {
    console.error('getUserProfile error:', error);
    throw error;
  }
}

// -----------------------------
// USER REVIEWS (NEW - for profile page)
// -----------------------------

export async function getUserReviews(userId) {
  try {
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

    return formattedReviews;
  } catch (error) {
    console.error('getUserReviews error:', error);
    throw error;
  }
}


// -----------------------------
// HELPER FUNCTIONS
// -----------------------------

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

