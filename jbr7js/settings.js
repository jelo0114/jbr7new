// Settings Page Functionality - Updated to use Next.js API routes

// Get user ID from session storage
function getUserId() {
    return sessionStorage.getItem('jbr7_user_id');
}

// Show specific settings section
function showSettingsSection(sectionName) {
    const sections = document.querySelectorAll('.settings-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    const menuItems = document.querySelectorAll('.settings-menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
    }
    
    const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Load data based on section
    if (sectionName === 'privacy') {
        loadLoginHistory();
    } else if (sectionName === 'shipping') {
        loadAddresses();
    }
}

// Load user data from API
async function loadUserData() {
    const userId = getUserId();
    
    if (!userId) {
        console.warn('No user ID found, redirecting to login');
        window.location.href = '/login.html';
        return;
    }

    try {
        console.log('settings.js: Loading user data for userId:', userId);
        const response = await fetch(`/api/get?action=profile&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('settings.js: Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('Not authenticated, redirecting to login');
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to load user data');
        }

        const data = await response.json();
        console.log('settings.js: Received data:', data);
        
        if (data.success && data.user) {
            populateAccountForm(data.user);
        } else {
            console.error('Invalid data format:', data);
            showNotification('Unable to load account information', 'info');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Unable to load account information', 'info');
    }
}

// Populate account form with user data
function populateAccountForm(user) {
    console.log('Populating account form with:', user);
    
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    if (fullNameInput) {
        fullNameInput.value = user.username || '';
        console.log('Set fullName to:', user.username);
    }
    
    if (emailInput) {
        emailInput.value = user.email || '';
        console.log('Set email to:', user.email);
    }
    
    if (phoneInput) {
        phoneInput.value = user.phone || '';
        console.log('Set phone to:', user.phone);
    }
}

// Save account information - TODO: Implement API endpoint
async function saveAccountInfo() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const userId = getUserId();
    
    console.log('Saving account info:', { fullName, email, phone });
    
    if (!userId) {
        showNotification('Please log in first', 'info');
        return;
    }
    
    if (!fullName) {
        showNotification('Full name is required', 'info');
        return;
    }
    
    if (!email || !isValidEmail(email)) {
        showNotification('Valid email is required', 'info');
        return;
    }
    
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update-account',
                userId,
                fullName,
                email,
                phone
            })
        });
        
        const data = await response.json();
        console.log('Update account response:', data);
        
        if (data.success) {
            showNotification('Account information updated successfully', 'success');
            setTimeout(() => loadUserData(), 500);
        } else {
            showNotification(data.error || 'Failed to update account', 'info');
        }
    } catch (error) {
        console.error('Error saving account info:', error);
        showNotification('Failed to update account information', 'info');
    }
}

// Change password - TODO: Implement API endpoint
async function changePassword() {
    const currentPassword = document.querySelector('input[placeholder="Enter current password"]')?.value;
    const newPassword = document.querySelector('input[placeholder="Enter new password"]')?.value;
    const confirmPassword = document.querySelector('input[placeholder="Confirm new password"]')?.value;
    const userId = getUserId();
    
    if (!userId) {
        showNotification('Please log in first', 'info');
        return;
    }
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('All password fields are required', 'info');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'info');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'info');
        return;
    }
    
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'change-password',
                userId,
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Password updated successfully', 'success');
            // Clear password fields
            document.querySelector('input[placeholder="Enter current password"]').value = '';
            document.querySelector('input[placeholder="Enter new password"]').value = '';
            document.querySelector('input[placeholder="Confirm new password"]').value = '';
        } else {
            showNotification(data.error || 'Failed to update password', 'info');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Failed to update password', 'info');
    }
}

// Email validation helper
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Notification Functions
function toggleNotification(type, checkbox) {
    const status = checkbox.checked ? 'enabled' : 'disabled';
    showNotification(`${type} notifications ${status}`, 'success');
}

// Privacy Functions
function enable2FA() {
    showNotification('Two-factor authentication setup coming soon', 'info');
}

// Load login history - TODO: Implement API endpoint
async function loadLoginHistory() {
    const container = document.getElementById('loginHistoryContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #006923;"></i>
            <p style="margin-top: 1rem; color: #666;">Loading login history...</p>
        </div>
    `;
    
    // Show placeholder for now
    setTimeout(() => {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem; color: #3b5d72;"></i>
                <p>Login history feature coming soon</p>
            </div>
        `;
    }, 500);
}

function viewFullHistory() {
    loadLoginHistory();
}

// Download user data as PDF - TODO: Implement API endpoint
async function downloadUserData() {
    showNotification('Data export feature coming soon', 'info');
}

// Delete account - TODO: Implement API endpoint
async function deleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone!');
    
    if (!confirmed) {
        return;
    }
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) {
        showNotification('Account deletion cancelled', 'info');
        return;
    }
    
    const userId = getUserId();
    if (!userId) {
        showNotification('Please log in first', 'info');
        return;
    }
    
    showNotification('Deleting account...', 'info');
    
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete-account',
                userId,
                password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Account deleted successfully', 'success');
            localStorage.clear();
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
        } else {
            showNotification(data.error || 'Failed to delete account', 'info');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Failed to delete account', 'info');
    }
}

// Payment Functions
async function savePaymentPreference() {
    const selected = document.querySelector('input[name="defaultPayment"]:checked');
    if (!selected) {
        showNotification('Please select a default payment method', 'info');
        return;
    }
    
    const paymentValue = selected.value;
    const userId = getUserId();
    
    // Save to localStorage immediately
    localStorage.setItem('jbr7_default_payment', paymentValue);
    
    if (!userId) {
        showNotification('Default payment method saved locally', 'success');
        return;
    }
    
    // Save to database via API
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'save-preferences',
                userId,
                default_payment: paymentValue
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Default payment method updated', 'success');
        } else {
            showNotification('Default payment method saved locally', 'success');
        }
    } catch (error) {
        console.error('Error saving payment preference:', error);
        showNotification('Default payment method saved locally', 'success');
    }
}

function addPaymentMethod() {
    showNotification('Add payment method feature coming soon', 'info');
}

function removePayment() {
    if (confirm('Remove this payment method?')) {
        showNotification('Payment method removed', 'success');
    }
}

// Address Functions
let addresses = [];
let editingAddressId = null;

// Load addresses from API
async function loadAddresses() {
    const container = document.getElementById('addresses-container');
    if (!container) return;
    
    const userId = getUserId();
    if (!userId) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>Please log in to view addresses</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading addresses...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/get?action=shipping-addresses&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to load addresses');
        }
        
        const data = await response.json();
        
        if (data.success) {
            addresses = data.data || [];
            renderAddresses();
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <i class="fas fa-map-marker-alt" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No addresses found. Add your first address to get started!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #d32f2f;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load addresses</p>
                <button class="btn-secondary" onclick="loadAddresses()" style="margin-top: 1rem;">Try Again</button>
            </div>
        `;
    }
}

// Render addresses list
function renderAddresses() {
    const container = document.getElementById('addresses-container');
    if (!container) return;
    
    if (addresses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <i class="fas fa-map-marker-alt" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No addresses found. Add your first address to get started!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    addresses.forEach(address => {
        const isHome = address.address_type === 'home';
        const isDefault = address.is_default == 1;
        
        let addressText = '';
        if (isHome) {
            const fullName = [address.first_name, address.middle_name, address.last_name].filter(Boolean).join(' ');
            addressText = `
                <strong>${fullName || 'Home Address'}</strong>
                <p>
                    ${address.house_unit_number || ''} ${address.street_name || ''}<br>
                    ${address.subdivision_village ? address.subdivision_village + '<br>' : ''}
                    ${address.barangay || ''}, ${address.city_municipality || ''}<br>
                    ${address.province_state || ''} ${address.postal_zip_code || ''}<br>
                    ${address.country || 'Philippines'}<br>
                    ${address.mobile_number ? 'Phone: ' + address.mobile_number : ''}
                </p>
            `;
        } else {
            addressText = `
                <strong>${address.company_name || 'Office Address'}</strong>
                <p>
                    ${address.recipient_name ? 'Attn: ' + address.recipient_name + '<br>' : ''}
                    ${address.building_name || ''} ${address.floor_unit_number ? 'Floor/Unit: ' + address.floor_unit_number + '<br>' : ''}
                    ${address.street_name || ''}<br>
                    ${address.barangay || ''}, ${address.city_municipality || ''}<br>
                    ${address.province_state || ''} ${address.postal_zip_code || ''}<br>
                    ${address.country || 'Philippines'}<br>
                    ${address.office_phone || address.mobile_number ? 'Phone: ' + (address.office_phone || address.mobile_number) : ''}
                </p>
            `;
        }
        
        html += `
            <div class="address-item">
                <div class="address-info">
                    ${addressText}
                </div>
                <div class="address-actions">
                    ${isDefault ? '<span class="default-badge">Default</span>' : ''}
                    ${!isDefault ? `<button class="btn-text" onclick="setDefaultAddress(${address.id})">Set as Default</button>` : ''}
                    <button class="btn-text" onclick="editAddress(${address.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-text" onclick="removeAddress(${address.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Show add address modal
function showAddAddressModal() {
    editingAddressId = null;
    document.getElementById('address-modal-title').textContent = 'Add New Address';
    document.getElementById('address-type-selection').style.display = 'block';
    document.getElementById('address-form').reset();
    document.getElementById('address-id').value = '';
    document.getElementById('address-type').value = 'home';
    switchAddressType('home');
    document.getElementById('address-modal').style.display = 'flex';
}

// Close address modal
function closeAddressModal() {
    document.getElementById('address-modal').style.display = 'none';
    editingAddressId = null;
    document.getElementById('address-form').reset();
}

// Switch between home and office address types
function switchAddressType(type) {
    document.getElementById('address-type').value = type;
    
    if (type === 'home') {
        document.getElementById('home-fields').style.display = 'block';
        document.getElementById('office-fields').style.display = 'none';
        document.getElementById('home-contact').style.display = 'block';
        document.getElementById('office-contact').style.display = 'none';
        document.getElementById('home-address-fields').style.display = 'block';
        document.getElementById('office-address-fields').style.display = 'none';
        document.getElementById('home-additional').style.display = 'block';
        document.getElementById('office-additional').style.display = 'none';
    } else {
        document.getElementById('home-fields').style.display = 'none';
        document.getElementById('office-fields').style.display = 'block';
        document.getElementById('home-contact').style.display = 'none';
        document.getElementById('office-contact').style.display = 'block';
        document.getElementById('home-address-fields').style.display = 'none';
        document.getElementById('office-address-fields').style.display = 'block';
        document.getElementById('home-additional').style.display = 'none';
        document.getElementById('office-additional').style.display = 'block';
    }
}

// Edit address
function editAddress(addressId) {
    const address = addresses.find(a => a.id == addressId);
    if (!address) {
        showNotification('Address not found', 'info');
        return;
    }
    
    editingAddressId = addressId;
    document.getElementById('address-modal-title').textContent = 'Edit Address';
    document.getElementById('address-type-selection').style.display = 'none';
    document.getElementById('address-id').value = addressId;
    document.getElementById('address-type').value = address.address_type;
    
    switchAddressType(address.address_type);
    
    // Fill form fields based on address type
    if (address.address_type === 'home') {
        document.getElementById('first-name').value = address.first_name || '';
        document.getElementById('middle-name').value = address.middle_name || '';
        document.getElementById('last-name').value = address.last_name || '';
        document.getElementById('mobile-number').value = address.mobile_number || '';
        document.getElementById('house-unit-number').value = address.house_unit_number || '';
        document.getElementById('street-name').value = address.street_name || '';
        document.getElementById('subdivision-village').value = address.subdivision_village || '';
    } else {
        document.getElementById('recipient-name').value = address.recipient_name || '';
        document.getElementById('company-name').value = address.company_name || '';
        document.getElementById('office-phone').value = address.office_phone || '';
        document.getElementById('office-mobile-number').value = address.mobile_number || '';
        document.getElementById('building-name').value = address.building_name || '';
        document.getElementById('floor-unit-number').value = address.floor_unit_number || '';
        if (document.getElementById('office-street-name')) {
            document.getElementById('office-street-name').value = address.street_name || '';
        }
    }
    
    // Common fields
    document.getElementById('barangay').value = address.barangay || '';
    document.getElementById('city-municipality').value = address.city_municipality || '';
    document.getElementById('province-state').value = address.province_state || '';
    document.getElementById('postal-zip-code').value = address.postal_zip_code || '';
    document.getElementById('country').value = address.country || 'Philippines';
    document.getElementById('set-as-default').checked = address.is_default == 1;
    
    document.getElementById('address-modal').style.display = 'flex';
}

// Remove address - TODO: Implement API endpoint
async function removeAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    showNotification('Delete address feature coming soon', 'info');
}

// Set default address - TODO: Implement API endpoint
async function setDefaultAddress(addressId) {
    showNotification('Set default address feature coming soon', 'info');
}

// Courier Functions
async function saveCourierPreference() {
    const selected = document.querySelector('input[name="defaultCourier"]:checked');
    if (!selected) {
        showNotification('Please select a courier to set as default', 'info');
        return;
    }
    
    const courierValue = selected.value;
    
    // Save to localStorage immediately
    localStorage.setItem('jbr7_default_courier', courierValue);
    
    const courierName = courierValue === 'jnt' ? 'JNT' : 'Flash Express';
    showNotification(`Default courier set to: ${courierName}`, 'success');
}

// Help Functions
function contactSupport() {
    showNotification('Opening support contact...', 'info');
}

function viewTerms() {
    showNotification('Loading terms of service...', 'info');
}

function viewPrivacyPolicy() {
    showNotification('Loading privacy policy...', 'info');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        
        // Clear user-specific data
        if (typeof UserStorage !== 'undefined' && UserStorage) {
            UserStorage.clearUserData();
        }
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification styles
if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: -400px;
            background-color: #fff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.8rem;
            z-index: 10000;
            transition: right 0.3s ease;
            max-width: 350px;
        }
        .notification.show { right: 20px; }
        .notification i { font-size: 1.5rem; }
        .notification-success { border-left: 4px solid #006923; }
        .notification-success i { color: #006923; }
        .notification-info { border-left: 4px solid #3b5d72; }
        .notification-info i { color: #3b5d72; }
        .notification span { font-size: 0.95rem; color: #333; font-weight: 500; }
    `;
    document.head.appendChild(notificationStyles);
}

// Load saved preferences on page load
async function loadSavedPreferences() {
    const userId = getUserId();
    
    if (!userId) {
        // Load from localStorage only
        const defaultPayment = localStorage.getItem('jbr7_default_payment');
        if (defaultPayment) {
            const paymentRadio = document.querySelector(`input[name="defaultPayment"][value="${defaultPayment}"]`);
            if (paymentRadio) paymentRadio.checked = true;
        }
        
        const defaultCourier = localStorage.getItem('jbr7_default_courier');
        if (defaultCourier) {
            const courierRadio = document.querySelector(`input[name="defaultCourier"][value="${defaultCourier}"]`);
            if (courierRadio) courierRadio.checked = true;
        }
        return;
    }
    
    try {
        const response = await fetch(`/api/get?action=user-preferences&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                // Load payment preference
                const defaultPayment = data.data.default_payment || localStorage.getItem('jbr7_default_payment');
                if (defaultPayment) {
                    const paymentRadio = document.querySelector(`input[name="defaultPayment"][value="${defaultPayment}"]`);
                    if (paymentRadio) {
                        paymentRadio.checked = true;
                        localStorage.setItem('jbr7_default_payment', defaultPayment);
                    }
                }
                
                // Load courier preference
                const defaultCourier = data.data.default_courier || localStorage.getItem('jbr7_default_courier');
                if (defaultCourier) {
                    const courierRadio = document.querySelector(`input[name="defaultCourier"][value="${defaultCourier}"]`);
                    if (courierRadio) {
                        courierRadio.checked = true;
                        localStorage.setItem('jbr7_default_courier', defaultCourier);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
        // Fall back to localStorage
        const defaultPayment = localStorage.getItem('jbr7_default_payment');
        if (defaultPayment) {
            const paymentRadio = document.querySelector(`input[name="defaultPayment"][value="${defaultPayment}"]`);
            if (paymentRadio) paymentRadio.checked = true;
        }
        
        const defaultCourier = localStorage.getItem('jbr7_default_courier');
        if (defaultCourier) {
            const courierRadio = document.querySelector(`input[name="defaultCourier"][value="${defaultCourier}"]`);
            if (courierRadio) courierRadio.checked = true;
        }
    }
}

// Load notification preferences
async function loadNotificationPreferences() {
    const userId = getUserId();
    if (!userId) return;
    
    try {
        const response = await fetch(`/api/get?action=notification-preference&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            console.warn('Failed to load notification preferences');
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
            const orderStatusToggle = document.getElementById('pushOrderStatus');
            const cartReminderToggle = document.getElementById('pushCartReminder');
            
            if (orderStatusToggle) {
                orderStatusToggle.checked = data.data.order_status == 1;
            }
            if (cartReminderToggle) {
                cartReminderToggle.checked = data.data.cart_reminder == 1;
            }
        }
    } catch (error) {
        console.error('Error loading notification preferences:', error);
    }
}

// Toggle push notification - TODO: Implement API endpoint  
async function togglePushNotification(type, checkbox) {
    const isEnabled = checkbox.checked ? 1 : 0;
    const typeName = type === 'order_status' ? 'Order Status' : 'Cart Reminders';
    const status = isEnabled ? 'enabled' : 'disabled';
    
    showNotification(`${typeName} notifications ${status}`, 'success');
}

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by your browser', 'info');
        return;
    }
    
    showNotification('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lng;
            
            showNotification('Location found', 'success');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showNotification('Could not get your location', 'info');
        }
    );
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded - initializing settings page');
        showSettingsSection('account');
        loadUserData();
        loadSavedPreferences();
        loadNotificationPreferences();
    });
} else {
    console.log('Document already loaded - initializing settings page');
    showSettingsSection('account');
    loadUserData();
    loadSavedPreferences();
    loadNotificationPreferences();
}