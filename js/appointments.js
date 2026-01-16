// Appointments page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadAppointments();
});

function loadAppointments() {
    const isLoggedIn = localStorage.getItem('client_logged_in') === 'true';
    const messageEl = document.getElementById('appointmentsMessage');
    
    if (!isLoggedIn) {
        messageEl.textContent = 'Please log in to view your appointments.';
        messageEl.style.color = 'blue';
        return;
    }
    
    fetch('api/get-user-consultations.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            displayAppointments(data.data);
        } else {
            messageEl.textContent = data.message || 'Unable to load appointments.';
            messageEl.style.color = 'red';
        }
    })
    .catch(err => {
        messageEl.textContent = 'An error occurred while loading appointments.';
        messageEl.style.color = 'red';
        console.error('Error:', err);
    });
}

function displayAppointments(appointments) {
    const list = document.getElementById('appointmentsList');
    const messageEl = document.getElementById('appointmentsMessage');
    
    if (appointments.length === 0) {
        messageEl.textContent = 'You have no appointments yet.';
        messageEl.style.color = 'blue';
        list.innerHTML = '';
        return;
    }
    
    messageEl.textContent = '';
    list.innerHTML = appointments.map(appt => `
        <div class="appointment-item">
            <h3>${appt.full_name}</h3>
            <p><strong>Issue:</strong> ${appt.legal_issue}</p>
            <p><strong>Date:</strong> ${new Date(appt.preferred_date).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status ${appt.status}">${appt.status}</span></p>
            <p><strong>Email:</strong> ${appt.email}</p>
            <p><strong>Phone:</strong> ${appt.phone}</p>
            ${appt.message ? `<p><strong>Message:</strong> ${appt.message}</p>` : ''}
        </div>
    `).join('');
}
