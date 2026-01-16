// Admin home page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

function loadDashboardData() {
    // Load summary statistics
    fetch('../api/get-report.php?type=consultations', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('totalConsultations').textContent = data.data.length;
            const pending = data.data.filter(c => c.status === 'pending').length;
            document.getElementById('pendingAppointments').textContent = pending;
        }
    })
    .catch(err => console.error('Error loading consultations:', err));
    
    // Load total users
    fetch('../api/manage-users.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('totalUsers').textContent = data.data.length;
        }
    })
    .catch(err => console.error('Error loading users:', err));
}
