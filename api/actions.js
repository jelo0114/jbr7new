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
} from '../supabse-conn/index';

import { createHash } from 'crypto';
import { supabase } from '../lib/supabaseClient';

// Hash password helper
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST and DELETE requests
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { action, userId, ...payload } = req.body;

  // Validate required parameters
  if (!action) {
    return res.status(400).json({ 
      success: false, 
      error: 'Action parameter is required' 
    });
  }

  try {
    let result = null;

    switch (action) {
      // ==================== AUTH ====================
      case 'signup': {
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

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('Database error checking email:', existingError);
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
          message: 'Account created successfully'
        });
      }

      case 'signin': {
        const { email, password } = payload;
        
        if (!email || !password) {
          return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
          });
        }

        const loginHash = hashPassword(password);

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, username, email')
          .eq('email', email)
          .eq('password_hash', loginHash)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Database error during signin:', userError);
          throw userError;
        }

        if (!user) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid email or password' 
          });
        }

        return res.status(200).json({
          success: true,
          user_id: user.id,
          username: user.username,
          email: user.email,
          message: 'Signed in successfully'
        });
      }
      
      // ==================== SAVED ITEMS ====================
      case 'add-saved-item': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await addSavedItem(userId, payload);
        result = { message: 'Item saved successfully' };
        break;
      }
      
      case 'delete-saved-item': {
        if (!userId || !payload.title) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId and title are required' 
          });
        }
        await deleteSavedItem(userId, payload.title);
        result = { message: 'Item removed successfully' };
        break;
      }
      
      case 'delete-all-saved-items': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await deleteAllSavedItems(userId);
        result = { message: 'All items cleared successfully' };
        break;
      }
      
      // ==================== SHIPPING ADDRESSES ====================
      case 'save-shipping-address': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await saveShippingAddress(userId, payload);
        result = { message: 'Shipping address saved successfully' };
        break;
      }
      
      case 'delete-shipping-address': {
        if (!userId || !payload.id) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId and id are required' 
          });
        }
        await deleteShippingAddress(userId, payload.id);
        result = { message: 'Address deleted successfully' };
        break;
      }
      
      case 'set-default-address': {
        if (!userId || !payload.id) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId and id are required' 
          });
        }
        await setDefaultShippingAddress(userId, payload.id);
        result = { message: 'Default address updated successfully' };
        break;
      }
      
      // ==================== USER PREFERENCES ====================
      case 'set-user-preferences': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await setUserPreferences(userId, payload);
        result = { message: 'Preferences updated successfully' };
        break;
      }
      
      case 'set-notification-preference': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await setNotificationPreference(userId, payload);
        result = { message: 'Notification preferences updated successfully' };
        break;
      }
      
      // ==================== ORDERS ====================
      case 'save-order': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        
        // Save order and get the generated order ID
        result = await saveOrderWithItems(userId, payload);
        
        // Create notification for order
        if (result && result.order_id) {
          try {
            await createOrderNotification(userId, {
              order_id: result.order_id,
              order_number: payload.orderId || result.order_number
            });
          } catch (notifError) {
            console.error('Failed to create order notification:', notifError);
            // Don't fail the order if notification fails
          }
        }
        
        return res.status(200).json({
          success: true,
          data: result,
          message: 'Order placed successfully'
        });
      }
      
      case 'cancel-order': {
        if (!userId || !payload.orderId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId and orderId are required' 
          });
        }
        await cancelOrder(userId, payload.orderId);
        result = { message: 'Order cancelled successfully' };
        break;
      }
      
      case 'update-order-status': {
        if (!payload.orderId || !payload.status) {
          return res.status(400).json({ 
            success: false, 
            error: 'orderId and status are required' 
          });
        }
        await updateOrderStatus(payload.orderId, payload.status);
        result = { message: 'Order status updated successfully' };
        break;
      }
      
      // ==================== REVIEWS & NOTIFICATIONS ====================
      case 'submit-review': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await submitReview(userId, payload);
        result = { message: 'Review submitted successfully' };
        break;
      }
      
      case 'create-notification': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await createOrderNotification(userId, payload);
        result = { message: 'Notification created successfully' };
        break;
      }
      
      case 'log-activity': {
        if (!userId) {
          return res.status(400).json({ 
            success: false, 
            error: 'userId is required' 
          });
        }
        await logUserActivity(userId, payload);
        result = { message: 'Activity logged successfully' };
        break;
      }
      
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Invalid action: ${action}` 
        });
    }

    return res.status(200).json({ 
      success: true, 
      message: `${action} completed successfully`,
      data: result 
    });
  } catch (error) {
    console.error('API Error:', error);
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error';
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}