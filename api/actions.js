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
  saveOrderWithItems,
  cancelOrder,
  updateOrderStatus,
  submitReview,
  logUserActivity,
  logLogin,
} from '../supabse-conn/index';

import { createHash } from 'crypto';
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
        await updateOrderStatus(payload.orderId, payload.status);
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