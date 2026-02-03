import {
  saveShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  setUserPreferences,
  setNotificationPreference,
  markNotificationRead,
  markAllNotificationsRead,
  claimRewardCoupon,
  getAdminById,
  updateOrderStatus,
  updateUserProfilePicture,
} from '../supabse-conn/index';

import { createHash } from 'crypto';
import { supabase } from '../lib/supabaseClient';

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  // Validate required parameters
  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required' });
  }

  try {
    switch (action) {
      // ==================== UPDATE ACCOUNT ====================
      case 'update-account':
        return await handleUpdateAccount(req, res);

      // ==================== CHANGE PASSWORD ====================
      case 'change-password':
        return await handleChangePassword(req, res);

      // ==================== DELETE ACCOUNT ====================
      case 'delete-account':
        return await handleDeleteAccount(req, res);

      // ==================== SAVE/UPDATE ADDRESS ====================
      case 'save-address':
      case 'update-address':
        return await handleSaveAddress(req, res);

      // ==================== DELETE ADDRESS ====================
      case 'delete-address':
        return await handleDeleteAddress(req, res);

      // ==================== SET DEFAULT ADDRESS ====================
      case 'set-default-address':
        return await handleSetDefaultAddress(req, res);

      // ==================== SAVE PREFERENCES ====================
      case 'save-preferences':
        return await handleSavePreferences(req, res);

      // ==================== UPDATE NOTIFICATION PREFERENCE ====================
      case 'update-notification-preference':
        return await handleUpdateNotificationPreference(req, res);

      case 'mark-notification-read':
        return await handleMarkNotificationRead(req, res);

      case 'mark-all-notifications-read':
        return await handleMarkAllNotificationsRead(req, res);

      // ==================== DELETE SAVED ITEM ====================
      case 'delete-saved-item':
        return await handleDeleteSavedItem(req, res);

      // ==================== CLAIM REWARD (points → coupon) ====================
      case 'claim-reward':
        return await handleClaimReward(req, res);

      // ==================== ADMIN ====================
      case 'admin-update-order-status':
        return await handleAdminUpdateOrderStatus(req, res);

      // ==================== UPLOAD PROFILE PHOTO ====================
      case 'upload-profile-photo':
        return await handleUploadProfilePhoto(req, res);

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

// ==================== UPDATE ACCOUNT ====================
async function handleUpdateAccount(req, res) {
  const { userId, username, email, phone } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Update account error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== CHANGE PASSWORD ====================
// Supports both Supabase Auth users and legacy users (password_hash in public.users).
async function handleChangePassword(req, res) {
  const { userId, authUserId: bodyAuthUid, currentPassword, newPassword, email: bodyEmail } = req.body;
  
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: {
        userId: userId ? 'provided' : 'missing',
        currentPassword: currentPassword ? 'provided' : 'missing',
        newPassword: newPassword ? 'provided' : 'missing'
      }
    });
  }
  
  const userIdStr = String(userId).trim();
  const bodyAuthUidStr = bodyAuthUid ? String(bodyAuthUid).trim() : '';
  const emailStr = bodyEmail && String(bodyEmail).trim() ? String(bodyEmail).trim() : '';

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return res.status(501).json({
        success: false,
        error: 'Password change is not configured (missing SUPABASE_SERVICE_ROLE_KEY).'
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Look up user by id or email — select only columns that exist on public.users (id, email, password_hash)
    const userIdKey = /^\d+$/.test(String(userIdStr)) ? parseInt(userIdStr, 10) : userIdStr;
    const userColumns = 'id, email, password_hash';
    let row = null;
    let rowError = null;
    const { data: rowByNum, error: errNum } = await adminClient
      .from('users')
      .select(userColumns)
      .eq('id', userIdKey)
      .maybeSingle();
    if (rowByNum) {
      row = rowByNum;
    } else if (userIdStr !== String(userIdKey)) {
      const { data: rowByStr, error: errStr } = await adminClient
        .from('users')
        .select(userColumns)
        .eq('id', userIdStr)
        .maybeSingle();
      if (rowByStr) row = rowByStr;
      rowError = errStr;
    } else {
      rowError = errNum;
    }

    if (!row && emailStr) {
      const { data: rowByEmail, error: errEmail } = await adminClient
        .from('users')
        .select(userColumns)
        .eq('email', emailStr)
        .maybeSingle();
      if (rowByEmail) row = rowByEmail;
      rowError = errEmail;
    }

    if (!row) {
      console.error('Change password user lookup:', rowError || 'not found', 'userId:', userIdStr, 'email:', emailStr || '(none)');
      return res.status(400).json({
        success: false,
        error: 'User not found. Please sign out and sign in again.'
      });
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let authUserId = (bodyAuthUidStr || '').trim();
    if (!UUID_REGEX.test(String(authUserId)) && row.email) {
      const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const authUser = (listData && listData.users)
        ? listData.users.find(u => (u.email || '').toLowerCase() === (row.email || '').toLowerCase())
        : null;
      if (authUser && authUser.id) authUserId = authUser.id;
    }

    if (UUID_REGEX.test(String(authUserId))) {
      const { error } = await adminClient.auth.admin.updateUserById(authUserId, { password: newPassword });
      if (error) {
        console.error('Change password Auth error:', error);
        return res.status(400).json({ success: false, error: error.message || 'Failed to update password' });
      }
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    if (row.password_hash) {
      const currentHash = hashPassword(currentPassword);
      if (currentHash !== row.password_hash) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect.'
        });
      }
      const newHash = hashPassword(newPassword);
      const { error: updateError } = await adminClient
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', row.id);
      if (updateError) {
        console.error('Change password legacy update:', updateError);
        return res.status(500).json({ success: false, error: 'Failed to update password.' });
      }
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }

    // User exists but has no password_hash (e.g. Auth-only or different schema): set password so legacy signin works
    const newHash = hashPassword(newPassword);
    const { error: setError } = await adminClient
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', row.id);
    if (setError) {
      if (setError.message && /column.*does not exist|password_hash/i.test(setError.message)) {
        return res.status(400).json({
          success: false,
          error: 'Account not linked to sign-in. Please sign out and sign in again.'
        });
      }
      console.error('Change password set password_hash:', setError);
      return res.status(500).json({ success: false, error: 'Failed to update password.' });
    }
    return res.status(200).json({ success: true, message: 'Password set successfully. You can now sign in with your email and this password.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// ==================== CLAIM REWARD (points → coupon) ====================
async function handleClaimReward(req, res) {
  const { userId, pointsCost, discountPercent } = req.body;
  if (!userId || pointsCost == null || discountPercent == null) {
    return res.status(400).json({ success: false, error: 'userId, pointsCost, and discountPercent required' });
  }
  const pts = parseInt(pointsCost, 10);
  const pct = parseInt(discountPercent, 10);
  if (isNaN(pts) || isNaN(pct) || pts < 0 || pct < 1 || pct > 100) {
    return res.status(400).json({ success: false, error: 'Invalid pointsCost or discountPercent' });
  }
  try {
    const { points } = await claimRewardCoupon(userId, pts, pct);
    return res.status(200).json({ success: true, message: 'Coupon claimed! Use it at checkout.', points });
  } catch (err) {
    console.error('Claim reward error:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to claim reward' });
  }
}

// ==================== DELETE ACCOUNT (delete all user data then user) ====================
async function handleDeleteAccount(req, res) {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const uid = parseInt(userId, 10) || userId;

  try {
    // First verify the password is correct
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', uid)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password_hash !== hashedPassword) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    // Delete all user data first (child tables then parent)
    const { data: userOrders } = await supabase.from('orders').select('id').eq('user_id', uid);
    const orderIds = (userOrders || []).map(o => o.id).filter(Boolean);
    if (orderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', orderIds);
    }
    
    // Clear all related tables (notification_preferences included)
    const tablesToClear = [
      'orders', 
      'reviews', 
      'saved_items', 
      'shipping_addresses', 
      'user_coupons', 
      'notifications', 
      'notification_preferences',
      'user_activities', 
      'receipts', 
      'login_history', 
      'user_preferences'
    ];
    
    for (const table of tablesToClear) {
      const { error: delErr } = await supabase.from(table).delete().eq('user_id', uid);
      if (delErr && !/does not exist|relation/i.test(delErr.message)) {
        console.warn('Delete from', table, ':', delErr.message);
      }
    }

    // Finally delete the user
    const { error: deleteUserError } = await supabase.from('users').delete().eq('id', uid);
    if (deleteUserError) {
      console.error('Failed to delete user:', deleteUserError);
      throw deleteUserError;
    }

    return res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
    });
  }
}

// ==================== UPLOAD PROFILE PHOTO ====================
// Uploads image to Supabase Storage and stores only the public URL in DB (avoids index size limit).
const PROFILE_BUCKET = 'avatars';
const MAX_BASE64_LENGTH = 5 * 1024 * 1024; // ~3.75MB image as base64

function extFromContentType(contentType) {
  const t = String(contentType || '').toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('gif')) return 'gif';
  if (t.includes('webp')) return 'webp';
  return 'jpg';
}

