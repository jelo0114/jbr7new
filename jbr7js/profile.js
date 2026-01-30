// Profile Page Functionality (API/Supabase)
// Flow: 1) Init checks session (getUserId) -> redirect signin if none. 2) showProfileSection('orders'), fetchSessionAndPopulateProfile(), setupAvatarButton() run once.
// 3) fetchSessionAndPopulateProfile: GET /api/get?action=profile&userId= -> 401 or any failure redirect signin; success -> populateProfilePage(data); if no orders -> loadOrdersForProfile(userId).
// 4) populateProfilePage: avatar, name, email, member since, stat cards, points, populateWishlist(items), populateOrders(orders). 5) Section switch (showProfileSection): reviews -> loadUserReviews(); rewards/activity -> loadUserActivities().

// Session shared with settings: jbr7_user_id (public id), jbr7_auth_uid (Supabase Auth UUID if any).
// Profile cache: jbr7_profile_cache, jbr7_profile_cache_ts, jbr7_profile_cache_user — show profile immediately when revisiting.
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getUserId() {
    const raw = sessionStorage.getItem('jbr7_user_id');
    if (!raw || String(raw).trim() === '' || String(raw).trim() === 'undefined') return null;
    return String(raw).trim();
}
function getAuthUserId() {
    return sessionStorage.getItem('jbr7_auth_uid');
}

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
    
    // Load data for specific sections
    if (sectionName === 'reviews') {
        if (typeof loadUserReviews === 'function') {
            loadUserReviews();
        }
    } else if (sectionName === 'rewards' || sectionName === 'activity') {
        if (typeof loadUserActivities === 'function') {
            loadUserActivities();
        }
    }
}

