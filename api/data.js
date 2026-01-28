import {
    getItemsWithRatings,
    getSavedItems,
    getOrdersForUser,
    getShippingAddresses,
    getUserPreferences,
    getNotificationPreference,
    getProductReviews,
    getUserActivities,
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
      let data;
  
      switch (action) {
        case 'items':
          data = await getItemsWithRatings();
          break;
        
        case 'saved-items':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for saved-items' });
          }
          data = await getSavedItems(userId);
          break;
        
        case 'orders':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for orders' });
          }
          data = await getOrdersForUser(userId);
          break;
        
        case 'shipping-addresses':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for shipping-addresses' });
          }
          data = await getShippingAddresses(userId);
          break;
        
        case 'user-preferences':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for user-preferences' });
          }
          data = await getUserPreferences(userId);
          break;
        
        case 'notification-preference':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for notification-preference' });
          }
          data = await getNotificationPreference(userId);
          break;
        
        case 'product-reviews':
          if (!itemId) {
            return res.status(400).json({ error: 'itemId is required for product-reviews' });
          }
          data = await getProductReviews(itemId);
          break;
        
        case 'user-activities':
          if (!userId) {
            return res.status(400).json({ error: 'userId is required for user-activities' });
          }
          data = await getUserActivities(userId);
          break;
        
        default:
          return res.status(400).json({ error: `Invalid action: ${action}` });
      }
  
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error' 
      });
    }
  }