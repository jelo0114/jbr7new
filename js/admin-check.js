// Admin authentication check
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
});

function checkAdminAuth() {
    const isAdminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    
    if (!isAdminLoggedIn) {
        alert('Admin access required');
        window.location.href = 'login.html';
    }
    
    setupAdminLogout();
}

function setupAdminLogout() {
    const logoutLink = document.getElementById('adminLogoutLink');
    
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                performAdminLogout();
            }
        });
    }
}

function performAdminLogout() {
    fetch('../api/logout.php', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.removeItem('admin_logged_in');
            localStorage.removeItem('admin_id');
            window.location.href = 'login.html';
        }
    })
    .catch(err => console.error('Logout error:', err));
}
