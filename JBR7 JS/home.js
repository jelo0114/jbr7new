// Navigation functionality for JBR7 Bags

// Lightweight messenger stub so header can call messages before the full messenger is initialized.
// It records an intent and will forward to the real implementation when available.
if (!window.JBR7Messenger) {
    window.JBR7Messenger = (function(){
        let real = null;
        let pending = { open:false, toggle:false };
        return {
            _attachReal(r){ real = r; if (real) { if(pending.open) real.openPanel(); if(pending.toggle) real.togglePanel(); pending.open = pending.toggle = false; } },
            createPanel(){ if(real && real.createPanel) return real.createPanel(); pending.open = true; },
            openPanel(){ if(real && real.openPanel) return real.openPanel(); pending.open = true; },
            closePanel(){ if(real && real.closePanel) return real.closePanel(); },
            togglePanel(){ if(real && real.togglePanel) return real.togglePanel(); pending.toggle = true; },
        };
    })();
}

/* The real messenger code will call window.JBR7Messenger._attachReal(realApi) after it initializes. */

// Handle navigation clicks
function handleNavigate(page) {
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    const clickedLink = document.querySelector(`nav a[data-page="${page}"]`);
    if (clickedLink) {
        clickedLink.classList.add('active');
    }
    
    // Navigate to different pages
    switch(page) {
        case 'home':
            window.location.href = 'home.html';
            break;
        case 'explore':
            window.location.href = 'explore.html';
            break;
        case 'saved':
            window.location.href = 'saved.html';
            break;
        case 'cart':
            window.location.href = 'cart.html';
            break;
        case 'contact':
            window.location.href = 'contact.html';
            break;
        case 'settings':
            window.location.href = 'settings.html';
            break;
        case 'search':
            // open the inline header search if available
            if (typeof openHeaderSearch === 'function') {
                openHeaderSearch();
            } else {
                showNotification('Search feature coming soon!', 'info');
            }
            break;
        case 'notifications':
            // Open the shared notification panel if available (panel-only approach)
            if (window.JBR7Notifications && typeof window.JBR7Notifications.openPanel === 'function') {
                window.JBR7Notifications.openPanel();
            } else {
                showNotification('Notifications feature coming soon!', 'info');
            }
            break;
        case 'messages':
            // open messenger panel (created below)
            if (window.JBR7Messenger && typeof window.JBR7Messenger.togglePanel === 'function') {
                window.JBR7Messenger.togglePanel();
            } else {
                showNotification('Messages feature coming soon!', 'info');
            }
            break;
        case 'profile':
            window.location.href = 'profile.html';
            break;
        default:
            console.log('Page not found:', page);
    }
}

// Handle footer navigation
function handleFooterNavigate(page) {
    const footerLinks = document.querySelectorAll('.footer-section ul li span');
    footerLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    switch(page) {
        case 'about':
            window.location.href = 'about.html';
            break;
        case 'products':
            window.location.href = 'explore.html';
            break;
        case 'contact':
            window.location.href = 'contact.html';
            break;
        default:
            console.log('Page not found:', page);
    }
}

// Handle social media clicks
function handleSocialClick(platform) {
    const socialIcons = document.querySelectorAll('.social-icons span');
    
    // Add temporary active state
    event.target.closest('span').classList.add('active');
    
    setTimeout(() => {
        event.target.closest('span').classList.remove('active');
    }, 300);
    
    // Open social media links (use specific Facebook share link provided)
    switch(platform) {
        case 'facebook':
            window.open('https://www.facebook.com/share/1CMB6249vF/', '_blank');
            break;
        case 'instagram':
            window.open('https://instagram.com', '_blank');
            break;
        case 'twitter':
            window.open('https://twitter.com', '_blank');
            break;
        default:
            console.log('Social platform not found:', platform);
    }
}

// Set active navigation based on current page
function setActiveNavigation() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'home';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Show notification function (if not already defined in explore.js)
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setActiveNavigation();
    
    // Prevent default anchor behavior and handle navigation
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
    
    // Add smooth scroll for internal page sections
    const internalLinks = document.querySelectorAll('a[href^="#"]:not([onclick])');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