// Fetch session info and populate profile page (show cached data immediately if valid, then refresh in background)
async function fetchSessionAndPopulateProfile() {
    const userId = getUserId();
    
    if (!userId) {
        window.location.href = 'signin.html';
        return;
    }

    // Show cached profile immediately so page doesn't "refresh to render" when navigating from other pages
    const cacheRaw = sessionStorage.getItem('jbr7_profile_cache');
    const cacheTs = sessionStorage.getItem('jbr7_profile_cache_ts');
    const cacheUser = sessionStorage.getItem('jbr7_profile_cache_user');
    if (cacheRaw && cacheUser === userId && cacheTs) {
        const age = Date.now() - parseInt(cacheTs, 10);
        if (age >= 0 && age < PROFILE_CACHE_TTL_MS) {
            try {
                const cached = JSON.parse(cacheRaw);
                if (cached && cached.user) {
                    populateProfilePage(cached);
                }
            } catch (e) {
                // ignore parse error
            }
        }
    }

    try {
        console.debug('profile.js: requesting profile data for user:', userId);
        const response = await fetch(`/api/get?action=profile&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.debug('profile.js: response status', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'signin.html';
                return;
            }
            try {
                const txt = await response.text();
                console.error('API ERROR:', response.status, txt);
            } catch (e) {
                console.error('API error:', response.status, e);
            }
            window.location.href = 'signin.html';
            return;
        }

        const data = await response.json();
        console.debug('profile.js: API json response', data);

        if (!data || !data.success || !data.user) {
            console.error('Invalid response format:', data);
            if (!cacheRaw || cacheUser !== userId) {
                window.location.href = 'signin.html';
            }
            return;
        }

        populateProfilePage(data);
        if (!data.orders || data.orders.length === 0) {
            loadOrdersForProfile(userId);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        if (!cacheRaw || cacheUser !== userId) {
            window.location.href = 'signin.html';
        }
    }
}

// Fetch orders for profile (single source, robust)
async function fetchProfileOrders(userId) {
    if (!userId) return [];
    try {
        const res = await fetch(`/api/get?action=orders&userId=${userId}`, { credentials: 'same-origin' });
        if (!res.ok) return [];
        const json = await res.json();
        const orders = (json && json.orders) ? json.orders : (json && json.data) ? json.data : [];
        return Array.isArray(orders) ? orders : [];
    } catch (e) {
        console.warn('Could not fetch orders for profile:', e);
        return [];
    }
}

// Load orders into UI (called after fetch; starts poll if not already running)
async function loadOrdersForProfile(userId) {
    const orders = await fetchProfileOrders(userId);
    if (orders.length > 0) {
        populateOrders(orders);
    } else {
        const ordersList = document.querySelector('#orders-section .orders-list') || document.getElementById('ordersList');
        if (ordersList) {
            ordersList.innerHTML = '<div class="empty-orders"><p>You have no orders yet.</p></div>';
        }
    }
    startProfileOrdersPoll(userId);
}

// Time-based display status: processing → shipped after 30s, shipped → delivered after 1 min (from created_at)
function getDisplayStatus(order) {
    var status = (order && order.status) ? String(order.status).toLowerCase() : 'processing';
    var created = order && order.created_at ? new Date(order.created_at).getTime() : Date.now();
    var elapsedSec = (Date.now() - created) / 1000;
    if (status === 'delivered' || elapsedSec >= 90) return 'delivered';
    if (status === 'shipped' || elapsedSec >= 30) return 'shipped';
    return 'processing';
}

var profileOrdersPollTimer = null;
function startProfileOrdersPoll(userId) {
    if (!userId || profileOrdersPollTimer !== null) return;
    profileOrdersPollTimer = setInterval(async function () {
        var uid = getUserId();
        if (!uid) {
            clearProfileOrdersPoll();
            return;
        }
        var orders = await fetchProfileOrders(uid);
        if (orders.length > 0) populateOrders(orders);
    }, 30000);
}

function clearProfileOrdersPoll() {
    if (profileOrdersPollTimer !== null) {
        clearInterval(profileOrdersPollTimer);
        profileOrdersPollTimer = null;
    }
}
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', clearProfileOrdersPoll);
}

// Populate with mock data for development/debugging
function populateMockProfile() {
    console.log('Populating mock profile for development');
    
    const mockData = {
        success: true,
        user: {
            username: "Demo User",
            email: "demo@example.com",
            created_at: "2024-01-15T00:00:00Z",
            profile_picture: null,
            points: 1250
        },
        stats: {
            orders: 5,
            saved: 3,
            favorites: 8,
            reviews: 2
        },
        items: [
            {
                title: "Eco-Friendly Tote Bag",
                price: "299",
                metadata: {
                    image: "totebag.avif"
                }
            },
            {
                title: "Reusable Shopping Bag",
                price: "249",
                metadata: {
                    image: "totebag.avif"
                }
            }
        ],
        orders: [
            {
                order_number: "ORD-2024-001",
                created_at: "2024-01-20T10:00:00Z",
                status: "delivered",
                total: "1,295"
            },
            {
                order_number: "ORD-2024-002",
                created_at: "2024-01-25T14:30:00Z",
                status: "processing",
                total: "849"
            }
        ]
    };
    
    populateProfilePage(mockData);
}

// Populate the profile page with user data
function populateProfilePage(data) {
    const user = data.user;
    const stats = data.stats || {};
    const savedItems = data.items || data.saved_items || [];

    // Sync session with DB user id and email so settings change-password finds the user
    if (user && user.id != null && user.id !== undefined) {
        var dbId = String(user.id).trim();
        if (dbId && dbId !== 'undefined') {
            sessionStorage.setItem('jbr7_user_id', dbId);
        }
    }
    if (user && user.email) {
        sessionStorage.setItem('jbr7_user_email', String(user.email).trim());
    }

    console.log('Populating profile with user data:', user);

    // Update profile avatar
    if (user.profile_picture) {
        updateProfileAvatar(user.profile_picture);
    }
    
    // Update profile header
    const profileName = document.querySelector('.profile-name');
    const profileEmail = document.querySelector('.profile-email');
    const profileMemberSince = document.querySelector('.profile-member-since');

    if (profileName) {
        const displayName = user.username || 'Guest User';
        profileName.textContent = displayName;
        console.log('Set profile name to:', displayName);
    } else {
        console.warn('Could not find .profile-name element');
    }

    if (profileEmail) {
        const emailText = user.email || 'No email available';
        profileEmail.innerHTML = `<i class="fas fa-envelope"></i> ${escapeHtml(emailText)}`;
        console.log('Set profile email to:', emailText);
    } else {
        console.warn('Could not find .profile-email element');
    }

    if (profileMemberSince) {
        const memberSince = formatMemberSince(user.created_at);
        profileMemberSince.innerHTML = `<i class="fas fa-calendar-alt"></i> Member since ${memberSince}`;
        console.log('Set member since to:', memberSince);
    } else {
        console.warn('Could not find .profile-member-since element');
    }

    // Update stats cards
    const statCards = document.querySelectorAll('.profile-stats .stat-card');
    console.log('Found stat cards:', statCards.length);
    statCards.forEach(card => {
        const label = (card.querySelector('.stat-label') || {}).textContent || '';
        const numEl = card.querySelector('.stat-number');
        if (!numEl) return;
        
        if (/Total Orders/i.test(label)) {
            numEl.textContent = stats.orders || stats.total_orders || 0;
        } else if (/Saved Items/i.test(label)) {
            numEl.textContent = stats.saved || stats.saved_items || 0;
        } else if (/Favorites/i.test(label)) {
            numEl.textContent = stats.favorites || 0;
        } else if (/Reviews/i.test(label)) {
            numEl.textContent = stats.reviews || 0;
        }
    });

    // Update loyalty points
    const loyaltyPoints = document.querySelector('.loyalty-points h3');
    if (loyaltyPoints) {
        loyaltyPoints.textContent = user.points || 0;
        console.log('Set loyalty points to:', user.points);
    }

    // Update rewards section points
    const rewardsPoints = document.querySelector('.rewards-card-large h3');
    if (rewardsPoints) {
        rewardsPoints.textContent = `${user.points || 0} Points`;
    }

    // Populate saved items (wishlist)
    populateWishlist(savedItems);

    // Cache profile so next time we open profile we can show it immediately (no visible refresh)
    if (user && user.id != null) {
        try {
            sessionStorage.setItem('jbr7_profile_cache', JSON.stringify({
                success: true,
                user: user,
                stats: data.stats || {},
                items: data.items || data.saved_items || [],
                orders: data.orders || []
            }));
            sessionStorage.setItem('jbr7_profile_cache_ts', String(Date.now()));
            sessionStorage.setItem('jbr7_profile_cache_user', String(user.id));
        } catch (e) {
            // ignore quota errors
        }
    }

    // Populate orders if available (array from profile or from separate orders API)
    const orders = data.orders || [];
    if (orders.length > 0) {
        populateOrders(orders);
    } else {
        // Ensure empty state is shown
        const ordersList = document.querySelector('#orders-section .orders-list');
        if (ordersList) {
            ordersList.innerHTML = '<div class="empty-orders"><p>You have no orders yet.</p></div>';
        }
    }
}

// Populate guest profile (when not logged in)
function populateGuestProfile() {
    try {
        console.log('Populating guest profile');
        const nameEl = document.querySelector('.profile-name');
        const emailEl = document.querySelector('.profile-email');
        const sinceEl = document.querySelector('.profile-member-since');
        
        if (nameEl) nameEl.textContent = 'Guest';
        if (emailEl) emailEl.innerHTML = '<i class="fas fa-envelope"></i> Not signed in';
        if (sinceEl) sinceEl.innerHTML = '<i class="fas fa-calendar-alt"></i> -';

        // Set stats to zero
        const statCards = document.querySelectorAll('.profile-stats .stat-card');
        statCards.forEach(card => {
            const numEl = card.querySelector('.stat-number');
            if (numEl) numEl.textContent = '0';
        });

        // Clear wishlist grid
        const grid = document.querySelector('.wishlist-grid');
        if (grid) grid.innerHTML = '<div class="empty-wishlist"><p>Please log in to view saved items.</p></div>';
    } catch (e) {
        console.warn('populateGuestProfile failed', e);
    }
}

// Format member since date
function formatMemberSince(dateString) {
    if (!dateString) return 'Recently';
    
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        return 'Recently';
    }
}

// Populate wishlist section
function populateWishlist(items) {
    const wishlistGrid = document.querySelector('.wishlist-grid');
    if (!wishlistGrid) return;

    wishlistGrid.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
        wishlistGrid.innerHTML = '<div class="empty-wishlist"><p>Your wishlist is empty</p></div>';
        return;
    }

    items.forEach(item => {
        const metadata = item.metadata || {};
        const imageUrl = metadata.image || 'https://via.placeholder.com/300x300?text=No+Image';
        
        const itemCard = document.createElement('div');
        itemCard.className = 'wishlist-item';
        itemCard.innerHTML = `
            <button class="remove-wishlist-btn" onclick="removeSavedItem('${encodeURIComponent(item.title)}', this)">
                <i class="fas fa-times"></i>
            </button>
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.title)}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            <div class="wishlist-info">
                <h3>${escapeHtml(item.title)}</h3>
                <p class="wishlist-price">₱${escapeHtml(item.price)}</p>
                <button class="btn-primary" onclick="addWishlistItemToCart('${escapeHtml(item.title)}', '${escapeHtml(item.price)}', '${escapeHtml(imageUrl)}')">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `;
        wishlistGrid.appendChild(itemCard);
    });
}

// Populate orders section; layout: header (order #, date, total, status) + product section (image, name, qty|color, price) + action buttons by status
function populateOrders(orders) {
    const ordersList = document.querySelector('#orders-section .orders-list') || document.getElementById('ordersList');
    if (!ordersList) return;

    ordersList.innerHTML = '';

    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-orders"><p>You have no orders yet.</p></div>';
        return;
    }

    orders.forEach(order => {
        var displayStatus = getDisplayStatus(order);
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card order-item';
        orderCard.setAttribute('data-status', displayStatus);

        const statusClass = getStatusClass(displayStatus);
        const formattedDate = formatOrderDate(order.created_at);
        var items = getOrderItems(order);
        var firstItem = items.length > 0 ? items[0] : null;
        var itemName = firstItem ? (firstItem.item_name || firstItem.name || '').trim() : '';
        var quantity = firstItem ? (parseInt(firstItem.quantity, 10) || 1) : 0;
        var color = firstItem ? (firstItem.color || firstItem.selectedColor || '').trim() : '';
        var itemPrice = firstItem ? (firstItem.line_total != null ? firstItem.line_total : (firstItem.item_price != null ? firstItem.item_price : order.total)) : order.total;
        var itemImage = getItemImageUrl(firstItem);
        var totalDisplay = order.total != null ? order.total : (order.total_amount != null ? order.total_amount : '0');
        var priceDisplay = itemPrice != null ? itemPrice : totalDisplay;
        var attrsText = 'Quantity: ' + quantity + (color ? ' | Color: ' + escapeHtml(color) : '');

        var showCancel = displayStatus === 'processing';
        var showTrack = displayStatus === 'shipped';
        var showLeaveReview = displayStatus === 'delivered' || displayStatus === 'shipped';

        var productHtml = firstItem
            ? `<div class="order-content">
                <img class="order-image" src="${escapeHtml(itemImage)}" alt="${escapeHtml(itemName)}" onerror="this.src='totebag.avif'">
                <div class="order-details">
                    <h3>${escapeHtml(itemName || 'Item')}</h3>
                    <p class="order-meta">${attrsText}</p>
                    <p class="order-price">₱${escapeHtml(String(priceDisplay))}</p>
                </div>
               </div>`
            : `<div class="order-content"><div class="order-details"><h3>Order #${escapeHtml(order.order_number)}</h3><p class="order-price">Total: ₱${escapeHtml(String(totalDisplay))}</p></div></div>`;

        var buttonsHtml = '<div class="order-actions">';
        buttonsHtml += '<button type="button" class="btn-secondary profile-view-details-btn" data-order-number="' + escapeHtml(order.order_number || '') + '" data-product-title="' + escapeHtml(itemName) + '">View Details</button>';
        if (showCancel) buttonsHtml += '<button type="button" class="btn-cancel-order profile-cancel-btn">Cancel Order</button>';
        if (showTrack) buttonsHtml += '<button type="button" class="btn-secondary profile-track-btn"><i class="fas fa-map-marker-alt"></i> Track Order</button>';
        if (showLeaveReview) buttonsHtml += '<button type="button" class="btn-primary profile-leave-review-btn" data-product-title="' + escapeHtml(itemName) + '" data-order-number="' + escapeHtml(order.order_number || '') + '">Leave Review</button>';
        buttonsHtml += '</div>';

        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${escapeHtml(order.order_number)}</h3>
                    <p class="order-date">${formattedDate}</p>
                    <p class="order-total">Total: ₱${escapeHtml(String(totalDisplay))}</p>
                </div>
                <span class="order-status ${statusClass}">${escapeHtml(displayStatus)}</span>
            </div>
            <div class="order-body">
                ${productHtml}
                ${buttonsHtml}
            </div>
        `;

        var viewDetailsBtn = orderCard.querySelector('.profile-view-details-btn');
        if (viewDetailsBtn) viewDetailsBtn.addEventListener('click', function () {
            viewOrderDetails(this.getAttribute('data-order-number') || '', this.getAttribute('data-product-title') || '');
        });
        if (showLeaveReview) {
            var leaveBtn = orderCard.querySelector('.profile-leave-review-btn');
            if (leaveBtn) leaveBtn.addEventListener('click', function () {
                leaveReviewFromOrder(this.getAttribute('data-product-title') || '', this.getAttribute('data-order-number') || '');
            });
        }
        if (showCancel) {
            var cancelBtn = orderCard.querySelector('.profile-cancel-btn');
            if (cancelBtn) cancelBtn.addEventListener('click', function () { cancelOrder(order.id || order.order_number); });
        }
        if (showTrack) {
            var trackBtn = orderCard.querySelector('.profile-track-btn');
            if (trackBtn) trackBtn.addEventListener('click', function () { trackOrder(order.order_number); });
        }
        ordersList.appendChild(orderCard);
    });
}
window.renderOrders = populateOrders;

// Remove saved item - Updated to use API
async function removeSavedItem(encodedTitle, buttonEl) {
    const title = decodeURIComponent(encodedTitle);
    const userId = getUserId();
    
    if (!userId) {
        showNotification('Please log in first', 'info');
        return;
    }
    
    if (!confirm(`Remove "${title}" from saved items?`)) return;
    
    try {
        const response = await fetch('/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'delete-saved-item',
                userId: userId,
                title: title 
            })
        });

        const data = await response.json();
        if (data.success) {
            const row = buttonEl && buttonEl.closest ? buttonEl.closest('.wishlist-item') : null;
            if (row) {
                row.style.opacity = '0';
                row.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    row.remove();
                    showNotification('Item removed from wishlist', 'success');
                }, 300);
            }
        } else {
            showNotification('Failed to remove item', 'info');
        }
    } catch (e) {
        console.warn('removeSavedItem failed', e);
        showNotification('Failed to remove item', 'info');
    }
}

// Add wishlist item to cart
function addWishlistItemToCart(title, price, image) {
    try {
        const item = {
            name: title,
            price: price,
            image: image,
            quantity: 1
        };

        // Use user-specific storage - REQUIRED for data isolation
        if (typeof UserStorage === 'undefined' || !UserStorage) {
            console.error('UserStorage not available!');
            showNotification('Unable to add to cart', 'info');
            return;
        }
        
        const raw = UserStorage.getItem('cart');
        let cart = JSON.parse(raw || '[]');
        const existingIndex = cart.findIndex(c => c.name === item.name);
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity = (cart[existingIndex].quantity || 0) + 1;
        } else {
            cart.push(item);
        }
        
        UserStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart badge
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        } else if (window.updateNavBadge) {
            window.updateNavBadge();
        }
        
        showNotification(`${title} added to cart`, 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart', 'info');
    }
}

// Profile Header Functions
// Make editAvatar globally accessible
window.editAvatar = function() {
    console.log('editAvatar function called');
    
    try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Accept all image types
        input.style.display = 'none';
        input.id = 'avatar-upload-input-' + Date.now(); // Unique ID
        
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) {
                // User cancelled, clean up
                cleanupInput(input);
                return;
            }
            
            console.log('File selected:', file.name, file.type, file.size);
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('File size must be less than 5MB', 'error');
                cleanupInput(input);
                return;
            }
            
            // Validate file type - check if it's an image (starts with 'image/')
            if (!file.type || !file.type.startsWith('image/')) {
                showNotification('Please select an image file.', 'error');
                cleanupInput(input);
                return;
            }
            
            // Show loading notification
            showNotification('Uploading photo...', 'info');
            
            // Create FormData
            const formData = new FormData();
            formData.append('photo', file);
            
            try {
                const response = await fetch('/jbr7php/upload_profile_photo.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    throw new Error('Upload failed with status: ' + response.status);
                }
                
                const data = await response.json();
                console.log('Upload response:', data);
                
                if (data.success) {
                    showNotification('Profile photo updated successfully!', 'success');
                    // Update the avatar display on profile page
                    updateProfileAvatar(data.photo_url);
                    // Reload profile data to get updated info
                    if (typeof fetchSessionAndPopulateProfile === 'function') {
                        fetchSessionAndPopulateProfile();
                    }
                } else {
                    showNotification(data.error || 'Failed to upload photo', 'error');
                }
            } catch (error) {
                console.error('Upload error:', error);
                showNotification('Failed to upload photo. Please try again.', 'error');
            }
            
            // Clean up input element
            cleanupInput(input);
        };
        
        // Handle cancellation (user clicks cancel)
        input.oncancel = function() {
            console.log('File picker cancelled');
            cleanupInput(input);
        };
        
        // Trigger file picker
        document.body.appendChild(input);
        input.click();
        
    } catch (error) {
        console.error('Error in editAvatar:', error);
        showNotification('Error opening file picker. Please try again.', 'error');
    }
}

// Helper function to clean up input element
function cleanupInput(input) {
    try {
        if (input && input.parentNode) {
            input.parentNode.removeChild(input);
        }
    } catch (e) {
        console.warn('Error cleaning up input:', e);
    }
}

function updateProfileAvatar(photoUrl) {
    const avatarEl = document.querySelector('.profile-avatar');
    if (!avatarEl) return;
    
    // Remove icon if exists
    const icon = avatarEl.querySelector('i');
    if (icon) {
        icon.remove();
    }
    
    // Check if img already exists
    let img = avatarEl.querySelector('img');
    if (!img) {
        img = document.createElement('img');
        avatarEl.appendChild(img);
    }
    
    // Set image properties
    img.src = photoUrl;
    img.alt = 'Profile Photo';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.style.display = 'block';
    
    // Remove background gradient when image is present
    avatarEl.style.background = 'transparent';
    
    img.onerror = function() {
        // Fallback to icon if image fails to load
        img.remove();
        const icon = document.createElement('i');
        icon.className = 'fas fa-user';
        avatarEl.appendChild(icon);
        // Restore background gradient
        avatarEl.style.background = 'linear-gradient(135deg, #006923, #00852c)';
    };
    
    img.onload = function() {
        // Ensure image is visible
        img.style.display = 'block';
    };
}

// Make shareProfile globally accessible
window.shareProfile = function() {
    showNotification('Profile link copied to clipboard!', 'success');
}

// Logout Function
function handleLogout() {
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

        // No need to call PHP logout, just redirect
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
    }
}

// Order Functions
function filterOrders(status) {
    const orders = document.querySelectorAll('.order-item, .order-card');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    let clicked = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
    if (!clicked) {
        clicked = Array.from(filterBtns).find(b => {
            try { return (b.getAttribute('onclick') || '').indexOf("'" + status + "'") !== -1; } 
            catch (e) { return false; }
        }) || filterBtns[0];
    }
    
    const btnEl = clicked && clicked.closest ? clicked.closest('.filter-btn') : clicked;
    if (btnEl) btnEl.classList.add('active');
    
    orders.forEach(order => {
        const orderStatus = order.getAttribute('data-status');
        if (status === 'all' || orderStatus === status) {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
}

// Get order items array (order_items, items, or parsed items_json)
function getOrderItems(order) {
    if (!order) return [];
    var items = order.order_items || order.items;
    if (Array.isArray(items) && items.length > 0) return items;
    if (order.items_json) {
        try {
            var parsed = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : order.items_json;
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
    }
    return [];
}

// Resolve product image URL for order item (relative path or fallback)
function getItemImageUrl(item) {
    if (!item) return 'totebag.avif';
    var img = item.item_image || item.image || (item.metadata && item.metadata.image) || '';
    if (img && String(img).trim()) return String(img).trim();
    return 'totebag.avif';
}

function getFirstProductTitleFromOrder(order) {
    var items = getOrderItems(order);
    if (items.length > 0) {
        var name = items[0].item_name || items[0].name;
        if (name) return String(name).trim();
    }
    return '';
}

function viewOrderDetails(orderNumber, productTitle) {
    if (productTitle) {
        window.location.href = 'view.html?title=' + encodeURIComponent(productTitle) + '&from=profile&order_number=' + encodeURIComponent(orderNumber || '');
    } else {
        showNotification('Product info not available', 'info');
    }
}

function leaveReviewFromOrder(productTitle, orderNumber) {
    if (productTitle) {
        window.location.href = 'view.html?title=' + encodeURIComponent(productTitle) + '&review=true&from=profile&order_number=' + encodeURIComponent(orderNumber || '');
    } else {
        showNotification('Product information not available', 'info');
    }
}

function reorder(orderId) {
    showNotification('Adding items to cart...', 'success');
}

function trackOrder(orderNumber) {
    if (orderNumber) {
        window.location.href = 'track-order.html?order=' + encodeURIComponent(orderNumber);
    } else {
        showNotification('Order number not available', 'info');
    }
}

function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        showNotification(`Order #${orderId} has been cancelled`, 'success');
    }
}

