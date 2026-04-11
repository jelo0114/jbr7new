import {
  addSavedItem,
  deleteSavedItem,
  deleteAllSavedItems,
  saveShippingAddress,
  deleteShippingAddress,
  setDefaultShippingAddress,
  setUserPreferences,
  setNotificationPreference,
  createOrderNotification,
  createOrderStatusNotification,
  getOrderById,
  saveOrderWithItems,
  cancelOrder,
  updateOrderStatus,
  submitReview,
  logUserActivity,
  logLogin,
} from '../supabse-conn/index';

import { createHash, randomBytes } from 'crypto';
import { supabase } from '../lib/supabaseClient';

// Hash password helper
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  // Only allow POST and DELETE requests
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userId, ...payload } = req.body;

  // Validate required parameters
  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required' });
  }

  try {
    let result = null;

    switch (action) {
      // ==================== AUTH ====================
      case 'signup':
        const { username, email, password } = payload;
        
        if (!username || !email || !password) {
          return res.status(400).json({ 
            success: false, 
            error: 'Username, email, and password are required' 
          });
        }
        if (password.length < 8) {
          return res.status(400).json({ 
            success: false, 
            error: 'Password must be at least 8 characters' 
          });
        }

        // Check if email already exists
        const { data: existing, error: existingError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingError) {
          console.error('Database error:', existingError);
          throw existingError;
        }
        
        if (existing) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email is already registered' 
          });
        }

        const password_hash = hashPassword(password);

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({ username, email, password_hash })
          .select('id')
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        return res.status(200).json({
          success: true,
          user_id: newUser?.id || null,
        });

      case 'signin':
        const { email: loginEmail, password: loginPassword } = payload;
        
        if (!loginEmail || !loginPassword) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
          });
        }

        const loginHash = hashPassword(loginPassword);

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, username, email')
          .eq('email', loginEmail)
          .eq('password_hash', loginHash)
          .maybeSingle();

        if (userError) {
          console.error('Database error:', userError);
          throw userError;
        }

        if (!user) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid email or password' 
          });
        }

        try {
          await logLogin(String(user.id), {
            ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null,
            user_agent: req.headers['user-agent'] || null,
          });
        } catch (e) {
          console.warn('logLogin failed:', e);
        }

        return res.status(200).json({
          success: true,
          user_id: user.id,
          username: user.username,
          email: user.email
        });

      // ==================== ADMIN AUTH ====================

      

      case 'admin-login':
        const { email: adminEmail, password: adminPassword } = payload;
        if (!adminEmail || !adminPassword) {
          return res.status(400).json({ success: false, error: 'Email and password are required' });
        }
        const adminHash = hashPassword(adminPassword);
        // Use ilike for case-insensitive email match (works regardless of how email was stored in DB)
        const { data: admin, error: adminErr } = await supabase
          .from('admin_users')
          .select('id, email, name')
          .ilike('email', String(adminEmail).trim())
          .eq('password_hash', adminHash)
          .maybeSingle();
        if (adminErr) {
          console.error('Admin login error:', adminErr);
          throw adminErr;
        }
        if (!admin) {
          return res.status(401).json({ success: false, error: 'Invalid admin email or password' });
        }
        return res.status(200).json({
          success: true,
          admin_id: admin.id,
          email: admin.email,
          name: admin.name,
        });
      
      // ==================== SAVED ITEMS ====================
      case 'add-saved-item':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await addSavedItem(userId, payload);
        break;
      
      case 'delete-saved-item':
        if (!userId || !payload.title) {
          return res.status(400).json({ error: 'userId and title are required' });
        }
        await deleteSavedItem(userId, payload.title);
        break;
      
      case 'delete-all-saved-items':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await deleteAllSavedItems(userId);
        break;
      
      // ==================== SHIPPING ADDRESSES ====================
      case 'save-shipping-address':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await saveShippingAddress(userId, payload);
        break;
      
      case 'delete-shipping-address':
        if (!userId || !payload.id) {
          return res.status(400).json({ error: 'userId and id are required' });
        }
        await deleteShippingAddress(userId, payload.id);
        break;
      
      case 'set-default-address':
        if (!userId || !payload.id) {
          return res.status(400).json({ error: 'userId and id are required' });
        }
        await setDefaultShippingAddress(userId, payload.id);
        break;
      
      // ==================== USER PREFERENCES ====================
      case 'set-user-preferences':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await setUserPreferences(userId, payload);
        break;
      
      case 'set-notification-preference':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await setNotificationPreference(userId, payload);
        break;
      
      // ==================== ORDERS ====================
      case 'save-order':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        result = await saveOrderWithItems(userId, payload);
        break;
      
      case 'cancel-order':
        if (!userId || !payload.orderId) {
          return res.status(400).json({ error: 'userId and orderId are required' });
        }
        await cancelOrder(userId, payload.orderId);
        break;
      
      case 'update-order-status':
        if (!payload.orderId || !payload.status) {
          return res.status(400).json({ error: 'orderId and status are required' });
        }
        const order = await getOrderById(payload.orderId);
        if (!order || !order.user_id) {
          return res.status(404).json({ error: 'Order not found' });
        }
        await updateOrderStatus(payload.orderId, payload.status);
        await createOrderStatusNotification(order.user_id, {
          order_id: order.id,
          order_number: order.order_number,
          status: payload.status,
        });
        break;
      
      // ==================== REVIEWS & NOTIFICATIONS ====================
      case 'submit-review':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await submitReview(userId, payload);
        break;
      
      case 'create-notification':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await createOrderNotification(userId, payload);
        break;
      
      case 'log-activity':
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        await logUserActivity(userId, payload);
        break;
      
      // ==================== PASSWORD RESET ====================
      case 'create_reset_token': {
        const { email } = payload;
        if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

        // Try to find user by email
        const { data: user, error: userErr } = await supabase.from('users').select('id,email').eq('email', String(email).trim()).maybeSingle();
        if (userErr) {
          console.error('User lookup error:', userErr);
          throw userErr;
        }

        // Generate secure token
        const token = randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + (60 * 60 * 1000)).toISOString(); // 1 hour

        const insertPayload = {
          token,
          user_id: user ? user.id : null,
          email: String(email).trim(),
          expires_at
        };

        const { data: inserted, error: insertErr } = await supabase.from('password_reset_tokens').insert(insertPayload).select('id').maybeSingle();
        if (insertErr) {
          console.error('Insert token error:', insertErr);
          throw insertErr;
        }

        // Build a reset URL using SITE_URL env or request headers
        const proto = (req.headers['x-forwarded-proto'] || 'https');
        const host = req.headers['x-forwarded-host'] || req.headers.host || '';
        const siteUrl = (process.env.SITE_URL || (proto + '://' + host)).replace(/\/$/, '');
        const reset_url = siteUrl + '/reset-password.html?token=' + encodeURIComponent(token);

        return res.status(200).json({ success: true, reset_url, token });
      }

      case 'verify_reset_token': {
        const { token } = payload;
        if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

        const { data: tokenRow, error: tokenErr } = await supabase
          .from('password_reset_tokens')
          .select('id, user_id, email, expires_at')
          .eq('token', token)
          .maybeSingle();

        if (tokenErr) {
          console.error('Token lookup error:', tokenErr);
          throw tokenErr;
        }

        if (!tokenRow) {
          return res.status(404).json({ success: false, error: 'Token not found' });
        }

        const now = new Date();
        if (tokenRow.expires_at && new Date(tokenRow.expires_at) < now) {
          // remove expired token
          await supabase.from('password_reset_tokens').delete().eq('id', tokenRow.id);
          return res.status(400).json({ success: false, error: 'Token expired' });
        }

        return res.status(200).json({ success: true, email: tokenRow.email || null, user_id: tokenRow.user_id || null });
      }

      case 'reset_password': {
        const { token, password } = payload;
        if (!token || !password) return res.status(400).json({ success: false, error: 'Token and password are required' });
        if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });

        const { data: tokenRow, error: tokenErr } = await supabase
          .from('password_reset_tokens')
          .select('id, user_id, email, expires_at')
          .eq('token', token)
          .maybeSingle();

        if (tokenErr) {
          console.error('Token lookup error:', tokenErr);
          throw tokenErr;
        }

        if (!tokenRow) {
          return res.status(404).json({ success: false, error: 'Invalid token' });
        }

        const now = new Date();
        if (tokenRow.expires_at && new Date(tokenRow.expires_at) < now) {
          await supabase.from('password_reset_tokens').delete().eq('id', tokenRow.id);
          return res.status(400).json({ success: false, error: 'Token expired' });
        }

        // Update user's password
        const password_hash = hashPassword(password);
        let updateErr = null;
        if (tokenRow.user_id) {
          const { error: uErr } = await supabase.from('users').update({ password_hash }).eq('id', tokenRow.user_id);
          updateErr = uErr;
        } else if (tokenRow.email) {
          const { error: uErr } = await supabase.from('users').update({ password_hash }).eq('email', tokenRow.email);
          updateErr = uErr;
        } else {
          return res.status(500).json({ success: false, error: 'Token missing user identifier' });
        }

        if (updateErr) {
          console.error('Password update error:', updateErr);
          throw updateErr;
        }

        // Delete token after successful reset
        await supabase.from('password_reset_tokens').delete().eq('id', tokenRow.id);

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
      }
      
      default:
        return res.status(400).json({ error: `Invalid action: ${action}` });
    }

    return res.status(200).json({ 
      success: true, 
      message: `${action} completed successfully`,
      data: result 
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}