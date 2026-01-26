// Settings Page Functionality - Updated to use profile.php

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
    
    // Load login history when privacy section is shown
    if (sectionName === 'privacy') {
        loadLoginHistory();
    }
}

// Load user data from profile endpoint
async function loadUserData() {
    try {
        console.log('settings.js: Loading user data from profile.php');
        const response = await fetch('/jbr7php/profile.php', {
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
        phoneInput.value = user.phone || '';
        console.log('Set phone to:', user.phone);
    } else {
        console.warn('phone input not found');
    }
}

// Save account information
async function saveAccountInfo() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    
    console.log('Saving account info:', { fullName, email, phone });
    
    if (!fullName) {
        showNotification('Full name is required', 'info');
        return;
    }
    
    if (!email || !isValidEmail(email)) {
        showNotification('Valid email is required', 'info');
        return;
    }
    
    try {
        const response = await fetch('/jbr7php/update_account.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                phone
            })
        });
        
        const data = await response.json();
        console.log('Update account response:', data);
        
        if (data.success) {
            showNotification('Account information updated successfully', 'success');
            // Reload user data to reflect changes
            setTimeout(() => loadUserData(), 500);
        } else {
            showNotification(data.error || 'Failed to update account', 'info');
        }
    } catch (error) {
        console.error('Error saving account info:', error);
        showNotification('Failed to update account information', 'info');
    }
}