function leaveReview(productTitle, productId) {
    // Open view.html with product and show review form
    if (productTitle) {
        const encodedTitle = encodeURIComponent(productTitle);
        window.location.href = `view.html?title=${encodedTitle}&review=true`;
    } else {
        showNotification('Product information not available', 'info');
    }
}

// Load user reviews - Updated to use API
async function loadUserReviews() {
    const container = document.getElementById('userReviewsList');
    if (!container) return;
    
    const userId = getUserId();
    if (!userId) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">Please log in to view your reviews.</p>';
        return;
    }
    
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">Loading reviews...</p>';
    
    try {
        const response = await fetch(`/api/get?action=user-reviews&userId=${userId}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load reviews');
        }
        
        const data = await response.json();
        
        if (data.success && data.reviews && data.reviews.length > 0) {
            container.innerHTML = '';
            data.reviews.forEach(review => {
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                reviewItem.style.cssText = 'padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1rem; background: #fff;';
                
                // Get product details for View Product link
                let productTitle = (review.product_title || review.item_title || 'Unknown Product').trim();
                let productPrice = parseFloat(review.item_price) || 0;
                let productImage = (review.item_image || 'totebag.avif').trim();
                
                // Ensure we never have "undefined" as a string
                if (productTitle === 'undefined' || productTitle === '' || !productTitle) {
                    productTitle = 'Unknown Product';
                }
                if (productImage === 'undefined' || productImage === '') {
                    productImage = 'totebag.avif';
                }
                
                // Generate stars with half-star support
                const rating = parseFloat(review.rating) || 0;
                const fullStars = Math.floor(rating);
                const hasHalfStar = (rating % 1) >= 0.5;
                let starsHtml = '';
                for (let i = 0; i < 5; i++) {
                    if (i < fullStars) {
                        starsHtml += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
                    } else if (i === fullStars && hasHalfStar) {
                        starsHtml += '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>';
                    } else {
                        starsHtml += '<i class="far fa-star" style="color: #d1d5db;"></i>';
                    }
                }
                
                reviewItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${escapeHtml(productTitle)}</h3>
                            <div style="margin-bottom: 0.5rem;">${starsHtml}</div>
                            <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">${review.date || (review.created_at ? formatOrderDate(review.created_at) : '')}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="editReviewFromProfile('${review.id}', '${escapeHtml(productTitle)}')" 
                                    style="padding: 0.4rem 0.8rem; background: #006923; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteReviewFromProfile(${review.id})" 
                                    style="padding: 0.4rem 0.8rem; background: #dc2626; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <p style="color: #4b5563; line-height: 1.6; margin: 0.5rem 0 0.5rem 0;">${escapeHtml(review.comment || 'No comment provided.')}</p>
                    <div style="margin-top: 0.5rem;">
                        <a href="view.html?title=${encodeURIComponent(productTitle)}&price=${productPrice}&img=${encodeURIComponent(productImage)}&from=profile" 
                           class="btn-text" 
                           style="display: inline-flex; align-items: center; gap: 0.5rem; color: #006923; text-decoration: none; font-weight: 500;">
                            <i class="fas fa-eye"></i> View Product
                        </a>
                    </div>
                `;
                container.appendChild(reviewItem);
            });
        } else {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">You haven\'t left any reviews yet.</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #dc2626;">Failed to load reviews. Please try again.</p>';
    }
}

