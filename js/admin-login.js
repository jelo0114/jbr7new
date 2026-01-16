// Admin login functionality
document.addEventListener('DOMContentLoaded', function() {
    setupAdminLoginForm();
});

function setupAdminLoginForm() {
    const form = document.getElementById('adminLoginForm');
    const messageEl = document.getElementById('adminLoginMessage');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showMessage(messageEl, 'Please fill in all fields', 'error');
            return;
        }
        
        try {
            const response = await fetch('../api/admin-login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('admin_logged_in', 'true');
                localStorage.setItem('admin_id', data.admin_id || '');
                
                showMessage(messageEl, data.message, 'success');
                setTimeout(() => {
                    window.location.href = 'admin-home.html';
                }, 1500);
            } else {
                showMessage(messageEl, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageEl, 'An error occurred. Please try again.', 'error');
            console.error('Admin login error:', error);
        }
    });
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message ' + type;
    element.style.color = type === 'error' ? 'red' : 'green';
    element.style.display = 'block';
}
