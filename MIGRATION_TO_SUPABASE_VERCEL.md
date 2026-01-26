# Complete Migration Guide: MySQL to PostgreSQL (Supabase) + Vercel Deployment

This guide will help you convert your JBR7 Bags application from MySQL (XAMPP) to PostgreSQL (Supabase) and deploy it to Vercel with automatic GitHub deployments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Converting MySQL to PostgreSQL](#part-1-converting-mysql-to-postgresql)
3. [Part 2: Setting Up Supabase](#part-2-setting-up-supabase)
4. [Part 3: Updating PHP Code](#part-3-updating-php-code)
5. [Part 4: Setting Up Vercel](#part-4-setting-up-vercel)
6. [Part 5: GitHub Integration](#part-5-github-integration)
7. [Part 6: Environment Variables](#part-6-environment-variables)
8. [Part 7: Testing & Troubleshooting](#part-7-testing--troubleshooting)

---

## Prerequisites

- GitHub account
- Supabase account (free tier available)
- Vercel account (free tier available)
- Your current MySQL database structure
- Basic knowledge of SQL and PHP

---

## Part 1: Converting MySQL to PostgreSQL

### Step 1.1: Key Differences Between MySQL and PostgreSQL

| MySQL | PostgreSQL |
|-------|------------|
| `INT UNSIGNED` | `INTEGER` or `BIGINT` |
| `AUTO_INCREMENT` | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` |
| `DATETIME` | `TIMESTAMP` or `TIMESTAMPTZ` |
| `TINYINT(1)` | `BOOLEAN` |
| `VARCHAR(n)` | `VARCHAR(n)` (same) |
| `TEXT` | `TEXT` (same) |
| `JSON` | `JSONB` (better performance) |
| `ENGINE=InnoDB` | Not needed |
| `DEFAULT CURRENT_TIMESTAMP` | `DEFAULT NOW()` |
| `ON DELETE CASCADE` | Same syntax |

### Step 1.2: Create PostgreSQL Conversion Script

Create a new file: `SQL/postgresql_schema.sql`

```sql
-- PostgreSQL Schema for JBR7 Bags Manufacturing
-- Converted from MySQL

-- Enable UUID extension (optional, for better IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    phone VARCHAR(50) NULL,
    profile_picture VARCHAR(512) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- 2. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'processing',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    items_json JSONB NULL,
    shipping_address TEXT NULL,
    payment_method VARCHAR(64) NULL,
    courier_service VARCHAR(64) NULL,
    customer_email VARCHAR(255) NULL,
    customer_phone VARCHAR(64) NULL,
    can_cancel_after TIMESTAMPTZ NULL,
    status_updated_at TIMESTAMPTZ NULL,
    shipped_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- ============================================
-- 3. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_image VARCHAR(512) NULL,
    item_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    size VARCHAR(50) NULL,
    color VARCHAR(50) NULL,
    line_total DECIMAL(10,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'processing',
    status_updated_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================
-- 4. SHIPPING ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(50) NOT NULL DEFAULT 'home',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    full_name VARCHAR(255) NULL,
    first_name VARCHAR(100) NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    recipient_name VARCHAR(255) NULL,
    company_name VARCHAR(255) NULL,
    mobile_number VARCHAR(20) NULL,
    alternate_number VARCHAR(20) NULL,
    office_phone VARCHAR(20) NULL,
    email_address VARCHAR(255) NULL,
    house_unit_number VARCHAR(50) NULL,
    building_name VARCHAR(255) NULL,
    floor_unit_number VARCHAR(50) NULL,
    street_name VARCHAR(255) NULL,
    subdivision_village VARCHAR(255) NULL,
    barangay VARCHAR(100) NULL,
    city_municipality VARCHAR(100) NULL,
    province_state VARCHAR(100) NULL,
    postal_zip_code VARCHAR(20) NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
    landmark_delivery_notes TEXT NULL,
    office_hours VARCHAR(255) NULL,
    additional_instructions TEXT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    formatted_address TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ship_user ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_ship_type ON shipping_addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_ship_default ON shipping_addresses(is_default);

-- ============================================
-- 5. USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(64) NULL,
    courier_service VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prefs_user ON user_preferences(user_id);

-- ============================================
-- 6. SAVED ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    price VARCHAR(50) NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_title ON saved_items(title);

-- ============================================
-- 7. LOGIN HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_time TIMESTAMPTZ NULL,
    session_duration INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_login_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_time ON login_history(login_time);

-- ============================================
-- 8. REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_title VARCHAR(255) NOT NULL,
    item_id VARCHAR(128) NOT NULL,
    rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item ON reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_title ON reviews(product_title);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product ON reviews(user_id, item_id);

-- ============================================
-- 9. USER ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(64) NOT NULL,
    description TEXT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON user_activities(created_at);

-- ============================================
-- 10. RECEIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
    order_number VARCHAR(100) NOT NULL,
    receipt_data JSONB NOT NULL,
    shipping_address TEXT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NULL,
    courier_service VARCHAR(50) NULL,
    customer_email VARCHAR(255) NULL,
    customer_phone VARCHAR(50) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_number ON receipts(order_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created ON receipts(created_at);

-- ============================================
-- 11. USER COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_coupons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discount_percentage INTEGER NOT NULL,
    points_cost INTEGER NOT NULL,
    coupon_code VARCHAR(50) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_code ON user_coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_user_coupons_expires ON user_coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_coupons_used ON user_coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_user_coupons_active ON user_coupons(user_id, is_used, expires_at);

-- ============================================
-- 12. NOTIFICATIONS TABLE (if exists)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================
-- END OF SCHEMA
-- ============================================
```

---

## Part 2: Setting Up Supabase

### Step 2.1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Create a new organization (or use personal)

### Step 2.2: Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `jbr7-bags`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### Step 2.3: Get Database Connection Details

**Detailed Steps:**

1. In Supabase dashboard, look at the **left sidebar**
2. Click the **⚙️ Settings** icon (gear icon at the bottom)
3. Click **"Database"** in the settings menu
4. Scroll down to find **"Connection string"** section
5. Click the **dropdown menu** and select **"URI"** format
6. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
7. Click the **📋 Copy** button next to the connection string
8. **Important:** The copied string contains `[YOUR-PASSWORD]` placeholder
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Your password is the one you created when setting up the project
   - If you forgot it: Settings → Database → "Reset database password"

**Alternative: Get Individual Values**

If you prefer separate values (for environment variables), in the same Database settings page:

- **Host**: `db.xxxxx.supabase.co` (shown in Connection info section)
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: Click "Show" to reveal, or use the password you set

**Visual Guide:**
```
Supabase Dashboard → Settings (⚙️) → Database → Scroll to "Connection string" → Select "URI" → Copy
```

**See detailed guide:** `SUPABASE_CONNECTION_GUIDE.md` for step-by-step instructions with screenshots.

### Step 2.4: Run SQL Schema in Supabase

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy and paste the entire `SQL/postgresql_schema.sql` file
4. Click "Run" (or press Ctrl+Enter)
5. Verify tables were created:
   - Go to **Table Editor**
   - You should see all tables listed

### Step 2.5: Enable Row Level Security (RLS) - Optional but Recommended

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id::text);

-- Repeat for other tables as needed
```

---

## Part 3: Updating PHP Code

### Step 3.1: Install PostgreSQL PHP Extension

**For Local Development (XAMPP):**

1. Open `php.ini` in `C:\xampp\php\`
2. Find and uncomment:
   ```ini
   extension=pdo_pgsql
   extension=pgsql
   ```
3. Restart Apache

**For Vercel:**
- Vercel automatically includes PostgreSQL extensions

### Step 3.2: Create Database Connection Helper

Create `config/database.php`:

```php
<?php
// config/database.php
// PostgreSQL Database Connection for Supabase

// Get environment variables (for Vercel) or use defaults (for local)
$DB_HOST = getenv('DB_HOST') ?: 'db.xxxxx.supabase.co';
$DB_PORT = getenv('DB_PORT') ?: '5432';
$DB_NAME = getenv('DB_NAME') ?: 'postgres';
$DB_USER = getenv('DB_USER') ?: 'postgres';
$DB_PASS = getenv('DB_PASSWORD') ?: 'your-password-here';

// Connection string for PostgreSQL
$dsn = "pgsql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME}";

try {
    $pdo = new PDO(
        $dsn,
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // Important for PostgreSQL
        ]
    );
} catch (PDOException $e) {
    error_log('Database connection error: ' . $e->getMessage());
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}
?>
```

### Step 3.3: Update All PHP Files

**Key Changes Needed:**

1. **Change MySQL-specific syntax:**
   ```php
   // OLD (MySQL)
   $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id');
   
   // NEW (PostgreSQL) - Same syntax, but different connection
   // No changes needed for prepared statements!
   ```

2. **Update JSON handling:**
   ```php
   // OLD (MySQL)
   items_json JSON NULL
   
   // NEW (PostgreSQL)
   // Use JSONB in schema, but PHP code stays the same
   $data = json_decode($row['items_json'], true);
   ```

3. **Update AUTO_INCREMENT references:**
   ```php
   // OLD (MySQL)
   $id = $pdo->lastInsertId();
   
   // NEW (PostgreSQL)
   // Use RETURNING clause or lastInsertId() still works!
   $stmt = $pdo->prepare('INSERT INTO users (...) VALUES (...) RETURNING id');
   $stmt->execute();
   $id = $stmt->fetchColumn();
   ```

4. **Update date functions:**
   ```php
   // OLD (MySQL)
   NOW()
   
   // NEW (PostgreSQL)
   NOW() // Still works, but better to use in PHP:
   date('Y-m-d H:i:s') // or
   (new DateTime())->format('Y-m-d H:i:s')
   ```

### Step 3.4: Update Specific Files

**Example: Update `jbr7php/session_user.php`:**

```php
<?php
// Before: MySQL connection
$pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", ...);

// After: PostgreSQL connection
require_once __DIR__ . '/../config/database.php';
// $pdo is now available from database.php
```

**Create a script to update all files:**

Create `scripts/update_db_connections.php`:

```php
<?php
// Script to find and update all database connections
$files = glob('jbr7php/*.php');
$oldConnection = 'new PDO("mysql:host';
$newConnection = "require_once __DIR__ . '/../config/database.php';";

foreach ($files as $file) {
    $content = file_get_contents($file);
    if (strpos($content, $oldConnection) !== false) {
        // Replace MySQL connection with PostgreSQL
        $content = str_replace(
            "new PDO(\"mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4\"",
            "require_once __DIR__ . '/../config/database.php';",
            $content
        );
        file_put_contents($file, $content);
        echo "Updated: $file\n";
    }
}
?>
```

---

## Part 4: Setting Up Vercel

### Step 4.1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 4.2: Create `vercel.json`

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*.php",
      "use": "@vercel/php"
    }
  ],
  "routes": [
    {
      "src": "/(.*\\.php)$",
      "dest": "/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "PHP_VERSION": "8.2"
  }
}
```

### Step 4.3: Create `.vercelignore`

```
node_modules/
.git/
.vercel/
*.log
php_errors.log
```

### Step 4.4: Test Local Deployment

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Part 5: GitHub Integration

### Step 5.1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Supabase migration"

# Add GitHub remote
git remote add origin https://github.com/yourusername/jbr7-bags.git

# Push to GitHub
git push -u origin main
```

### Step 5.2: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Click "Import Git Repository"
4. Select your GitHub repository
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
6. Click "Deploy"

### Step 5.3: Enable Auto-Deployment

1. In Vercel project settings
2. Go to **Git** section
3. Ensure:
   - ✅ "Automatically deploy commits pushed to the Production Branch" is enabled
   - Production branch: `main` or `master`
4. Every push to main branch will auto-deploy!

---

## Part 6: Environment Variables

### Step 6.1: Set Environment Variables in Vercel

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add these variables:

```
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-supabase-password
SESSION_SECRET=your-random-secret-key
```

3. Apply to: **Production**, **Preview**, and **Development**

### Step 6.2: Update `config/database.php` to Use Environment Variables

```php
<?php
// config/database.php
// Get from environment (Vercel) or use defaults (local)

$DB_HOST = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
$DB_PORT = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '5432';
$DB_NAME = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'jbr7_db';
$DB_USER = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'postgres';
$DB_PASS = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: '';

// ... rest of connection code
```

### Step 6.3: Create `.env.example` for Local Development

Create `.env.example`:

```
DB_HOST=db.xxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
SESSION_SECRET=local-dev-secret
```

**Note:** Add `.env` to `.gitignore` to keep secrets safe!

---

## Part 7: Testing & Troubleshooting

### Step 7.1: Test Database Connection

Create `test_connection.php`:

```php
<?php
require_once 'config/database.php';

try {
    $stmt = $pdo->query('SELECT version()');
    $version = $stmt->fetchColumn();
    echo "✅ Connected to PostgreSQL: " . $version;
} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage();
}
?>
```

### Step 7.2: Common Issues & Solutions

**Issue 1: "PDO driver not found"**
- Solution: Enable `pdo_pgsql` extension in `php.ini`

**Issue 2: "Connection refused"**
- Solution: Check Supabase firewall settings, allow your IP

**Issue 3: "Column doesn't exist"**
- Solution: Check table names are lowercase (PostgreSQL is case-sensitive)

**Issue 4: "Syntax error near..."**
- Solution: Remove MySQL-specific syntax like `ENGINE=InnoDB`

**Issue 5: Session not working on Vercel**
- Solution: Use Supabase Auth or store sessions in database

### Step 7.3: Migration Checklist

- [ ] All SQL converted to PostgreSQL syntax
- [ ] All PHP files updated to use `config/database.php`
- [ ] Environment variables set in Vercel
- [ ] Database schema created in Supabase
- [ ] Test connection works
- [ ] Test user registration/login
- [ ] Test order creation
- [ ] Test cart functionality
- [ ] Test coupon system
- [ ] GitHub repo connected to Vercel
- [ ] Auto-deployment enabled
- [ ] Production URL working

### Step 7.4: Data Migration (If Needed)

If you have existing data in MySQL:

1. Export MySQL data:
   ```bash
   mysqldump -u root -p jbr7_db > backup.sql
   ```

2. Convert to PostgreSQL format (use tools like `pgloader` or manual conversion)

3. Import to Supabase:
   ```bash
   psql -h db.xxxxx.supabase.co -U postgres -d postgres -f converted_data.sql
   ```

---

## Quick Reference Commands

### Local Development
```bash
# Start local server
php -S localhost:8000

# Test database connection
php test_connection.php
```

### Vercel Deployment
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

### Git Workflow
```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys!
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel PHP Documentation](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/php)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MySQL to PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/migration.html)

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Review browser console for errors
4. Check PHP error logs in Vercel

---

**Last Updated:** January 2026
**Version:** 1.0
