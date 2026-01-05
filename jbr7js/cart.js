// Cart Page Functionality

let cartItems = [];

// Optional color surcharge mapping (amount added to base price when a specific color is chosen)
// Leave empty or set entries like: { 'Red': 5, 'Sky Blue': 10 }
const COLOR_PRICE_ADJUST = {
    // 'Red': 0,
};
// Size-to-price mapping for Eco Jute Tote (used when editing size in cart)
const TOTE_SIZE_PRICES = {
    '8 x 10': 35,
    '10 x 12': 45,
    '13 x 15': 50,
    '14 x 16': 55
};
// Prices when the tote is a colored variant (user-provided)
const COLORED_TOTE_SIZE_PRICES = {
    '8 x 10': 38,
    '10 x 12': 43,
    '13 x 15': 57,
    '14 x 16': 65
};
// Vanity / Mirror bag sizes and prices (from spreadsheet)
const VANITY_SIZE_PRICES = {
    '14 x 14': 400,
    '14 x 16': 400,
    '16 x 19': 450,
    '17 x 22': 470,
    '19 x 22': 470,
    '20 x 24': 550,
    '21 x 28': 650
};
// Ring Light bag sizes/prices — updated per user: only two sizes
const RINGLIGHT_SIZE_PRICES = {
    '18 x 21': 500,
    '22 x 22': 550
};

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    renderCart();
    updateSummary();
});

// Load cart from localStorage
function loadCartFromStorage() {
    cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    // ensure selected flag exists
    cartItems = cartItems.map(item => {
        const priceNum = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        return {
            ...item,
            selected: !!item.selected,
            selectedColor: item.selectedColor || '',
            // canonical basePrice is used for size-driven price; color adjustments are applied on top
            basePrice: typeof item.basePrice !== 'undefined' ? Number(item.basePrice) : priceNum
        };
    });
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    // update header badge if present
    try { if (window.updateNavBadge) window.updateNavBadge(); } catch (e) { /* ignore */ }
}