/* Header inline search toggle
   - clicking the search icon transforms it into a search input
   - clicking outside or clicking another nav icon closes it
   - Esc closes it
   - Enter submits (navigates to explore.html?q=...)
*/
(function() {
    let searchOpen = false;
    let searchAnchor = null;
    let searchWrapper = null;
    let outsideClickHandler = null;
    let keyHandler = null;

    function createStyles() {
        if (document.getElementById('header-search-styles')) return;
        const s = document.createElement('style');
        s.id = 'header-search-styles';
        s.textContent = `
            nav .header-search-wrapper { display: inline-flex; align-items: center; }
            nav .header-search-input { width: 160px; padding: 0.4rem 0.55rem; border-radius: 18px; border: 1px solid #ddd; outline: none; font-size: 0.92rem; }
            nav .header-search-input:focus { box-shadow: 0 0 0 3px rgba(0,105,35,0.06); border-color: #006923; }
            nav a[data-page="search"].search-open { padding: 0 6px; }
            @media (max-width: 480px) { nav .header-search-input { width: 120px; padding: 0.35rem 0.45rem; } }
        `;
        document.head.appendChild(s);
    }

    function buildSearch(anchor) {
        // anchor is the <a data-page="search">
        searchAnchor = anchor;
        // create wrapper
        searchWrapper = document.createElement('div');
        searchWrapper.className = 'header-search-wrapper';

        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = 'Search products...';
        input.className = 'header-search-input';
        input.setAttribute('aria-label', 'Search products');

        searchWrapper.appendChild(input);

        return { wrapper: searchWrapper, input };
    }

    function openHeaderSearch() {
        if (searchOpen) return;
        createStyles();

        const anchor = document.querySelector('nav a[data-page="search"]');
        if (!anchor) return;

        // prevent default navigation
        anchor.classList.add('search-open');
        const { wrapper, input } = buildSearch(anchor);

        anchor.style.display = 'inline-flex';
        anchor.style.alignItems = 'center';
        anchor.style.gap = '0.5rem';

        // temporarily store original content
        anchor._origContent = anchor.innerHTML;
        // show only the icon plus the wrapper
        const icon = anchor.querySelector('i');
        anchor.innerHTML = '';
        if (icon) anchor.appendChild(icon);
        anchor.appendChild(wrapper);

        input.focus();
        searchOpen = true;

        // outside click: close when clicking outside the anchor
        outsideClickHandler = function(e) {
            if (!anchor.contains(e.target)) closeHeaderSearch();
        };
        document.addEventListener('click', outsideClickHandler);

        // close if user clicks another nav link
        const nav = document.querySelector('nav');
        if (nav) {
            nav.addEventListener('click', navClickClose, true);
        }

        // key handling
        keyHandler = function(e) {
            if (e.key === 'Escape') {
                closeHeaderSearch();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                submitSearch(input.value);
            }
        };
        document.addEventListener('keydown', keyHandler);

        // small helper to prevent nav click from immediately closing when clicking inside the input
        input.addEventListener('click', function(e) { e.stopPropagation(); });
    }

    function navClickClose(e) {
        // if the clicked element is the search anchor itself, ignore
        const anchor = document.querySelector('nav a[data-page="search"]');
        if (anchor && anchor.contains(e.target)) return;
        // clicking any other nav anchor will close the search bar
        if (e.target.closest && e.target.closest('nav a')) {
            closeHeaderSearch();
        }
    }

    function closeHeaderSearch() {
        if (!searchOpen) return;
        const anchor = document.querySelector('nav a[data-page="search"]');
        if (!anchor) return;

        // restore original content
        if (anchor._origContent) {
            anchor.innerHTML = anchor._origContent;
            delete anchor._origContent;
        }
        anchor.classList.remove('search-open');
        // remove listeners
        document.removeEventListener('click', outsideClickHandler);
        document.removeEventListener('keydown', keyHandler);
        const nav = document.querySelector('nav');
        if (nav) nav.removeEventListener('click', navClickClose, true);

        searchOpen = false;
    }

    function submitSearch(q) {
        const term = (q || '').trim();
        if (!term) {
            showNotification('Please enter a search term', 'info');
            return;
        }
        // Navigate to explore with query param
        const url = 'explore.html?q=' + encodeURIComponent(term);
        window.location.href = url;
    }

    // expose opener globally for handleNavigate use
    window.openHeaderSearch = openHeaderSearch;
    // provide a convenience close function
    window.closeHeaderSearch = closeHeaderSearch;

    // Attach click handler to nav search anchor to prevent default and open the search
    document.addEventListener('DOMContentLoaded', function() {
        const anchor = document.querySelector('nav a[data-page="search"]');
        if (!anchor) return;
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            // If already open, focus input; else open
            if (searchOpen) {
                const input = document.querySelector('.header-search-input');
                if (input) input.focus();
            } else {
                openHeaderSearch();
            }
        });
    });
})();

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

