// Manage users page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
});

function loadUsers() {
    fetch('../api/manage-users.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            displayUsers(data.data);
        } else {
            document.getElementById('usersMessage').textContent = data.message;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        document.getElementById('usersMessage').textContent = 'Error loading users';
    });
}

function displayUsers(users) {
    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.contact_number}</td>
            <td>
                <button onclick="deleteUser(${user.uid})" class="btn-danger">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    fetch('../api/manage-users.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            action: 'delete',
            user_id: userId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('User deleted successfully');
            loadUsers();
        } else {
            alert(data.message || 'Error deleting user');
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('An error occurred');
    });
}
