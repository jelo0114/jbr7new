// Account settings page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
});

function loadUserProfile() {
    const isLoggedIn = localStorage.getItem('client_logged_in') === 'true';
    
    if (!isLoggedIn) {
        alert('You must be logged in to access account settings');
        window.location.href = 'client-login.html';
        return;
    }
    
    fetch('api/get-user-profile.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            displayProfile(data.data);
        } else {
            alert(data.message || 'Unable to load profile');
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('An error occurred while loading your profile');
    });
}

function displayProfile(profile) {
    document.getElementById('username').value = profile.username || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('first_name').value = profile.first_name || '';
    document.getElementById('last_name').value = profile.last_name || '';
    document.getElementById('contact_number').value = profile.contact_number || '';
    
    // Store in localStorage for later use
    localStorage.setItem('client_first_name', profile.first_name);
    localStorage.setItem('client_email', profile.email);
}