async function handleUploadProfilePhoto(req, res) {
  const body = req.body || {};
  const userId = body.userId;
  const photo = body.photo;
  const contentType = body.contentType;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }
  if (!photo || typeof photo !== 'string') {
    return res.status(400).json({ success: false, error: 'photo (base64) is required' });
  }
  if (photo.length > MAX_BASE64_LENGTH) {
    return res.status(400).json({ success: false, error: 'Image too large. Max ~4MB.' });
  }
  const type = (contentType && String(contentType).startsWith('image/')) ? contentType : 'image/jpeg';
  const ext = extFromContentType(contentType);
  let buffer;
  try {
    buffer = Buffer.from(photo, 'base64');
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Invalid base64 image.' });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(503).json({ success: false, error: 'Storage not configured (Supabase URL / service role).' });
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const path = `${String(userId).replace(/[^a-zA-Z0-9_-]/g, '')}.${ext}`;
    const { data: uploadData, error: uploadError } = await admin.storage
      .from(PROFILE_BUCKET)
      .upload(path, buffer, { contentType: type, upsert: true });
    if (uploadError) {
      console.error('Profile photo storage upload error:', uploadError);
      return res.status(500).json({ success: false, error: uploadError.message || 'Storage upload failed.' });
    }
    const { data: urlData } = admin.storage.from(PROFILE_BUCKET).getPublicUrl(uploadData.path);
    const publicUrl = urlData.publicUrl;
    await updateUserProfilePicture(userId, publicUrl);
    return res.status(200).json({ success: true, photo_url: publicUrl });
  } catch (error) {
    const msg = error && error.message ? error.message : 'Failed to save photo';
    console.error('Upload profile photo error:', msg);
    return res.status(500).json({ success: false, error: msg });
  }
}

