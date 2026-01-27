// Explore Page Functionality

// Prefer /api/* routes (Supabase/Vercel) but fall back to PHP (XAMPP)
function jbr7Fetch(apiUrl, phpUrl, options) {
    return fetch(apiUrl, options).then(res => {
        if (res.status === 404 || res.status === 405) return fetch(phpUrl, options);
        return res;
    }).catch(() => fetch(phpUrl, options));
}

// Product mapping to match view.html PRODUCTS array
const PRODUCT_MAP = {
    'Eco Colored Tote Bag': { id: '7', slug: 'eco-colored-tote' },
    'Riki Tall Bag': { id: '8', slug: 'riki-tall-bag' },
    'Plain Brass Cotton Back Pack': { id: '9', slug: 'plain-brass-backpack' },
    'Two Colored Brass Cotton Back Pack': { id: '10', slug: 'two-colored-backpack' },
    'Envelope Bags': { id: '11', slug: 'envelope-bag' },
    'Boys Kiddie Bag': { id: '12', slug: 'boys-kiddie-bag' },
    'Girls Kiddie Bag': { id: '13', slug: 'girls-kiddie-bag' },
    'Katrina Plain': { id: '14', slug: 'katrina-plain' },
    'Katrina Two Colors': { id: '15', slug: 'katrina-two-colors' },
    'Module Bag': { id: '16', slug: 'module-bag' },
    'Eco Jute Tote Bag': { id: '1', slug: 'eco-jute-tote' },
    'Riki Bag': { id: '4', slug: 'riki-bag' },
    'Ring Light Bag': { id: '5', slug: 'ringlight-bag' },
    'Vanity Mirror Bag': { id: '6', slug: 'vanity-mirror-bag' }
};

// Handle URL search query parameter
function handleSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const sortParam = urlParams.get('sort');
    
    // Update sort if specified (do this first so products are sorted before filtering)
    if (sortParam === 'rating') {
        const sortSelect = document.getElementById('sortFilter');
        if (sortSelect) {
            sortSelect.value = 'rating';
            // Wait a bit for DOM to be ready, then sort
            setTimeout(() => {
                if (typeof sortProducts === 'function') {
                    sortProducts();
                }
            }, 100);
        }
    }
    
    if (searchQuery) {
        // Filter products by search query
        const productCards = document.querySelectorAll('.product-card');
        const queryLower = searchQuery.toLowerCase();
        
        productCards.forEach(card => {
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const description = (card.querySelector('.product-description')?.textContent || '').toLowerCase();
            const category = (card.getAttribute('data-category') || '').toLowerCase();
            
            const matches = title.includes(queryLower) || 
                          description.includes(queryLower) || 
                          category.includes(queryLower);
            
            card.style.display = matches ? 'block' : 'none';
        });
        
        // If no matches, show message
        const visibleCards = Array.from(productCards).filter(card => card.style.display !== 'none');
        if (visibleCards.length === 0 && productCards.length > 0) {
            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                const noResultsMsg = document.createElement('div');
                noResultsMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;';
                noResultsMsg.innerHTML = `
                    <i class="fas fa-search" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                    <h3>No products found</h3>
                    <p>No products match "${searchQuery}". Try a different search term.</p>
                `;
                productsGrid.appendChild(noResultsMsg);
            }
        }
    } else if (sortParam === 'rating') {
        // Just sort by rating if no search query
        setTimeout(() => {
            if (typeof sortProducts === 'function') {
                sortProducts();
            }
        }, 100);
    }
}

