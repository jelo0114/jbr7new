// Explore Page Functionality

// Filter products by category
function filterProducts() {
    const filterValue = document.getElementById('categoryFilter').value;
    const productCards = document.querySelectorAll('.product-card');
    
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

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sortFilter').value;
    const productsGrid = document.getElementById('productsGrid');
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    
    let sortedCards = [...productCards];
    
    switch(sortValue) {
        case 'price-low':
            sortedCards.sort((a, b) => {
                return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
            });
            break;
        case 'price-high':
            sortedCards.sort((a, b) => {
                return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
            });
            break;
        case 'rating':
            sortedCards.sort((a, b) => {
                return parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating'));
            });
            break;
        case 'newest':
            sortedCards.sort((a, b) => {
                return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
            });
            break;
        default:
            // Featured - original order
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
    }
}

// Add to cart
function addToCart(button) {
    // Instead of adding directly to cart from Explore, redirect user to the product view page
    // so the single Add to Cart flow (on view.html) is used.
    const productCard = button.closest('.product-card');
    if (!productCard) return;
    const titleEl = productCard.querySelector('h3');
    const priceEl = productCard.querySelector('.price');
    const imgEl = productCard.querySelector('.product-image img');

    const title = titleEl ? titleEl.textContent.trim() : '';
    const price = priceEl ? priceEl.textContent.replace(/[^0-9\.]/g,'') : '';
    // prefer attribute src (may be relative) so view.html can resolve folder names
    const img = imgEl ? (imgEl.getAttribute('src') || imgEl.src) : '';
    const descEl = productCard.querySelector('.product-description');
    const desc = descEl ? descEl.textContent.trim().slice(0,300) : '';

    const q = `view.html?title=${encodeURIComponent(title)}&price=${encodeURIComponent(price)}&img=${encodeURIComponent(img)}&desc=${encodeURIComponent(desc)}&from=explore`;
    window.location.href = q;
}

// Update cart count badge
function updateCartCount() {
    // Prefer the centralized header badge helper when available to avoid duplicates
    if (window.updateNavBadge) {
        try { window.updateNavBadge(); return; } catch (e) { /* ignore and fallback */ }
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
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
            }
        });

    } catch (e) {
        // silent failure is OK — prices.json optional
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

