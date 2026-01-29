// Cart Page Functionality - IMPROVED ERROR HANDLING VERSION

let cartItems = [];

// Size-to-price mapping for Eco Jute Tote
const TOTE_SIZE_PRICES = {
    '8 x 10': 35,
    '10 x 12': 45,
    '13 x 15': 50,
    '14 x 16': 55
};
// Prices when the tote is a colored variant
const COLORED_TOTE_SIZE_PRICES = {
    '8 x 10': 38,
    '10 x 12': 43,
    '13 x 15': 57,
    '14 x 16': 65
};
// Vanity / Mirror bag sizes and prices
const VANITY_SIZE_PRICES = {
    '14 x 14': 400,
    '14 x 16': 430,
    '16 x 19': 450,
    '16 x 21': 470,
    '17 x 25': 500,
    '20 x 24': 550,
    '21 x 28': 650
};
// Ring Light bag sizes/prices
const RINGLIGHT_SIZE_PRICES = {
    '18 x 21': 500,
    '22 x 22': 550
};

// Color options for each product type
const PRODUCT_COLORS = {
    'Plain Brass Cotton Backpack': ['Maroon', 'Dark Old Rose', 'Neon Green', 'Tan Brown', 'Black', 'Pink', 'Sage Green'],
    'Plain Brass Cotton Back Pack': ['Maroon', 'Dark Old Rose', 'Neon Green', 'Tan Brown', 'Black', 'Pink', 'Sage Green'],
    'Brass Cotton Backpack': ['Maroon', 'Dark Old Rose', 'Neon Green', 'Tan Brown', 'Black', 'Pink', 'Sage Green'],
    'Two Colored Brass Cotton': ['Olive/Peach', 'Pink/Light Gray', 'Soft Violet', 'Mustard', 'Red/Gray', 'Neon/Olive', 'Rust/Old Rose', 'Red/Black', 'Neon/Pink'],
    'Envelope Bags': ['Black', 'Green', 'Pink', 'Blue', 'Neon Green', 'Deep Blue', 'Red', 'Yellow'],
    'Envelope Bag': ['Black', 'Green', 'Pink', 'Blue', 'Neon Green', 'Deep Blue', 'Red', 'Yellow'],
    'Boys Kiddie Bag': ['Batman', 'Cars', 'Ironman', 'Spiderman', 'Superman'],
    'Girls Kiddie Bag': ['Barbie', 'Sofia', 'Hello Kitty', 'Frozen'],
    'Katrina Plain': ['Red', 'Neon Green', 'Black', 'Gray', 'Sky Blue', 'Pink'],
    'Katrina Two Colors': ['Cool Green/Gray', 'F.Pink/Gray', 'Orange/Gray', 'Navy Blue/Gray', 'Maroon/Gray', 'Black/Gray', 'Tortoise Blue/Gray'],
    'Module Bag': ['Yellow', 'Orange', 'Pink', 'Navy Blue', 'Black', 'Sky Blue', 'Violet', 'Blue'],
    'Eco Colored Tote Bag': ['White', 'Black', 'Red', 'Pink', 'Sky Blue', 'Navy Blue', 'Royal Blue', 'Beige', 'Cream', 'Orange', 'Olive Green', 'Emerald Green', 'Yellow', 'Charcoal Gray', 'Lavender', 'Maroon', 'Mint Green']
};

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    renderCart();
    updateSummary();
    loadDefaultPaymentAndCourier();
});

// Load cart from localStorage (user-specific)
function loadCartFromStorage() {
    const cartData = typeof UserStorage !== 'undefined' && UserStorage ? 
        UserStorage.getItem('cart') : 
        localStorage.getItem('cart');
    
    cartItems = JSON.parse(cartData || '[]');
    cartItems = cartItems.map(item => {
        const priceNum = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        return {
            ...item,
            selected: !!item.selected,
            selectedColor: item.selectedColor || item.color || '',
            basePrice: typeof item.basePrice !== 'undefined' ? Number(item.basePrice) : priceNum,
            availableColors: item.availableColors || getColorsForProduct(item.name)
        };
    });
}

