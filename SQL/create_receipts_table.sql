-- create_receipts_table.sql
-- Creates receipts table with proper foreign key constraints
-- Run this AFTER users and orders tables exist

USE jbr7_db;

-- Drop table if exists (to allow re-running)
DROP TABLE IF EXISTS receipts;

-- Create receipts table WITHOUT foreign keys first
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

-- Add foreign key for user_id (only if users table exists and has correct structure)
-- Check if users table exists and has INT UNSIGNED id
SET @users_table_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'users'
);

SET @users_id_type = (
    SELECT DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'id'
);

SET @users_id_unsigned = (
    SELECT COLUMN_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'id'
    AND COLUMN_TYPE LIKE '%unsigned%'
);

-- Add foreign key for user_id (using stored procedure approach for MySQL compatibility)
-- Check if constraint already exists
SET @fk_user_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'receipts' 
    AND CONSTRAINT_NAME = 'fk_receipts_user'
);

-- Add user foreign key if users table exists and constraint doesn't exist
SET @add_user_fk = IF(
    @users_table_exists > 0 AND @fk_user_exists = 0,
    CONCAT('ALTER TABLE receipts ADD CONSTRAINT fk_receipts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'),
    'SELECT 1'
);

SET @sql_user = @add_user_fk;
PREPARE stmt_user_fk FROM @sql_user;
EXECUTE stmt_user_fk;
DEALLOCATE PREPARE stmt_user_fk;

-- Add foreign key for order_id (only if orders table exists)
SET @orders_table_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'orders'
);

SET @fk_order_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'receipts' 
    AND CONSTRAINT_NAME = 'fk_receipts_order'
);

-- Add order foreign key if orders table exists and constraint doesn't exist
SET @add_order_fk = IF(
    @orders_table_exists > 0 AND @fk_order_exists = 0,
    CONCAT('ALTER TABLE receipts ADD CONSTRAINT fk_receipts_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL'),
    'SELECT 1'
);

SET @sql_order = @add_order_fk;
PREPARE stmt_order_fk FROM @sql_order;
EXECUTE stmt_order_fk;
DEALLOCATE PREPARE stmt_order_fk;

SELECT 'Receipts table created successfully!' AS result;
