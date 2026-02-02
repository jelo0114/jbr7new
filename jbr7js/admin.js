(function() {
    'use strict';

    var API_BASE = (typeof window !== 'undefined' && window.JBR7_API_BASE) ? window.JBR7_API_BASE : '';

    function getAdminId() {
        try {
            return sessionStorage.getItem('jbr7_admin_id') || '';
        } catch (e) {
            return '';
        }
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
        if (extraParams) {
            Object.keys(extraParams).forEach(function(k) {
                params.set(k, extraParams[k]);
            });
        }
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

    function fetchApiActions(body) {
        return fetch(API_BASE + '/api/actions', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.success === false && data.error) throw new Error(data.error);
                return data;
            });
    }

    // ---------- Overview ----------
    function loadOverview() {
        var stats = { users: 0, orders: 0, items: 0, reviews: 0 };
        function setStat(id, val) {
            var el = document.getElementById(id);
            if (el) el.textContent = val;
        }
        setStat('stat-users', '-');
        setStat('stat-orders', '-');
        setStat('stat-items', '-');
        setStat('stat-reviews', '-');

        Promise.all([
            fetchApiGet('admin-users').then(function(d) { stats.users = (d.data && d.data.length) || 0; }),
            fetchApiGet('admin-orders').then(function(d) { stats.orders = (d.data && d.data.length) || 0; }),
            fetchApiGet('admin-items').then(function(d) { stats.items = (d.data && d.data.length) || 0; }),
            fetchApiGet('admin-reviews').then(function(d) { stats.reviews = (d.data && d.data.length) || 0; })
        ]).then(function() {
            setStat('stat-users', stats.users);
            setStat('stat-orders', stats.orders);
            setStat('stat-items', stats.items);
            setStat('stat-reviews', stats.reviews);
        }).catch(function() {
            setStat('stat-users', '?');
            setStat('stat-orders', '?');
            setStat('stat-items', '?');
            setStat('stat-reviews', '?');
        });
    }

    // ---------- Orders ----------
    function formatDate(str) {
        if (!str) return '-';
        var d = new Date(str);
        return isNaN(d.getTime()) ? str : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

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
                var statusOptions = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
                var opts = statusOptions.map(function(s) {
                    return '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + s + '</option>';
                }).join('');
                return '<tr data-order-id="' + o.id + '">' +
                    '<td>' + (o.order_number || o.id) + '</td>' +
                    '<td>' + (o.user_id || '-') + '</td>' +
                    '<td>' + (o.total != null ? o.total : '-') + '</td>' +
                    '<td><select class="order-status-select" data-order-id="' + o.id + '">' + opts + '</select>' +
                    '<button type="button" class="order-status-btn" data-order-id="' + o.id + '">Update</button>' +
                    '</td>' +
                    '<td>' + formatDate(o.created_at) + '</td>' +
                    '<td>-</td></tr>';
            }).join('');
            tbody.querySelectorAll('.order-status-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var orderId = btn.getAttribute('data-order-id');
                    var row = btn.closest('tr');
                    var sel = row.querySelector('.order-status-select');
                    var status = sel ? sel.value : 'processing';
                    updateOrderStatus(orderId, status, function() {
                        loadOrders();
                    }, function() {
                        alert('Failed to update order status');
                    });
                });
            });
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load orders</td></tr>';
        });
    }

    function updateOrderStatus(orderId, status, onSuccess, onError) {
        fetchApiPost({
            action: 'admin-update-order-status',
            orderId: parseInt(orderId, 10),
            status: status
        }).then(function() {
            if (onSuccess) onSuccess();
        }).catch(function() {
            if (onError) onError();
        });
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
                return '<tr><td>' + (u.id || '-') + '</td><td>' + (u.username || '-') + '</td><td>' + (u.email || '-') + '</td><td>' + (u.points != null ? u.points : '-') + '</td><td>' + formatDate(u.created_at) + '</td></tr>';
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
                return '<tr><td>' + (i.id || '-') + '</td><td>' + (i.item_id || '-') + '</td><td>' + (i.title || '-') + '</td><td>' + (i.price != null ? i.price : '-') + '</td><td>' + (i.category || '-') + '</td><td>' + (i.rating != null ? i.rating : '-') + '</td></tr>';
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
                return '<tr><td>' + (r.user_id || '-') + '</td><td>' + (r.product_title || r.item_id || '-') + '</td><td>' + (r.rating != null ? r.rating : '-') + '</td><td>' + comment + '</td><td>' + formatDate(r.created_at) + '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Failed to load reviews</td></tr>';
        });
    }

    // ---------- Tabs ----------
    function switchSection(sectionId) {
        document.querySelectorAll('.admin-section').forEach(function(s) {
            s.classList.remove('active');
        });
        document.querySelectorAll('.admin-tab').forEach(function(t) {
            t.classList.remove('active');
            if (t.getAttribute('data-section') === sectionId) t.classList.add('active');
        });
        var section = document.getElementById('section-' + sectionId);
        if (section) section.classList.add('active');
        if (sectionId === 'overview') loadOverview();
        if (sectionId === 'orders') loadOrders();
        if (sectionId === 'users') loadUsers();
        if (sectionId === 'items') loadItems();
        if (sectionId === 'reviews') loadReviews();
    }

    // ---------- Logout ----------
    function logout() {
        sessionStorage.removeItem('jbr7_admin_id');
        sessionStorage.removeItem('jbr7_admin_email');
        sessionStorage.removeItem('jbr7_admin_name');
        window.location.href = 'adminlogin.html';
    }

    // ---------- Init ----------
    function init() {
        if (!checkAdmin()) return;
        setAdminName();
        loadOverview();

        document.querySelectorAll('.admin-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                switchSection(this.getAttribute('data-section'));
            });
        });
        var logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        document.getElementById('refresh-orders').addEventListener('click', function() { loadOrders(); });
        document.getElementById('refresh-users').addEventListener('click', function() { loadUsers(); });
        document.getElementById('refresh-items').addEventListener('click', function() { loadItems(); });
        document.getElementById('refresh-reviews').addEventListener('click', function() { loadReviews(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
