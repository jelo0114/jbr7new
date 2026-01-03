// Saved Items Page Functionality

// Sample product data (in real app, this would come from a database)
const productData = {
    "Eco Jute Tote Bag": {
        image: "https://www.sourceforthegoose.com/cdn/shop/files/Scallop-top-jute-tote.jpg?v=1713019103&width=1080",
        description: "Sustainable jute tote with scallop top design, perfect for everyday use",
    price: "₱45.00",
        rating: 4.8,
        reviews: 127,
        category: "Tote Bags"
    },
    "Professional Module Backpack": {
        image: "https://www.teqler.com/media/_processed_/6/8/csm_T131370_70518ba90d.jpg",
        description: "Multi-compartment backpack with laptop sleeve and water-resistant fabric",
    price: "₱78.00",
        rating: 4.9,
        reviews: 203,
        category: "Backpacks"
    },
    "Canvas Messenger Bag": {
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
        description: "Classic canvas messenger with adjustable strap and multiple pockets",
    price: "₱62.00",
        rating: 4.6,
        reviews: 89,
        category: "Messenger Bags"
    },
    "Minimalist Leather Tote": {
        image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500",
        description: "Sleek vegan leather tote with minimalist design and spacious interior",
    price: "₱38.00",
        rating: 4.7,
        reviews: 156,
        category: "Tote Bags"
    },
    "Weekend Duffel Bag": {
        image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=500",
        description: "Spacious duffel with premium materials, perfect for weekend getaways",
    price: "₱95.00",
        rating: 4.9,
        reviews: 178,
        category: "Duffel Bags"
    },
    "Urban Commuter Backpack": {
        image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500",
        description: "Sleek urban backpack with anti-theft features and USB charging port",
    price: "₱52.00",
        rating: 4.5,
        reviews: 94,
        category: "Backpacks"
    },
    "Classic Leather Messenger": {
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
        description: "Timeless leather messenger bag with vintage-inspired hardware",
    price: "₱68.00",
        rating: 4.8,
        reviews: 142,
        category: "Messenger Bags"
    },
    "Canvas Market Tote": {
        image: "https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=500",
        description: "Durable canvas tote with reinforced handles and internal pockets",
    price: "₱42.00",
        rating: 4.6,
        reviews: 76,
        category: "Tote Bags"
    }
};

// Load saved items from localStorage
function loadSavedItems() {
    const savedItems = JSON.parse(localStorage.getItem('savedBags') || '[]');
    const savedItemsGrid = document.getElementById('savedItemsGrid');
    const emptyState = document.getElementById('emptyState');
    const savedCount = document.getElementById('savedCount');
    
    // Update count
    savedCount.textContent = `${savedItems.length} Saved Item${savedItems.length !== 1 ? 's' : ''}`;
    
    // Clear grid
    savedItemsGrid.innerHTML = '';
    
    if (savedItems.length === 0) {
        emptyState.classList.add('show');
        savedItemsGrid.style.display = 'none';
    } else {
        emptyState.classList.remove('show');
        savedItemsGrid.style.display = 'grid';
        
        savedItems.forEach((entry, index) => {
            // entry may be a string (legacy) or an object {name, price, image}
            let itemName = null;
            let productInfo = null;
            let info = null;

            if (typeof entry === 'string') {
                itemName = entry;
                productInfo = productData[itemName];
            } else if (entry && typeof entry === 'object') {
                itemName = entry.name || 'Unknown';
                productInfo = productData[itemName];
            }

            // Base info: prefer productData when available
            info = productInfo ? Object.assign({}, productInfo) : {
                image: 'https://via.placeholder.com/400x300?text=Image+unavailable',
                description: 'No additional information available for this item.',
                price: '₱0.00',
                rating: 0,
                category: 'Unknown'
            };

            // Overlay any saved object fields (new format)
            if (entry && typeof entry === 'object') {
                if (entry.image) info.image = entry.image;
                if (entry.price) info.price = entry.price;
            }

            // If a centralized prices.json was loaded into window.cachedPrices,
            // use that retail price when available to display a consistent price.
            try {
                const p = window.cachedPrices && window.cachedPrices[itemName];
                if (p && typeof p.retail === 'number' && isFinite(p.retail)) {
                    info.price = `₱${Number(p.retail).toFixed(2)}`;
                }
            } catch (e) { /* ignore */ }

            // Ensure info.price is a formatted currency string for display (handle numeric or numeric-string values)
            try {
                if (info && info.price != null) {
                    const raw = String(info.price).trim();
                    if (/^[0-9\.]+$/.test(raw)) {
                        info.price = `₱${Number(raw).toFixed(2)}`;
                    }
                }
            } catch (e) { /* ignore */ }

            const card = createSavedItemCard(itemName, info, index);
                    // Attach view handler that opens view.html with details
                    const viewBtn = card.querySelector('.view-btn');
                    if (viewBtn) {
                        viewBtn.addEventListener('click', function(e){
                            e.preventDefault();
                            // price: try saved numeric, fallback to stripping currency
                            const priceNumeric = (entry && entry.price) ? String(entry.price).replace(/[^0-9\.]/g,'') : String(info.price || '').replace(/[^0-9\.]/g,'');
                            viewProduct(itemName, priceNumeric, info.image || '', info.description || '');
                        });
                    }
                    savedItemsGrid.appendChild(card);
        });
    }
}