// ==================== ADMIN: UPDATE ORDER STATUS ====================
async function handleAdminUpdateOrderStatus(req, res) {
  const { adminId, orderId, status } = req.body;
  if (!adminId || !orderId || !status) {
    return res.status(400).json({ success: false, error: 'adminId, orderId, and status are required' });
  }
  try {
    const admin = await getAdminById(adminId);
    if (!admin) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const validStatuses = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(String(status))) {
      return res.status(400).json({ success: false, error: 'Invalid status. Use: processing, confirmed, shipped, delivered, cancelled' });
    }
    await updateOrderStatus(parseInt(orderId, 10), String(status));
    return res.status(200).json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Admin update order status error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to update order status' });
  }
}

// ==================== SAVE/UPDATE ADDRESS ====================
async function handleSaveAddress(req, res) {
  const { userId, id, ...addressData } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    if (id) {
      // Update existing address
      const { error } = await supabase
        .from('shipping_addresses')
        .update({ ...addressData, user_id: userId })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // If set as default, unset others
      if (addressData.is_default) {
        await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', userId)
          .neq('id', id);
      }

      return res.status(200).json({
        success: true,
        message: 'Address updated successfully'
      });
    } else {
      // Create new address
      await saveShippingAddress(userId, addressData);

      return res.status(200).json({
        success: true,
        message: 'Address saved successfully'
      });
    }
  } catch (error) {
    console.error('Save address error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== DELETE ADDRESS ====================
async function handleDeleteAddress(req, res) {
  const { userId, id } = req.body;

  if (!userId || !id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await deleteShippingAddress(userId, id);

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== SET DEFAULT ADDRESS ====================
async function handleSetDefaultAddress(req, res) {
  const { userId, id } = req.body;

  if (!userId || !id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await setDefaultShippingAddress(userId, id);

    return res.status(200).json({
      success: true,
      message: 'Default address updated'
    });
  } catch (error) {
    console.error('Set default address error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== SAVE PREFERENCES ====================
async function handleSavePreferences(req, res) {
  const { userId, default_payment, default_courier } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get existing preferences
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const updateData = {};
    if (default_payment !== undefined && default_payment !== null) {
      updateData.default_payment = default_payment;
    }
    if (default_courier !== undefined && default_courier !== null) {
      updateData.default_courier = default_courier;
    }

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updateData
        });

      if (error) throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Preferences saved successfully'
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== UPDATE NOTIFICATION PREFERENCE ====================
async function handleUpdateNotificationPreference(req, res) {
  const { userId, notification_type, enabled } = req.body;

  if (!userId || !notification_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get existing preferences (maybeSingle so no row doesn't throw)
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const updateData = {};
    if (notification_type === 'order_status') {
      updateData.order_status = enabled ? true : false;
    } else if (notification_type === 'cart_reminder') {
      updateData.cart_reminder = enabled ? true : false;
    }

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Create new with defaults
      const { error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          order_status: notification_type === 'order_status' ? isEnabled : true,
          cart_reminder: notification_type === 'cart_reminder' ? isEnabled : true
        });

      if (error) throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Notification preference updated'
    });
  } catch (error) {
    console.error('Update notification preference error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== MARK NOTIFICATION READ ====================
async function handleMarkNotificationRead(req, res) {
  const { userId, notificationId } = req.body;
  if (!userId || !notificationId) {
    return res.status(400).json({ error: 'userId and notificationId are required' });
  }
  try {
    await markNotificationRead(userId, notificationId);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ==================== MARK ALL NOTIFICATIONS READ ====================
async function handleMarkAllNotificationsRead(req, res) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  try {
    await markAllNotificationsRead(userId);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ==================== DELETE SAVED ITEM ====================
async function handleDeleteSavedItem(req, res) {
  const { userId, title } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('title', title);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Item removed from saved items'
    });
  } catch (error) {
    console.error('Delete saved item error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}