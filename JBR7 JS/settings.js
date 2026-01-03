// Settings Page Functionality

// Show specific settings section
function showSettingsSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.settings-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.settings-menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionName}-section`);
    if (selectedSection) {
        selectedSection.classList.add('active');
        selectedSection.style.display = 'block';
    }
    
    // Add active class to clicked menu item
    const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
}

// Account Functions
function saveAccountInfo() {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const company = document.getElementById('company').value;
    
    if (!fullName || !email || !phone) {
        showNotification('Please fill in all required fields', 'info');
        return;
    }
    
    showNotification('Account information updated successfully!', 'success');
}

function changePassword() {
    showNotification('Password updated successfully!', 'success');
}

// Notification Functions
function toggleNotification(type, checkbox) {
    const status = checkbox.checked ? 'enabled' : 'disabled';
    showNotification(`${type} notifications ${status}`, 'info');
}

// Privacy & Security Functions
function enable2FA() {
    showNotification('Two-Factor Authentication setup initiated', 'success');
}

function viewFullHistory() {
    showNotification('Loading full login history...', 'info');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        showNotification('Account deletion request submitted', 'info');
    }
}

// Payment Functions
function addPaymentMethod() {
    showNotification('Opening payment method form...', 'info');
}

function removePayment() {
    if (confirm('Are you sure you want to remove this payment method?')) {
        showNotification('Payment method removed', 'success');
    }
}

function setDefaultPayment() {
    showNotification('Default payment method updated', 'success');
}

// Save and load default payment preference
function savePaymentPreference() {
    const radios = document.querySelectorAll('input[name="defaultPayment"]');
    let selected = null;
    radios.forEach(r => { if (r.checked) selected = r.value; });
    if (!selected) {
        showNotification('Please select a payment method to save', 'info');
        return;
    }
    localStorage.setItem('jbr7_default_payment', selected);
    showNotification('Default payment method saved', 'success');
}

function loadDefaultPayment() {
    const saved = localStorage.getItem('jbr7_default_payment');
    if (saved) {
        const el = document.querySelector(`input[name="defaultPayment"][value="${saved}"]`);
        if (el) el.checked = true;
    }
}

// Address Functions
function addAddress() {
    showNotification('Opening address form...', 'info');
}

function editAddress() {
    showNotification('Opening address editor...', 'info');
}

function removeAddress() {
    if (confirm('Are you sure you want to remove this address?')) {
        showNotification('Address removed', 'success');
    }
}

function setDefaultAddress() {
    showNotification('Default address updated', 'success');
}

// Preference Functions
function changeTheme(theme) {
    showNotification(`Theme changed to ${theme}`, 'success');
    // You could actually implement theme switching here
}

function toggleCompactView(checkbox) {
    const status = checkbox.checked ? 'enabled' : 'disabled';
    showNotification(`Compact view ${status}`, 'info');
}

function setDefaultSort(sortValue) {
    showNotification(`Default sorting set to ${sortValue}`, 'success');
}

function toggleSaveCart(checkbox) {
    const status = checkbox.checked ? 'enabled' : 'disabled';
    showNotification(`Auto-save cart ${status}`, 'info');
}

// Language & Region Functions
function changeLanguage(language) {
    showNotification(`Language changed to ${language}`, 'success');
}

function changeCurrency(currency) {
    showNotification(`Currency changed to ${currency}`, 'success');
}

function changeTimezone(timezone) {
    showNotification(`Timezone changed to ${timezone}`, 'success');
}

// Help & Support Functions
function contactSupport() {
    handleNavigate('contact');
}

function viewTerms() {
    showNotification('Opening Terms of Service...', 'info');
}

function viewPrivacyPolicy() {
    showNotification('Opening Privacy Policy...', 'info');
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            // Redirect to login page or home
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Show notification
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
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification styles if not already present
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
        
        .notification.show {
            right: 20px;
        }
        
        .notification i {
            font-size: 1.5rem;
        }
        
        .notification-success {
            border-left: 4px solid #006923;
        }
        
        .notification-success i {
            color: #006923;
        }
        
        .notification-info {
            border-left: 4px solid #3b5d72;
        }
        
        .notification-info i {
            color: #3b5d72;
        }
        
        .notification span {
            font-size: 0.95rem;
            color: #333;
            font-weight: 500;
        }
    `;
    document.head.appendChild(notificationStyles);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Show account section by default
    showSettingsSection('account');
    // Load saved preferences
    try { loadDefaultPayment(); } catch (e) { /* ignore if section not present on page */ }
});
