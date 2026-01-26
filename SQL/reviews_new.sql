-- reviews_new.sql
-- Clean review system for JBR7 Bags
-- Run this to create a fresh reviews table

USE `jbr7_db`;

-- Drop existing reviews table if you want to start fresh (uncomment if needed)
-- DROP TABLE IF EXISTS `reviews`;

-- Create new reviews table with clean structure
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `product_title` VARCHAR(255) NOT NULL,
  `item_id` VARCHAR(128) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_item_id` (`item_id`),
  INDEX `idx_product_title` (`product_title`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_rating` (`rating`),
  UNIQUE KEY `unique_user_product` (`user_id`, `item_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