function editReviewFromProfile(reviewId, productTitle) {
    const encodedTitle = encodeURIComponent(productTitle);
    window.location.href = `view.html?title=${encodedTitle}&review=true&edit=${reviewId}`;
}

function deleteReviewFromProfile(reviewId) {
    if (confirm('Are you sure you want to delete this review?')) {
        // TODO: Implement delete review endpoint
        showNotification('Delete review functionality coming soon', 'info');
    }
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
    
    wishlistItem.style.opacity = '0';
    wishlistItem.style.transform = 'translateX(100px)';
    setTimeout(() => wishlistItem.remove(), 300);
}

// Review Functions
function editReview(button) {
    showNotification('Opening review editor...', 'info');
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
}

function claimReward(pointsCost) {
    const currentPoints = 2450;
    
    if (currentPoints >= pointsCost) {
        if (confirm(`Redeem ${pointsCost} points for this reward?`)) {
            showNotification(`Reward claimed! ${pointsCost} points deducted.`, 'success');
        }
    } else {
        showNotification(`You need ${pointsCost - currentPoints} more points for this reward`, 'info');
    }
}

// Load user activities - Updated to use API
async function loadUserActivities() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const response = await fetch(`/api/get?action=user-activities&userId=${userId}`, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) throw new Error('Failed to fetch activities');
        
        const data = await response.json();
        if (data.success) {
            // Update points display
            const pointsEl = document.querySelector('.loyalty-points h3');
            if (pointsEl) {
                pointsEl.textContent = data.points.toLocaleString();
            }
            
            const rewardsPointsEl = document.querySelector('.rewards-card-large h3');
            if (rewardsPointsEl) {
                rewardsPointsEl.textContent = data.points.toLocaleString() + ' Points';
            }
            
            // Render activities
            const activityList = document.getElementById('activityList');
            if (activityList && data.activities) {
                if (data.activities.length === 0) {
                    activityList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #6b7280;">No activities yet.</p>';
                } else {
                    activityList.innerHTML = '';
                    data.activities.forEach(activity => {
                        const activityItem = document.createElement('div');
                        activityItem.className = 'activity-item';
                        
                        const iconClass = activity.type === 'order' ? 'added' : 'reviewed';
                        const icon = activity.type === 'order' ? 'fa-cart-plus' : 'fa-star';
                        
                        activityItem.innerHTML = `
                            <div class="activity-icon ${iconClass}">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="activity-content">
                                <strong>${activity.description}</strong>
                                <span class="activity-time">${activity.time_ago}</span>
                            </div>
                            <div class="activity-points">+${activity.points} pts</div>
                        `;
                        activityList.appendChild(activityItem);
                    });
                }
            }
        }
    } catch (e) {
        console.error('Failed to load activities:', e);
    }
}

