// pages/api/get.js
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
  } from '../supabse-conn/index';
  
  export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { action, userId, itemId } = req.query;
  
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
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for orders' });
          }
          result = await getOrdersForUser(userId);
          return res.status(200).json({ success: true, orders: result });
        
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
        
        // ==================== NEW: PROFILE ACTION ====================
        case 'profile':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for profile' });
          }
          result = await getUserProfile(userId);
          return res.status(200).json({ success: true, ...result });
        
        // ==================== NEW: USER REVIEWS ACTION ====================
        case 'user-reviews':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for user-reviews' });
          }
          result = await getUserReviews(userId);
          return res.status(200).json({ success: true, reviews: result });
        
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