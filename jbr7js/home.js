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
    
    // Navigate to different pages (relative paths so nav works from any base URL or file://)
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
    
    // Safely resolve clicked element: use event if available, otherwise try to find the footer span matching the page
    let footerTarget = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
    if (!footerTarget) {
        try {
            footerTarget = document.querySelector(`.footer-section ul li span[onclick*="handleFooterNavigate('${page}')"]`);
        } catch (e) {
            footerTarget = document.querySelector('.footer-section ul li span');
        }
    }
    if (footerTarget) {
        const spanEl = footerTarget.closest ? footerTarget.closest('span') : footerTarget;
        if (spanEl) spanEl.classList.add('active');
    }
    
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
    
    // Add temporary active state (safely resolve target)
    let socialTarget = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
    if (!socialTarget) socialTarget = document.querySelector('.social-icons span');
    const socialSpan = socialTarget && socialTarget.closest ? socialTarget.closest('span') : socialTarget;
    if (socialSpan) {
        socialSpan.classList.add('active');
        setTimeout(() => {
            socialSpan.classList.remove('active');
        }, 300);
    }
    
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
    // normalize filename by removing common extensions (.html, .php)
    const raw = window.location.pathname.split('/').pop() || '';
    const currentPage = (raw.replace(/\.html$|\.php$/i, '') || 'home');
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

    // initialize header using server session (if available)
    if (typeof initHeaderFromServer === 'function') initHeaderFromServer();

    // Logo auth logic: if user is not logged in and clicks the logo, go back to landing (index.html)
    const logoLink = document.querySelector('header .logo[data-logo-home]');
    if (logoLink) {
        logoLink.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                const res = await fetch('/jbr7php/session_user.php', { credentials: 'same-origin' });
                if (res && res.ok) {
                    // Logged in: keep behavior as home link
                    window.location.href = '/home.html';
                } else {
                    // Not logged in: send to index landing page
                    window.location.href = '/index.html';
                }
            } catch (err) {
                // On error, be safe and send to landing
                window.location.href = '/index.html';
            }
        });
    }
});

