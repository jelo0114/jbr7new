-- complete_rewards_setup.sql
-- Complete setup for rewards, points, and activities system
-- Run this file to set up everything needed for the rewards system

USE `jbr7_db`;

-- ============================================
-- STEP 1: Add points column to users table
-- ============================================
-- Check if column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'jbr7_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'points';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `users` ADD COLUMN `points` INT NOT NULL DEFAULT 0',
    'SELECT "points column already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure all users have points initialized
UPDATE `users` SET `points` = 0 WHERE `points` IS NULL;

-- ============================================
-- STEP 2: Create user_activities table
-- ============================================
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `activity_type` VARCHAR(64) NOT NULL,
  `description` TEXT NULL,
  `points_awarded` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  INDEX (`activity_type`),
  INDEX (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Done! The rewards system is now set up.
-- ============================================
-- Points will be awarded automatically when:
-- - User places an order (100 points)
-- - User adds a review (100 points)
-- 
-- Activities are logged in the user_activities table
-- Points are stored in the users.points column