// Filter products by category
function filterProducts() {
    const filterValue = document.getElementById('categoryFilter').value;
    const productCards = document.querySelectorAll('.product-card');
    
    // Get search query from URL if exists
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const queryLower = searchQuery ? searchQuery.toLowerCase() : '';
    
    productCards.forEach((card, index) => {
        const category = card.getAttribute('data-category');
        let show = false;

        if (filterValue === 'all') {
            show = true;
        } else {
            switch (filterValue) {
                case 'tote':
                    show = (category === 'jute-tote');
                    break;
                case 'backpack':
                    show = (category === 'backpack');
                    break;
                case 'envelop-module':
                    // combined envelope & module
                    show = (category === 'envelop-module');
                    break;
                case 'rvr':
                    // Riki, Vanity, Ringlight grouped
                    show = (category === 'riki' || category === 'vanity' || category === 'ringlight');
                    break;
                case 'kiddie':
                    // both boys and girls
                    show = (category === 'boys-kiddie' || category === 'girls-kiddie');
                    break;
                default:
                    show = (category === filterValue);
            }
        }

        // Also check search query if exists
        if (show && queryLower) {
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const description = (card.querySelector('.product-description')?.textContent || '').toLowerCase();
            const cardCategory = (card.getAttribute('data-category') || '').toLowerCase();
            
            const matchesSearch = title.includes(queryLower) || 
                                description.includes(queryLower) || 
                                cardCategory.includes(queryLower);
            show = matchesSearch;
        }
        
        if (show) {
            card.style.display = 'block';
            // Re-trigger animation
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = `slideInFromLeft 0.6s ease-out forwards ${index * 0.1}s`;
            }, 10);
        } else {
            card.style.display = 'none';
        }
    });
}

// Helper function to get price from card (from data-price or displayed price)
function getCardPrice(card) {
    let price = card.getAttribute('data-price');
    if (!price || isNaN(parseFloat(price))) {
        // Try to extract from displayed price
        const priceEl = card.querySelector('.price');
        if (priceEl) {
            price = priceEl.textContent.replace(/[^0-9\.]/g, '');
            if (price && !isNaN(parseFloat(price))) {
                card.setAttribute('data-price', price);
                return parseFloat(price);
            }
        }
        return 0;
    }
    return parseFloat(price);
}

// Helper function to get rating from card
function getCardRating(card) {
    const rating = card.getAttribute('data-rating');
    if (!rating || isNaN(parseFloat(rating))) {
        // Try to extract from displayed rating
        const ratingEl = card.querySelector('.rating-number');
        if (ratingEl) {
            const ratingVal = parseFloat(ratingEl.textContent);
            if (!isNaN(ratingVal)) {
                card.setAttribute('data-rating', ratingVal.toString());
                return ratingVal;
            }
        }
        return 0;
    }
    return parseFloat(rating);
}

// Helper function to get date from card
function getCardDate(card) {
    const dateStr = card.getAttribute('data-date');
    if (!dateStr) {
        // Default to today if no date
        const today = new Date();
        card.setAttribute('data-date', today.toISOString().split('T')[0]);
        return today;
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date(0) : date;
}

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sortFilter').value;
    const productsGrid = document.getElementById('productsGrid');
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    
    // Store original order for "featured" option
    if (!productsGrid.originalOrder) {
        productsGrid.originalOrder = [...productCards];
    }
    
    let sortedCards = [...productCards];
    
    switch(sortValue) {
        case 'price-low':
            sortedCards.sort((a, b) => {
                return getCardPrice(a) - getCardPrice(b);
            });
            break;
        case 'price-high':
            sortedCards.sort((a, b) => {
                return getCardPrice(b) - getCardPrice(a);
            });
            break;
        case 'rating':
            sortedCards.sort((a, b) => {
                const ratingA = getCardRating(a);
                const ratingB = getCardRating(b);
                if (ratingB !== ratingA) {
                    return ratingB - ratingA;
                }
                // If ratings are equal, sort by review count
                const countA = parseInt(a.getAttribute('data-review-count') || '0');
                const countB = parseInt(b.getAttribute('data-review-count') || '0');
                return countB - countA;
            });
            break;
        case 'newest':
            sortedCards.sort((a, b) => {
                return getCardDate(b) - getCardDate(a);
            });
            break;
        default:
            // Featured - restore original order
            sortedCards = [...productsGrid.originalOrder];
            break;
    }
    
    // Clear and re-append in new order
    productsGrid.innerHTML = '';
    sortedCards.forEach((card, index) => {
        productsGrid.appendChild(card);
        // Re-trigger animation with new delay
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = `slideInFromLeft 0.6s ease-out forwards ${index * 0.1}s`;
        }, 10);
    });
}

