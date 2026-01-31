/* Shared notifications library for all pages
   - When user is logged in, fetches notifications from API (every order + every status change).
   - Uses localStorage key 'jbr7_notifications' when not logged in.
   - Exposes functions to render a panel, update the badge, mark read, and add notifications.
*/

(function(){
    const STORAGE_KEY = 'jbr7_notifications';
    const NS = 'jbr7'; // namespace prefix for DOM classes to avoid collisions
    var serverNotificationsCache = null; // when logged in, list from API

    function getUserId() {
        try {
            return sessionStorage.getItem('jbr7_user_id') || null;
        } catch (e) {
            return null;
        }
    }

    function formatTime(createdAt) {
        if (!createdAt) return 'Just now';
        var d = new Date(createdAt);
        var now = new Date();
        var diff = (now - d) / 60000;
        if (diff < 1) return 'Just now';
        if (diff < 60) return Math.floor(diff) + 'm ago';
        if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
        if (diff < 10080) return Math.floor(diff / 1440) + 'd ago';
        return d.toLocaleDateString();
    }

    function loadNotifications() {
        var userId = getUserId();
        if (userId && serverNotificationsCache) {
            return serverNotificationsCache;
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY, '[]');
                return [];
            }
            const arr = JSON.parse(raw) || [];
            const dummyTitles = ['Order Shipped', 'Special Discount', 'New Product Launch'];
            const filtered = Array.isArray(arr) ? arr.filter(function (n) {
                return !n || !dummyTitles.some(function (t) { return (n.title || '').indexOf(t) !== -1; });
            }) : [];
            if (filtered.length !== (Array.isArray(arr) ? arr.length : 0)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            }
            return filtered;
        } catch (e) {
            console.error('Failed to load notifications', e);
            localStorage.setItem(STORAGE_KEY, '[]');
            return [];
        }
    }

    var lastFetchError = null;

    function fetchServerNotifications() {
        var userId = getUserId();
        if (!userId) return Promise.resolve([]);
        lastFetchError = null;
        var base = (typeof window !== 'undefined' && window.JBR7_API_BASE) ? window.JBR7_API_BASE : '';
        var apiUrl = base + '/api/get?action=notifications&userId=' + encodeURIComponent(userId);
        return fetch(apiUrl, { credentials: 'same-origin' })
            .then(function (r) {
                if (!r.ok) {
                    lastFetchError = 'API ' + r.status;
                    throw new Error('API returned ' + r.status);
                }
                return r.json();
            })
            .then(function (data) {
                if (!data || !data.success) {
                    lastFetchError = (data && data.error) ? data.error : 'Invalid response';
                    return serverNotificationsCache || [];
                }
                var list = (data.data && Array.isArray(data.data)) ? data.data : [];
                lastFetchError = null;
                serverNotificationsCache = list.map(function (n) {
                    return {
                        id: n.id,
                        type: (n.notification_type === 'order_status' ? 'orders' : n.notification_type) || 'orders',
                        title: n.title || 'Notification',
                        message: n.message || '',
                        time: formatTime(n.created_at),
                        read: !!n.is_read,
                        icon: n.notification_type === 'order_status' ? 'fa-box' : 'fa-info-circle'
                    };
                });
                return serverNotificationsCache;
            })
            .catch(function (e) {
                console.error('Failed to fetch notifications', e);
                if (!lastFetchError) lastFetchError = e && e.message ? e.message : 'Connection failed';
                return serverNotificationsCache || [];
            });
    }

    function saveNotifications(arr) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
        } catch (e) {
            console.error('Failed to save notifications', e);
        }
    }

    // Create DOM for panel on demand (id/class names scoped with namespace)
    function ensurePanelExists() {
        if (document.getElementById(NS + '-notification-panel')) return;

        const panelHTML = `
            <div id="${NS}-notification-panel" class="${NS}-notification-panel" aria-hidden="true">
                <div class="${NS}-notification-header">
                    <h3><i class="fas fa-bell"></i> Notifications</h3>
                    <button class="${NS}-close-panel" aria-label="Close notifications"><i class="fas fa-times"></i></button>
                </div>
                <div class="${NS}-notification-filters">
                    <button class="${NS}-filter-btn active" data-filter="all">All</button>
                    <button class="${NS}-filter-btn" data-filter="orders">Orders</button>
                </div>
                <div class="${NS}-notifications-list"></div>
                <div class="${NS}-notification-footer">
                    <button id="${NS}-markAllBtn">Mark all as read</button>
                    <button id="${NS}-clearAllBtn">Clear all</button>
                </div>
            </div>
            <div id="${NS}-notification-overlay" class="${NS}-notification-overlay" tabindex="-1"></div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = panelHTML;
        // inject styles scoped to namespace to avoid conflicting with existing CSS
        const style = document.createElement('style');
        style.id = NS + '-notification-styles';
        style.textContent = `
            .${NS}-notification-panel{position:fixed;top:0;right:-420px;width:400px;height:100vh;background:#fff;box-shadow:-2px 0 10px rgba(0,0,0,0.08);transition:right 0.28s ease;z-index:1200;display:flex;flex-direction:column}
            .${NS}-notification-panel.active{right:0}
            .${NS}-notification-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.45);display:none;z-index:1199}
            .${NS}-notification-overlay.active{display:block}
            .${NS}-notification-header{display:flex;justify-content:space-between;align-items:center;padding:18px;border-bottom:1px solid #e6f4ea;background:#0a7a3a;color:#fff}
            .${NS}-notification-header h3{margin:0;font-size:18px;display:flex;align-items:center;gap:10px}
            .${NS}-close-panel{background:none;border:none;color:#fff;font-size:20px;cursor:pointer}
            .${NS}-notification-filters{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid #f0f8f2;background:#f9fff7;overflow-x:auto}
            .${NS}-filter-btn{padding:7px 14px;border:1px solid #dfeee0;background:#fff;border-radius:20px;cursor:pointer;white-space:nowrap}
            .${NS}-filter-btn.active{background:#0a7a3a;color:#fff;border-color:#0a7a3a}
            .${NS}-notifications-list{flex:1;overflow-y:auto;padding:8px 0;background:#fff}
            .${NS}-notification-item{padding:14px 18px;border-bottom:1px solid #f0f0f0;cursor:pointer;position:relative}
            .${NS}-notification-item.unread{background:#eef9ec}
            .${NS}-notification-item.unread::before{content:'';position:absolute;left:12px;top:50%;transform:translateY(-50%);width:8px;height:8px;background:#0a7a3a;border-radius:50%}
            .${NS}-notification-content{margin-left:12px}
            .${NS}-notification-title{font-weight:600;margin-bottom:6px;color:#333;display:flex;align-items:center;gap:8px}
            .${NS}-notification-message{font-size:14px;color:#666;margin-bottom:6px}
            .${NS}-notification-time{font-size:12px;color:#999}
            .${NS}-notification-footer{display:flex;gap:10px;padding:12px 16px;border-top:1px solid #e6f4ea;background:#f9fff7}
            .${NS}-notification-footer button{flex:1;padding:10px;border:1px solid #dfeee0;background:#fff;border-radius:6px;cursor:pointer}
            .${NS}-notification-footer button:hover{background:#0a7a3a;color:#fff;border-color:#0a7a3a}
            .${NS}-notification-badge{position:absolute;top:-6px;right:-6px;background:#ff4444;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
            @media(max-width:768px){.${NS}-notification-panel{width:100%;right:-100%}}
        `;

        document.body.appendChild(style);
        document.body.appendChild(wrapper);

        // wire up close buttons and overlay
        const panel = document.getElementById(NS + '-notification-panel');
        const overlay = document.getElementById(NS + '-notification-overlay');
        panel.querySelector('.' + NS + '-close-panel').addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);
    }

    function updateBadgeElement(bellEl, count) {
        if (!bellEl) return;
        const existing = bellEl.querySelector('.' + NS + '-notification-badge');
        if (existing) existing.remove();
        if (count > 0) {
            const b = document.createElement('span');
            b.className = NS + '-notification-badge';
            b.textContent = count > 9 ? '9+' : count;
            bellEl.style.position = 'relative';
            bellEl.appendChild(b);
        }
    }

    function updateNotificationBadge() {
        const notifications = loadNotifications();
        const unreadCount = notifications.filter(function (n) { return !n.read; }).length;
        const bellIcon = document.querySelector('a[data-page="notifications"]');
        if (!bellIcon) return;
        updateBadgeElement(bellIcon, unreadCount);
    }

    function renderList(filteredNotifications, container) {
        if (!container) return;
        if (!filteredNotifications || filteredNotifications.length === 0) {
            var emptyMsg = lastFetchError
                ? '<p>Unable to load notifications</p><button type="button" class="' + NS + '-retry-btn" style="margin-top:0.5rem;padding:0.4rem 0.8rem;background:#0a7a3a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.9rem;">Retry</button>'
                : '<p>No notifications</p>';
            container.innerHTML = '<div class="' + NS + '-empty-notifications"><i class="fas fa-bell-slash"></i>' + emptyMsg + '</div>';
            var retryBtn = container.querySelector('.' + NS + '-retry-btn');
            if (retryBtn) retryBtn.onclick = function() { lastFetchError = null; fetchServerNotifications().then(function() { applyFilter(currentFilter, container); updateNotificationBadge(); }); };
            updateNotificationBadge();
            return;
        }

        container.innerHTML = filteredNotifications.map(notification => `
            <div class="${NS}-notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                <div class="${NS}-notification-content">
                    <div class="${NS}-notification-title">
                        <i class="fas ${notification.icon} ${NS}-notification-type-icon ${notification.type}"></i>
                        ${notification.title}
                    </div>
                    <div class="${NS}-notification-message">${notification.message}</div>
                    <div class="${NS}-notification-time">${notification.time}</div>
                </div>
            </div>
        `).join('');

        // attach click handlers
        container.querySelectorAll('.' + NS + '-notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                markAsRead(id);
                // update view after marking
                applyFilter(currentFilter, container);
            });
        });
    }

    let currentFilter = 'all';

    function applyFilter(filter, container) {
        const all = loadNotifications();
        const filtered = filter === 'all' ? all : all.filter(n => n.type === filter);
        renderList(filtered, container);
    }

    function markAsRead(id) {
        const notifications = loadNotifications();
        const n = notifications.find(x => x.id === id);
        if (n && !n.read) {
            n.read = true;
            saveNotifications(notifications);
            updateNotificationBadge();
        }
    }

    function markAllAsRead() {
        const notifications = loadNotifications();
        notifications.forEach(n => n.read = true);
        saveNotifications(notifications);
        updateNotificationBadge();
        const container = document.querySelector('.' + NS + '-notifications-list');
        applyFilter(currentFilter, container);
    }

    function clearAllNotifications() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            saveNotifications([]);
            updateNotificationBadge();
            const container = document.querySelector('.' + NS + '-notifications-list');
            applyFilter(currentFilter, container);
        }
    }

    function addNotification(type, title, message) {
        const notifications = loadNotifications();
        const newNotification = {
            id: (notifications.length ? Math.max(...notifications.map(n => n.id)) : 0) + 1,
            type,
            title,
            message,
            time: 'Just now',
            read: false,
            icon: type === 'orders' ? 'fa-box' : type === 'promotions' ? 'fa-tag' : 'fa-info-circle'
        };
        notifications.unshift(newNotification);
        saveNotifications(notifications);
        updateNotificationBadge();
        if (typeof showNotification === 'function') showNotification(`New notification: ${title}`, 'info');
    }

    // Panel controls
    function openPanel() {
        ensurePanelExists();
        const panel = document.getElementById(NS + '-notification-panel');
        const overlay = document.getElementById(NS + '-notification-overlay');
        currentFilter = 'all';
        // update filter button states
        const filterBtns = panel.querySelectorAll('.' + NS + '-filter-btn');
        filterBtns.forEach(b => b.classList.remove('active'));
        filterBtns[0] && filterBtns[0].classList.add('active');
        panel.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        const container = panel.querySelector('.' + NS + '-notifications-list');
        if (getUserId()) {
            fetchServerNotifications().then(function () {
                updateNotificationBadge();
                applyFilter('all', container);
            });
        } else {
            applyFilter('all', container);
        }

        // wire filter buttons (idempotent)
        filterBtns.forEach(btn => {
            btn.removeEventListener('click', filterBtnHandler);
            btn.addEventListener('click', filterBtnHandler);
        });

        // footer buttons
        const markAll = document.getElementById(NS + '-markAllBtn');
        const clearAll = document.getElementById(NS + '-clearAllBtn');
        markAll && (markAll.onclick = () => { markAllAsRead(); });
        clearAll && (clearAll.onclick = () => { clearAllNotifications(); });
    }

    function filterBtnHandler(e) {
        const filter = e.currentTarget.dataset.filter;
        currentFilter = filter;
        const panel = document.getElementById(NS + '-notification-panel');
        if (!panel) return;
        panel.querySelectorAll('.' + NS + '-filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const container = panel.querySelector('.' + NS + '-notifications-list');
        applyFilter(filter, container);
    }

    function closePanel() {
        const panel = document.getElementById(NS + '-notification-panel');
        const overlay = document.getElementById(NS + '-notification-overlay');
        if (panel) panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // expose API
    window.JBR7Notifications = Object.assign(window.JBR7Notifications || {}, {
        loadNotifications,
        saveNotifications,
        updateNotificationBadge,
        openPanel,
        closePanel,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        addNotification
    });

    // Initialize badge and bell behavior; when logged in, fetch from server so badge is correct
    document.addEventListener('DOMContentLoaded', function() {
        if (getUserId()) {
            fetchServerNotifications().then(function () {
                updateNotificationBadge();
            });
        } else {
            updateNotificationBadge();
        }
        var bell = document.querySelector('a[data-page="notifications"]');
        if (bell) {
            bell.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.JBR7Notifications && typeof window.JBR7Notifications.openPanel === 'function') {
                    window.JBR7Notifications.openPanel();
                }
            });
        }
    });
})();