// Change password
async function changePassword() {
    const currentPassword = document.querySelector('input[placeholder="Enter current password"]')?.value;
    const newPassword = document.querySelector('input[placeholder="Enter new password"]')?.value;
    const confirmPassword = document.querySelector('input[placeholder="Confirm new password"]')?.value;
    
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
        const response = await fetch('/jbr7php/change_password.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmPassword
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

// Load and display login history
async function loadLoginHistory() {
    const container = document.getElementById('loginHistoryContainer');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-spinner" style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #006923;"></i>
            <p style="margin-top: 1rem; color: #666;">Loading login history...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/jbr7php/get_login_history.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/signin.html';
                return;
            }
            throw new Error('Failed to load login history');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Check if there's a message about table not existing
            if (data.message) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem; color: #3b5d72;"></i>
                        <p style="margin-bottom: 0.5rem;">${data.message}</p>
                        <p style="font-size: 0.875rem; color: #999;">Login history will appear here after the table is created.</p>
                    </div>
                `;
                return;
            }
            
            if (data.history && data.history.length > 0) {
                const historyHtml = data.history.map(entry => {
                const loginDate = new Date(entry.login_time);
                const formattedDate = loginDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                let durationText = 'Active session';
                if (entry.logout_time) {
                    const duration = entry.session_duration;
                    if (duration) {
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        if (hours > 0) {
                            durationText = `${hours}h ${minutes}m`;
                        } else {
                            durationText = `${minutes}m`;
                        }
                    }
                }
                
                return `
                    <div class="login-history-item" style="padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">${entry.device_info}</div>
                            <div style="font-size: 0.875rem; color: #666;">
                                <div>IP: ${entry.ip_address}</div>
                                <div>Login: ${formattedDate}</div>
                                <div>Duration: ${durationText}</div>
                            </div>
                        </div>
                        <div style="color: #006923;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `
                <div style="margin-bottom: 1rem; color: #666; font-size: 0.9rem;">
                    Showing ${data.count} recent login${data.count !== 1 ? 's' : ''}
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${historyHtml}
                </div>
            `;
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No login history found</p>
                    </div>
                `;
            }
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading login history:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #d32f2f;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load login history</p>
                <button class="btn-secondary" onclick="loadLoginHistory()" style="margin-top: 1rem;">Try Again</button>
            </div>
        `;
    }
}

function viewFullHistory() {
    loadLoginHistory();
}

// Delete account function
// Download user data as PDF
async function downloadUserData() {
    showNotification('Preparing your data export...', 'info');
    
    try {
        // Open in new window - it will auto-trigger print dialog for PDF save
        const url = '/jbr7php/download_user_data.php';
        const newWindow = window.open(url, '_blank', 'width=800,height=600');
        
        if (!newWindow) {
            showNotification('Please allow pop-ups to download your data', 'error');
            return;
        }
        
        // Show instruction after a delay
        setTimeout(() => {
            showNotification('Print dialog will open automatically. Select "Save as PDF" as destination.', 'info');
        }, 1000);
    } catch (error) {
        console.error('Error downloading user data:', error);
        showNotification('Failed to download data. Please try again.', 'error');
    }
}

async function deleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete:\n\n- Your account\n- All orders\n- All saved items\n- All reviews\n- All activity history\n\nThis cannot be reversed!');
    
    if (!confirmed) {
        return;
    }
    
    // Ask for password confirmation
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) {
        showNotification('Account deletion cancelled', 'info');
        return;
    }
    
    // Show loading
    showNotification('Deleting account...', 'info');
    
    try {
        const response = await fetch('/jbr7php/delete_account.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Account deleted successfully', 'success');
            
            // Clear all local storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Redirect to home page after a short delay
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

// Payment Functions
async function savePaymentPreference() {
    const selected = document.querySelector('input[name="defaultPayment"]:checked');
    if (!selected) {
        showNotification('Please select a default payment method', 'info');
        return;
    }
    
    const paymentValue = selected.value;
    
    // Save to localStorage immediately
    localStorage.setItem('jbr7_default_payment', paymentValue);
    
    // Save to database
    try {
        const response = await fetch('/jbr7php/save_user_preferences.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                default_payment: paymentValue,
                default_courier: null // Keep existing courier preference
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Default payment method updated', 'success');
        } else {
            // Still show success since localStorage was saved
            showNotification('Default payment method saved locally', 'success');
        }
    } catch (error) {
        console.error('Error saving payment preference:', error);
        // Still show success since localStorage was saved
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

// Load addresses from database
async function loadAddresses() {
    const container = document.getElementById('addresses-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Loading addresses...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/jbr7php/get_shipping_addresses.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/signin.html';
                return;
            }
            throw new Error('Failed to load addresses');
        }
        
        const data = await response.json();
        
        if (data.success) {
            addresses = data.addresses || [];
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

// Remove address
async function removeAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    try {
        const response = await fetch('/jbr7php/delete_shipping_address.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: addressId })
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

// Set default address
async function setDefaultAddress(addressId) {
    try {
        const response = await fetch('/jbr7php/set_default_address.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: addressId })
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
                // Using a free geocoding service (you can replace with Google Maps API)
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

// Handle address form submission
document.addEventListener('DOMContentLoaded', function() {
    const addressForm = document.getElementById('address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const addressType = document.getElementById('address-type').value;
            const addressId = document.getElementById('address-id').value;
            const isDefault = document.getElementById('set-as-default').checked;
            
            let addressData = {
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
                const response = await fetch('/jbr7php/save_shipping_address.php', {
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
    
    // Save to database
    try {
        const response = await fetch('/jbr7php/save_user_preferences.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                default_payment: null, // Keep existing payment preference
                default_courier: courierValue
            })
        });
        
        const data = await response.json();
        const courierName = courierValue === 'jnt' ? 'JNT' : 'Flash Express';
        if (data.success) {
            showNotification(`Default courier set to: ${courierName}`, 'success');
        } else {
            // Still show success since localStorage was saved
            showNotification(`Default courier saved locally: ${courierName}`, 'success');
        }
    } catch (error) {
        console.error('Error saving courier preference:', error);
        const courierName = courierValue === 'jnt' ? 'JNT' : 'Flash Express';
        // Still show success since localStorage was saved
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

        fetch('/jbr7php/logout.php', { method: 'GET', credentials: 'same-origin' })
            .finally(() => {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 600);
            });
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
    // Try to load from database first, then fallback to localStorage
    try {
        const response = await fetch('/jbr7php/get_user_preferences.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.preferences) {
                // Load payment preference
                const defaultPayment = data.preferences.default_payment || localStorage.getItem('jbr7_default_payment');
                if (defaultPayment) {
                    const paymentRadio = document.querySelector(`input[name="defaultPayment"][value="${defaultPayment}"]`);
                    if (paymentRadio) {
                        paymentRadio.checked = true;
                        // Sync to localStorage
                        localStorage.setItem('jbr7_default_payment', defaultPayment);
                    }
                }
                
                // Load courier preference
                const defaultCourier = data.preferences.default_courier || localStorage.getItem('jbr7_default_courier');
                if (defaultCourier) {
                    const courierRadio = document.querySelector(`input[name="defaultCourier"][value="${defaultCourier}"]`);
                    if (courierRadio) {
                        courierRadio.checked = true;
                        // Sync to localStorage
                        localStorage.setItem('jbr7_default_courier', defaultCourier);
                    }
                }
                return; // Exit early if database load succeeded
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

// Load notification preferences from server
async function loadNotificationPreferences() {
    try {
        const response = await fetch('/jbr7php/get_notification_preference.php', {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            console.warn('Failed to load notification preferences');
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.preferences) {
            // Update toggle switches
            const orderStatusToggle = document.getElementById('pushOrderStatus');
            const cartReminderToggle = document.getElementById('pushCartReminder');
            
            if (orderStatusToggle) {
                orderStatusToggle.checked = data.preferences.order_status == 1;
            }
            if (cartReminderToggle) {
                cartReminderToggle.checked = data.preferences.cart_reminder == 1;
            }
        }
    } catch (error) {
        console.error('Error loading notification preferences:', error);
    }
}

// Toggle push notification - FIXED PATH
async function togglePushNotification(type, checkbox) {
    const isEnabled = checkbox.checked ? 1 : 0;
    
    console.log('togglePushNotification called:', { type, isEnabled });
    
    try {
        const requestData = {
            notification_type: type,
            enabled: isEnabled
        };
        
        console.log('Sending request:', requestData);
        
        // FIXED: Added leading slash to path
        const response = await fetch('/jbr7php/update_notification_preference.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Get the raw text first to see what we're receiving
        const rawText = await response.text();
        console.log('Raw response:', rawText);
        
        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw text that failed to parse:', rawText);
            checkbox.checked = !checkbox.checked;
            showNotification('Server returned invalid response. Check console for details.', 'info');
            return;
        }
        
        console.log('Parsed data:', data);
        
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
        console.error('Error stack:', error.stack);
        // Revert checkbox state on error
        checkbox.checked = !checkbox.checked;
        showNotification('Failed to update notification preference. Check console for details.', 'info');
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded - initializing settings page');
        // Theme is initialized by theme.js if included
        showSettingsSection('account');
        loadUserData();
        loadSavedPreferences();
        loadNotificationPreferences(); // Load notification settings
    });
} else {
    console.log('Document already loaded - initializing settings page');
    // Theme is initialized by theme.js if included
    showSettingsSection('account');
    loadUserData();
    loadSavedPreferences();
    loadNotificationPreferences(); // Load notification settings
}