// Settings Page Functionality - Updated to use Next.js API with Supabase

// Session shared with profile: jbr7_user_id, jbr7_auth_uid (same keys as profile.js).
function getUserId() {
    return sessionStorage.getItem('jbr7_user_id');
}
function getAuthUserId() {
    return sessionStorage.getItem('jbr7_auth_uid');
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
        window.location.href = 'signin.html';
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
    } else {
        console.warn('fullName input not found');
    }
    
    if (emailInput) {
        emailInput.value = user.email || '';
        console.log('Set email to:', user.email);
    } else {
        console.warn('email input not found');
    }
    
    if (phoneInput) {
        const number = user.phone || user.mobile || user.phone_number || user.number || '';
        phoneInput.value = number;
        console.log('Set phone/number to:', number);
    } else {
        console.warn('phone input not found');
    }
}

// Save account information - Updated to use API
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
                username: fullName,
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

// Change password - sync session from profile first so API finds the user
async function changePassword() {
    const currentPassword = document.querySelector('input[placeholder="Enter current password"]')?.value;
    const newPassword = document.querySelector('input[placeholder="Enter new password"]')?.value;
    const confirmPassword = document.querySelector('input[placeholder="Confirm new password"]')?.value;
    let rawUserId = getUserId();
    let userId = rawUserId && String(rawUserId).trim() && String(rawUserId).trim() !== 'undefined' ? String(rawUserId).trim() : null;
    
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
    
    var userEmail = '';
    try {
        // Sync session with DB user id from profile API so change-password finds the user
        try {
            const profileRes = await fetch('/api/get?action=profile&userId=' + encodeURIComponent(userId), {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' }
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                if (profileData && profileData.success && profileData.user) {
                    if (profileData.user.id != null) {
                        var dbId = String(profileData.user.id).trim();
                        if (dbId && dbId !== 'undefined') {
                            sessionStorage.setItem('jbr7_user_id', dbId);
                            userId = dbId;
                        }
                    }
                    if (profileData.user.email) userEmail = String(profileData.user.email).trim();
                }
            }
        } catch (e) {
            // continue with existing userId
        }

        var body = {
            action: 'change-password',
            userId,
            authUserId: getAuthUserId() || userId,
            currentPassword,
            newPassword
        };
        if (userEmail) body.email = userEmail;

        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
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

// Load and display login history - Updated for API (placeholder)
async function loadLoginHistory() {
    const container = document.getElementById('loginHistoryContainer');
    if (!container) return;
    
    const userId = getUserId();
    if (!userId) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <p>Please log in to view login history</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #006923;"></i>
            <p style="margin-top: 1rem; color: #666;">Loading login history...</p>
        </div>
    `;
    
    // Placeholder - implement when backend endpoint is ready
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

// Download user data as PDF - Updated for API (placeholder)
async function downloadUserData() {
    const userId = getUserId();
    if (!userId) {
        showNotification('Please log in first', 'info');
        return;
    }
    
    // Data export reserved for future
}

// Delete account - Updated to use API
async function deleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete:\n\n- Your account\n- All orders\n- All saved items\n- All reviews\n- All activity history\n\nThis cannot be reversed!');
    
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
            
            // Clear all local storage
            if (typeof UserStorage !== 'undefined' && UserStorage) {
                UserStorage.clearUserData();
            }
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
        showNotification('Failed to delete account. Please try again.', 'info');
    }
}

// Payment Functions - Updated to use API
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
                window.location.href = 'signin.html';
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
        
        // Update required fields
        document.getElementById('first-name').required = true;
        document.getElementById('last-name').required = true;
        document.getElementById('mobile-number').required = true;
        document.getElementById('house-unit-number').required = true;
        document.getElementById('street-name').required = true;
        document.getElementById('office-mobile-number').required = false;
        document.getElementById('building-name').required = false;
        document.getElementById('office-street-name').required = false;
        document.getElementById('recipient-name').required = false;
        document.getElementById('company-name').required = false;
    } else {
        document.getElementById('home-fields').style.display = 'none';
        document.getElementById('office-fields').style.display = 'block';
        document.getElementById('home-contact').style.display = 'none';
        document.getElementById('office-contact').style.display = 'block';
        document.getElementById('home-address-fields').style.display = 'none';
        document.getElementById('office-address-fields').style.display = 'block';
        document.getElementById('home-additional').style.display = 'none';
        document.getElementById('office-additional').style.display = 'block';
        
        // Update required fields
        document.getElementById('first-name').required = false;
        document.getElementById('last-name').required = false;
        document.getElementById('mobile-number').required = false;
        document.getElementById('house-unit-number').required = false;
        document.getElementById('street-name').required = false;
        document.getElementById('office-mobile-number').required = true;
        document.getElementById('building-name').required = true;
        document.getElementById('office-street-name').required = true;
        document.getElementById('recipient-name').required = true;
        document.getElementById('company-name').required = true;
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
    
    // Switch to correct type
    switchAddressType(address.address_type);
    
    // Fill form fields
    if (address.address_type === 'home') {
        document.getElementById('first-name').value = address.first_name || '';
        document.getElementById('middle-name').value = address.middle_name || '';
        document.getElementById('last-name').value = address.last_name || '';
        document.getElementById('mobile-number').value = address.mobile_number || '';
        document.getElementById('alternate-number').value = address.alternate_number || '';
        document.getElementById('house-unit-number').value = address.house_unit_number || '';
        document.getElementById('street-name').value = address.street_name || '';
        document.getElementById('subdivision-village').value = address.subdivision_village || '';
        document.getElementById('landmark-delivery-notes').value = address.landmark_delivery_notes || '';
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
        document.getElementById('office-hours').value = address.office_hours || '';
        document.getElementById('additional-instructions').value = address.additional_instructions || '';
    }
    
    // Common fields
    document.getElementById('email-address').value = address.email_address || '';
    document.getElementById('barangay').value = address.barangay || '';
    document.getElementById('city-municipality').value = address.city_municipality || '';
    document.getElementById('province-state').value = address.province_state || '';
    document.getElementById('postal-zip-code').value = address.postal_zip_code || '';
    document.getElementById('country').value = address.country || 'Philippines';
    document.getElementById('formatted-address').value = address.formatted_address || '';
    document.getElementById('latitude').value = address.latitude || '';
    document.getElementById('longitude').value = address.longitude || '';
    document.getElementById('set-as-default').checked = address.is_default == 1;
    
    document.getElementById('address-modal').style.display = 'flex';
}

// Remove address - Updated to use API
async function removeAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    const userId = getUserId();
    if (!userId) {
        showNotification('Please log in first', 'info');
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
                action: 'delete-address',
                userId,
                id: addressId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Address deleted successfully', 'success');
            loadAddresses();
        } else {
            showNotification(data.error || 'Failed to delete address', 'info');
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        showNotification('Failed to delete address', 'info');
    }
}

// Set default address - Updated to use API
async function setDefaultAddress(addressId) {
    const userId = getUserId();
    if (!userId) {
        showNotification('Please log in first', 'info');
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
                action: 'set-default-address',
                userId,
                id: addressId 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Default address updated', 'success');
            loadAddresses();
        } else {
            showNotification(data.error || 'Failed to set default address', 'info');
        }
    } catch (error) {
        console.error('Error setting default address:', error);
        showNotification('Failed to set default address', 'info');
    }
}

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by your browser', 'info');
        return;
    }
    
    showNotification('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lng;
            
            // Reverse geocode to get address
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await response.json();
                
                if (data && data.address) {
                    const addr = data.address;
                    const formatted = data.display_name || '';
                    document.getElementById('formatted-address').value = formatted;
                    
                    // Auto-fill form fields if empty
                    if (!document.getElementById('barangay').value && addr.suburb) {
                        document.getElementById('barangay').value = addr.suburb;
                    }
                    if (!document.getElementById('city-municipality').value && addr.city) {
                        document.getElementById('city-municipality').value = addr.city;
                    }
                    if (!document.getElementById('province-state').value && addr.state) {
                        document.getElementById('province-state').value = addr.state;
                    }
                    if (!document.getElementById('postal-zip-code').value && addr.postcode) {
                        document.getElementById('postal-zip-code').value = addr.postcode;
                    }
                    if (!document.getElementById('street-name').value && addr.road) {
                        document.getElementById('street-name').value = addr.road;
                        if (document.getElementById('office-street-name')) {
                            document.getElementById('office-street-name').value = addr.road;
                        }
                    }
                    
                    showNotification('Location found and address filled', 'success');
                } else {
                    showNotification('Location found but address could not be determined', 'info');
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                showNotification('Location found but could not get address details', 'info');
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            showNotification('Could not get your location. Please enter address manually.', 'info');
        }
    );
}

// Handle address form submission - Updated to use API
document.addEventListener('DOMContentLoaded', function() {
    const addressForm = document.getElementById('address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userId = getUserId();
            if (!userId) {
                showNotification('Please log in first', 'info');
                return;
            }
            
            const addressType = document.getElementById('address-type').value;
            const addressId = document.getElementById('address-id').value;
            const isDefault = document.getElementById('set-as-default').checked;
            
            let addressData = {
                action: addressId ? 'update-address' : 'save-address',
                userId,
                address_type: addressType,
                is_default: isDefault,
                email_address: document.getElementById('email-address').value,
                barangay: document.getElementById('barangay').value,
                city_municipality: document.getElementById('city-municipality').value,
                province_state: document.getElementById('province-state').value,
                postal_zip_code: document.getElementById('postal-zip-code').value,
                country: document.getElementById('country').value,
                latitude: document.getElementById('latitude').value || null,
                longitude: document.getElementById('longitude').value || null,
                formatted_address: document.getElementById('formatted-address').value || null
            };
            
            if (addressId) {
                addressData.id = parseInt(addressId);
            }
            
            if (addressType === 'home') {
                addressData.first_name = document.getElementById('first-name').value;
                addressData.middle_name = document.getElementById('middle-name').value;
                addressData.last_name = document.getElementById('last-name').value;
                addressData.mobile_number = document.getElementById('mobile-number').value;
                addressData.alternate_number = document.getElementById('alternate-number').value;
                addressData.house_unit_number = document.getElementById('house-unit-number').value;
                addressData.street_name = document.getElementById('street-name').value;
                addressData.subdivision_village = document.getElementById('subdivision-village').value;
                addressData.landmark_delivery_notes = document.getElementById('landmark-delivery-notes').value;
            } else {
                addressData.recipient_name = document.getElementById('recipient-name').value;
                addressData.company_name = document.getElementById('company-name').value;
                addressData.office_phone = document.getElementById('office-phone').value;
                addressData.mobile_number = document.getElementById('office-mobile-number').value;
                addressData.building_name = document.getElementById('building-name').value;
                addressData.floor_unit_number = document.getElementById('floor-unit-number').value;
                addressData.street_name = document.getElementById('office-street-name').value;
                addressData.office_hours = document.getElementById('office-hours').value;
                addressData.additional_instructions = document.getElementById('additional-instructions').value;
            }
            
            try {
                const response = await fetch('/api/post', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(addressData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification(data.message || 'Address saved successfully', 'success');
                    closeAddressModal();
                    loadAddresses();
                } else {
                    showNotification(data.error || 'Failed to save address', 'info');
                }
            } catch (error) {
                console.error('Error saving address:', error);
                showNotification('Failed to save address', 'info');
            }
        });
    }
    
    // Load addresses when shipping section is shown
    const originalShowSection = showSettingsSection;
    showSettingsSection = function(sectionName) {
        originalShowSection(sectionName);
        if (sectionName === 'shipping') {
            loadAddresses();
        }
    };
});

// Courier Functions - Updated to use API
async function saveCourierPreference() {
    const selected = document.querySelector('input[name="defaultCourier"]:checked');
    if (!selected) {
        showNotification('Please select a courier to set as default', 'info');
        return;
    }
    
    const courierValue = selected.value;
    const userId = getUserId();
    
    // Save to localStorage immediately
    localStorage.setItem('jbr7_default_courier', courierValue);
    
    const courierName = courierValue === 'jnt' ? 'JNT' : 'Flash Express';
    
    if (!userId) {
        showNotification(`Default courier saved locally: ${courierName}`, 'success');
        return;
    }
    
    // Save to database
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
                default_courier: courierValue
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Default courier set to: ${courierName}`, 'success');
        } else {
            showNotification(`Default courier saved locally: ${courierName}`, 'success');
        }
    } catch (error) {
        console.error('Error saving courier preference:', error);
        showNotification(`Default courier saved locally: ${courierName}`, 'success');
    }
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
        
        // Clear legacy data
        localStorage.removeItem('userSession');
        localStorage.removeItem('cart');
        localStorage.removeItem('savedBags');
        localStorage.removeItem('jbr7_default_payment');
        localStorage.removeItem('jbr7_default_courier');
        localStorage.removeItem('jbr7_customer_email');
        localStorage.removeItem('jbr7_customer_phone');
        localStorage.removeItem('pendingCheckout');
        localStorage.removeItem('appliedPromo');
        
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

// Load saved preferences on page load - Updated to use API
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
                return;
            }
        }
    } catch (error) {
        console.error('Error loading preferences from database:', error);
    }
    
    // Fallback to localStorage only
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

// Load notification preferences from server - Updated to use API
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
            // Update toggle switches
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

// Toggle push notification - Updated to use API
async function togglePushNotification(type, checkbox) {
    const isEnabled = checkbox.checked ? 1 : 0;
    const userId = getUserId();
    
    if (!userId) {
        showNotification('Please log in first', 'info');
        checkbox.checked = !checkbox.checked;
        return;
    }
    
    console.log('togglePushNotification called:', { type, isEnabled });
    
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update-notification-preference',
                userId,
                notification_type: type,
                enabled: isEnabled
            })
        });
        
        const data = await response.json();
        console.log('Notification preference update response:', data);
        
        if (data.success) {
            const status = isEnabled ? 'enabled' : 'disabled';
            const typeName = type === 'order_status' ? 'Order Status' : 'Cart Reminders';
            showNotification(`${typeName} notifications ${status}`, 'success');
        } else {
            // Revert checkbox state on error
            checkbox.checked = !checkbox.checked;
            showNotification(data.error || 'Failed to update notification preference', 'info');
        }
    } catch (error) {
        console.error('Error updating notification preference:', error);
        // Revert checkbox state on error
        checkbox.checked = !checkbox.checked;
        showNotification('Failed to update notification preference', 'info');
    }
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