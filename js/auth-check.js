// Auth check - Check if user is logged in and update nav
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

function checkAuthStatus() {
    // Check if there's a session cookie or localStorage flag
    // This is a simple client-side check. In production, make an API call.
    const isLoggedIn = localStorage.getItem('client_logged_in') === 'true';
    const firstName = localStorage.getItem('client_first_name');
    
    updateNavigation(isLoggedIn, firstName);
}

function updateNavigation(isLoggedIn, firstName) {
    const navContainer = document.getElementById('userNavContainer');
    
    if (!navContainer) return;
    
    if (isLoggedIn) {
        navContainer.innerHTML = `
            <div class="user-dropdown">
                <a href="account-settings.html" class="user-nav" style="color:#FFD700; font-weight:bold; display:flex; align-items:center; gap:6px; text-decoration:none; text-transform:none;">
                    <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                    ${firstName || 'User'}
                </a>
                <div class="user-dropdown-content">
                    <a href="account-settings.html" class="dropdown-btn"><i class="fas fa-cog"></i> Settings</a>
                    <a href="#" class="dropdown-btn" id="logoutLink"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;
        
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                performLogout();
            });
        }
    }
}

function performLogout() {
    if (!confirm('Are you sure you want to log out?')) return;
    
    fetch('api/logout.php', {
        method: 'POST',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.removeItem('client_logged_in');
            localStorage.removeItem('client_id');
            localStorage.removeItem('client_first_name');
            localStorage.removeItem('client_username');
            localStorage.removeItem('client_email');
            window.location.href = 'index.html';
        } else {
            alert('Logout failed: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Logout error:', err);
        alert('An error occurred during logout');
    });
}
