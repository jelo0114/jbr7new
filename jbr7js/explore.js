// Explore Page Functionality

// Map API category to explore filter data-category
function mapCategoryToDataCategory(category) {
  if (!category) return 'other';
  const c = String(category).toLowerCase();
  if (c.includes('tote') || c.includes('jute') || c.includes('katsa')) return 'jute-tote';
  if (c.includes('backpack')) return 'backpack';
  if (c.includes('envelop') || c.includes('module')) return 'envelop-module';
  if (c.includes('riki')) return 'riki';
  if (c.includes('vanity')) return 'vanity';
  if (c.includes('ringlight') || c.includes('ring light')) return 'ringlight';
  if (c.includes('boys') && c.includes('kiddie')) return 'boys-kiddie';
  if (c.includes('girls') && c.includes('kiddie')) return 'girls-kiddie';
  if (c.includes('kiddie')) return 'boys-kiddie';
  return c.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '') || 'other';
}

// Build star HTML for rating (0-5)
function buildStarsHtml(rating) {
  const r = Math.min(5, Math.max(0, parseFloat(rating) || 0));
  const full = Math.floor(r);
  const hasHalf = (r % 1) >= 0.5;
  let html = '';
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (hasHalf) html += '<i class="fas fa-star-half-alt"></i>';
  for (let i = full + (hasHalf ? 1 : 0); i < 5; i++) html += '<i class="far fa-star"></i>';
  return html;
}

// Load all items from API (tracks all items; supports sort=rating for highest ratings)
function loadItemsFromAPI() {
  const urlParams = new URLSearchParams(window.location.search);
  const sortParam = urlParams.get('sort') || '';
  const sortQuery = sortParam === 'rating' || sortParam === 'price-low' || sortParam === 'price-high' || sortParam === 'newest' ? sortParam : '';

  const apiUrl = '/api/get?action=items' + (sortQuery ? '&sort=' + encodeURIComponent(sortQuery) : '');
  return fetch(apiUrl, { credentials: 'same-origin' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success || !Array.isArray(data.data)) return null;
      return data.data;
    })
    .catch(function () { return null; });
}