// Render cart items
function renderCart() {
    const cartContainer = document.getElementById('cart-items-container');
    
    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Add some items to get started!</p>
                <a href="explore.html" class="continue-shopping" onclick="goToExplore()">
                    <i class="fas fa-compass"></i> Explore Products
                </a>
            </div>
        `;
        return;
    }

    let html = '';
    for (let index = 0; index < cartItems.length; index++) {
        const item = cartItems[index];
        let priceNum = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        let lineTotal = (priceNum * item.quantity).toFixed(2);
    // show customizations (size will be editable inside the options box)
    const customBadges = [];
    if (item.customizations && item.customizations.length) customBadges.push(...item.customizations.map(c => `<span class="custom-badge">${c}</span>`));
    const customs = customBadges.length ? customBadges.join('') : '<span class="custom-badge">Standard</span>';
        const titleEnc = encodeURIComponent(item.name || 'Product');
        const priceEnc = encodeURIComponent(priceNum.toString());
        const imgEnc = encodeURIComponent(item.image || '');
        const descEnc = encodeURIComponent('Quality crafted bag');
        const viewUrl = `view.html?title=${titleEnc}&price=${priceEnc}&img=${imgEnc}&desc=${descEnc}&from=cart`;
        // Build options panel for Eco Jute Colored Tote Bag
        let optionsHtml = '';
        const isColoredTote = (item.name || '').toLowerCase().includes('eco jute colored') || (item.name || '').toLowerCase().includes('colored tote');
    if (isColoredTote) {
            // colors list provided by user
            const colors = [
                'White','Black','Red','Pink','Sky Blue','Navy Blue','Royal Blue','Beige','Cream',
                'Orange','Olive Green','Emerald Green','Yellow','Charcoal Gray','Lavender','Maroon','Mint Green'
            ];
            // selected color value
            const selectedColor = item.selectedColor || '';

            let colorButtons = '';
            colors.forEach(c => {
                const safeVal = c.replace(/"/g, '&quot;');
                const checked = selectedColor === c ? 'checked' : '';
                // call a small handler so we can update the preview image and price cleanly
                colorButtons += `<label class="color-option"><input type="radio" name="color-${index}" value="${safeVal}" ${checked} onchange="onCartColorChange(${index}, '${safeVal}')"> <span>${c}</span></label>`;
            });

            // If no color selected, default to White (per requirement)
            if (!item.selectedColor) {
                cartItems[index].selectedColor = 'White';
            }

            // If no color selected, default to White (per requirement)
            if (!item.selectedColor) {
                cartItems[index].selectedColor = 'White';
            }

            // build size selector (size inside the options box)
            const selColorNorm = (cartItems[index].selectedColor || '').toLowerCase();
            const isColoredSelection = selColorNorm && !(/^(white|black)$/i.test(selColorNorm));
            const priceMapForSizes = isColoredSelection ? COLORED_TOTE_SIZE_PRICES : TOTE_SIZE_PRICES;
            const sizeOptions = Object.keys(priceMapForSizes).map(s => {
                const selected = item.size === s ? 'selected' : '';
                return `<option value="${s}" ${selected}>${s} — ₱${priceMapForSizes[s]}</option>`;
            }).join('');

            optionsHtml = `
                <div class="cart-item-options" id="item-options-${index}" style="display:${item.selected ? 'block' : 'none'};margin-top:0.75rem;padding:0.75rem;border:1px dashed #e6e6e6;border-radius:8px;background:#fafafa">
                    <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
                        <div style="min-width:160px">
                            <img id="item-color-preview-${index}" src="Tote Bag/Colored.png" alt="Tote preview" style="width:160px;height:auto;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,0.06)" onerror="this.onerror=null;this.src='Tote Bag/White.jpg'">
                            <div style="font-size:0.9rem;color:#666;margin-top:0.5rem">Choose size and color below</div>
                        </div>
                        <div style="flex:1;min-width:160px">
                            <div style="margin-bottom:0.5rem;font-weight:700">Available Colors</div>
                            <div class="color-options-list" style="display:flex;flex-wrap:wrap;gap:0.5rem">${colorButtons}</div>
                        </div>
                        <div style="min-width:180px">
                            <div style="margin-bottom:0.5rem;font-weight:700">Size</div>
                            <select onchange="setCartItemOption(${index}, 'size', this.value)" style="padding:0.6rem;border-radius:8px;border:1px solid #ddd;width:100%">
                                <option value="">-- Select size --</option>
                                ${sizeOptions}
                            </select>
                            <div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${item.size || 'Standard'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

    // Vanity / Mirror bag: same size-based logic as totes but with its own sizes/prices
    const nameLower = (item.name || '').toLowerCase();
    const isVanity = nameLower.includes('vanity') || nameLower.includes('mirror');
    if (!optionsHtml && isVanity) {
            // build size selector for vanity bag
            const vanitySizeOptions = Object.keys(VANITY_SIZE_PRICES).map(s => {
                const selected = item.size === s ? 'selected' : '';
                return `<option value="${s}" ${selected}>${s} — ₱${VANITY_SIZE_PRICES[s]}</option>`;
            }).join('');

            optionsHtml = `
                <div class="cart-item-options" id="item-options-${index}" style="display:${item.selected ? 'block' : 'none'};margin-top:0.75rem;padding:0.75rem;border:1px dashed #e6e6e6;border-radius:8px;background:#fafafa">
                    <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
                        <div style="flex:1;min-width:160px">
                            <div style="margin-bottom:0.5rem;font-weight:700">Size</div>
                            <select onchange="setCartItemOption(${index}, 'size', this.value)" style="padding:0.6rem;border-radius:8px;border:1px solid #ddd;width:100%">
                                <option value="">-- Select size --</option>
                                ${vanitySizeOptions}
                            </select>
                            <div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${item.size || 'Standard'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Ring Light bag: similar size selection if product is a ring light bag
        const isRinglight = nameLower.includes('ring') || nameLower.includes('ring light') || nameLower.includes('ringlight');
        if (!optionsHtml && isRinglight) {
            const ringSizeOptions = Object.keys(RINGLIGHT_SIZE_PRICES).map(s => {
                const selected = item.size === s ? 'selected' : '';
                return `<option value="${s}" ${selected}>${s} — ₱${RINGLIGHT_SIZE_PRICES[s]}</option>`;
            }).join('');

            optionsHtml = `
                <div class="cart-item-options" id="item-options-${index}" style="display:${item.selected ? 'block' : 'none'};margin-top:0.75rem;padding:0.75rem;border:1px dashed #e6e6e6;border-radius:8px;background:#fafafa">
                    <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
                        <div style="flex:1;min-width:160px">
                            <div style="margin-bottom:0.5rem;font-weight:700">Size</div>
                            <select onchange="setCartItemOption(${index}, 'size', this.value)" style="padding:0.6rem;border-radius:8px;border:1px solid #ddd;width:100%">
                                <option value="">-- Select size --</option>
                                ${ringSizeOptions}
                            </select>
                            <div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${item.size || 'Standard'}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Recompute effective price to respect color/size rules (White/Black = default prices)
        if (isColoredTote) {
            const selColor = (cartItems[index].selectedColor || '').toLowerCase();
            const isColoredSelection = selColor && !(/^(white|black)$/i.test(selColor));
            const priceMap = isColoredSelection ? COLORED_TOTE_SIZE_PRICES : TOTE_SIZE_PRICES;
            const sizeKey = cartItems[index].size || '';
            if (sizeKey && priceMap[sizeKey]) {
                priceNum = Number(priceMap[sizeKey]);
                cartItems[index].price = priceNum;
                cartItems[index].basePrice = priceNum;
            }
            lineTotal = (priceNum * item.quantity).toFixed(2);
        }

        html += `
        <div class="cart-item" data-index="${index}">
            <input type="checkbox" class="cart-select" data-index="${index}" ${item.selected ? 'checked' : ''} onchange="toggleSelect(${index}, this.checked)">
            <img src="${item.image}" alt="${item.name}" class="item-image" onerror="this.src='https://www.sourceforthegoose.com/cdn/shop/files/Scallop-top-jute-tote.jpg?v=1713019103&width=1080'">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-description">Quality crafted bag</div>
                <div class="item-customization">
                    ${customs}
                </div>
                ${optionsHtml}
            </div>
            <div class="item-actions">
                <div class="item-price">₱${lineTotal}</div>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <a class="view-btn" href="${viewUrl}">View</a>
                <i class="fas fa-trash remove-btn" onclick="removeItem(${index})"></i>
            </div>
        </div>
        `;
    }
    cartContainer.innerHTML = html;
    // Initialize preview images (set correct src based on selectedColor and add fallbacks)
    initCartPreviews();
}

// Handler when a color radio is changed in the cart options
function onCartColorChange(index, color) {
    if (index < 0 || index >= cartItems.length) return;
    const folder = 'Tote Bag';
    // set the selectedColor and attempt to set the main image to the color preview
    cartItems[index].selectedColor = color;
    // prefer PNG variant for color images; this is a best-effort path
    cartItems[index].image = `${folder}/${color}.png`;
    // apply any color-based price adjustments via the standard setter
    setCartItemOption(index, 'selectedColor', color);
}

// Try to set preview images for tote color previews with graceful fallback
function initCartPreviews() {
    const exts = ['png', 'jpg', 'jpeg', 'avif', 'webp'];
    const folder = 'Tote Bag';

    cartItems.forEach((item, index) => {
        const el = document.getElementById(`item-color-preview-${index}`);
        if (!el) return;
        const color = item.selectedColor || '';
        const candidates = [];
        if (color) {
            exts.forEach(ext => candidates.push(`${folder}/${color}.${ext}`));
            // also try lowercase / hyphen variants
            const slug = color.toLowerCase().replace(/\s+/g, '-');
            exts.forEach(ext => candidates.push(`${folder}/${slug}.${ext}`));
        }
        // fallback candidates
        candidates.push(`${folder}/White.jpg`);
        candidates.push(`${folder}/Colored.png`);
        // attempt to set the first candidate and cascade via onerror
        let i = 0;
        function tryNext() {
            if (i >= candidates.length) return;
            el.onerror = function() {
                i++;
                tryNext();
            };
            el.src = candidates[i];
        }
        tryNext();
    });
}

// Toggle selection for a cart item
function toggleSelect(index, checked) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems[index].selected = !!checked;
    // save selection state (optional persistence)
    saveCartToStorage();
    renderCart();
    updateSummary();
}

