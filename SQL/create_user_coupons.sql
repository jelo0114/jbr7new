-- create_user_coupons.sql
-- Creates table for user redeemed coupons/rewards
-- Run this in phpMyAdmin or MySQL CLI

USE jbr7_db;

-- ============================================
-- STEP 1: Drop table if exists (to avoid conflicts)
-- ============================================
DROP TABLE IF EXISTS user_coupons;

-- ============================================
-- STEP 2: Create user_coupons table WITHOUT foreign key
-- ============================================
CREATE TABLE user_coupons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    discount_percentage INT NOT NULL,
    points_cost INT NOT NULL,
    coupon_code VARCHAR(50) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_coupon_code (coupon_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used),
    INDEX idx_user_active (user_id, is_used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: Add foreign key constraint (if users table exists)
-- ============================================
-- Check if users table exists and has the correct structure
SET @users_table_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'users'
);

SET @users_id_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'id'
    AND DATA_TYPE = 'int'
    AND COLUMN_KEY = 'PRI'
);

SET @sql_add_fk = IF(@users_table_exists > 0 AND @users_id_exists > 0,
    'ALTER TABLE user_coupons ADD CONSTRAINT fk_user_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT "Users table not found or structure mismatch - skipping foreign key" AS message'
);

PREPARE stmt_fk FROM @sql_add_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- ============================================
-- Verify table structure
-- ============================================
DESCRIBE user_coupons;

SELECT 'User coupons table created successfully!' AS result;
