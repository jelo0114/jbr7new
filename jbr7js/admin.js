(function() {
    'use strict';

    var API_BASE = (typeof window !== 'undefined' && window.JBR7_API_BASE) ? window.JBR7_API_BASE : '';
    var SECTION_TITLES = {
        overview: 'Dashboard Overview',
        orders: 'Order Management',
        users: 'User Management',
        items: 'Products',
        reviews: 'Reviews',
        reports: 'Download Reports',
        analytics: 'Analytics & Reporting',
        settings: 'Settings'
    };

    function getAdminId() {
        try { return sessionStorage.getItem('jbr7_admin_id') || ''; } catch (e) { return ''; }
    }

    function checkAdmin() {
        var id = getAdminId();
        if (!id || id === 'undefined') {
            window.location.href = 'adminlogin.html';
            return false;
        }
        return true;
    }

    function setAdminName() {
        var name = sessionStorage.getItem('jbr7_admin_name') || 'Admin';
        var el = document.getElementById('admin-name');
        if (el) el.textContent = name;
    }

    function fetchApiGet(action, extraParams) {
        var adminId = getAdminId();
        if (!adminId) return Promise.reject(new Error('Not logged in'));
        var params = new URLSearchParams({ action: action, adminId: adminId });
        if (extraParams) Object.keys(extraParams).forEach(function(k) { params.set(k, extraParams[k]); });
        return fetch(API_BASE + '/api/get?' + params.toString(), { credentials: 'same-origin' })
            .then(function(r) {
                if (!r.ok) throw new Error('Request failed');
                return r.json();
            })
            .then(function(data) {
                if (data.success === false && data.error) throw new Error(data.error);
                return data;
            });
    }

    function fetchApiPost(body) {
        var adminId = getAdminId();
        if (!adminId) return Promise.reject(new Error('Not logged in'));
        var payload = Object.assign({}, body, { adminId: adminId });
        return fetch(API_BASE + '/api/post', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success === false && data.error) throw new Error(data.error);
                return data;
            });
    }

    function formatDate(str) {
        if (!str) return '-';
        var d = new Date(str);
        return isNaN(d.getTime()) ? str : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function statusClass(s) {
        s = (s || '').toLowerCase();
        if (s === 'delivered') return 'status-delivered';
        if (s === 'shipped') return 'status-shipped';
        if (s === 'confirmed') return 'status-confirmed';
        if (s === 'cancelled') return 'status-cancelled';
        return 'status-processing';
    }

    // ---------- Overview ----------
    function loadOverview() {
        function setStat(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val;
        }
        setStat('stat-users', '-');
        setStat('stat-orders', '-');
        setStat('stat-items', '-');
        setStat('stat-reviews', '-');
        Promise.all([
            fetchApiGet('admin-users').then(function(d) { return (d.data && d.data.length) || 0; }),
            fetchApiGet('admin-orders').then(function(d) { return (d.data && d.data.length) || 0; }),
            fetchApiGet('admin-items').then(function(d) { return (d.data && d.data.length) || 0; }),
            fetchApiGet('admin-reviews').then(function(d) { return (d.data && d.data.length) || 0; })
        ]).then(function(arr) {
            setStat('stat-users', arr[0]);
            setStat('stat-orders', arr[1]);
            setStat('stat-items', arr[2]);
            setStat('stat-reviews', arr[3]);
        }).catch(function() {
            setStat('stat-users', '—');
            setStat('stat-orders', '—');
            setStat('stat-items', '—');
            setStat('stat-reviews', '—');
        });
    }

    // ---------- Orders (name, order count, status badge) ----------
    function loadOrders() {
        var tbody = document.getElementById('orders-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
        fetchApiGet('admin-orders').then(function(res) {
            var list = res.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No orders</td></tr>';
                return;
            }
            tbody.innerHTML = list.map(function(o) {
                var status = (o.status || 'processing').toLowerCase();
                var customerName = (o.user && (o.user.username || o.user.email)) ? (o.user.username || o.user.email) : 'User #' + (o.user_id || '-');
                var orderCount = o.user_order_count != null ? o.user_order_count : '-';
                return '<tr>' +
                    '<td>' + (o.order_number || o.id) + '</td>' +
                    '<td>' + escapeHtml(customerName) + '</td>' +
                    '<td>' + orderCount + '</td>' +
                    '<td>' + (o.total != null ? o.total : '-') + '</td>' +
                    '<td><span class="status-badge ' + statusClass(status) + '">' + status + '</span></td>' +
                    '<td>' + formatDate(o.created_at) + '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load orders</td></tr>';
        });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    // ---------- Users ----------
    function loadUsers() {
        var tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading...</td></tr>';
        fetchApiGet('admin-users').then(function(res) {
            var list = res.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No users</td></tr>';
                return;
            }
            tbody.innerHTML = list.map(function(u) {
                return '<tr><td>' + (u.id || '-') + '</td><td>' + escapeHtml(u.username || '-') + '</td><td>' + escapeHtml(u.email || '-') + '</td><td>' + (u.points != null ? u.points : '-') + '</td><td>' + formatDate(u.created_at) + '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Failed to load users</td></tr>';
        });
    }

    // ---------- Items ----------
    function loadItems() {
        var tbody = document.getElementById('items-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
        fetchApiGet('admin-items').then(function(res) {
            var list = res.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No products</td></tr>';
                return;
            }
            tbody.innerHTML = list.map(function(i) {
                return '<tr><td>' + (i.id || '-') + '</td><td>' + escapeHtml(i.item_id || '-') + '</td><td>' + escapeHtml(i.title || '-') + '</td><td>' + (i.price != null ? i.price : '-') + '</td><td>' + escapeHtml(i.category || '-') + '</td><td>' + (i.rating != null ? i.rating : '-') + '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load products</td></tr>';
        });
    }

    // ---------- Reviews ----------
    function loadReviews() {
        var tbody = document.getElementById('reviews-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading...</td></tr>';
        fetchApiGet('admin-reviews').then(function(res) {
            var list = res.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No reviews</td></tr>';
                return;
            }
            tbody.innerHTML = list.map(function(r) {
                var comment = (r.comment || '').toString();
                if (comment.length > 60) comment = comment.substring(0, 60) + '...';
                return '<tr><td>' + (r.user_id || '-') + '</td><td>' + escapeHtml(r.product_title || r.item_id || '-') + '</td><td>' + (r.rating != null ? r.rating : '-') + '</td><td>' + escapeHtml(comment) + '</td><td>' + formatDate(r.created_at) + '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Failed to load reviews</td></tr>';
        });
    }

    // ---------- Download Reports (CSV) ----------
    function csvEscape(val) {
        if (val == null) return '';
        var s = String(val);
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }

    function downloadCsv(filename, rows, headers) {
        var line = headers.map(csvEscape).join(',');
        var body = rows.map(function(row) { return headers.map(function(h) { return csvEscape(row[h]); }).join(','); }).join('\n');
        var blob = new Blob([line + '\n' + body], { type: 'text/csv;charset=utf-8;' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function downloadOrdersReport() {
        fetchApiGet('admin-orders').then(function(res) {
            var list = res.data || [];
            var headers = ['order_number', 'customer', 'customer_orders', 'total', 'status', 'created_at'];
            var rows = list.map(function(o) {
                var name = (o.user && (o.user.username || o.user.email)) ? (o.user.username || o.user.email) : 'User #' + (o.user_id || '');
                return {
                    order_number: o.order_number || o.id,
                    customer: name,
                    customer_orders: o.user_order_count,
                    total: o.total,
                    status: o.status,
                    created_at: o.created_at || ''
                };
            });
            downloadCsv('jbr7-orders-report-' + new Date().toISOString().slice(0, 10) + '.csv', rows, headers);
        }).catch(function() { alert('Failed to load orders for report'); });
    }

    function downloadUsersReport() {
        fetchApiGet('admin-users').then(function(res) {
            var list = res.data || [];
            var headers = ['id', 'username', 'email', 'points', 'created_at'];
            var rows = list.map(function(u) {
                return { id: u.id, username: u.username, email: u.email, points: u.points, created_at: u.created_at || '' };
            });
            downloadCsv('jbr7-users-report-' + new Date().toISOString().slice(0, 10) + '.csv', rows, headers);
        }).catch(function() { alert('Failed to load users for report'); });
    }

    function downloadProductsReport() {
        fetchApiGet('admin-items').then(function(res) {
            var list = res.data || [];
            var headers = ['id', 'item_id', 'title', 'price', 'category', 'rating', 'review_count'];
            var rows = list.map(function(i) {
                return { id: i.id, item_id: i.item_id, title: i.title, price: i.price, category: i.category, rating: i.rating, review_count: i.review_count };
            });
            downloadCsv('jbr7-products-report-' + new Date().toISOString().slice(0, 10) + '.csv', rows, headers);
        }).catch(function() { alert('Failed to load products for report'); });
    }

    // ---------- Sidebar & sections ----------
    function setPageTitle(sectionId) {
        var el = document.getElementById('page-title');
        if (el) el.textContent = SECTION_TITLES[sectionId] || 'Admin';
    }

    function switchSection(sectionId) {
        document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
        document.querySelectorAll('.nav-item').forEach(function(t) {
            t.classList.remove('active');
            if (t.getAttribute('data-section') === sectionId) t.classList.add('active');
        });
        var section = document.getElementById('section-' + sectionId);
        if (section) section.classList.add('active');
        setPageTitle(sectionId);
        if (sectionId === 'overview') loadOverview();
        if (sectionId === 'orders') loadOrders();
        if (sectionId === 'users') loadUsers();
        if (sectionId === 'items') loadItems();
        if (sectionId === 'reviews') loadReviews();
        if (sectionId === 'settings') loadSettings();
    }

    function loadSettings() {
        var nameEl = document.getElementById('settings-admin-name');
        var emailEl = document.getElementById('settings-admin-email');
        if (nameEl) nameEl.textContent = sessionStorage.getItem('jbr7_admin_name') || '—';
        if (emailEl) emailEl.textContent = sessionStorage.getItem('jbr7_admin_email') || '—';
        var logoutBtn = document.getElementById('settings-logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = function() { logout(); };
        }
    }

    function logout() {
        sessionStorage.removeItem('jbr7_admin_id');
        sessionStorage.removeItem('jbr7_admin_email');
        sessionStorage.removeItem('jbr7_admin_name');
        window.location.href = 'adminlogin.html';
    }

    function init() {
        if (!checkAdmin()) return;
        setAdminName();
        loadOverview();

        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                switchSection(this.getAttribute('data-section'));
            });
        });

        var logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', function(e) { e.preventDefault(); logout(); });

        var refreshOrders = document.getElementById('refresh-orders');
        if (refreshOrders) refreshOrders.addEventListener('click', function() { loadOrders(); });
        var refreshUsers = document.getElementById('refresh-users');
        if (refreshUsers) refreshUsers.addEventListener('click', function() { loadUsers(); });
        var refreshItems = document.getElementById('refresh-items');
        if (refreshItems) refreshItems.addEventListener('click', function() { loadItems(); });
        var refreshReviews = document.getElementById('refresh-reviews');
        if (refreshReviews) refreshReviews.addEventListener('click', function() { loadReviews(); });

        var dlOrders = document.getElementById('download-orders-report');
        if (dlOrders) dlOrders.addEventListener('click', downloadOrdersReport);
        var dlUsers = document.getElementById('download-users-report');
        if (dlUsers) dlUsers.addEventListener('click', downloadUsersReport);
        var dlProducts = document.getElementById('download-products-report');
        if (dlProducts) dlProducts.addEventListener('click', downloadProductsReport);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
