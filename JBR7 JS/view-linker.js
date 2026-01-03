// view-linker.js
// Makes cards and saved items clickable and navigates to view.html with product info and `from` param.
(function(){
    function safeEncode(v){ return encodeURIComponent(String(v || '').trim()); }

    function detectFrom(){
        const p = window.location.pathname.split('/').pop();
        if(!p) return 'explore';
        const name = p.replace('.html','');
        // map index/home to explore by default
        if(['index','home'].includes(name)) return 'explore';
        return name;
    }

    function extractProductFromCard(card){
        // attempt to find common elements inside the card
        const titleEl = card.querySelector('h3') || card.querySelector('.product-info h3') || card.querySelector('.saved-item-info h3');
        const title = titleEl ? titleEl.textContent.trim() : '';
        const priceEl = card.querySelector('.price') || card.querySelector('.product-footer .price');
        const price = priceEl ? priceEl.textContent.replace(/[^0-9\.]/g,'') : '';
        const imgEl = card.querySelector('img') || card.querySelector('.product-image img') || card.querySelector('.saved-item-image img');
        // Prefer the attribute value (may be relative path) so view.html can resolve folder names reliably
        const img = imgEl ? (imgEl.getAttribute('src') || imgEl.src) : '';
        const descEl = card.querySelector('.product-description') || card.querySelector('.saved-item-description') || card.querySelector('p');
        const desc = descEl ? descEl.textContent.trim().slice(0,300) : '';
        return { title, price, img, desc };
    }

    function attach(selector){
        document.querySelectorAll(selector).forEach(card => {
            // avoid double-binding
            if(card.dataset.viewLinked) return;
            card.dataset.viewLinked = '1';
            card.style.cursor = 'pointer';
            card.addEventListener('click', function(e){
                // ignore clicks on buttons/links inside card
                const tag = e.target.tagName.toLowerCase();
                if(['a','button','input'].includes(tag)) return;
                const product = extractProductFromCard(card);
                const from = detectFrom();
                const url = 'view.html?title=' + safeEncode(product.title) +
                            '&price=' + safeEncode(product.price) +
                            '&img=' + safeEncode(product.img) +
                            '&desc=' + safeEncode(product.desc) +
                            '&from=' + safeEncode(from);
                window.location.href = url;
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function(){
        // Attach to common selectors
        attach('.product-card');
        attach('.saved-item-card');
        attach('.wishlist-item');
        attach('.saved-items-grid .saved-item-card');
        // If there are view buttons (links), convert them to proper link to view.html
        document.querySelectorAll('.view-btn, .view-button, a.view-link').forEach(el => {
            if(el.tagName.toLowerCase() === 'a'){
                // ensure href points to view.html with from param
                const from = detectFrom();
                const url = new URL(el.href, window.location.href);
                url.pathname = 'view.html';
                url.searchParams.set('from', from);
                el.href = url.toString();
            } else {
                // button -> click handler
                el.addEventListener('click', function(e){
                    e.preventDefault();
                    const card = el.closest('.product-card, .saved-item-card');
                    if(!card) return;
                    const product = extractProductFromCard(card);
                    const from = detectFrom();
                    const url = 'view.html?title=' + safeEncode(product.title) +
                                '&price=' + safeEncode(product.price) +
                                '&img=' + safeEncode(product.img) +
                                '&desc=' + safeEncode(product.desc) +
                                '&from=' + safeEncode(from);
                    window.location.href = url;
                });
            }
        });
    });
})();
