-- add_profile_picture.sql
-- Adds profile_picture column to users table

USE jbr7_db;

-- Check if column already exists before adding
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'jbr7_db' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'profile_picture'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN profile_picture VARCHAR(512) NULL DEFAULT NULL AFTER points',
    'SELECT "Column profile_picture already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