// Fetch session info and update header elements so pages can remain plain HTML
async function initHeaderFromServer() {
    try {
        const res = await fetch('/jbr7php/session_user.php', { credentials: 'same-origin' });
        if (!res.ok) return; // not authenticated or server error
        const j = await res.json().catch(() => null);
        if (!j || !j.success || !j.user) return;
        const user = j.user;
        const stats = j.stats || {};

        // update profile link (show logged-in state) - make link point to the static HTML
        // and replace the original anchor node to remove previously attached event listeners
        // (those were added earlier to anchors with href^="#"). This lets the link act as a
        // normal navigation to /profile.html while still using PHP only for data fetching.
        const profileLink = document.querySelector('nav a[data-page="profile"]');
        if (profileLink && profileLink.parentNode) {
            // create a clean clone (cloning attributes/children but not event listeners)
            const clean = profileLink.cloneNode(true);
            // remove any inline onclick handlers so navigation is handled by href
            clean.removeAttribute('onclick');
            // point to the static HTML profile page
            clean.setAttribute('href', '/profile.html');

            // create or update badge/avatar on the clean element
            let badge = clean.querySelector('.user-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'user-badge';
                badge.title = user.username || 'Account';
                badge.style.cssText = 'display:inline-block;margin-left:6px;width:26px;height:26px;border-radius:100%;background:#0a7e3a;color:#fff;text-align:center;font-size:12px;line-height:26px;';
                badge.textContent = (user.username || 'U').charAt(0).toUpperCase();
                clean.appendChild(badge);
            } else {
                badge.title = user.username || badge.title;
                badge.textContent = (user.username || 'U').charAt(0).toUpperCase();
            }

            // replace DOM node so earlier nav click listeners (that call preventDefault)
            // are not attached to this element anymore — clicking will follow /profile.html
            profileLink.parentNode.replaceChild(clean, profileLink);
        }

        // update saved count badge if present
        if (typeof stats.saved !== 'undefined') {
            const savedLink = document.querySelector('nav a[data-page="saved"]');
            if (savedLink) {
                let sb = savedLink.querySelector('.saved-badge');
                if (!sb) {
                    sb = document.createElement('span'); sb.className = 'saved-badge'; sb.style.cssText = 'margin-left:6px;background:#111;color:#fff;padding:2px 6px;border-radius:10px;font-size:11px;';
                    savedLink.appendChild(sb);
                }
                sb.textContent = stats.saved;
                sb.style.display = stats.saved > 0 ? 'inline-block' : 'none';
            }
        }
    } catch (e) {
        // ignore silently — header remains as static HTML
        console.warn('Header init failed', e);
    }
}

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
            nav { overflow: visible !important; }
            nav a[data-page="search"] { overflow: visible !important; }
            nav a[data-page="search"].search-open { overflow: visible !important; }
            nav .header-search-wrapper { display: inline-flex; align-items: center; position: relative !important; z-index: 99999 !important; overflow: visible !important; }
            nav .header-search-input { width: 200px; padding: 0.4rem 0.55rem; border-radius: 18px; border: 1px solid #ddd; outline: none; font-size: 0.92rem; }
            nav .header-search-input:focus { box-shadow: 0 0 0 3px rgba(0,105,35,0.06); border-color: #006923; }
            nav a[data-page="search"].search-open { padding: 0 6px; position: relative !important; z-index: 99999 !important; overflow: visible !important; }
            nav .search-suggestions { 
                font-size: 0.9rem !important; 
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: absolute !important;
                z-index: 99999 !important;
                overflow: visible !important;
                background: #fff !important;
                top: calc(100% + 4px) !important;
                left: 0 !important;
                width: 100% !important;
                min-width: 300px !important;
            }
            nav .search-suggestions .suggestion-item:hover { background: #f0f0f0 !important; }
            nav .search-suggestions .suggestion-item.highlighted { background: #e8f5e9 !important; }
            @media (max-width: 480px) { 
                nav .header-search-input { width: 140px; padding: 0.35rem 0.45rem; }
                nav .search-suggestions { width: 280px !important; left: -60px !important; }
            }
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
        input.placeholder = 'Search products, settings...';
        input.className = 'header-search-input';
        input.setAttribute('aria-label', 'Search products and settings');
        input.setAttribute('autocomplete', 'off');

        // Create suggestions dropdown
        const suggestionsDropdown = document.createElement('div');
        suggestionsDropdown.className = 'search-suggestions';
        suggestionsDropdown.id = 'search-suggestions-dropdown';
        // Set initial styles
        suggestionsDropdown.style.cssText = 'display: none; position: absolute; top: calc(100% + 4px); left: 0; width: 100%; min-width: 300px; background: #fff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 400px; overflow-y: auto; z-index: 99999; margin-top: 0;';
        
        searchWrapper.style.position = 'relative';
        searchWrapper.style.zIndex = '99999';
        searchWrapper.style.overflow = 'visible'; // Ensure dropdown is not clipped
        searchWrapper.appendChild(input);
        searchWrapper.appendChild(suggestionsDropdown);
        
        // Also ensure parent anchor has overflow visible
        if (anchor) {
            anchor.style.overflow = 'visible';
        }
        
        console.log('Dropdown created:', suggestionsDropdown, 'Parent:', searchWrapper);

        return { wrapper: searchWrapper, input, suggestionsDropdown };
    }

    function openHeaderSearch() {
        if (searchOpen) return;
        createStyles();

        const anchor = document.querySelector('nav a[data-page="search"]');
        if (!anchor) return;

        // prevent default navigation
        anchor.classList.add('search-open');
        const { wrapper, input, suggestionsDropdown } = buildSearch(anchor);

        anchor.style.display = 'inline-flex';
        anchor.style.alignItems = 'center';
        anchor.style.gap = '0.5rem';
        anchor.style.position = 'relative';
        anchor.style.zIndex = '99999';

        // temporarily store original content
        anchor._origContent = anchor.innerHTML;
        // show only the icon plus the wrapper
        const icon = anchor.querySelector('i');
        anchor.innerHTML = '';
        if (icon) anchor.appendChild(icon);
        anchor.appendChild(wrapper);

        input.focus();
        searchOpen = true;

        // Debounced search function
        let searchTimeout = null;
        input.addEventListener('input', function() {
            const query = input.value.trim();
            clearTimeout(searchTimeout);
            
            console.log('Input event triggered, query:', query, 'dropdown:', suggestionsDropdown);
            
            if (query.length === 0) {
                suggestionsDropdown.style.display = 'none';
                return;
            }
            
            // Show dropdown immediately when typing starts (even with 1 character)
            if (query.length >= 1) {
                // Show loading state or empty dropdown
                if (query.length < 2) {
                    // For single character, show quick suggestions
                    console.log('Calling showQuickSuggestions');
                    showQuickSuggestions(query, suggestionsDropdown);
                } else {
                    // For 2+ characters, perform full search
                    console.log('Calling performSearch');
                    searchTimeout = setTimeout(() => {
                        performSearch(query, suggestionsDropdown, input);
                    }, 300);
                }
            }
        });
        
        // Also trigger on focus if there's already text
        input.addEventListener('focus', function() {
            const query = input.value.trim();
            if (query.length >= 1) {
                if (query.length < 2) {
                    showQuickSuggestions(query, suggestionsDropdown);
                } else {
                    performSearch(query, suggestionsDropdown, input);
                }
            }
        });

        // Handle suggestion clicks
        suggestionsDropdown.addEventListener('click', function(e) {
            const suggestionItem = e.target.closest('.suggestion-item');
            if (suggestionItem) {
                const url = suggestionItem.getAttribute('data-url');
                if (url) {
                    if (url.includes('#')) {
                        const [page, section] = url.split('#');
                        if (page === 'settings.html') {
                            window.location.href = url;
                            setTimeout(() => {
                                if (typeof showSettingsSection === 'function') {
                                    showSettingsSection(section);
                                }
                            }, 100);
                        } else {
                            window.location.href = url;
                        }
                    } else {
                        // Handle navigation for all pages
                        if (url.includes('home.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('home');
                            } else {
                                window.location.href = url;
                            }
                        } else if (url.includes('explore.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('explore');
                            } else {
                                window.location.href = url;
                            }
                        } else if (url.includes('cart.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('cart');
                            } else {
                                window.location.href = url;
                            }
                        } else if (url.includes('saved.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('saved');
                            } else {
                                window.location.href = url;
                            }
                        } else if (url.includes('profile.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('profile');
                            } else {
                                window.location.href = url;
                            }
                        } else if (url.includes('contact.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('contact');
                            } else {
                                window.location.href = url;
                            }
                        } else if (url.includes('notification.html')) {
                            if (typeof handleNavigate === 'function') {
                                handleNavigate('notifications');
                            } else {
                                window.location.href = url;
                            }
                        } else {
                            window.location.href = url;
                        }
                    }
                    closeHeaderSearch();
                }
            }
        });

        // outside click: close when clicking outside the anchor and dropdown
        outsideClickHandler = function(e) {
            const clickedInside = anchor.contains(e.target) || suggestionsDropdown.contains(e.target);
            if (!clickedInside) {
                // Only close dropdown, not the entire search bar
                suggestionsDropdown.style.display = 'none';
            }
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
                suggestionsDropdown.style.display = 'none';
                closeHeaderSearch();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedSuggestion = suggestionsDropdown.querySelector('.suggestion-item.highlighted');
                if (selectedSuggestion) {
                    const url = selectedSuggestion.getAttribute('data-url');
                    if (url) {
                        window.location.href = url;
                        closeHeaderSearch();
                        return;
                    }
                }
                // If no suggestion selected, just close the dropdown - don't redirect
                // submitSearch(input.value); // Removed - no auto-redirect to explore.html
                suggestionsDropdown.style.display = 'none';
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1, suggestionsDropdown);
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

        // Hide suggestions dropdown
        const suggestionsDropdown = anchor.querySelector('.search-suggestions');
        if (suggestionsDropdown) {
            suggestionsDropdown.style.display = 'none';
        }

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

    // Show quick suggestions for single character
    function showQuickSuggestions(query, dropdown) {
        console.log('showQuickSuggestions called with query:', query, 'dropdown:', dropdown);
        if (!dropdown) {
            console.error('Dropdown element not found in showQuickSuggestions');
            return;
        }
        
        dropdown.innerHTML = '';
        const queryLower = query.toLowerCase();
        
        // Quick suggestions based on first character
        const quickSuggestions = [
            { text: 'Home', url: 'home.html', icon: 'fa-home', char: 'h' },
            { text: 'Explore Products', url: 'explore.html', icon: 'fa-compass', char: 'e' },
            { text: 'My Cart', url: 'cart.html', icon: 'fa-shopping-cart', char: 'c' },
            { text: 'Saved Items', url: 'saved.html', icon: 'fa-bookmark', char: 's' },
            { text: 'My Profile', url: 'profile.html', icon: 'fa-user-circle', char: 'p' },
            { text: 'Settings', url: 'settings.html', icon: 'fa-cog', char: 's' },
            { text: 'Contact Us', url: 'contact.html', icon: 'fa-envelope', char: 'c' },
            { text: 'Track Order', url: 'track-order.html', icon: 'fa-truck', char: 't' },
        ];
        
        const matching = quickSuggestions.filter(s => s.char === queryLower || s.text.toLowerCase().startsWith(queryLower));
        
        console.log('Matching suggestions:', matching);
        
        if (matching.length > 0) {
            matching.slice(0, 5).forEach(suggestion => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.setAttribute('data-url', suggestion.url);
                suggestionItem.style.cssText = 'padding: 0.75rem 1rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;';
                suggestionItem.innerHTML = `
                    <i class="fas ${suggestion.icon}" style="color: #006923;"></i>
                    <div style="flex: 1;">
                        <strong>${suggestion.text}</strong>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #999; font-size: 0.85rem;"></i>
                `;
                suggestionItem.onmouseenter = function() {
                    this.style.background = '#f0f0f0';
                };
                suggestionItem.onmouseleave = function() {
                    this.style.background = '#fff';
                };
                dropdown.appendChild(suggestionItem);
            });
            // Force dropdown to be visible with inline styles
            dropdown.style.cssText += 'display: block !important; visibility: visible !important; opacity: 1 !important; position: absolute !important; z-index: 99999 !important;';
            console.log('Dropdown should be visible now. Display:', dropdown.style.display, 'Children:', dropdown.children.length);
        } else {
            dropdown.style.display = 'none';
        }
    }

    // Perform search and show suggestions
    async function performSearch(query, dropdown, input) {
        try {
            // Ensure dropdown is visible before fetching
            if (!dropdown) {
                console.error('Dropdown element not found');
                return;
            }
            
            const response = await fetch(`/jbr7php/search_all.php?q=${encodeURIComponent(query)}&type=all`);
            const data = await response.json();
            
            if (!data.success) {
                dropdown.style.display = 'none';
                return;
            }
            
            const results = data.results || {};
            const products = results.products || [];
            const suggestions = results.suggestions || [];
            
            dropdown.innerHTML = '';
            
            // Force dropdown to be visible with inline styles
            dropdown.style.cssText += 'display: block !important; visibility: visible !important; opacity: 1 !important; position: absolute !important; z-index: 99999 !important;';
            console.log('performSearch - Dropdown should be visible. Display:', dropdown.style.display, 'Children:', dropdown.children.length);
            
            // Show "Highest Ratings" option - only show if searching for products/bags specifically
            if (query.toLowerCase().includes('bag') || query.toLowerCase().includes('bags') || query.toLowerCase().includes('product') || query.toLowerCase().includes('rating') || products.length > 0) {
                const highestRatingOption = document.createElement('div');
                highestRatingOption.className = 'suggestion-item suggestion-filter';
                highestRatingOption.style.cssText = 'padding: 0.75rem 1rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; background: #f8f9fa;';
                highestRatingOption.innerHTML = `
                    <i class="fas fa-star" style="color: #fbbf24;"></i>
                    <div style="flex: 1;">
                        <strong>Highest Ratings</strong>
                        <div style="font-size: 0.85rem; color: #666;">View all products sorted by rating</div>
                    </div>
                `;
                highestRatingOption.onclick = function() {
                    if (query) {
                        window.location.href = `explore.html?sort=rating&q=${encodeURIComponent(query)}`;
                    } else {
                        window.location.href = 'explore.html?sort=rating';
                    }
                };
                dropdown.appendChild(highestRatingOption);
            }
            
            // Show "View All Bags" if searching for "bag" or "bags"
            if (query.toLowerCase().includes('bag') || query.toLowerCase().includes('bags')) {
                const viewAllOption = document.createElement('div');
                viewAllOption.className = 'suggestion-item';
                viewAllOption.style.cssText = 'padding: 0.75rem 1rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.75rem;';
                viewAllOption.innerHTML = `
                    <i class="fas fa-shopping-bag" style="color: #006923;"></i>
                    <div style="flex: 1;">
                        <strong>View All Bags</strong>
                        <div style="font-size: 0.85rem; color: #666;">Browse all products</div>
                    </div>
                `;
                viewAllOption.onclick = function() {
                    window.location.href = 'explore.html';
                };
                dropdown.appendChild(viewAllOption);
            }
            
            // Show system-wide suggestions (pages, settings, etc.)
            if (suggestions.length > 0) {
                // Group suggestions by type for better organization
                const pageSuggestions = suggestions.filter(s => !s.text.includes('Settings >'));
                const settingsSuggestions = suggestions.filter(s => s.text.includes('Settings >'));
                
                // Show page suggestions first
                if (pageSuggestions.length > 0) {
                    pageSuggestions.forEach(suggestion => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'suggestion-item';
                        suggestionItem.setAttribute('data-url', suggestion.url);
                        suggestionItem.style.cssText = 'padding: 0.75rem 1rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;';
                        suggestionItem.innerHTML = `
                            <i class="fas ${suggestion.icon}" style="color: #006923;"></i>
                            <div style="flex: 1;">
                                <strong>${suggestion.text}</strong>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #999; font-size: 0.85rem;"></i>
                        `;
                        suggestionItem.onmouseenter = function() {
                            this.style.background = '#f0f0f0';
                        };
                        suggestionItem.onmouseleave = function() {
                            this.style.background = '#fff';
                        };
                        dropdown.appendChild(suggestionItem);
                    });
                }
                
                // Show settings suggestions
                if (settingsSuggestions.length > 0) {
                    // Add a separator if we have both types
                    if (pageSuggestions.length > 0) {
                        const separator = document.createElement('div');
                        separator.style.cssText = 'padding: 0.5rem 1rem; background: #f8f9fa; border-top: 2px solid #eee; border-bottom: 1px solid #eee; font-size: 0.75rem; color: #666; font-weight: 600; text-transform: uppercase;';
                        separator.textContent = 'Settings';
                        dropdown.appendChild(separator);
                    }
                    
                    settingsSuggestions.forEach(suggestion => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'suggestion-item';
                        suggestionItem.setAttribute('data-url', suggestion.url);
                        suggestionItem.style.cssText = 'padding: 0.75rem 1rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;';
                        suggestionItem.innerHTML = `
                            <i class="fas ${suggestion.icon}" style="color: #006923;"></i>
                            <div style="flex: 1;">
                                <strong>${suggestion.text}</strong>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #999; font-size: 0.85rem;"></i>
                        `;
                        suggestionItem.onmouseenter = function() {
                            this.style.background = '#f0f0f0';
                        };
                        suggestionItem.onmouseleave = function() {
                            this.style.background = '#fff';
                        };
                        dropdown.appendChild(suggestionItem);
                    });
                }
            }
            
            // Show product suggestions (limit to 5 for dropdown) - only if searching for products
            if (products.length > 0 && (query.toLowerCase().includes('bag') || query.toLowerCase().includes('product') || query.toLowerCase().includes('item') || suggestions.length === 0)) {
                // Add separator if we have system suggestions
                if (suggestions.length > 0) {
                    const separator = document.createElement('div');
                    separator.style.cssText = 'padding: 0.5rem 1rem; background: #f8f9fa; border-top: 2px solid #eee; border-bottom: 1px solid #eee; font-size: 0.75rem; color: #666; font-weight: 600; text-transform: uppercase;';
                    separator.textContent = 'Products';
                    dropdown.appendChild(separator);
                }
                
                const productLimit = Math.min(5, products.length);
                for (let i = 0; i < productLimit; i++) {
                    const product = products[i];
                    const productItem = document.createElement('div');
                    productItem.className = 'suggestion-item';
                    productItem.setAttribute('data-url', `view.html?title=${encodeURIComponent(product.title)}`);
                    productItem.style.cssText = 'padding: 0.75rem 1rem; border-bottom: 1px solid #eee; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: background 0.2s;';
                    
                    const imageUrl = product.image || 'totebag.avif';
                    const ratingStars = '★'.repeat(Math.floor(product.rating)) + (product.rating % 1 >= 0.5 ? '½' : '');
                    
                    productItem.innerHTML = `
                        <img src="${imageUrl}" alt="${product.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" onerror="this.src='totebag.avif'">
                        <div style="flex: 1; min-width: 0;">
                            <strong style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.title}</strong>
                            <div style="font-size: 0.85rem; color: #666; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="color: #fbbf24;">${ratingStars}</span>
                                <span>${product.rating.toFixed(1)}</span>
                                <span>•</span>
                                <span>₱${product.price.toFixed(2)}</span>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right" style="color: #999; font-size: 0.85rem;"></i>
                    `;
                    productItem.onmouseenter = function() {
                        this.style.background = '#f0f0f0';
                    };
                    productItem.onmouseleave = function() {
                        this.style.background = '#fff';
                    };
                    dropdown.appendChild(productItem);
                }
                
                // Show "View All Results" if there are more products
                if (products.length > productLimit) {
                    const viewAllResults = document.createElement('div');
                    viewAllResults.className = 'suggestion-item';
                    viewAllResults.style.cssText = 'padding: 0.75rem 1rem; cursor: pointer; text-align: center; color: #006923; font-weight: 600; background: #f8f9fa;';
                    viewAllResults.textContent = `View All ${products.length} Products`;
                    viewAllResults.onclick = function() {
                        window.location.href = `explore.html?q=${encodeURIComponent(query)}`;
                    };
                    dropdown.appendChild(viewAllResults);
                }
            }
            
            // Always show dropdown if we have any content, otherwise hide it
            if (dropdown.children.length > 0) {
                dropdown.style.display = 'block';
            } else {
                // Show "No results" message
                const noResults = document.createElement('div');
                noResults.style.cssText = 'padding: 2rem 1rem; text-align: center; color: #999;';
                noResults.innerHTML = `
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <div>No results found for "${query}"</div>
                `;
                dropdown.appendChild(noResults);
                dropdown.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Search error:', error);
            dropdown.style.display = 'none';
        }
    }
    
    // Navigate suggestions with arrow keys
    function navigateSuggestions(direction, dropdown) {
        const items = dropdown.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;
        
        let currentIndex = -1;
        items.forEach((item, index) => {
            if (item.classList.contains('highlighted')) {
                currentIndex = index;
                item.classList.remove('highlighted');
                item.style.background = '';
            }
        });
        
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = items.length - 1;
        if (currentIndex >= items.length) currentIndex = 0;
        
        items[currentIndex].classList.add('highlighted');
        items[currentIndex].style.background = '#e8f5e9';
        items[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

    // AI Assistant Function - Answers questions about JBR7 Bags system
    function generateAIResponse(userMessage) {
        if (!userMessage || typeof userMessage !== 'string') {
            return "I am JBR7 AI! Please ask me a question about JBR7 Bags Manufacturing.";
        }
        const message = userMessage.toLowerCase().trim();
        
        // Greetings
        if (message.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/)) {
            return "Hello! 👋 Welcome to JBR7 Bags Manufacturing. I am JBR7 AI and I am here to help you with any questions about our products, orders, shipping, customization, or anything else. How can I assist you today?";
        }
        
        // Navigation/Pages
        if (message.match(/(how to|where|navigate|go to|find|access|page|section)/)) {
            if (message.match(/(home|main|landing)/)) {
                return "To go to the home page, click the 'Home' icon in the header navigation, or visit home.html. The home page shows our featured products and main content.";
            }
            if (message.match(/(explore|products|browse|shop|items)/)) {
                return "To explore our products, click the 'Explore' icon in the header. You can filter by category (Tote Bags, Backpacks, Module Bags, etc.) and sort by price, rating, or newest items.";
            }
            if (message.match(/(saved|bookmark|favorites|wishlist)/)) {
                return "To view your saved items, click the 'Saved' icon (bookmark) in the header. You can save products by clicking the bookmark icon on any product card.";
            }
            if (message.match(/(cart|shopping cart|checkout|buy)/)) {
                return "To view your cart, click the shopping cart icon in the header. You can add items to cart from the Explore page or product view page, then proceed to checkout.";
            }
            if (message.match(/(contact|support|help|customer service)/)) {
                return "To contact us, click 'Contact Us' in the header. You can also use the Customer Service button on the contact page to open this chat. Our email is roquejennylynbatac@gmail.com and phone is 09216821649.";
            }
            if (message.match(/(profile|account|settings|user)/)) {
                return "To access your profile or settings, click the profile icon or settings icon in the header. You can manage your account information, preferences, and more there.";
            }
            return "You can navigate using the header menu:\n• Home - Main page\n• Explore - Browse products\n• Saved - Your saved items\n• Cart - Shopping cart\n• Contact Us - Support\n• Settings - Account settings\n• Messages - This chat\n• Profile - Your account";
        }
        
        // Product Information
        if (message.match(/(product|bag|what do you have|types|varieties|available|offer|sell)/)) {
            return "We offer various bag types:\n• Tote Bags (Eco Colored, White, Black) - Starting from ₱55\n• Backpacks (Plain, Two Colors, Katrina series) - Starting from ₱180\n• Module Bags - ₱90\n• Envelope Bags - ₱70\n• Riki, Vanity, and Ringlight Bags - Starting from ₱400\n• Kiddie Bags (Boys & Girls) - ₱140\n\nBrowse our Explore page to see all products with details, prices, and images!";
        }
        
        // Price inquiries
        if (message.match(/(price|cost|how much|pricing|afford|expensive|cheap|budget)/)) {
            return "Our prices vary by product:\n• Standard bags: Starting from ₱55\n• Custom bags with logos: Starting from ₱70\n• Backpacks: ₱180-₱850\n• Special bags (Riki, Vanity, Ringlight): ₱400-₱500\n\nBulk order discounts:\n• 10% off for 100+ units\n• 15% off for 500+ units\n• 20% off for 1000+ units\n\nFor specific quotes, visit the Explore page or contact us directly!";
        }
        
        // Ordering process
        if (message.match(/(order|buy|purchase|how to order|place order|order process|add to cart|checkout)/)) {
            return "To place an order:\n1. Go to the Explore page\n2. Browse and select products\n3. Click 'Add to Cart' or customize first\n4. View your cart (cart icon in header)\n5. Proceed to checkout\n\nFor custom orders:\n• Email: roquejennylynbatac@gmail.com\n• Minimum: 50 units for custom designs\n• We'll confirm details within 24 hours\n\nYou can also save items for later using the bookmark icon!";
        }
        
        // Shipping & Delivery
        if (message.match(/(shipping|delivery|how long|when will|deliver|arrive|ship|track|tracking)/)) {
            return "Shipping Information:\n• Standard orders: 3-5 business days\n• Custom orders: 7-14 business days\n• Express shipping: Available (additional fee)\n• Tracking: Provided via email once shipped\n• International shipping: Available\n• Free shipping: Available with vouchers\n\nYou'll receive tracking information via email once your order ships!";
        }
        
        // Payment methods
        if (message.match(/(payment|pay|credit card|cash|method|how to pay|accepted|payment option)/)) {
            return "We accept:\n• Credit cards (Visa, Mastercard, American Express)\n• Debit cards\n• PayPal\n• Bank transfers\n• Cash on delivery (local orders)\n• Flexible payment terms (bulk orders)\n• Installment options available\n\nAll payments are secure and processed safely.";
        }
        
        // Customization
        if (message.match(/(custom|customize|logo|design|personalize|colors|material|print|embroidery)/)) {
            return "Customization Options:\n• Logo printing (screen print, embroidery, heat transfer)\n• Custom colors\n• Material selection (canvas, jute, leather, nylon)\n• Size adjustments\n• Custom pockets and compartments\n• Special hardware\n\nRequirements:\n• Minimum order: 50 units\n• Design files: AI, EPS, PDF, PNG (high res), JPG\n• Sample available (fee refunded on bulk order)\n\nContact us at roquejennylynbatac@gmail.com for custom orders!";
        }
        
        // Returns & Refunds
        if (message.match(/(return|refund|exchange|wrong|defective|broken|damaged|problem|issue)/)) {
            return "Return Policy:\n• Standard products: 30-day return (unused, with tags)\n• Custom orders: Returns only for manufacturing defects\n• Defective items: Free replacement or full refund\n• Contact us immediately with photos if issues arise\n• No return needed for defective items (unless requested)\n\nTo initiate a return, contact us at roquejennylynbatac@gmail.com or use the Contact Us page.";
        }
        
        // Contact Information
        if (message.match(/(contact|email|phone|number|reach|talk to|address|location|where are you)/)) {
            return "Contact Information:\n📧 Email: roquejennylynbatac@gmail.com\n📱 Phone: 09216821649\n⏰ Hours: Mon-Fri, 9AM - 6PM\n📍 Address: 059 Purok 1, Culianin, Plaridel, Bulacan\n💬 Facebook: Visit our page for instant messaging\n\nYou can also use the Contact Us page or this chat for assistance!";
        }
        
        // Bulk Orders
        if (message.match(/(bulk|wholesale|minimum|quantity|discount|corporate|business|large order)/)) {
            return "Bulk Order Benefits:\n• 10% discount: 100+ units\n• 15% discount: 500+ units\n• 20% discount: 1000+ units\n• Custom pricing available\n• Flexible payment terms\n• Corporate partnerships welcome\n\nCustom orders:\n• Minimum: 50 units\n• Smaller quantities: Additional setup fee\n\nContact us for a custom quote tailored to your needs!";
        }
        
        // Samples
        if (message.match(/(sample|preview|see before|trial|test|example|demo)/)) {
            return "Yes! We offer samples:\n• Sample products available for evaluation\n• Custom order samples: Available with your design\n• Sample fee: Small fee (refunded when you place bulk order)\n• Ensures satisfaction before large orders\n\nRequest samples by emailing roquejennylynbatac@gmail.com!";
        }
        
        // Features/Services
        if (message.match(/(feature|service|what can|capabilities|what do you|help with|assist)/)) {
            return "I can help you with:\n• Product information and browsing\n• Pricing and quotes\n• Order placement and process\n• Shipping and delivery\n• Payment methods\n• Customization options\n• Returns and refunds\n• Bulk order discounts\n• Sample requests\n• Navigation help\n• General questions about JBR7 Bags\n\nJust ask me anything!";
        }
        
        // Account/Profile
        if (message.match(/(account|profile|login|sign in|sign up|register|user|my account)/)) {
            return "Account Features:\n• Sign In/Sign Up: Available from the header\n• Profile: Manage your account information\n• Saved Items: Bookmark products you like\n• Cart: View and manage your shopping cart\n• Order History: Track your orders\n• Settings: Customize preferences\n\nTo access your account, click the profile icon or sign in from the header.";
        }
        
        // Cart/Saved Items
        if (message.match(/(cart|saved|bookmark|remove|delete|clear|empty|items in)/)) {
            if (message.match(/(saved|bookmark)/)) {
                return "Saved Items:\n• Click the bookmark icon on any product to save it\n• View saved items: Click 'Saved' in header\n• Remove: Click bookmark again or remove from saved page\n• Saved items persist across sessions\n\nYour saved items are stored locally and can be accessed anytime!";
            }
            if (message.match(/(cart|shopping cart)/)) {
                return "Shopping Cart:\n• Add items: Click 'Add to Cart' on products\n• View cart: Click cart icon in header\n• Remove items: Use remove button in cart\n• Update quantity: Adjust in cart page\n• Checkout: Proceed from cart page\n\nYour cart is saved and persists across sessions!";
            }
        }
        
        // Search/Filter
        if (message.match(/(search|filter|find|sort|category|browse|look for)/)) {
            return "Search & Filter Options:\n• Explore Page: Filter by category (Tote, Backpack, Module, etc.)\n• Sort Options: Price (Low/High), Highest Rated, Newest, Featured\n• Categories: All, Tote Bag, Backpack, Module & Envelopes, RVR bags, Kiddie Bags\n• Search: Use the search icon in header (coming soon)\n\nVisit the Explore page to filter and sort products!";
        }
        
        // Sustainability/Eco-friendly
        if (message.match(/(eco|environment|green|sustainable|recycle|organic|material|environmental)/)) {
            return "Sustainability:\n• Eco-friendly materials used\n• Recycled materials available\n• Organic cotton options\n• Biodegradable jute\n• Eco-friendly dyes\n• Minimal, recyclable packaging\n• Environmental certifications\n\nWe are committed to sustainable manufacturing practices!";
        }
        
        // Thank you responses
        if (message.match(/(thank|thanks|appreciate|great|helpful|perfect|awesome|good)/)) {
            return "You are very welcome! 😊 I am glad I could help. Is there anything else you would like to know about our products, orders, or services? Feel free to ask anytime!";
        }
        
        // Goodbye
        if (message.match(/(bye|goodbye|see you|later|farewell|exit|leave)/)) {
            return "Goodbye! 👋 Thank you for chatting with JBR7 Bags Manufacturing. If you need any help in the future, just open this chat again. Have a great day!";
        }
        
        // Default/General Help
        return "I am JBR7 AI! I can assist with:\n\n📦 Products & Pricing\n🛒 Ordering & Cart\n🚚 Shipping & Delivery\n💳 Payment Methods\n🎨 Customization\n↩️ Returns & Refunds\n📞 Contact Information\n📊 Bulk Orders\n\nTry asking about:\n• 'How do I place an order?'\n• 'What products do you have?'\n• 'What are your prices?'\n• 'How do I customize bags?'\n• 'What is your return policy?'\n\nOr ask me anything else about our services!";
    }

    function onSend(){
        const txt = (inputEl && inputEl.value || '').trim();
        if(!txt) return;
        const msgs = loadMessages();
        const m = { id: Date.now(), text: txt, ts: Date.now(), direction: 'out' };
        msgs.push(m); saveMessages(msgs); renderMessages(); inputEl.value = '';
        // AI-generated reply
        setTimeout(()=>{ 
            try {
                if (typeof generateAIResponse !== 'function') {
                    console.error('[JBR7Messenger] generateAIResponse function not found');
                    const reply = { 
                        id: Date.now()+1, 
                        text: 'I apologize, but JBR7 AI is not available. Please contact us at roquejennylynbatac@gmail.com for assistance.', 
                        ts: Date.now(), 
                        direction: 'in' 
                    }; 
                    const arr = loadMessages(); 
                    arr.push(reply); 
                    saveMessages(arr); 
                    renderMessages();
                    return;
                }
                const aiResponse = generateAIResponse(txt);
                if (!aiResponse || aiResponse.trim() === '') {
                    console.warn('[JBR7Messenger] Empty AI response');
                    const reply = { 
                        id: Date.now()+1, 
                        text: 'I am here to help! Could you please rephrase your question?', 
                        ts: Date.now(), 
                        direction: 'in' 
                    }; 
                    const arr = loadMessages(); 
                    arr.push(reply); 
                    saveMessages(arr); 
                    renderMessages();
                    return;
                }
                const reply = { 
                    id: Date.now()+1, 
                    text: aiResponse, 
                    ts: Date.now(), 
                    direction: 'in' 
                }; 
                const arr = loadMessages(); 
                arr.push(reply); 
                saveMessages(arr); 
                renderMessages();
            } catch(e) {
                console.error('[JBR7Messenger] AI response error:', e);
                // Fallback response if AI function fails
                const reply = { 
                    id: Date.now()+1, 
                    text: 'I apologize, but I encountered an error. Please try rephrasing your question or contact us at roquejennylynbatac@gmail.com for assistance.', 
                    ts: Date.now(), 
                    direction: 'in' 
                }; 
                const arr = loadMessages(); 
                arr.push(reply); 
                saveMessages(arr); 
                renderMessages();
            }
        }, 800 + Math.random()*800);
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
        // Use user-specific storage - REQUIRED for data isolation
        if (typeof UserStorage === 'undefined' || !UserStorage) {
            return 0;
        }
        
        const data = UserStorage.getItem('cart');
        const arr = JSON.parse(data || '[]');
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
