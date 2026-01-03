// Profile Page Functionality

// Show specific profile section
function showProfileSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all menu items
    const menuItems = document.querySelectorAll('.profile-menu-item');
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

// Profile Header Functions
function editAvatar() {
    showNotification('Opening avatar editor...', 'info');
    // Here you would open a file picker or avatar editor
}

function shareProfile() {
    showNotification('Profile link copied to clipboard!', 'success');
    // Here you would copy the profile URL to clipboard
}

// Logout Function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        
        // Clear any stored session data (if any)
        localStorage.removeItem('userSession');
        sessionStorage.clear();
        
        // Redirect to index.html after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Order Functions
function filterOrders(status) {
    const orders = document.querySelectorAll('.order-item');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Update active filter button
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter orders
    orders.forEach(order => {
        const orderStatus = order.getAttribute('data-status');
        if (status === 'all' || orderStatus === status) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

function viewOrder(orderId) {
    showNotification(`Opening order #JBR7-2024-${orderId}...`, 'info');
    // Here you would navigate to order details page
}

function trackOrder(orderId) {
    showNotification(`Tracking order #JBR7-2024-${orderId}...`, 'info');
    // Here you would open tracking page
}

function reorder(orderId) {
    showNotification('Adding items to cart...', 'success');
    // Here you would add the order items to cart
}

function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        showNotification(`Order #JBR7-2024-${orderId} has been cancelled`, 'success');
        // Here you would send cancellation request to backend
    }
}

function leaveReview(orderId) {
    showNotification('Opening review form...', 'info');
    // Here you would open review modal/page
}

// Wishlist Functions
function removeFromWishlist(button) {
    const wishlistItem = button.closest('.wishlist-item');
    if (wishlistItem) {
        wishlistItem.style.opacity = '0';
        wishlistItem.style.transform = 'scale(0.8)';
        setTimeout(() => {
            wishlistItem.remove();
            showNotification('Item removed from wishlist', 'info');
        }, 300);
    }
}

function clearWishlist() {
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
        const wishlistItems = document.querySelectorAll('.wishlist-item');
        wishlistItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => item.remove(), 300);
            }, index * 100);
        });
        showNotification('Wishlist cleared', 'success');
    }
}

function moveToCart(button) {
    const wishlistItem = button.closest('.wishlist-item');
    const productName = wishlistItem.querySelector('h3').textContent;
    
    showNotification(`${productName} added to cart!`, 'success');
    
    // Animate removal from wishlist
    wishlistItem.style.opacity = '0';
    wishlistItem.style.transform = 'translateX(100px)';
    setTimeout(() => {
        wishlistItem.remove();
    }, 300);
}

// Review Functions
function editReview(button) {
    showNotification('Opening review editor...', 'info');
    // Here you would open review editing modal
}

function deleteReview(button) {
    if (confirm('Are you sure you want to delete this review?')) {
        const reviewItem = button.closest('.review-item');
        reviewItem.style.opacity = '0';
        reviewItem.style.transform = 'translateX(-100px)';
        setTimeout(() => {
            reviewItem.remove();
            showNotification('Review deleted', 'success');
        }, 300);
    }
}

// Rewards Functions
function viewRewards() {
    showProfileSection('rewards');
}

function redeemPoints() {
    showNotification('Opening rewards redemption...', 'info');
    // Here you would open redemption modal
}

function claimReward(pointsCost) {
    const currentPoints = 2450; // This would come from user data
    
    if (currentPoints >= pointsCost) {
        if (confirm(`Redeem ${pointsCost} points for this reward?`)) {
            showNotification(`Reward claimed! ${pointsCost} points deducted.`, 'success');
            // Here you would process the reward claim
        }
    } else {
        showNotification(`You need ${pointsCost - currentPoints} more points for this reward`, 'info');
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
    // Show orders section by default
    showProfileSection('orders');
});