// Simple messenger panel (accessible as window.JBR7Messenger)
(function(){
    const STORAGE_KEY = 'jbr7_messages';
    let panel = null, messagesEl = null, inputEl = null, openToggle = null;
    function loadMessages(){
        try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){return []}
    }
    function saveMessages(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
    function createPanel(){
        if(panel) return panel;
        console.log('[JBR7Messenger] createPanel()');
    panel = document.createElement('aside');
        panel.className = 'jbr7-messenger-panel';
        panel.innerHTML = `
            <div class="jbr7-messenger-header">
                <div class="title">Messages</div>
                <div>
                    <button class="close-btn" aria-label="Close messages">&times;</button>
                </div>
            </div>
            <div class="jbr7-messenger-body">
                <div class="jbr7-messages"></div>
            </div>
            <div class="jbr7-messenger-input">
                <input type="text" placeholder="Type a message..." aria-label="Type a message">
                <button class="send">Send</button>
            </div>
        `;
        document.body.appendChild(panel);

    messagesEl = panel.querySelector('.jbr7-messages');
        inputEl = panel.querySelector('.jbr7-messenger-input input');
        const sendBtn = panel.querySelector('.jbr7-messenger-input .send');
        const closeBtn = panel.querySelector('.close-btn');

        closeBtn.addEventListener('click', closePanel);
        sendBtn.addEventListener('click', onSend);
        inputEl.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); onSend(); } });


    panel.addEventListener('click', function(e){ e.stopPropagation(); });

        // initial render
        renderMessages();
        return panel;
    }

    function openPanel(){ createPanel(); panel.classList.add('open'); scrollToBottom();
        console.log('[JBR7Messenger] openPanel()');
        // focus input so user can start typing immediately
        try{ setTimeout(()=>{ if(inputEl) inputEl.focus(); }, 120); }catch(e){}
        // defensive inline styles in case page CSS prevents visibility (helps debugging)
        try{
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
            panel.style.display = 'flex';
            panel.style.zIndex = '2147483647';
            console.log('[JBR7Messenger] panel styles forced visible');
            console.log('[JBR7Messenger] panel computed style:', window.getComputedStyle(panel));
        }catch(e){ console.warn('[JBR7Messenger] force-style failed', e); }
    }
    function closePanel(){ 
        if(!panel) return;
        panel.classList.remove('open');
        // reset styles that openPanel forced so the panel truly hides
        try{
            panel.style.transform = 'translateY(20px)';
            panel.style.opacity = '0';
            panel.style.visibility = 'hidden';
            panel.style.display = 'none';
            panel.style.zIndex = '';
        }catch(e){ /* ignore style reset errors */ }
        try{ if(inputEl) inputEl.blur(); }catch(e){}
    }
    function togglePanel(){ createPanel(); if(panel.classList.contains('open')) closePanel(); else openPanel(); }

    function renderMessages(){
        const msgs = loadMessages();
        if(!messagesEl) return;
        messagesEl.innerHTML = '';
        msgs.forEach(m => {
            const d = document.createElement('div'); d.className = 'jbr7-msg ' + (m.direction === 'out' ? 'out' : 'in');
            d.innerHTML = `<div class="text">${escapeHtml(m.text)}</div><span class="meta">${new Date(m.ts).toLocaleTimeString()}</span>`;
            messagesEl.appendChild(d);
        });
        scrollToBottom();
    }

    function onSend(){
        const txt = (inputEl && inputEl.value || '').trim();
        if(!txt) return;
        const msgs = loadMessages();
        const m = { id: Date.now(), text: txt, ts: Date.now(), direction: 'out' };
        msgs.push(m); saveMessages(msgs); renderMessages(); inputEl.value = '';
        // simple echo reply to demonstrate
        setTimeout(()=>{ const reply = { id: Date.now()+1, text: 'Thanks — we received: "' + txt + '"', ts: Date.now(), direction: 'in' }; const arr = loadMessages(); arr.push(reply); saveMessages(arr); renderMessages(); }, 800 + Math.random()*800);
    }

    function scrollToBottom(){ if(!panel) return; const body = panel.querySelector('.jbr7-messenger-body'); body.scrollTop = body.scrollHeight; }

    function escapeHtml(s){ return String(s).replace(/[&"'<>]/g, function(c){ return {'&':'&amp;','"':'&quot;','"':'&#39;','<':'&lt;','>':'&gt;'}[c]; }); }

    // Expose API (attach to stub if present so any early clicks are honored)
    const realApi = { createPanel, openPanel, closePanel, togglePanel };
    if (window.JBR7Messenger && typeof window.JBR7Messenger._attachReal === 'function') {
        window.JBR7Messenger._attachReal(realApi);
        console.log('[JBR7Messenger] attached to stub');
    } else {
        window.JBR7Messenger = realApi;
    }

    // ensure click on nav messages toggles panel
    document.addEventListener('DOMContentLoaded', function(){
        // create the panel early so toggle/create always finds it (helps pages where scripts run later)
        try{ createPanel(); console.log('[JBR7Messenger] panel created on DOMContentLoaded'); }catch(e){}
        document.querySelectorAll('nav a[data-page="messages"]').forEach(a => {
            a.addEventListener('click', function(e){ e.preventDefault(); togglePanel(); });
        });
    });
})();

// Global delegation: toggle messenger when any header messages link is clicked anywhere on the page
document.addEventListener('click', function(e){
    try {
        const anchor = e.target.closest && e.target.closest('nav a[data-page="messages"]');
        if (anchor) {
            e.preventDefault();
            if (window.JBR7Messenger && typeof window.JBR7Messenger.togglePanel === 'function') {
                window.JBR7Messenger.togglePanel();
            }
        }
    } catch (err) {
        // defensive: ignore if closest not supported or other errors
    }
});

// NAV BADGE: show a persistent red count badge on the cart (and other nav anchors if desired)
function _getCartCountFromStorage() {
    try {
        const arr = JSON.parse(localStorage.getItem('cart') || '[]');
        if (!Array.isArray(arr)) return 0;
        return arr.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    } catch (e) { return 0; }
}

function updateNavBadge(count) {
    try {
        const navCart = document.querySelector('nav a[data-page="cart"]');
        if (!navCart) return;
        // remove any legacy badge elements to avoid duplicates (created by older scripts)
        navCart.querySelectorAll('.cart-badge').forEach(n => n.remove());
        let badge = navCart.querySelector('.nav-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'nav-badge';
            // place last so it floats nicely in the corner
            navCart.appendChild(badge);
        }
        const c = (typeof count === 'number') ? count : _getCartCountFromStorage();
        badge.textContent = c > 99 ? '99+' : String(c);
        badge.style.display = (c && c > 0) ? 'inline-block' : 'none';
    } catch (e) {
        // ignore failures - non-critical UI enhancement
    }
}

// expose globally so other modules (cart.js, view add-to-cart, etc.) can call it after mutating localStorage
window.updateNavBadge = updateNavBadge;

// initialize badge on load and listen for storage events (other tabs/windows)
document.addEventListener('DOMContentLoaded', function() {
    // small timeout to allow any other scripts that write cart on load to run first
    setTimeout(() => updateNavBadge(), 40);
    window.addEventListener('storage', function(e) {
        if (!e) return;
        if (e.key === 'cart') updateNavBadge();
    });
});
