// Generate report functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
});

function generateReport() {
    const type = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select date range');
        return;
    }
    
    const url = `../api/get-report.php?type=${type}&start_date=${startDate}&end_date=${endDate}`;
    
    fetch(url, {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            displayReport(data.data, type);
        } else {
            document.getElementById('reportMessage').textContent = data.error || 'Error generating report';
        }
    })
    .catch(err => {
        console.error('Error:', err);
        document.getElementById('reportMessage').textContent = 'Error generating report';
    });
}

function displayReport(data, type) {
    const container = document.getElementById('reportContainer');
    
    if (data.length === 0) {
        container.innerHTML = '<p>No data found for the selected period.</p>';
        return;
    }
    
    let html = '<table class="report-table"><thead><tr>';
    
    if (type === 'consultations') {
        html += '<th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Issue</th><th>Status</th><th>Date</th></tr></thead><tbody>';
        data.forEach(row => {
            html += `<tr>
                <td>${row.consultation_id}</td>
                <td>${row.full_name}</td>
                <td>${row.email}</td>
                <td>${row.phone}</td>
                <td>${row.legal_issue}</td>
                <td>${row.status}</td>
                <td>${new Date(row.preferred_date).toLocaleString()}</td>
            </tr>`;
        });
    } else if (type === 'activities') {
        html += '<th>Username</th><th>Activity</th><th>Description</th><th>IP Address</th><th>Date</th></tr></thead><tbody>';
        data.forEach(row => {
            html += `<tr>
                <td>${row.username}</td>
                <td>${row.activity_type}</td>
                <td>${row.activity_description}</td>
                <td>${row.ip_address}</td>
                <td>${new Date(row.created_at).toLocaleString()}</td>
            </tr>`;
        });
    } else if (type === 'users') {
        html += '<th>ID</th><th>Username</th><th>Email</th><th>Name</th><th>Phone</th><th>Joined</th></tr></thead><tbody>';
        data.forEach(row => {
            html += `<tr>
                <td>${row.uid}</td>
                <td>${row.username}</td>
                <td>${row.email}</td>
                <td>${row.first_name} ${row.last_name}</td>
                <td>${row.contact_number}</td>
                <td>${new Date(row.created_at).toLocaleString()}</td>
            </tr>`;
        });
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}