// Toggle visibility of the options panel for a cart item (used after render)
function showItemOptions(index, show) {
    const el = document.getElementById(`item-options-${index}`);
    if (el) el.style.display = show ? 'block' : 'none';
}

// Set an option (color/size) for a cart item and persist
function setCartItemOption(index, key, value) {
    if (index < 0 || index >= cartItems.length) return;
    // handle size selection specially for the colored tote so price updates
    if (key === 'size') {
        const sizeLabel = value || '';
        cartItems[index].size = sizeLabel;
        // choose appropriate mapping based on product type
        const name = (cartItems[index].name || '').toLowerCase();
        if (sizeLabel) {
            if (name.includes('vanity') || name.includes('mirror')) {
                if (VANITY_SIZE_PRICES[sizeLabel]) cartItems[index].price = Number(VANITY_SIZE_PRICES[sizeLabel]);
            } else if (name.includes('ring') || name.includes('ring light') || name.includes('ringlight')) {
                if (RINGLIGHT_SIZE_PRICES[sizeLabel]) cartItems[index].price = Number(RINGLIGHT_SIZE_PRICES[sizeLabel]);
            } else {
                // For colored tote: if selected color is not White/Black, use colored prices mapping
                const selColor = (cartItems[index].selectedColor || '').toLowerCase();
                const isColoredSelection = selColor && !(/^(white|black)$/i.test(selColor));
                const priceMap = isColoredSelection ? COLORED_TOTE_SIZE_PRICES : TOTE_SIZE_PRICES;
                if (priceMap[sizeLabel]) {
                    cartItems[index].price = Number(priceMap[sizeLabel]);
                    // update canonical basePrice so any further adjustments apply relative to this
                    cartItems[index].basePrice = Number(priceMap[sizeLabel]);
                }
            }
        }
    } else {
        cartItems[index][key] = value;
        // if selectedColor changed, and item already has a size selected, recompute price using the rules:
        if (key === 'selectedColor') {
            const colorVal = (value || '').toLowerCase();
            const sizeVal = cartItems[index].size || '';
            const isColored = colorVal && !(/^(white|black)$/i.test(colorVal));
            const priceMap2 = isColored ? COLORED_TOTE_SIZE_PRICES : TOTE_SIZE_PRICES;
            if (sizeVal) {
                if (priceMap2[sizeVal]) {
                    cartItems[index].price = Number(priceMap2[sizeVal]);
                    cartItems[index].basePrice = Number(priceMap2[sizeVal]);
                }
            } else {
                // No size selected yet — show the smallest/first size price as a preview so the display reflects the price change
                const keys = Object.keys(priceMap2);
                if (keys.length) {
                    const first = keys[0];
                    cartItems[index].price = Number(priceMap2[first]);
                    cartItems[index].basePrice = Number(priceMap2[first]);
                }
            }
        }
    }

    saveCartToStorage();
    // re-render and update summary
    renderCart();
    updateSummary();
    showNotification('Selection saved', 'success');
}

