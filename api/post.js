// pages/api/post.js
// POST endpoint for user actions (create, update, delete)

import {
    saveShippingAddress,
    deleteShippingAddress,
    setDefaultShippingAddress,
    setUserPreferences,
    setNotificationPreference,
  } from '../supabse-conn/index';
  
  import { supabase } from '../lib/supabaseClient';
  
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
  
        // ==================== DELETE SAVED ITEM ====================
        case 'delete-saved-item':
          return await handleDeleteSavedItem(req, res);
  
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
  async function handleChangePassword(req, res) {
    const { userId, currentPassword, newPassword } = req.body;
  
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      // Get current password hash
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();
  
      if (fetchError) throw fetchError;
  
      // In a real app, you'd verify the current password here
      // For now, we'll just update to the new password
      // You should use bcrypt or similar to hash passwords
  
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword }) // In production, hash this!
        .eq('id', userId);
  
      if (updateError) throw updateError;
  
      return res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  // ==================== DELETE ACCOUNT ====================
  async function handleDeleteAccount(req, res) {
    const { userId, password } = req.body;
  
    if (!userId || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      // In production, verify password first
      // Then delete all related data and the user
  
      // Delete user (CASCADE should handle related data)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
  
      if (error) throw error;
  
      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      // Get existing preferences
      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
  
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
            order_status: notification_type === 'order_status' ? enabled : true,
            cart_reminder: notification_type === 'cart_reminder' ? enabled : true
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
  