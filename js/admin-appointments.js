// Admin appointments page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set date input to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').value = today;
});

function loadAppointmentsByDate() {
    const date = document.getElementById('appointmentDate').value;
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    fetch(`../api/get-appointments.php?date=${date}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            displayAppointments(data.data);
        } else {
            document.getElementById('appointmentsMessage').textContent = data.error || 'No appointments found';
        }
    })
    .catch(err => {
        console.error('Error:', err);
        document.getElementById('appointmentsMessage').textContent = 'Error loading appointments';
    });
}

function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentsBody');
    
    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No appointments for this date</td></tr>';
        return;
    }
    
    tbody.innerHTML = appointments.map(appt => `
        <tr>
            <td>${appt.id}</td>
            <td>${appt.name}</td>
            <td>${appt.time}</td>
            <td>
                <button onclick="updateStatus(${appt.id}, 'completed')" class="btn-success">Complete</button>
                <button onclick="updateStatus(${appt.id}, 'rejected')" class="btn-danger">Reject</button>
            </td>
        </tr>
    `).join('');
}

function updateStatus(consultationId, status) {
    fetch('../api/update-appointment-status.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            consultation_id: consultationId,
            status: status
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Status updated successfully');
            const date = document.getElementById('appointmentDate').value;
            loadAppointmentsByDate();
        } else {
            alert(data.message || 'Error updating status');
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('An error occurred');
    });
}
