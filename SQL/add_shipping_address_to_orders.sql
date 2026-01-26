-- add_shipping_address_to_orders.sql
-- Adds shipping_address column to orders table if it doesn't exist

USE jbr7_db;

-- Check if column already exists
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'orders' 
    AND COLUMN_NAME = 'shipping_address'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL AFTER customer_phone',
    'SELECT "Column shipping_address already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