// Get colors for a product by name
function getColorsForProduct(productName) {
    if (!productName) return [];
    
    const nameLower = productName.toLowerCase();
    
    for (const key in PRODUCT_COLORS) {
        const keyLower = key.toLowerCase();
        if (nameLower.includes(keyLower)) {
            return PRODUCT_COLORS[key];
        }
    }
    
    if (nameLower.includes('brass') && nameLower.includes('cotton')) {
        if (nameLower.includes('two color') || nameLower.includes('two-color') || nameLower.includes('twocolored')) {
            return PRODUCT_COLORS['Two Colored Brass Cotton'];
        }
        return PRODUCT_COLORS['Plain Brass Cotton Backpack'];
    }
    if (nameLower.includes('envelope')) return PRODUCT_COLORS['Envelope Bags'];
    if (nameLower.includes('boys') || (nameLower.includes('kiddie') && nameLower.includes('boy'))) {
        return PRODUCT_COLORS['Boys Kiddie Bag'];
    }
    if (nameLower.includes('girls') || (nameLower.includes('kiddie') && nameLower.includes('girl'))) {
        return PRODUCT_COLORS['Girls Kiddie Bag'];
    }
    if (nameLower.includes('katrina')) {
        if (nameLower.includes('two') || nameLower.includes('color')) {
            return PRODUCT_COLORS['Katrina Two Colors'];
        }
        return PRODUCT_COLORS['Katrina Plain'];
    }
    if (nameLower.includes('module')) return PRODUCT_COLORS['Module Bag'];
    if (nameLower.includes('tote') || nameLower.includes('eco')) {
        return PRODUCT_COLORS['Eco Colored Tote Bag'];
    }
    
    return [];
}