// Toggle save/bookmark
function toggleSave(button) {
    button.classList.toggle('saved');
    
    const productCard = button.closest('.product-card');
    const productName = productCard.querySelector('h3').textContent;
    const productPriceEl = productCard.querySelector('.price');
    // store numeric price (no currency symbol) so other pages can parse it reliably
    const productPrice = productPriceEl ? productPriceEl.textContent.replace(/[^0-9\.]/g,'') : '';
    const productImageEl = productCard.querySelector('.product-image img');
    const productImage = productImageEl ? (productImageEl.getAttribute('src') || productImageEl.src) : '';

    if (button.classList.contains('saved')) {
        showNotification(`${productName} saved to your collection!`, 'success');

        // Store rich object in localStorage (backwards compatible with older string entries)
        let savedItems = JSON.parse(localStorage.getItem('savedBags') || '[]');
        const exists = savedItems.some(s => (typeof s === 'string' && s === productName) || (s && s.name === productName));
        if (!exists) {
            savedItems.push({ name: productName, price: productPrice, image: productImage });
            localStorage.setItem('savedBags', JSON.stringify(savedItems));
        }

        // Try server save for authenticated users. If not authenticated, server returns 401 and we silently keep localStorage.
        try {
            const payload = { title: productName, image: productImage, price: productPrice };
            jbr7Fetch('/api/save_item', '/jbr7php/save_item.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(res => {
                if (res.status === 401) {
                    // not authenticated; nothing to do (localStorage used)
                    return;
                }
                return res.json();
            }).then(json => {
                // If needed, could update UI based on server response
            }).catch(e => {
                console.warn('Server save failed', e);
            });
        } catch (e) { console.warn('Save request failed', e); }
    } else {
        showNotification(`${productName} removed from saved items`, 'info');

        // Remove by name (supports both string and object entries)
        let savedItems = JSON.parse(localStorage.getItem('savedBags') || '[]');
        savedItems = savedItems.filter(item => {
            if (typeof item === 'string') return item !== productName;
            if (item && typeof item === 'object') return item.name !== productName;
            return true;
        });
        localStorage.setItem('savedBags', JSON.stringify(savedItems));

        // Try server-side removal
        try {
            const payload = { title: productName };
            jbr7Fetch('/api/delete_saved_item', '/jbr7php/delete_saved_item.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(res => {
                if (res.status === 401) return; // not authenticated
                return res.json();
            }).then(json => {
                // optionally update UI
            }).catch(e => console.warn('Server remove failed', e));
        } catch (e) { console.warn('Remove request failed', e); }
    }
}

// Add to cart - NOW USES PRODUCT ID/SLUG
function addToCart(button) {
    const productCard = button.closest('.product-card');
    if (!productCard) return;
    
    const titleEl = productCard.querySelector('h3');
    const title = titleEl ? titleEl.textContent.trim() : '';
    
    // Look up the product ID from the map
    const productInfo = PRODUCT_MAP[title];
    
    if (productInfo) {
        // Use ID or slug to link to view page
        window.location.href = `view.html?id=${productInfo.id}&from=explore`;
    } else {
        // Fallback to old method if product not in map
        const priceEl = productCard.querySelector('.price');
        const imgEl = productCard.querySelector('.product-image img');
        const price = priceEl ? priceEl.textContent.replace(/[^0-9\.]/g,'') : '';
        const img = imgEl ? (imgEl.getAttribute('src') || imgEl.src) : '';
        const descEl = productCard.querySelector('.product-description');
        const desc = descEl ? descEl.textContent.trim().slice(0,300) : '';
        
        const q = `view.html?title=${encodeURIComponent(title)}&price=${encodeURIComponent(price)}&img=${encodeURIComponent(img)}&desc=${encodeURIComponent(desc)}&from=explore`;
        window.location.href = q;
    }
}

