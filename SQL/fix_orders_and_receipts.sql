-- fix_orders_and_receipts.sql
-- Simple script to fix orders table and create receipts table
-- Run this in phpMyAdmin or MySQL CLI

USE jbr7_db;

-- ============================================
-- STEP 1: Add shipping_address column to orders if missing
-- ============================================
-- Check if column exists first (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'orders' 
    AND COLUMN_NAME = 'shipping_address'
);

SET @sql_add_col = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL AFTER customer_phone',
    'SELECT "Column shipping_address already exists" AS message'
);

PREPARE stmt_col FROM @sql_add_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- ============================================
-- STEP 2: Drop receipts table if exists
-- ============================================
DROP TABLE IF EXISTS receipts;

-- ============================================
-- STEP 3: Create receipts table WITHOUT foreign keys
-- ============================================
CREATE TABLE receipts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED NULL,
    order_number VARCHAR(100) NOT NULL,
    receipt_data TEXT NOT NULL,
    shipping_address TEXT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NULL,
    courier_service VARCHAR(50) NULL,
    customer_email VARCHAR(255) NULL,
    customer_phone VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id),
    INDEX idx_order_number (order_number),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 4: Add foreign keys manually (run these separately if needed)
-- ============================================
-- Uncomment these lines if you want foreign keys:
-- ALTER TABLE receipts ADD CONSTRAINT fk_receipts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE receipts ADD CONSTRAINT fk_receipts_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

SELECT 'Setup complete! Orders table updated and receipts table created.' AS result;