// Render product grid from API items (replaces static cards so we track all items)
function renderProductsGrid(items) {
  const grid = document.getElementById('productsGrid');
  if (!grid || !items || items.length === 0) return;

  const dateStr = function (d) {
    if (!d) return new Date().toISOString().slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  };
  const escape = function (s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  grid.innerHTML = items.map(function (item) {
    const title = escape(item.title);
    const desc = escape((item.description || '').slice(0, 200));
    const img = escape(item.image || 'totebag.avif');
    const price = (parseFloat(item.price) || 0).toFixed(2);
    const rating = Math.min(5, Math.max(0, parseFloat(item.rating) || 0));
    const reviewCount = parseInt(item.review_count, 10) || 0;
    const dataCategory = mapCategoryToDataCategory(item.category);
    const stars = buildStarsHtml(rating);
    const reviewText = reviewCount === 0 ? '(0 reviews)' : reviewCount === 1 ? '(1 review)' : '(' + reviewCount + ' reviews)';
    const percentVal = Math.round((rating / 5) * 100);
    const percentDisplay = percentVal + '%';
    const viewUrl = 'view.html?title=' + encodeURIComponent(item.title) + '&from=explore';
    const safeHref = viewUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return (
      '<div class="product-card" data-category="' + dataCategory + '" data-price="' + price + '" data-rating="' + rating + '" data-date="' + dateStr(item.created_at) + '" data-href="' + safeHref + '" data-review-count="' + reviewCount + '">' +
        '<div class="product-image">' +
          '<img src="' + img + '" alt="' + title + '" onerror="this.src=\'totebag.avif\'">' +
          '<button class="save-btn" onclick="toggleSave(this)"><i class="far fa-bookmark"></i></button>' +
        '</div>' +
        '<div class="product-info">' +
          '<h3>' + title + '</h3>' +
          '<p class="product-description">' + (desc ? desc : '') + '</p>' +
          '<div class="rating">' +
            stars +
            '<span class="rating-number">' + rating.toFixed(1) + '</span>' +
            '<span class="review-count">' + reviewText + '</span>' +
            '<span class="rating-percentage" style="margin-left:0.5rem;color:#6b7280;font-size:0.85rem;font-weight:500;">' + percentDisplay + '</span>' +
          '</div>' +
          '<div class="product-footer"><span class="price">₱' + price + '</span></div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  grid.originalOrder = Array.from(grid.querySelectorAll('.product-card'));
}

// Fetch real review data from API for each product card and update rating, review count, percentage
function fetchAndUpdateCardRatings() {
  var grid = document.getElementById('productsGrid');
  if (!grid) return;
  var cards = grid.querySelectorAll('.product-card');
  var fetchFn = typeof window.apiFetch === 'function' ? window.apiFetch : fetch;

  function updateCardWithSummary(card, productTitle, summary) {
    var total = summary && typeof summary.total === 'number' ? summary.total : 0;
    var average = summary && typeof summary.average === 'number' ? summary.average : 0;
    var clampedRating = Math.max(0, Math.min(5, average));

    var ratingEl = card.querySelector('.rating-number');
    var reviewCountEl = card.querySelector('.review-count');
    var ratingPercentageEl = card.querySelector('.rating-percentage');
    var starsContainer = card.querySelector('.rating');

    if (ratingEl) {
      ratingEl.textContent = average > 0 ? average.toFixed(1) : '0.0';
      card.setAttribute('data-rating', clampedRating.toString());
    }
    if (reviewCountEl) {
      if (total === 0) reviewCountEl.textContent = '(0 reviews)';
      else if (total === 1) reviewCountEl.textContent = '(1 review)';
      else reviewCountEl.textContent = '(' + total + ' reviews)';
      card.setAttribute('data-review-count', String(total));
    }
    if (ratingPercentageEl) {
      ratingPercentageEl.textContent = Math.round((clampedRating / 5) * 100) + '%';
      ratingPercentageEl.style.display = 'inline';
    }
    if (starsContainer) {
      var stars = starsContainer.querySelectorAll('i');
      var fullStars = Math.floor(clampedRating);
      var hasHalfStar = (clampedRating % 1) >= 0.5;
      stars.forEach(function(star, index) {
        if (index < fullStars) star.className = 'fas fa-star';
        else if (index === fullStars && hasHalfStar) star.className = 'fas fa-star-half-alt';
        else star.className = 'far fa-star';
      });
    }
  }

  cards.forEach(function(card) {
    var titleEl = card.querySelector('h3');
    if (!titleEl) return;
    var productTitle = (titleEl.textContent || '').trim();
    if (!productTitle) return;

    fetchFn('/api/get_product_reviews?product=' + encodeURIComponent(productTitle), { credentials: 'same-origin' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var summary = (data && data.summary) ? data.summary : { total: 0, average: 0 };
        updateCardWithSummary(card, productTitle, summary);
      })
      .catch(function() {
        updateCardWithSummary(card, productTitle, { total: 0, average: 0 });
      });
  });
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
    'Ringlight Bag': { id: '5', slug: 'ringlight-bag' },
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
            fetch('/jbr7php/save_item.php', {
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
            fetch('/jbr7php/delete_saved_item.php', {
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

// Attach fallback image when product image fails to load (e.g. 404 on Vercel)
function attachProductImageFallbacks() {
    const fallbackSrc = 'totebag.avif';
    document.querySelectorAll('.product-card .product-image img').forEach(function(img) {
        if (img.dataset.fallbackAttached) return;
        img.dataset.fallbackAttached = '1';
        img.onerror = function() {
            this.onerror = null;
            if (this.src !== fallbackSrc) this.src = fallbackSrc;
        };
    });
}

// Initialize on page load — load all items from API (track all items; highest ratings when sort=rating)
document.addEventListener('DOMContentLoaded', function() {
    attachProductImageFallbacks();

    loadItemsFromAPI().then(function(items) {
        if (items && items.length > 0) {
            renderProductsGrid(items);
            fetchAndUpdateCardRatings();
            var sortParam = new URLSearchParams(window.location.search).get('sort');
            var sortSelect = document.getElementById('sortFilter');
            if (sortSelect && (sortParam === 'rating' || sortParam === 'price-low' || sortParam === 'price-high' || sortParam === 'newest')) {
                sortSelect.value = sortParam;
            }
            if (typeof initializeDataAttributes === 'function') initializeDataAttributes();
            loadSavedStates();
            updateCartCount();
            handleSearchQuery();
        } else {
            initializeDataAttributes();
            loadPrices().then(function() {
                loadSavedStates();
                updateCartCount();
            }).catch(function() {
                loadSavedStates();
                updateCartCount();
            });
            updateCartCount();
            handleSearchQuery();
        }
    }).catch(function() {
        initializeDataAttributes();
        loadPrices().then(function() {
            loadSavedStates();
            updateCartCount();
        }).catch(function() {
            loadSavedStates();
            updateCartCount();
        });
        updateCartCount();
        handleSearchQuery();
    });

    // Click on product card (except save button) goes to product view
    var productsGridEl = document.getElementById('productsGrid');
    if (productsGridEl) {
        productsGridEl.addEventListener('click', function(e) {
            if (e.target.closest('.save-btn')) return;
            var card = e.target.closest('.product-card');
            if (card) {
                var href = card.getAttribute('data-href');
                if (href) window.location.href = href;
            }
        });
    }

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