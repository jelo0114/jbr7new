(function() {
    'use strict';

    var API_BASE = (typeof window !== 'undefined' && window.JBR7_API_BASE) ? window.JBR7_API_BASE : '';
    // Use PHP POST URL so product updates persist to SQL (e.g. window.JBR7_ADMIN_API_POST_URL = '/jbr7php/post.php')
    var API_POST_URL = (typeof window !== 'undefined' && window.JBR7_ADMIN_API_POST_URL) ? window.JBR7_ADMIN_API_POST_URL : (API_BASE + '/api/post');
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
        return fetch(API_POST_URL, {
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

    var overviewCache = { orders: [], usersCount: 0, itemsCount: 0, reviewsCount: 0 };
    var overviewPeriod = 'all';
    var analyticsCache = { orders: [], itemsCount: 0, reviewsCount: 0 };
    var analyticsPeriod = 'all';

    function filterOrdersByPeriod(orders, period) {
        if (!period || period === 'all') return orders;
        var now = Date.now();
        var ms = period === '7' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        var cut = now - ms;
        return (orders || []).filter(function(o) {
            var t = o.created_at ? new Date(o.created_at).getTime() : 0;
            return t >= cut;
        });
    }

    function setStat(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // ---------- Overview ----------
    function loadOverview() {
        setStat('stat-users', '-');
        setStat('stat-orders', '-');
        setStat('stat-items', '-');
        setStat('stat-reviews', '-');
        Promise.all([
            fetchApiGet('admin-users').then(function(d) { return d.data || []; }),
            fetchApiGet('admin-orders').then(function(d) { return d.data || []; }),
            fetchApiGet('admin-items').then(function(d) { return d.data || []; }),
            fetchApiGet('admin-reviews').then(function(d) { return d.data || []; })
        ]).then(function(arr) {
            var users = arr[0];
            var orders = arr[1];
            var items = arr[2];
            var reviews = arr[3];
            overviewCache.orders = orders;
            overviewCache.usersCount = users.length;
            overviewCache.itemsCount = items.length;
            overviewCache.reviewsCount = reviews.length;
            applyOverviewFilter();
        }).catch(function() {
            setStat('stat-users', '—');
            setStat('stat-orders', '—');
            setStat('stat-items', '—');
            setStat('stat-reviews', '—');
        });
    }

    function applyOverviewFilter() {
        setStat('stat-users', overviewCache.usersCount);
        setStat('stat-items', overviewCache.itemsCount);
        setStat('stat-reviews', overviewCache.reviewsCount);
        var filtered = filterOrdersByPeriod(overviewCache.orders, overviewPeriod);
        setStat('stat-orders', filtered.length);
    }

    // ---------- Analytics ----------
    function loadAnalytics() {
        setStat('analytics-revenue', '—');
        setStat('analytics-orders', '—');
        setStat('analytics-products', '—');
        setStat('analytics-reviews', '—');
        var statusEl = document.getElementById('analytics-by-status');
        if (statusEl) statusEl.innerHTML = '<p class="empty-msg">Loading...</p>';
        Promise.all([
            fetchApiGet('admin-orders').then(function(d) { return d.data || []; }),
            fetchApiGet('admin-items').then(function(d) { return d.data || []; }),
            fetchApiGet('admin-reviews').then(function(d) { return d.data || []; })
        ]).then(function(arr) {
            analyticsCache.orders = arr[0];
            analyticsCache.itemsCount = (arr[1] || []).length;
            analyticsCache.reviewsCount = (arr[2] || []).length;
            applyAnalyticsFilter();
        }).catch(function() {
            setStat('analytics-revenue', '—');
            setStat('analytics-orders', '—');
            setStat('analytics-products', '—');
            setStat('analytics-reviews', '—');
            if (statusEl) statusEl.innerHTML = '<p class="empty-msg">Failed to load</p>';
        });
    }

    function applyAnalyticsFilter() {
        var filtered = filterOrdersByPeriod(analyticsCache.orders, analyticsPeriod);
        var revenue = 0;
        filtered.forEach(function(o) {
            var t = o.total;
            revenue += (typeof t === 'number' ? t : parseFloat(String(t).replace(/,/g, ''))) || 0;
        });
        setStat('analytics-revenue', revenue.toFixed(2));
        setStat('analytics-orders', filtered.length);
        setStat('analytics-products', analyticsCache.itemsCount);
        setStat('analytics-reviews', analyticsCache.reviewsCount);
        var byStatus = {};
        filtered.forEach(function(o) {
            var s = (o.status || 'processing').toLowerCase();
            byStatus[s] = (byStatus[s] || 0) + 1;
        });
        var statusEl = document.getElementById('analytics-by-status');
        if (statusEl) {
            var order = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            var html = order.map(function(s) {
                var count = byStatus[s] || 0;
                return '<div class="breakdown-row"><span class="status-name">' + s + '</span><span class="status-count">' + count + '</span></div>';
            }).join('');
            statusEl.innerHTML = html || '<p class="empty-msg">No orders</p>';
        }
    }

    // ---------- Orders (status from API; admin can update — reflects on profile) ----------
    function loadOrders() {
        var tbody = document.getElementById('orders-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
        fetchApiGet('admin-orders').then(function(res) {
            var list = res.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No orders</td></tr>';
                return;
            }
            var statusOptions = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
            tbody.innerHTML = list.map(function(o) {
                var rawStatus = o.status != null ? String(o.status).trim() : '';
                var status = (rawStatus || 'processing').toLowerCase();
                var customerName = (o.user && (o.user.username || o.user.email)) ? (o.user.username || o.user.email) : 'User #' + (o.user_id || '-');
                var orderCount = o.user_order_count != null ? o.user_order_count : '-';
                var totalVal = o.total;
                var totalStr = totalVal != null ? (typeof totalVal === 'number' ? totalVal : String(totalVal)) : '-';
                var opts = statusOptions.map(function(s) {
                    return '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + s + '</option>';
                }).join('');
                return '<tr data-order-id="' + o.id + '" data-current-status="' + escapeHtml(status) + '" class="order-row">' +
                    '<td data-label="Order #">' + (o.order_number || o.id) + '</td>' +
                    '<td data-label="Customer">' + escapeHtml(customerName) + '</td>' +
                    '<td data-label="Orders">' + orderCount + '</td>' +
                    '<td data-label="Total">' + escapeHtml(totalStr) + '</td>' +
                    '<td data-label="Status"><span class="status-badge ' + statusClass(status) + '">' + escapeHtml(status) + '</span></td>' +
                    '<td data-label="Date">' + formatDate(o.created_at) + '</td>' +
                    '<td class="order-actions-cell" data-label="Change status">' +
                    '<select class="order-status-select" data-order-id="' + o.id + '" aria-label="Order status">' + opts + '</select>' +
                    '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load orders</td></tr>';
        });
    }

    function updateOrderStatus(orderId, status) {
        return fetchApiPost({
            action: 'admin-update-order-status',
            orderId: parseInt(orderId, 10),
            status: status
        });
    }

    function updateAllOrderChanges() {
        var tbody = document.getElementById('orders-tbody');
        var btn = document.getElementById('update-all-orders');
        if (!tbody || !btn) return;
        var rows = tbody.querySelectorAll('tr[data-order-id][data-current-status]');
        var updates = [];
        rows.forEach(function(tr) {
            var select = tr.querySelector('.order-status-select');
            var current = (tr.getAttribute('data-current-status') || '').toLowerCase();
            var selected = select ? (select.value || 'processing').toLowerCase() : current;
            if (selected !== current) {
                updates.push({
                    orderId: tr.getAttribute('data-order-id'),
                    status: selected
                });
            }
        });
        if (updates.length === 0) {
            return;
        }
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating ' + updates.length + '…';
        Promise.all(updates.map(function(u) { return updateOrderStatus(u.orderId, u.status); }))
            .then(function() {
                loadOrders();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check-double"></i> Update all changes';
            })
            .catch(function() {
                alert('Some updates failed. Refreshing list.');
                loadOrders();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check-double"></i> Update all changes';
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

    // ---------- Items (with thumbnail, quantity, editable) ----------
    function loadItems() {
        var tbody = document.getElementById('items-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">Loading...</td></tr>';
        fetchApiGet('admin-items').then(function(res) {
            var list = res.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">No products</td></tr>';
                return;
            }
            tbody.innerHTML = list.map(function(i) {
                var imgSrc = (i.image || '').trim() ? i.image : 'totebag.avif';
                if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) imgSrc = imgSrc;
                var thumb = '<img src="' + escapeHtml(imgSrc) + '" alt="" class="item-thumb" onerror="this.src=\'totebag.avif\'">';
                var titleVal = escapeHtml(i.title || '');
                var priceVal = i.price != null ? Number(i.price) : '';
                var catVal = escapeHtml(i.category || '');
                var qtyVal = i.quantity != null ? parseInt(i.quantity, 10) : '';
                if (qtyVal === '' || isNaN(qtyVal)) qtyVal = '';
                var imgVal = escapeHtml(i.image || '');
                return '<tr data-item-id="' + (i.id || '') + '">' +
                    '<td class="item-thumb-cell">' + thumb + '</td>' +
                    '<td>' + (i.id || '-') + '</td>' +
                    '<td>' + escapeHtml(i.item_id || '-') + '</td>' +
                    '<td><input type="text" class="item-edit-title" value="' + titleVal + '"></td>' +
                    '<td><input type="number" step="0.01" min="0" class="item-edit-price" value="' + priceVal + '"></td>' +
                    '<td><input type="text" class="item-edit-category" value="' + catVal + '"></td>' +
                    '<td><input type="number" min="0" class="item-edit-quantity" value="' + qtyVal + '"></td>' +
                    '<td><input type="text" class="item-edit-image" value="' + imgVal + '" placeholder="Image path"></td>' +
                    '<td>' + (i.rating != null ? i.rating : '-') + '</td></tr>';
            }).join('');
        }).catch(function() {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">Failed to load products</td></tr>';
        });
    }

    function getItemPayloadFromRow(tr) {
        var itemId = tr.getAttribute('data-item-id');
        if (!itemId) return null;
        var title = (tr.querySelector('.item-edit-title') || {}).value;
        var price = (tr.querySelector('.item-edit-price') || {}).value;
        var category = (tr.querySelector('.item-edit-category') || {}).value;
        var quantity = (tr.querySelector('.item-edit-quantity') || {}).value;
        var image = (tr.querySelector('.item-edit-image') || {}).value;
        return { itemId: itemId, title: title, price: price ? parseFloat(price) : undefined, category: category, quantity: quantity !== '' ? parseInt(quantity, 10) : undefined, image: image || undefined };
    }

    function updateAllItems() {
        var tbody = document.getElementById('items-tbody');
        if (!tbody) return;
        var rows = tbody.querySelectorAll('tr[data-item-id]');
        if (rows.length === 0) { alert('No products to update.'); return; }
        var payloads = [];
        rows.forEach(function(tr) {
            var p = getItemPayloadFromRow(tr);
            if (p) payloads.push(p);
        });
        var btn = document.getElementById('update-all-items');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...'; }
        function runOne(index) {
            if (index >= payloads.length) {
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double"></i> Update all'; }
                alert('All products updated.');
                loadItems();
                return;
            }
            var p = payloads[index];
            fetchApiPost({ action: 'admin-update-product', itemId: p.itemId, title: p.title, price: p.price, category: p.category, quantity: p.quantity, image: p.image })
                .then(function() { runOne(index + 1); })
                .catch(function(e) {
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double"></i> Update all'; }
                    alert('Failed at product ' + (index + 1) + ': ' + (e.message || e));
                });
        }
        runOne(0);
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
            var headers = ['id', 'item_id', 'title', 'price', 'category', 'quantity', 'rating', 'review_count'];
            var rows = list.map(function(i) {
                return { id: i.id, item_id: i.item_id, title: i.title, price: i.price, category: i.category, quantity: i.quantity != null ? i.quantity : '', rating: i.rating, review_count: i.review_count };
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
        if (sectionId === 'reports') loadSalesReport('weekly');
        if (sectionId === 'analytics') loadAnalytics();
        if (sectionId === 'settings') loadSettings();
    }

    var salesReportCache = { period: 'weekly', data: null };

    function loadSalesReport(period) {
        period = period || salesReportCache.period;
        salesReportCache.period = period;
        var summaryEl = document.getElementById('sales-summary');
        if (summaryEl) summaryEl.innerHTML = '<p class="sales-placeholder">Loading...</p>';
        document.querySelectorAll('.sales-period-btn').forEach(function(b) {
            b.classList.toggle('active', b.getAttribute('data-period') === period);
        });
        fetchApiGet('admin-sales', { period: period }).then(function(res) {
            var d = res.data || {};
            salesReportCache.data = d;
            var total = d.totalRevenue != null ? d.totalRevenue : 0;
            var count = d.orderCount != null ? d.orderCount : 0;
            var periodLabel = period === 'weekly' ? 'Last 7 days' : period === 'monthly' ? 'Last 30 days' : 'Last 365 days';
            if (summaryEl) {
                summaryEl.innerHTML = '<div class="sales-stats">' +
                    '<p><strong>Period:</strong> ' + periodLabel + '</p>' +
                    '<p><strong>Total revenue:</strong> ₱' + Number(total).toFixed(2) + '</p>' +
                    '<p><strong>Orders:</strong> ' + count + '</p>' +
                    '</div>';
            }
        }).catch(function() {
            if (summaryEl) summaryEl.innerHTML = '<p class="sales-placeholder">Failed to load sales.</p>';
        });
    }

    function downloadSalesReport() {
        var d = salesReportCache.data;
        if (!d || !d.orders) {
            alert('Load a sales period first (Weekly / Monthly / Annually).');
            return;
        }
        var headers = ['order_number', 'user_id', 'total', 'status', 'created_at'];
        var rows = (d.orders || []).map(function(o) {
            return { order_number: o.order_number, user_id: o.user_id, total: o.total, status: o.status, created_at: o.created_at || '' };
        });
        var period = salesReportCache.period || 'weekly';
        downloadCsv('jbr7-sales-' + period + '-' + new Date().toISOString().slice(0, 10) + '.csv', rows, headers);
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

    function closeSidebar() {
        document.body.classList.remove('sidebar-open');
    }

    function init() {
        if (!checkAdmin()) return;
        setAdminName();
        loadOverview();

        var menuBtn = document.getElementById('admin-menu-btn');
        var overlay = document.getElementById('sidebar-overlay');
        if (menuBtn) {
            menuBtn.addEventListener('click', function() {
                document.body.classList.toggle('sidebar-open');
                menuBtn.setAttribute('aria-label', document.body.classList.contains('sidebar-open') ? 'Close menu' : 'Open menu');
                var icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.className = document.body.classList.contains('sidebar-open') ? 'fas fa-times' : 'fas fa-bars';
                }
            });
        }
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                switchSection(this.getAttribute('data-section'));
                closeSidebar();
            });
        });

        var logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', function(e) { e.preventDefault(); logout(); });

        var updateAllOrders = document.getElementById('update-all-orders');
        if (updateAllOrders) updateAllOrders.addEventListener('click', updateAllOrderChanges);
        var refreshOrders = document.getElementById('refresh-orders');
        if (refreshOrders) refreshOrders.addEventListener('click', function() { loadOrders(); });
        var refreshUsers = document.getElementById('refresh-users');
        if (refreshUsers) refreshUsers.addEventListener('click', function() { loadUsers(); });
        var updateAllItemsBtn = document.getElementById('update-all-items');
        if (updateAllItemsBtn) updateAllItemsBtn.addEventListener('click', updateAllItems);
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
        document.querySelectorAll('.sales-period-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { loadSalesReport(this.getAttribute('data-period')); });
        });
        var dlSales = document.getElementById('download-sales-report');
        if (dlSales) dlSales.addEventListener('click', downloadSalesReport);

        document.querySelectorAll('#section-overview .filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#section-overview .filter-btn').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                overviewPeriod = this.getAttribute('data-period') || 'all';
                applyOverviewFilter();
            });
        });
        document.querySelectorAll('.filter-analytics').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-analytics').forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                analyticsPeriod = this.getAttribute('data-period') || 'all';
                applyAnalyticsFilter();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