// Update cart count badge
function updateCartCount() {
    // Prefer the centralized header badge helper when available to avoid duplicates
    if (window.updateNavBadge) {
        try { window.updateNavBadge(); return; } catch (e) { /* ignore and fallback */ }
    }

    // Use user-specific storage - REQUIRED for data isolation
    if (typeof UserStorage === 'undefined' || !UserStorage) {
        console.error('UserStorage not available!');
        return;
    }
    
    const raw = UserStorage.getItem('cart');
    const cart = JSON.parse(raw || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Fallback: add a simple badge if the global helper isn't present
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
    // Remove existing notification
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
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Load saved items on page load
function loadSavedStates() {
    const savedItems = JSON.parse(localStorage.getItem('savedBags') || '[]');
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent;
        const saveBtn = card.querySelector('.save-btn');
        const isSaved = savedItems.some(s => (typeof s === 'string' && s === productName) || (s && s.name === productName));
        if (isSaved) {
            saveBtn.classList.add('saved');
        }
    });
}

// Initialize data attributes from displayed values
function initializeDataAttributes() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        // Initialize data-price from displayed price if missing
        if (!card.getAttribute('data-price') || isNaN(parseFloat(card.getAttribute('data-price')))) {
            const priceEl = card.querySelector('.price');
            if (priceEl) {
                const price = priceEl.textContent.replace(/[^0-9\.]/g, '');
                if (price && !isNaN(parseFloat(price))) {
                    card.setAttribute('data-price', price);
                }
            }
        }
        
        // Initialize data-rating from displayed rating if missing
        if (!card.getAttribute('data-rating') || isNaN(parseFloat(card.getAttribute('data-rating')))) {
            const ratingEl = card.querySelector('.rating-number');
            if (ratingEl) {
                const rating = parseFloat(ratingEl.textContent);
                if (!isNaN(rating)) {
                    card.setAttribute('data-rating', rating.toString());
                }
            }
        }
        
        // Initialize data-date if missing (default to today)
        if (!card.getAttribute('data-date')) {
            const today = new Date();
            card.setAttribute('data-date', today.toISOString().split('T')[0]);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize data attributes first
    initializeDataAttributes();
    
    // Load centralized prices (if available) and then restore saved states
    loadPrices().then(() => {
        loadSavedStates();
        updateCartCount();
    }).catch(() => {
        // If prices.json is missing or fails, continue with existing values
        loadSavedStates();
        updateCartCount();
    });
    updateCartCount();
    
    // Handle search query from URL
    handleSearchQuery();
    
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Load prices.json and apply retail prices to product cards when available
async function loadPrices() {
    try {
        const res = await fetch('prices.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('prices.json not found');
        const prices = await res.json();

        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const titleEl = card.querySelector('h3');
            if (!titleEl) return;
            const name = titleEl.textContent.trim();
            const entry = prices[name];
            if (entry && Number(entry.retail) === entry.retail) {
                // Set displayed price and numeric data-price for sorting
                const priceSpan = card.querySelector('.price');
                if (priceSpan) priceSpan.textContent = `₱${Number(entry.retail).toFixed(2)}`;
                card.setAttribute('data-price', String(Number(entry.retail)));
            } else {
                // Ensure data-price is set even if not in prices.json
                const currentPrice = card.getAttribute('data-price');
                if (!currentPrice || isNaN(parseFloat(currentPrice))) {
                    const priceEl = card.querySelector('.price');
                    if (priceEl) {
                        const price = priceEl.textContent.replace(/[^0-9\.]/g, '');
                        if (price && !isNaN(parseFloat(price))) {
                            card.setAttribute('data-price', price);
                        }
                    }
                }
            }
        });

    } catch (e) {
        // silent failure is OK — prices.json optional
        // Ensure all cards have data-price set from displayed prices
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const currentPrice = card.getAttribute('data-price');
            if (!currentPrice || isNaN(parseFloat(currentPrice))) {
                const priceEl = card.querySelector('.price');
                if (priceEl) {
                    const price = priceEl.textContent.replace(/[^0-9\.]/g, '');
                    if (price && !isNaN(parseFloat(price))) {
                        card.setAttribute('data-price', price);
                    }
                }
            }
        });
        console.warn('prices.json load failed:', e.message || e);
        throw e;
    }
}

// Add styles for notification
const notificationStyles = document.createElement('style');
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
    
    /* cart-badge styling removed in favor of centralized .nav-badge in home.css */
`;
document.head.appendChild(notificationStyles);