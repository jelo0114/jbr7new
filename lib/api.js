// Frontend API Helper with Auth
// Use these functions instead of calling fetch directly

const API_BASE = ''; // Empty string means same domain

// ==================== HELPER FUNCTION ====================
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

// ==================== AUTH OPERATIONS ====================

export async function signup(username, email, password) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'signup',
      username,
      email,
      password
    })
  });
}

export async function signin(email, password) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'signin',
      email,
      password
    })
  });
}

// ==================== GET OPERATIONS (READ DATA) ====================

export async function getItems() {
  const result = await apiCall(`${API_BASE}/api/data?action=items`);
  return result.data;
}

export async function getSavedItems(userId) {
  const result = await apiCall(`${API_BASE}/api/data?action=saved-items&userId=${userId}`);
  return result.data;
}

export async function getOrders(userId) {
  const result = await apiCall(`${API_BASE}/api/data?action=orders&userId=${userId}`);
  return result.data;
}

export async function getShippingAddresses(userId) {
  const result = await apiCall(`${API_BASE}/api/data?action=shipping-addresses&userId=${userId}`);
  return result.data;
}

export async function getUserPreferences(userId) {
  const result = await apiCall(`${API_BASE}/api/data?action=user-preferences&userId=${userId}`);
  return result.data;
}

export async function getNotificationPreference(userId) {
  const result = await apiCall(`${API_BASE}/api/data?action=notification-preference&userId=${userId}`);
  return result.data;
}

export async function getProductReviews(itemId) {
  const result = await apiCall(`${API_BASE}/api/data?action=product-reviews&itemId=${itemId}`);
  return result.data;
}

export async function getUserActivities(userId) {
  const result = await apiCall(`${API_BASE}/api/data?action=user-activities&userId=${userId}`);
  return result.data;
}

// ==================== POST OPERATIONS (WRITE DATA) ====================

export async function addSavedItem(userId, itemData) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add-saved-item',
      userId,
      ...itemData
    })
  });
}

export async function deleteSavedItem(userId, title) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete-saved-item',
      userId,
      title
    })
  });
}

export async function deleteAllSavedItems(userId) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete-all-saved-items',
      userId
    })
  });
}

export async function saveShippingAddress(userId, addressData) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save-shipping-address',
      userId,
      ...addressData
    })
  });
}

export async function deleteShippingAddress(userId, addressId) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'delete-shipping-address',
      userId,
      id: addressId
    })
  });
}

export async function setDefaultAddress(userId, addressId) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'set-default-address',
      userId,
      id: addressId
    })
  });
}

export async function setUserPreferences(userId, preferences) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'set-user-preferences',
      userId,
      ...preferences
    })
  });
}

export async function setNotificationPreference(userId, preferences) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'set-notification-preference',
      userId,
      ...preferences
    })
  });
}

export async function saveOrder(userId, orderData) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save-order',
      userId,
      ...orderData
    })
  });
}

export async function cancelOrder(userId, orderId) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'cancel-order',
      userId,
      orderId
    })
  });
}

export async function updateOrderStatus(orderId, status) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update-order-status',
      orderId,
      status
    })
  });
}

export async function submitReview(userId, reviewData) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'submit-review',
      userId,
      ...reviewData
    })
  });
}

export async function createNotification(userId, notificationData) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-notification',
      userId,
      ...notificationData
    })
  });
}

export async function logActivity(userId, activityData) {
  return await apiCall(`${API_BASE}/api/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'log-activity',
      userId,
      ...activityData
    })
  });
}