// Save cart to localStorage (user-specific)
function saveCartToStorage() {
    if (typeof UserStorage !== 'undefined' && UserStorage) {
        UserStorage.setItem('cart', JSON.stringify(cartItems));
    } else {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }
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
        
        const customBadges = [];
        if (item.customizations && item.customizations.length) customBadges.push(...item.customizations.map(c => `<span class="custom-badge">${escapeHtml(c)}</span>`));
        const customs = customBadges.length ? customBadges.join('') : '<span class="custom-badge">Standard</span>';
        
        const titleEnc = encodeURIComponent(item.name || 'Product');
        const priceEnc = encodeURIComponent(priceNum.toString());
        const imgEnc = encodeURIComponent(item.image || '');
        const descEnc = encodeURIComponent('Quality crafted bag');
        const viewUrl = `view.html?title=${titleEnc}&price=${priceEnc}&img=${imgEnc}&desc=${descEnc}&from=cart`;
        
        // Build options panel
        let optionsHtml = '';
        const isColoredTote = (item.name || '').toLowerCase().includes('eco jute colored') || (item.name || '').toLowerCase().includes('colored tote');
        const nameLower = (item.name || '').toLowerCase();
        const isVanity = nameLower.includes('vanity') || nameLower.includes('mirror');
        const isRinglight = nameLower.includes('ring') || nameLower.includes('ring light') || nameLower.includes('ringlight');
        
        const colors = item.availableColors || getColorsForProduct(item.name);
        const hasColors = colors && colors.length > 0;
        
        if (isColoredTote) {
            const selectedColor = item.selectedColor || '';

            let colorButtons = '';
            colors.forEach(c => {
                const safeVal = escapeHtml(c);
                const checked = selectedColor === c ? 'checked' : '';
                colorButtons += `<label class="color-option"><input type="radio" name="color-${index}" value="${safeVal}" ${checked} onchange="onCartColorChange(${index}, '${escapeHtml(c, true)}')"> <span>${escapeHtml(c)}</span></label>`;
            });

            if (!item.selectedColor) {
                cartItems[index].selectedColor = 'White';
            }

            const selColorNorm = (cartItems[index].selectedColor || '').toLowerCase();
            const isColoredSelection = selColorNorm && !(/^(white|black)$/i.test(selColorNorm));
            const priceMapForSizes = isColoredSelection ? COLORED_TOTE_SIZE_PRICES : TOTE_SIZE_PRICES;
            const sizeOptions = Object.keys(priceMapForSizes).map(s => {
                const selected = item.size === s ? 'selected' : '';
                return `<option value="${escapeHtml(s)}" ${selected}>${escapeHtml(s)} — ₱${priceMapForSizes[s]}</option>`;
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
                            <div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${escapeHtml(item.size || 'Standard')}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (isVanity) {
            const vanitySizeOptions = Object.keys(VANITY_SIZE_PRICES).map(s => {
                const selected = item.size === s ? 'selected' : '';
                return `<option value="${escapeHtml(s)}" ${selected}>${escapeHtml(s)} — ₱${VANITY_SIZE_PRICES[s]}</option>`;
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
                            <div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${escapeHtml(item.size || 'Standard')}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (isRinglight) {
            const ringSizeOptions = Object.keys(RINGLIGHT_SIZE_PRICES).map(s => {
                const selected = item.size === s ? 'selected' : '';
                return `<option value="${escapeHtml(s)}" ${selected}>${escapeHtml(s)} — ₱${RINGLIGHT_SIZE_PRICES[s]}</option>`;
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
                            <div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${escapeHtml(item.size || 'Standard')}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (hasColors) {
            const selectedColor = item.selectedColor || '';
            
            let colorButtons = '';
            colors.forEach(c => {
                const safeVal = escapeHtml(c);
                const checked = selectedColor === c ? 'checked' : '';
                colorButtons += `<label class="color-option"><input type="radio" name="color-${index}" value="${safeVal}" ${checked} onchange="setCartItemOption(${index}, 'selectedColor', '${escapeHtml(c, true)}')"> <span>${escapeHtml(c)}</span></label>`;
            });
            
            optionsHtml = `
                <div class="cart-item-options" id="item-options-${index}" style="display:${item.selected ? 'block' : 'none'};margin-top:0.75rem;padding:0.75rem;border:1px dashed #e6e6e6;border-radius:8px;background:#fafafa">
                    <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
                        <div style="flex:1;min-width:160px">
                            <div style="margin-bottom:0.5rem;font-weight:700">Choose Color</div>
                            <div class="color-options-list" style="display:flex;flex-wrap:wrap;gap:0.5rem">${colorButtons}</div>
                            ${selectedColor ? `<div style="margin-top:0.5rem;font-size:0.9rem;color:#666">Selected: ${escapeHtml(selectedColor)}</div>` : '<div style="margin-top:0.5rem;font-size:0.9rem;color:#e53e3e">⚠ Please select a color to checkout</div>'}
                        </div>
                    </div>
                </div>
            `;
        }

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
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="item-image" onerror="this.src='https://www.sourceforthegoose.com/cdn/shop/files/Scallop-top-jute-tote.jpg?v=1713019103&width=1080'">
            <div class="item-details">
                <div class="item-name">${escapeHtml(item.name)}</div>
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
    initCartPreviews();
}

// HTML escape helper to prevent XSS
function escapeHtml(text, forAttribute = false) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    const escaped = String(text).replace(/[&<>"']/g, m => map[m]);
    return forAttribute ? escaped.replace(/'/g, "\\'") : escaped;
}

function onCartColorChange(index, color) {
    if (index < 0 || index >= cartItems.length) return;
    const folder = 'Tote Bag';
    cartItems[index].selectedColor = color;
    cartItems[index].image = `${folder}/${color}.png`;
    setCartItemOption(index, 'selectedColor', color);
}

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
            const slug = color.toLowerCase().replace(/\s+/g, '-');
            exts.forEach(ext => candidates.push(`${folder}/${slug}.${ext}`));
        }
        candidates.push(`${folder}/White.jpg`);
        candidates.push(`${folder}/Colored.png`);
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

function toggleSelect(index, checked) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems[index].selected = !!checked;
    
    const optionsPanel = document.getElementById(`item-options-${index}`);
    if (optionsPanel) {
        optionsPanel.style.display = checked ? 'block' : 'none';
    }
    
    saveCartToStorage();
    updateSummary();
}

function setCartItemOption(index, key, value) {
    if (index < 0 || index >= cartItems.length) return;
    
    if (key === 'size') {
        const sizeLabel = value || '';
        cartItems[index].size = sizeLabel;
        const name = (cartItems[index].name || '').toLowerCase();
        if (sizeLabel) {
            if (name.includes('vanity') || name.includes('mirror')) {
                if (VANITY_SIZE_PRICES[sizeLabel]) cartItems[index].price = Number(VANITY_SIZE_PRICES[sizeLabel]);
            } else if (name.includes('ring') || name.includes('ring light') || name.includes('ringlight')) {
                if (RINGLIGHT_SIZE_PRICES[sizeLabel]) cartItems[index].price = Number(RINGLIGHT_SIZE_PRICES[sizeLabel]);
            } else {
                const selColor = (cartItems[index].selectedColor || '').toLowerCase();
                const isColoredSelection = selColor && !(/^(white|black)$/i.test(selColor));
                const priceMap = isColoredSelection ? COLORED_TOTE_SIZE_PRICES : TOTE_SIZE_PRICES;
                if (priceMap[sizeLabel]) {
                    cartItems[index].price = Number(priceMap[sizeLabel]);
                    cartItems[index].basePrice = Number(priceMap[sizeLabel]);
                }
            }
        }
    } else {
        cartItems[index][key] = value;
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
    renderCart();
    updateSummary();
    showNotification('Selection saved', 'success');
}

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

function removeItem(index) {
    if (index < 0 || index >= cartItems.length) return;
    
    const itemName = cartItems[index].name;
    cartItems.splice(index, 1);
    
    saveCartToStorage();
    renderCart();
    updateSummary();
    showNotification(`${itemName} removed from cart`, 'info');
}

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

function updateSummary() {
    const anySelected = cartItems.some(it => !!it.selected);
    const subtotal = cartItems.reduce((sum, item) => {
        const price = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        if (anySelected && !item.selected) return sum;
        return sum + (price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 50 ? 0 : 0.00;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `₱${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `₱${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `₱${total.toFixed(2)}`;
    
    const itemCount = (() => {
        const any = cartItems.some(it => !!it.selected);
        if (any) return cartItems.reduce((sum, item) => item.selected ? sum + item.quantity : sum, 0);
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    })();
    const countEl = document.getElementById('cart-item-count');
    if (countEl) countEl.textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`;
}

function applyPromoCode() {
    const promoInput = document.getElementById('promo-input');
    const promoCode = promoInput.value.trim().toUpperCase();
    
    if (promoCode === '') {
        showNotification('Please enter a promo code', 'info');
        return;
    }
    
    const promoCodes = {
        'JBR10': { type: 'percentage', value: 10, message: '10% discount applied!' },
        'FREESHIP': { type: 'shipping', value: 0, message: 'Free shipping applied!' },
        'SAVE20': { type: 'percentage', value: 20, message: '20% discount applied!' },
        'WELCOME15': { type: 'percentage', value: 15, message: '15% welcome discount applied!' }
    };
    
    if (promoCodes[promoCode]) {
        showNotification(promoCodes[promoCode].message, 'success');
        localStorage.setItem('appliedPromo', promoCode);
        promoInput.value = '';
    } else {
        showNotification('Invalid promo code. Try JBR10 or FREESHIP', 'info');
    }
}

// IMPROVED CHECKOUT FUNCTION with better error handling
async function checkout() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty! Add items before checkout.', 'info');
        return;
    }
    
    // Get user ID
    const userId = sessionStorage.getItem('jbr7_user_id');
    if (!userId) {
        showNotification('Please log in to checkout', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Validate shipping address
    try {
        const addressResponse = await fetch(`/api/get?action=shipping-addresses&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin'
        });
        
        if (!addressResponse.ok) {
            throw new Error(`HTTP error! status: ${addressResponse.status}`);
        }
        
        const addressData = await addressResponse.json();
        
        if (!addressData.success || !addressData.data || addressData.data.length === 0) {
            showNotification('Please add a shipping address in Settings before checkout. Redirecting...', 'error');
            setTimeout(() => {
                window.location.href = 'settings.html#shipping';
            }, 2000);
            return;
        }
    } catch (error) {
        console.error('Error checking addresses:', error);
        showNotification('Unable to verify shipping address. Please check your connection.', 'error');
        return;
    }
    
    // Validate color selection
    const anySelected = cartItems.some(it => !!it.selected);
    const itemsToCheck = anySelected ? cartItems.filter(it => it.selected) : cartItems;
    
    for (const item of itemsToCheck) {
        const colors = item.availableColors || getColorsForProduct(item.name);
        if (colors && colors.length > 0 && !item.selectedColor) {
            showNotification(`Please select a color for ${item.name}`, 'info');
            const itemElement = document.querySelector(`[data-index="${cartItems.indexOf(item)}"]`);
            if (itemElement) {
                itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
    }
    
    const paymentMethod = document.getElementById('payment-method').value;
    const courierService = document.getElementById('courier-service').value;
    
    if (!paymentMethod) {
        showNotification('Please select a payment method', 'info');
        return;
    }
    if (!courierService) {
        showNotification('Please select a courier service', 'info');
        return;
    }
    
    const subtotal = cartItems.reduce((sum, item) => {
        const price = parseFloat(String(item.price).replace(/[^0-9\.\-]/g, '')) || 0;
        if (anySelected && !item.selected) return sum;
        return sum + (price * item.quantity);
    }, 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = +(subtotal + shipping).toFixed(2);

    const customerEmail = localStorage.getItem('jbr7_customer_email') || localStorage.getItem('customerEmail') || '';
    const customerPhone = localStorage.getItem('jbr7_customer_phone') || localStorage.getItem('customerPhone') || '';

    const orderId = 'JBR7-' + Date.now().toString(36).toUpperCase();
    const itemsToCheckout = anySelected ? cartItems.filter(it => it.selected) : cartItems;

    const items = itemsToCheckout.map(it => ({
        name: it.name || '',
        image: it.image || '',
        quantity: Number(it.quantity) || 1,
        size: it.size || '',
        color: it.selectedColor || '',
        unitPrice: +(parseFloat(String(it.price).replace(/[^0-9\.\-]/g, '')) || 0),
        lineTotal: +((parseFloat(String(it.price).replace(/[^0-9\.\-]/g, '')) || 0) * (Number(it.quantity) || 1)).toFixed(2)
    }));

    // Get default shipping address
    let shippingAddress = null;
    try {
        const addressResponse = await fetch(`/api/get?action=shipping-addresses&userId=${userId}`, {
            method: 'GET',
            credentials: 'same-origin'
        });
        const addressData = await addressResponse.json();
        if (addressData.success && addressData.data && addressData.data.length > 0) {
            const defaultAddr = addressData.data.find(addr => addr.is_default) || addressData.data[0];
            
            // Format address for order
            shippingAddress = {
                full_name: [defaultAddr.first_name, defaultAddr.middle_name, defaultAddr.last_name].filter(Boolean).join(' ') || 
                           defaultAddr.recipient_name || defaultAddr.company_name || '',
                phone: defaultAddr.mobile_number || defaultAddr.office_phone || '',
                address_line1: [defaultAddr.house_unit_number, defaultAddr.street_name, defaultAddr.building_name].filter(Boolean).join(' '),
                address_line2: [defaultAddr.subdivision_village, defaultAddr.barangay].filter(Boolean).join(', '),
                city: defaultAddr.city_municipality || '',
                province: defaultAddr.province_state || '',
                postal_code: defaultAddr.postal_zip_code || '',
                country: defaultAddr.country || 'Philippines'
            };
        }
    } catch (error) {
        console.error('Error fetching shipping address:', error);
    }

    const checkoutData = {
        orderId,
        orderNumber: orderId,
        timestamp: new Date().toISOString(),
        items,
        subtotal: +subtotal.toFixed(2),
        shipping: +shipping.toFixed(2),
        total: +total.toFixed(2),
        payment: paymentMethod,
        courier: courierService,
        customerEmail,
        customerPhone,
        shippingAddress
    };

    localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
    showNotification('Saving order to database...', 'info');
    
    const orderPayload = {
        userId: parseInt(userId),
        orderId: checkoutData.orderId,
        orderNumber: checkoutData.orderNumber,
        items: checkoutData.items,
        subtotal: checkoutData.subtotal,
        shipping: checkoutData.shipping,
        total: checkoutData.total,
        payment: checkoutData.payment,
        courier: checkoutData.courier,
        customerEmail: checkoutData.customerEmail,
        customerPhone: checkoutData.customerPhone,
        shippingAddress: checkoutData.shippingAddress,
        timestamp: checkoutData.timestamp
    };

    // PHP expects orderId (not orderNumber) and same keys; session supplies userId
    const phpOrderPayload = {
        orderId: checkoutData.orderId,
        orderNumber: checkoutData.orderNumber,
        items: checkoutData.items,
        subtotal: checkoutData.subtotal,
        shipping: checkoutData.shipping,
        total: checkoutData.total,
        payment: checkoutData.payment,
        courier: checkoutData.courier,
        customerEmail: checkoutData.customerEmail,
        customerPhone: checkoutData.customerPhone,
        shippingAddress: checkoutData.shippingAddress,
        timestamp: checkoutData.timestamp
    };

    try {
        // Try API routes first, then PHP backend
        const apiAttempts = [
            { path: '/api/orders', body: orderPayload },
            { path: '/api/order', body: orderPayload },
            { path: '/jbr7php/save_order.php', body: phpOrderPayload }
        ];
        let response = null;
        let lastError = null;
        
        for (const { path: apiPath, body } of apiAttempts) {
            try {
                response = await fetch(apiPath, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify(body)
                });
                
                if (response.ok) {
                    const ct = response.headers.get("content-type");
                    if (ct && ct.includes("application/json")) {
                        break;
                    }
                }
                if (response.status === 404) {
                    response = null;
                    continue;
                }
                if (!response.ok) {
                    lastError = new Error(`HTTP ${response.status}`);
                    continue;
                }
                break;
            } catch (err) {
                lastError = err;
                response = null;
                continue;
            }
        }
        
        if (!response || !response.ok) {
            const ct = response ? response.headers.get("content-type") : null;
            if (response && (!ct || !ct.includes("application/json"))) {
                const text = await response.text();
                if (text.includes('NOT_FOUND') || text.includes('404') || text.includes('page could not be found')) {
                    throw new Error('API_NOT_CONFIGURED');
                }
            }
            throw lastError || new Error('API_NOT_CONFIGURED');
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            if (text.includes('NOT_FOUND') || text.includes('404')) {
                throw new Error('API_NOT_CONFIGURED');
            }
            throw new Error('Server returned invalid response format');
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Order saved successfully:', data.order_id);
            showNotification('Order saved successfully! Redirecting to receipt...', 'success');
            
            // Clear selected items or entire cart
            if (anySelected) {
                cartItems = cartItems.filter(it => !it.selected);
                saveCartToStorage();
            } else {
                cartItems = [];
                saveCartToStorage();
            }
            
            setTimeout(() => {
                window.location.href = 'receipt.html';
            }, 800);
        } else {
            console.error('Failed to save order:', data.error);
            throw new Error(data.error || 'Failed to save order');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        
        // Handle API not configured error with fallback
        if (error.message === 'API_NOT_CONFIGURED') {
            console.warn('API endpoint not found. Order saved locally.');
            showNotification('Order placed! (Saved locally - API not configured yet)', 'success');
            
            // Save to localStorage as fallback
            const existingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
            existingOrders.push(checkoutData);
            localStorage.setItem('pendingOrders', JSON.stringify(existingOrders));
            
            // Clear cart
            if (anySelected) {
                cartItems = cartItems.filter(it => !it.selected);
            } else {
                cartItems = [];
            }
            saveCartToStorage();
            
            setTimeout(() => {
                window.location.href = 'receipt.html';
            }, 1000);
            return;
        }
        
        // Show user-friendly error message
        let userMessage = 'Failed to save order. ';
        if (error.message.includes('network') || error.message.includes('fetch')) {
            userMessage += 'Please check your internet connection.';
        } else if (error.message.includes('API_NOT_CONFIGURED')) {
            userMessage += 'Server configuration error. Order saved locally.';
        } else {
            userMessage += error.message;
        }
        
        showNotification(userMessage, 'error');
    }
}

async function loadDefaultPaymentAndCourier() {
    const paymentMapping = {
        'gcash': 'GCash',
        'paymaya': 'PayMaya',
        'cod': 'COD',
        'rcbc': 'RCBC',
        'mastercard': 'Mastercard'
    };
    
    const courierMapping = {
        'jnt': 'J&T Express',
        'flash': 'Flash Express'
    };
    
    let defaultPayment = null;
    let defaultCourier = null;
    
    const userId = sessionStorage.getItem('jbr7_user_id');
    
    if (userId) {
        try {
            const response = await fetch(`/api/get?action=user-preferences&userId=${userId}`, {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    defaultPayment = data.data.default_payment;
                    defaultCourier = data.data.default_courier;
                    
                    if (defaultPayment) localStorage.setItem('jbr7_default_payment', defaultPayment);
                    if (defaultCourier) localStorage.setItem('jbr7_default_courier', defaultCourier);
                }
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }
    
    if (!defaultPayment) {
        defaultPayment = localStorage.getItem('jbr7_default_payment');
    }
    if (!defaultCourier) {
        defaultCourier = localStorage.getItem('jbr7_default_courier');
    }
    
    if (defaultPayment && paymentMapping[defaultPayment]) {
        setTimeout(() => {
            const paymentSelect = document.getElementById('payment-method');
            if (paymentSelect) {
                const cartValue = paymentMapping[defaultPayment];
                const optionExists = Array.from(paymentSelect.options).some(opt => opt.value === cartValue);
                if (optionExists) {
                    paymentSelect.value = cartValue;
                }
            }
        }, 100);
    }
    
    if (defaultCourier && courierMapping[defaultCourier]) {
        setTimeout(() => {
            const courierSelect = document.getElementById('courier-service');
            if (courierSelect) {
                const cartValue = courierMapping[defaultCourier];
                const optionExists = Array.from(courierSelect.options).some(opt => opt.value === cartValue);
                if (optionExists) {
                    courierSelect.value = cartValue;
                }
            }
        }, 100);
    }
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
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

function goToExplore() {
    window.location.href = 'explore.html';
}

function goHome() {
    window.location.href = 'home.html';
}

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
    
    .notification-error {
        border-left: 4px solid #d32f2f;
    }
    
    .notification-error i {
        color: #d32f2f;
    }
    
    .notification span {
        font-size: 0.95rem;
        color: #333;
        font-weight: 500;
    }
    
    .color-option {
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.6rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: white;
    }
    
    .color-option:hover {
        border-color: #006923;
        background: #f0f7f2;
    }
    
    .color-option input[type="radio"] {
        margin-right: 0.4rem;
    }
    
    .color-option input[type="radio"]:checked + span {
        font-weight: 600;
        color: #006923;
    }
`;
document.head.appendChild(notificationStyles);