// Create saved item card
function createSavedItemCard(name, info, index) {
    const card = document.createElement('div');
    card.className = 'saved-item-card';
    card.style.animation = `slideInFromLeft 0.6s ease-out forwards ${index * 0.1}s`;
    card.style.opacity = '0';
    
    // Generate star rating HTML (handle missing/zero ratings)
    const ratingVal = (typeof info.rating === 'number') ? info.rating : 0;
    const fullStars = Math.floor(ratingVal);
    const hasHalfStar = (ratingVal % 1) >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    card.innerHTML = `
        <div class="saved-item-image">
            <img src="${info.image}" alt="${name}">
            <button class="remove-btn" onclick="removeSavedItem('${name}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="saved-item-info">
            <h3>${name}</h3>
            <p class="saved-item-description">${info.description}</p>
            <div class="saved-item-meta">
                <div class="rating">
                    ${starsHTML}
                    <span class="rating-number">${ratingVal > 0 ? ratingVal : ''}</span>
                </div>
                <span class="category-tag">${info.category}</span>
            </div>
            <div class="saved-item-footer">
                <span class="price">${info.price}</span>
                <div class="saved-item-actions">
                    <button class="view-btn" onclick="viewProduct('${name}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="add-to-cart-btn" onclick="addSavedToCart('${name}', '${info.price}', '${info.image}')">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Remove saved item
function removeSavedItem(itemName) {
    let savedItems = JSON.parse(localStorage.getItem('savedBags') || '[]');
    // Support removal when saved entries are strings or objects {name, ...}
    savedItems = savedItems.filter(item => {
        if (typeof item === 'string') return item !== itemName;
        if (item && typeof item === 'object') return item.name !== itemName;
        return true;
    });
    localStorage.setItem('savedBags', JSON.stringify(savedItems));
    
    showNotification(`${itemName} removed from saved items`, 'info');
    loadSavedItems();
}

// Clear all saved items
function clearAllSaved() {
    if (confirm('Are you sure you want to remove all saved items?')) {
        localStorage.setItem('savedBags', '[]');
        showNotification('All saved items cleared', 'info');
        loadSavedItems();
    }
}

// Toggle view (grid/list)
let isListView = false;
function toggleView() {
    const grid = document.getElementById('savedItemsGrid');
    const toggleBtn = document.querySelector('.view-toggle-btn i');
    
    isListView = !isListView;
    
    if (isListView) {
        grid.classList.add('list-view');
        toggleBtn.className = 'fas fa-th';
    } else {
        grid.classList.remove('list-view');
        toggleBtn.className = 'fas fa-th-large';
    }
}

// View product (open view.html with product details)
function viewProduct(title, priceNumeric, img, desc) {
    const q = (k, v) => `${k}=${encodeURIComponent(String(v || ''))}`;
    const from = 'saved';
    const params = [q('title', title), q('price', priceNumeric), q('img', img), q('desc', desc), q('from', from)].join('&');
    window.location.href = 'view.html?' + params;
}

// Add saved item to cart
function addSavedToCart(name, price, image) {
    const cartItem = {
        name: name,
        price: price,
        image: image,
        quantity: 1
    };
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = cart.findIndex(item => item.name === name);
    
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
        showNotification(`${name} quantity updated in cart!`, 'success');
    } else {
        cart.push(cartItem);
        showNotification(`${name} added to cart!`, 'success');
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    // Prefer centralized header badge helper if present
    try { if (window.updateNavBadge) window.updateNavBadge(); else updateCartCount(); } catch (e) { try { updateCartCount(); } catch (e2) {} }
}

// Update cart count badge
function updateCartCount() {
    // Use the centralized nav badge if available (prevents duplicate badges)
    if (window.updateNavBadge) { try { window.updateNavBadge(); return; } catch (e) { /* fallback below */ } }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const cartLink = document.querySelector('nav a[data-page="cart"]');
    if (cartLink) {
        let badge = cartLink.querySelector('.cart-badge');
        if (!badge && totalItems > 0) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartLink.style.position = 'relative';
            cartLink.appendChild(badge);
        }
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
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

// Add slide-in animation keyframe
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInFromLeft {
        0% {
            opacity: 0;
            transform: translateX(-100px);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Attempt to load centralized prices manifest (optional). This is used to show
    // retail prices in saved cards when available.
    fetch('prices.json', { cache: 'no-store' }).then(r => {
        if (!r.ok) throw new Error('no prices');
        return r.json();
    }).then(j => {
        window.cachedPrices = j || {};
    }).catch(() => {
        window.cachedPrices = {};
    }).finally(() => {
        loadSavedItems();
        updateCartCount();
    });
});