// Helper functions
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'": '&#39;' }[c];
    });
}

function getStatusClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'processing' || s === 'shipped' || s === 'delivered' || s === 'cancelled') return s;
    return 'processing';
}

function formatOrderDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (e) {
        return dateString;
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
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
        .notification-error { border-left: 4px solid #dc2626; }
        .notification-error i { color: #dc2626; }
        .notification-info { border-left: 4px solid #3b5d72; }
        .notification-info i { color: #3b5d72; }
        .notification span { font-size: 0.95rem; color: #333; font-weight: 500; }
    `;
    document.head.appendChild(notificationStyles);
}

// Run profile load once per page; avoid refresh loop when user is logged in
var profileLoadDone = false;
function initProfilePage() {
    if (profileLoadDone) return;
    var userId = getUserId();
    if (!userId) {
        window.location.href = 'signin.html';
        return;
    }
    profileLoadDone = true;
    showProfileSection('orders');
    fetchSessionAndPopulateProfile();
    setupAvatarButton();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
    initProfilePage();
}

// Setup avatar button event listener as fallback
function setupAvatarButton() {
    const avatarBtn = document.querySelector('.edit-avatar-btn');
    if (avatarBtn) {
        // Remove existing onclick and add event listener
        avatarBtn.removeAttribute('onclick');
        avatarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Avatar button clicked via event listener');
            if (typeof window.editAvatar === 'function') {
                window.editAvatar();
            } else {
                console.error('editAvatar function not found');
                showNotification('Error: Photo upload function not available', 'error');
            }
        });
        console.log('Avatar button event listener attached');
    } else {
        console.warn('Avatar button not found');
    }
}