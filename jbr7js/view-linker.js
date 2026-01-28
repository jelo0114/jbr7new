// view-linker.js - Makes product cards clickable and links to view page with proper IDs

(function() {
    // Product name to ID mapping (matches PRODUCTS array in view.html)
    const PRODUCT_ID_MAP = {
        'Eco Jute Tote Bag': '1',
        'Professional Module Backpack': '2',
        'Canvas Messenger Bag': '3',
        'Riki Bag': '4',
        'Ringlight Bag': '5',
        'Ring Light Bag': '5',
        'Vanity Mirror Bag': '6',
        'Eco Colored Tote Bag': '7',
        'Riki Tall Bag': '8',
        'Plain Brass Cotton Back Pack': '9',
        'Two Colored Brass Cotton Back Pack': '10',
        'Envelope Bags': '11',
        'Boys Kiddie Bag': '12',
        'Girls Kiddie Bag': '13',
        'Katrina Plain': '14',
        'Katrina Two Colors': '15',
        'Module Bag': '16'
    };

    function initProductCardLinks() {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            // Make the entire card clickable (except buttons)
            card.style.cursor = 'pointer';
            
            card.addEventListener('click', function(e) {
                // Don't navigate if clicking on save button or other buttons
                if (e.target.closest('.save-btn') || e.target.closest('button')) {
                    return;
                }
                
                const titleEl = this.querySelector('h3');
                if (!titleEl) return;
                
                const productName = titleEl.textContent.trim();
                const productId = PRODUCT_ID_MAP[productName];
                
                if (productId) {
                    // Navigate using product ID
                    window.location.href = `view.html?id=${productId}&from=explore`;
                } else {
                    // Fallback: use title if ID not found
                    console.warn('Product ID not found for:', productName);
                    const priceEl = this.querySelector('.price');
                    const imgEl = this.querySelector('.product-image img');
                    const price = priceEl ? priceEl.textContent.replace(/[^0-9\.]/g,'') : '';
                    const img = imgEl ? (imgEl.getAttribute('src') || imgEl.src) : '';
                    const descEl = this.querySelector('.product-description');
                    const desc = descEl ? descEl.textContent.trim().slice(0,300) : '';
                    
                    window.location.href = `view.html?title=${encodeURIComponent(productName)}&price=${encodeURIComponent(price)}&img=${encodeURIComponent(img)}&desc=${encodeURIComponent(desc)}&from=explore`;
                }
            });
            
            // Add hover effect
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
                this.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductCardLinks);
    } else {
        initProductCardLinks();
    }
})();