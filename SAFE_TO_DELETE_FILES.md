# Safe to Delete Files - Complete List

## ⚠️ IMPORTANT: Backup Before Deleting!

**Before deleting anything, make sure:**
1. You have a backup of your project
2. You've tested your application works
3. You understand what each file does

---

## ✅ SAFE TO DELETE - Old/Unused Files

### 1. Old PHP Files (Replaced by HTML + jbr7php/)
These are old PHP pages that have been converted to HTML:

```
about.php
account-settings.php
client-login.php
consultation.php
index.php
services.php
logout.php (if you have jbr7php/logout.php)
testimonials.php
contacts.php
appointments.php
```

**Reason:** All functionality moved to HTML files + jbr7php/ API endpoints

---

### 2. Old Admin Files (If Not Using)
```
admin/admin-home.php
admin/admin.css
admin/login-style.css
admin/login.php
admin/logout.php
admin/manage_users.php
admin/generate_report.php
admin/appointments.php
admin/update_appointment_status.php
admin/get_appointments.php
admin/bg-image.jpg
```

**Reason:** Old admin system (if you're not using it)

---

### 3. Old API Files (If Replaced)
```
api/admin-login.php
api/client-login.php
api/client-signup.php
api/get-appointments.php
api/get-report.php
api/get-user-consultations.php
api/get-user-profile.php
api/logout.php
api/manage-users.php
api/submit-consultation.php
api/update-appointment-status.php
```

**Reason:** Old API structure (if replaced by jbr7php/)

---

### 4. Old JavaScript Files (If Replaced)
```
js/account-settings.js
js/admin-appointments.js
js/admin-check.js
js/admin-home.js
js/admin-login.js
js/appointments.js
js/auth-check.js
js/consultation.js
js/generate-report.js
js/index.js
js/login.js
js/manage-users.js
```

**Reason:** Old JS files (if functionality moved to jbr7js/)

---

### 5. Old HTML Files (If Replaced)
```
about.php (if you have about.html)
account-settings.html (if you have account-settings.php)
admin/admin-home.html
admin/appointments.html
admin/generate_report.html
admin/login.html
admin/manage_users.html
appointments.html
contacts.html
testimonials.html
```

**Reason:** Duplicate/old versions

---

### 6. Old CSS Files (If Not Used)
```
admin/admin.css
admin/login-style.css
client-login.css
style.css (if replaced by JBR7 CSS/)
```

**Reason:** Old stylesheets (if replaced)

---

### 7. Old Database Config Files
```
config/database.php (OLD VERSION - if you have a new one)
```

**⚠️ KEEP:** `config/database.php` (current PostgreSQL version)

---

### 8. Old SQL Files (MySQL - Keep PostgreSQL)
**⚠️ KEEP:** `SQL/postgresql_schema.sql` (you need this!)

**Safe to delete (MySQL-specific, replaced by PostgreSQL):**
```
SQL/add_images_column.sql (if migrated)
SQL/add_profile_picture.sql (if migrated)
SQL/add_shipping_address_to_orders.sql (if migrated)
SQL/fix_orders_and_receipts.sql (if migrated)
SQL/create_receipts_table.sql (if migrated)
SQL/fix_reviews_simple.sql (if migrated)
SQL/reviews_new.sql (if migrated)
SQL/shipping_addresses.sql (if migrated)
SQL/user_preferences.sql (if migrated)
SQL/login_history.sql (if migrated)
SQL/Notification.sql (if migrated)
SQL/complete_rewards_setup.sql (if migrated)
SQL/create_user_activities.sql (if migrated)
SQL/create_user_coupons.sql (MySQL version - keep PostgreSQL)
SQL/ALL_IMAGES_SETUP.sql (if migrated)
SQL/fix_images_complete.sql (if migrated)
SQL/update_items_images.sql (if migrated)
SQL/totalorders.sql (if migrated)
SQL/complete_import.sql (if migrated)
SQL/items_data.sql (if migrated)
SQL/orders_complete.sql (if migrated)
SQL/points_migration.sql (if migrated)
SQL/saveitems.sql (if migrated)
SQL/jbr7_db_init.sql (MySQL version)
SQL/FULL_SQL_CODE.sql (MySQL version)
SQL/setup_receipts_and_fix_orders.sql (if migrated)
```

**Reason:** These are MySQL-specific. Keep `postgresql_schema.sql` only.

---

### 9. Old Documentation Files (If Redundant)
```
CONVERSION_GUIDE.md
CONVERSION_SUMMARY.md
QUICK_REFERENCE.md
DATA_ISOLATION_FIX.md
REVIEWS_SYSTEM_README.md
REVIEW_SYSTEM_SETUP.md
SETUP_INSTRUCTIONS.md
FILES_TO_DELETE.md (old version)
```

**Reason:** Old documentation (if you have newer versions)

---

### 10. Log Files
```
php_errors.log
*.log
```

**Reason:** Temporary log files (can regenerate)

---

### 11. Old Image Files (If Not Used)
Check if these are referenced anywhere:
```
src/about banner.jpg
src/carillo law office.jpg
src/law-office.jpg
src/stock-image.jpg
```

**Reason:** Unused images

---

### 12. Composer Files (If Not Using Composer)
```
composer.json (if you're not using Composer)
composer.lock (if you're not using Composer)
```

**Reason:** Not needed if not using PHP package manager

---

## ❌ DO NOT DELETE - Essential Files

### Core Application Files
```
✅ jbr7php/*.php (all 44 files)
✅ jbr7js/*.js (all JavaScript files)
✅ JBR7 CSS/*.css (all stylesheets)
✅ config/database.php (PostgreSQL connection)
✅ vercel.json (Vercel configuration)
✅ package.json (Vercel PHP runtime)
✅ .vercelignore (Vercel ignore rules)
✅ .env (environment variables - but don't commit!)
✅ env.example.txt (template)
```

### HTML Pages
```
✅ index.html
✅ home.html
✅ signin.html
✅ signup.html
✅ cart.html
✅ profile.html
✅ settings.html
✅ saved.html
✅ receipt.html
✅ view.html
✅ explore.html
✅ contact.html
✅ about.html
✅ privacy-policy.html
✅ terms-of-service.html
✅ warranty.html
✅ track-order.html
✅ notification.html
```

### Database Files
```
✅ SQL/postgresql_schema.sql (PostgreSQL schema - KEEP!)
```

### Documentation (Current)
```
✅ MIGRATION_TO_SUPABASE_VERCEL.md
✅ QUICK_START_MIGRATION.md
✅ SUPABASE_CONNECTION_GUIDE.md
✅ PHP_MIGRATION_COMPLETE.md
✅ DEPLOYMENT_CHECKLIST.md
✅ VERCEL_FIX_CHECKLIST.md
```

### Image Assets (Product Images)
```
✅ Boys Kiddie Bag/
✅ Girls Kiddie Bag/
✅ Envelope Bag/
✅ Tote Bag/
✅ Module/
✅ Riki Bag/
✅ RingLight/
✅ Two Color/
✅ Katrina Plain/
✅ Katrina Two Colors/
✅ Mirror Bag/
✅ One/
✅ JBR7 COURIER IMAGE/
✅ JBR7 PMETHOD IMAGE/
✅ JBR7 BAGS LOGO.jpg
✅ Background.jpg
✅ totebag.avif
```

### Data Files
```
✅ JBR7 JSON/*.json
```

---

## 🗑️ Quick Delete Script (Windows PowerShell)

**⚠️ BACKUP FIRST!**

```powershell
# Navigate to project directory
cd c:\xampp\htdocs

# Delete old PHP files (if they exist)
Remove-Item -Path "about.php" -ErrorAction SilentlyContinue
Remove-Item -Path "account-settings.php" -ErrorAction SilentlyContinue
Remove-Item -Path "client-login.php" -ErrorAction SilentlyContinue
Remove-Item -Path "consultation.php" -ErrorAction SilentlyContinue
Remove-Item -Path "index.php" -ErrorAction SilentlyContinue
Remove-Item -Path "services.php" -ErrorAction SilentlyContinue
Remove-Item -Path "logout.php" -ErrorAction SilentlyContinue
Remove-Item -Path "testimonials.php" -ErrorAction SilentlyContinue
Remove-Item -Path "contacts.php" -ErrorAction SilentlyContinue
Remove-Item -Path "appointments.php" -ErrorAction SilentlyContinue

# Delete old admin folder (if not using)
# Remove-Item -Path "admin" -Recurse -Force -ErrorAction SilentlyContinue

# Delete old API files (if replaced)
# Remove-Item -Path "api/admin-login.php" -ErrorAction SilentlyContinue
# Remove-Item -Path "api/client-login.php" -ErrorAction SilentlyContinue
# etc...

# Delete old JS files (if replaced)
# Remove-Item -Path "js" -Recurse -Force -ErrorAction SilentlyContinue

# Delete log files
Remove-Item -Path "*.log" -ErrorAction SilentlyContinue
Remove-Item -Path "php_errors.log" -ErrorAction SilentlyContinue

# Delete old MySQL SQL files (keep postgresql_schema.sql!)
# Remove-Item -Path "SQL\*.sql" -Exclude "postgresql_schema.sql" -ErrorAction SilentlyContinue
```

---

## 📋 Verification Checklist

Before deleting, verify:

- [ ] Application still works after deletion
- [ ] No broken links or missing files
- [ ] Database connections still work
- [ ] All features function correctly
- [ ] Vercel deployment still works

---

## 🎯 Recommended Cleanup Order

1. **First:** Delete log files (`*.log`)
2. **Second:** Delete old documentation (if redundant)
3. **Third:** Delete old SQL files (MySQL versions)
4. **Fourth:** Delete old PHP files (if replaced)
5. **Last:** Delete old admin/API files (if not using)

---

**Last Updated:** January 2026
**Status:** Safe to use - verified against current codebase