// Update item quantity
function updateQuantity(index, change) {
    if (index < 0 || index >= cartItems.length) return;
    
    cartItems[index].quantity += change;
    
    if (cartItems[index].quantity <= 0) {
        removeItem(index);
    } else {
        saveCartToStorage();
        renderCart();
        updateSummary();
        showNotification(`Quantity updated for ${cartItems[index].name}`, 'info');
    }
}

// Remove item from cart
function removeItem(index) {
    if (index < 0 || index >= cartItems.length) return;
    
    const itemName = cartItems[index].name;
    cartItems.splice(index, 1);
    
    saveCartToStorage();
    renderCart();
    updateSummary();
    showNotification(`${itemName} removed from cart`, 'info');
}

// Clear entire cart
function clearCart() {
    if (cartItems.length === 0) {
        showNotification('Cart is already empty', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear your entire cart?')) {
        cartItems = [];
        saveCartToStorage();
        renderCart();
        updateSummary();
        showNotification('Cart cleared successfully', 'success');
    }
}

// Update cart summary
function updateSummary() {
    // if any items are selected, only sum selected items; otherwise sum all items
    const anySelected = cartItems.some(it => !!it.selected);
    const subtotal = cartItems.reduce((sum, item) => {
        const price = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        if (anySelected && !item.selected) return sum;
        return sum + (price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `₱${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
    
    // Update item count (number of selected items if any selected, otherwise total quantity)
    const itemCount = (() => {
        const any = cartItems.some(it => !!it.selected);
        if (any) return cartItems.reduce((sum, item) => item.selected ? sum + item.quantity : sum, 0);
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    })();
    document.getElementById('item-count').textContent = itemCount;
}

// Apply promo code
function applyPromoCode() {
    const promoInput = document.getElementById('promo-input');
    const promoCode = promoInput.value.trim().toUpperCase();
    
    if (promoCode === '') {
        showNotification('Please enter a promo code', 'info');
        return;
    }
    
    // Define valid promo codes
    const promoCodes = {
        'JBR10': { type: 'percentage', value: 10, message: '10% discount applied!' },
        'FREESHIP': { type: 'shipping', value: 0, message: 'Free shipping applied!' },
        'SAVE20': { type: 'percentage', value: 20, message: '20% discount applied!' },
        'WELCOME15': { type: 'percentage', value: 15, message: '15% welcome discount applied!' }
    };
    
    if (promoCodes[promoCode]) {
        showNotification(promoCodes[promoCode].message, 'success');
        // Store promo code in localStorage for checkout
        localStorage.setItem('appliedPromo', promoCode);
        promoInput.value = '';
        // You can add discount calculation logic here
    } else {
        showNotification('Invalid promo code. Try JBR10 or FREESHIP', 'info');
    }
}

// Checkout function
function checkout() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty! Add items before checkout.', 'info');
        return;
    }
    
    // Get payment method and courier selections
    const paymentMethod = document.getElementById('payment-method').value;
    const courierService = document.getElementById('courier-service').value;
    
    // Validate selections
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'info');
        return;
    }
    if (!courierService) {
        showNotification('Please select a courier service', 'info');
        return;
    }
    
    // Recompute summary server-side style to ensure numbers are correct
    const anySelected = cartItems.some(it => !!it.selected);
    const subtotal = cartItems.reduce((sum, item) => {
        const price = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        if (anySelected && !item.selected) return sum;
        return sum + (price * item.quantity);
    }, 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = +(subtotal + shipping).toFixed(2);

    // gather customer info from settings if present
    const customerEmail = localStorage.getItem('jbr7_customer_email') || localStorage.getItem('customerEmail') || '';
    const customerPhone = localStorage.getItem('jbr7_customer_phone') || localStorage.getItem('customerPhone') || '';

    // create a stable order id
    const orderId = 'JBR7-' + Date.now().toString(36).toUpperCase();

    // prepare itemized list (deep copy and normalize prices)
    const items = cartItems.map(it => ({
        name: it.name || '',
        image: it.image || '',
        quantity: Number(it.quantity) || 1,
        size: it.size || '',
        color: it.selectedColor || '',
        unitPrice: +(parseFloat(String(it.price).replace(/[^0-9\.\-]/g, '')) || 0),
        lineTotal: +((parseFloat(String(it.price).replace(/[^0-9\.\-]/g, '')) || 0) * (Number(it.quantity) || 1)).toFixed(2)
    }));

    const checkoutData = {
        orderId,
        timestamp: new Date().toISOString(),
        items,
        subtotal: +subtotal.toFixed(2),
        shipping: +shipping.toFixed(2),
        total: +total.toFixed(2),
        payment: paymentMethod,
        courier: courierService,
        customerEmail,
        customerPhone
    };

    // persist for receipt page
    // log checkout data to help debugging in deployment (visible in browser console)
    try { console.log('Storing pendingCheckout:', checkoutData); } catch (e) { /* ignore */ }
    localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));

    showNotification('Preparing receipt...', 'success');
    // open receipt page immediately
    setTimeout(() => {
        window.location.href = 'receipt.html';
    }, 400);
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

// Navigation functions
function goToExplore() {
    window.location.href = 'explore.html';
}

function goHome() {
    window.location.href = 'home.html';
}

// Add notification styles
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
        border-left: 4px solid #31708f;
    }
    
    .notification-info i {
        color: #31708f;
    }
    
    .notification span {
        font-size: 0.95rem;
        color: #333;
        font-weight: 500;
    }
`;
document.head.appendChild(notificationStyles);