# Quick Reference Guide - PHP to HTML Conversion

## 🎯 Entry Points

| Purpose | File | URL |
|---------|------|-----|
| **User Homepage** | `index.html` | `/index.html` |
| **Client Login** | `client-login.html` | `/client-login.html` |
| **Book Consultation** | `consultation.html` | `/consultation.html` |
| **View Appointments** | `appointments.html` | `/appointments.html` |
| **Admin Panel** | `admin/login.html` | `/admin/login.html` |
| **Admin Dashboard** | `admin/admin-home.html` | `/admin/admin-home.html` |

---

## 🔌 API Endpoints Reference

### Authentication
```
POST /api/client-login.php
Content-Type: application/json
{
  "login_id": "username or email",
  "login_password": "password",
  "recaptcha_token": "g-recaptcha-response"
}
Response: { "success": true, "redirect": "index.html" }
```

```
POST /api/client-signup.php
Content-Type: application/json
{
  "username": "username",
  "email": "email@example.com",
  "password": "password",
  "confirm_password": "password",
  "first_name": "John",
  "last_name": "Doe",
  "contact_number": "+63...",
  "recaptcha_token": "g-recaptcha-response"
}
Response: { "success": true, "message": "Account created successfully" }
```

### Consultation Management
```
POST /api/submit-consultation.php
{
  "full_name": "Client Name",
  "email": "client@email.com",
  "phone": "+63...",
  "legal_issue": "Real Estate Law",
  "preferred_date": "2025-01-20T14:00",
  "message": "Optional message"
}
```

### Admin Operations
```
GET /api/get-appointments.php?date=2025-01-20
Response: [
  { "id": 1, "name": "John Doe", "time": "14:00" }
]
```

```
POST /api/update-appointment-status.php
{
  "consultation_id": 1,
  "status": "completed"
}
```

```
GET /api/manage-users.php
Response: [
  { "uid": 1, "username": "john_doe", "email": "...", ... }
]
```

---

## 🔓 Authentication Flow

### Client Login
```
1. User enters credentials → client-login.html
2. Form calls → api/client-login.php
3. Backend verifies → sets PHP session
4. Frontend stores → localStorage['client_logged_in'] = true
5. Redirect → index.html
6. Navigation bar updates → shows user name & logout
```

### Admin Login
```
1. Admin enters credentials → admin/login.html
2. Form calls → api/admin-login.php
3. Backend verifies → sets PHP session
4. Frontend stores → localStorage['admin_logged_in'] = true
5. Redirect → admin/admin-home.html
6. Protection → admin-check.js verifies on each admin page
```

### Logout
```
1. User clicks logout
2. Calls → api/logout.php
3. Backend destroys → PHP session
4. Frontend clears → localStorage items
5. Redirect → index.html
```

---

## 📋 Form Submission Pattern

All HTML forms use this pattern:

```javascript
// 1. Prevent default form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();

// 2. Validate client-side
if (!formData) return alert('Fill all fields');

// 3. Call API via fetch
const response = await fetch('api/endpoint.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: sends session cookie
    body: JSON.stringify({ ... form data ... })
});

// 4. Handle response
const data = await response.json();
if (data.success) {
    // Success logic
    window.location.href = data.redirect;
} else {
    // Error handling
    showMessage(messageEl, data.message, 'error');
}
```

---

## 💾 Data Storage

### Server-Side (PHP Sessions)
```php
$_SESSION['client_logged_in'] = true;
$_SESSION['client_id'] = 123;
$_SESSION['client_username'] = 'john_doe';
// Persists across requests via session cookie
```

### Client-Side (localStorage)
```javascript
localStorage.setItem('client_logged_in', 'true');
localStorage.setItem('client_first_name', 'John');
// Used for UI updates without additional API calls
```

---

## 🎨 Page Structure (Standard Template)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Page Title</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Navigation with user info -->
    <nav class="navbar">
        <div class="user-nav-container" id="userNavContainer">
            <!-- Updated by auth-check.js -->
        </div>
    </nav>

    <!-- Page content -->
    <section>
        <form id="pageForm">
            <!-- Form fields -->
        </form>
        <p id="pageMessage" class="message"></p>
    </section>

    <!-- Footer -->
    <footer>...</footer>

    <!-- Scripts -->
    <script src="js/auth-check.js"></script>
    <script src="js/page.js"></script>
</body>
</html>
```

---

## 🔄 Common Patterns

### Check Authentication
```javascript
const isLoggedIn = localStorage.getItem('client_logged_in') === 'true';
if (!isLoggedIn) {
    window.location.href = 'client-login.html';
}
```

### Show Message
```javascript
function showMessage(element, message, type) {
    element.textContent = message;
    element.style.color = type === 'error' ? 'red' : 'green';
}
```

### Date Formatting
```javascript
new Date(dateString).toLocaleString(); // 1/20/2025, 2:00:00 PM
new Date(dateString).toISOString().split('T')[0]; // 2025-01-20
```

### API Error Handling
```javascript
try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.success) { ... }
    else { showMessage(msg, data.message, 'error'); }
} catch (err) {
    showMessage(msg, 'Network error occurred', 'error');
}
```

---

## 📁 Key Files to Modify

### Adding New Feature
1. **Create API** → `api/new-feature.php`
2. **Create Page** → `new-page.html`
3. **Create Script** → `js/new-page.js`
4. **Update Navigation** → Edit navbar in pages

### Fixing Bug
1. **Check Console** (F12) for client-side errors
2. **Check Network Tab** for API response
3. **Check Server Logs** for backend errors
4. **Edit appropriate file** (HTML, JS, or PHP)

### Changing Database Query
1. **Edit API file** → `api/endpoint.php`
2. **Test API** via Postman or browser DevTools
3. **Update JavaScript** if response format changes

---

## 🧪 Testing Commands (Browser Console)

```javascript
// Check login status
localStorage.getItem('client_logged_in');

// Clear session (logout effect)
localStorage.clear();

// Manually set session (testing)
localStorage.setItem('client_logged_in', 'true');

// Test API call
fetch('api/get-user-profile.php', {
    credentials: 'include'
}).then(r => r.json()).then(d => console.log(d));

// Check active requests
// Open DevTools → Network tab → watch requests
```

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Unauthorized" error | Check if logged in (`localStorage`) |
| Form won't submit | Check console (F12) for JS errors |
| API returns empty data | Verify date format (YYYY-MM-DD) |
| Navigation doesn't update | Refresh page or check auth-check.js |
| Admin page shows blank | Verify admin session active |
| Buttons don't work | Check if JavaScript file loaded |
| Styling looks broken | Clear browser cache (Ctrl+Shift+Del) |

---

## 🔐 Remember

- ✅ Always use `credentials: 'include'` in fetch for session cookies
- ✅ All database queries use prepared statements
- ✅ Passwords hashed with password_hash() on server
- ✅ Forms validate both client and server-side
- ✅ Don't store sensitive data in localStorage
- ✅ Keep API secret keys in PHP files only

---

**Version:** 1.0
**Last Updated:** January 15, 2026
**Status:** Ready for Use
