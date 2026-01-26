-- fix_reviews_simple.sql
-- Simple migration script - run this in phpMyAdmin
-- This version checks for existing columns before adding them

USE `jbr7_db`;

-- Step 1: Add product_title column (only if it doesn't exist)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND COLUMN_NAME = 'product_title'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `reviews` ADD COLUMN `product_title` VARCHAR(255) NOT NULL DEFAULT '''' AFTER `user_id`',
    'SELECT "product_title column already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add item_id column (only if it doesn't exist)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND COLUMN_NAME = 'item_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `reviews` ADD COLUMN `item_id` VARCHAR(128) NOT NULL DEFAULT '''' AFTER `product_title`',
    'SELECT "item_id column already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Update rating to support decimals (0.5, 1.0, 1.5, etc.)
-- Check current column type first
SET @col_type = (
    SELECT DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND COLUMN_NAME = 'rating'
);

SET @sql = IF(@col_type != 'decimal',
    'ALTER TABLE `reviews` MODIFY COLUMN `rating` DECIMAL(3,1) NOT NULL',
    'SELECT "rating column already supports decimals - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add comment column (only if it doesn't exist)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND COLUMN_NAME = 'comment'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `reviews` ADD COLUMN `comment` TEXT NOT NULL AFTER `rating`',
    'SELECT "comment column already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add indexes (check if they exist first)
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND INDEX_NAME = 'idx_reviews_user'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `reviews` ADD INDEX `idx_reviews_user` (`user_id`)',
    'SELECT "idx_reviews_user index already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND INDEX_NAME = 'idx_reviews_item'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `reviews` ADD INDEX `idx_reviews_item` (`item_id`)',
    'SELECT "idx_reviews_item index already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND INDEX_NAME = 'idx_reviews_title'
);
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE `reviews` ADD INDEX `idx_reviews_title` (`product_title`)',
    'SELECT "idx_reviews_title index already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add unique constraint (one review per user per item)
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND CONSTRAINT_NAME = 'unique_user_product'
);

SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE `reviews` ADD UNIQUE KEY `unique_user_product` (`user_id`, `item_id`)',
    'SELECT "unique_user_product constraint already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Update existing rows to populate product_title and item_id if they're empty
-- Check if 'title' column exists first
SET @has_title = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND COLUMN_NAME = 'title'
);

SET @has_item_title = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'reviews' 
    AND COLUMN_NAME = 'item_title'
);

-- Update using title column if it exists
SET @sql = IF(@has_title > 0,
    'UPDATE `reviews` SET `product_title` = COALESCE(`title`, ''Unknown Product''), `item_id` = CONCAT(''item_'', MD5(COALESCE(`title`, ''Unknown Product''))) WHERE (`product_title` = '''' OR `product_title` IS NULL) OR (`item_id` = '''' OR `item_id` IS NULL)',
    IF(@has_item_title > 0,
        'UPDATE `reviews` SET `product_title` = COALESCE(`item_title`, ''Unknown Product''), `item_id` = CONCAT(''item_'', MD5(COALESCE(`item_title`, ''Unknown Product''))) WHERE (`product_title` = '''' OR `product_title` IS NULL) OR (`item_id` = '''' OR `item_id` IS NULL)',
        'SELECT "No source columns (title/item_title) found in reviews table - skipping data migration. New reviews will have product_title and item_id set automatically." AS message'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed! Check messages above for any skipped steps.' AS status;
