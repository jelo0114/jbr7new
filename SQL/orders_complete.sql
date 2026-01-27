-- orders_complete.sql
-- Complete orders system with order_items table for jbr7_db

USE `jbr7_db`;

-- Update orders table to include status tracking timestamps
-- Note: Run these ALTER TABLE statements one by one if columns already exist
ALTER TABLE `orders` 
ADD COLUMN `status_updated_at` TIMESTAMP NULL DEFAULT NULL AFTER `status`;

ALTER TABLE `orders` 
ADD COLUMN `shipped_at` TIMESTAMP NULL DEFAULT NULL AFTER `status_updated_at`;

ALTER TABLE `orders` 
ADD COLUMN `delivered_at` TIMESTAMP NULL DEFAULT NULL AFTER `shipped_at`;

ALTER TABLE `orders` 
ADD COLUMN `payment_method` VARCHAR(64) NULL DEFAULT NULL AFTER `delivered_at`;

ALTER TABLE `orders` 
ADD COLUMN `courier_service` VARCHAR(64) NULL DEFAULT NULL AFTER `payment_method`;

ALTER TABLE `orders` 
ADD COLUMN `customer_email` VARCHAR(255) NULL DEFAULT NULL AFTER `courier_service`;

ALTER TABLE `orders` 
ADD COLUMN `customer_phone` VARCHAR(64) NULL DEFAULT NULL AFTER `customer_email`;

ALTER TABLE `orders` 
ADD COLUMN `can_cancel_after` TIMESTAMP NULL DEFAULT NULL AFTER `customer_phone`;

-- Create order_items table for individual items in orders
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `item_image` VARCHAR(512) NULL,
  `item_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `size` VARCHAR(128) NULL,
  `color` VARCHAR(128) NULL,
  `line_total` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'processing',
  `status_updated_at` TIMESTAMP NULL DEFAULT NULL,
  `shipped_at` TIMESTAMP NULL DEFAULT NULL,
  `delivered_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update reviews table to link to order_items
-- Note: Run these ALTER TABLE statements one by one if columns already exist
ALTER TABLE `reviews`
ADD COLUMN `order_item_id` INT UNSIGNED NULL DEFAULT NULL AFTER `item_id`;

ALTER TABLE `reviews`
ADD COLUMN `comment` TEXT NULL AFTER `body`;

-- Add index and foreign key (run separately if they exist)
-- ALTER TABLE `reviews` ADD INDEX (`order_item_id`);
-- ALTER TABLE `reviews` ADD FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE SET NULL;

-- Create items table for explore page
CREATE TABLE IF NOT EXISTS `items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_id` VARCHAR(128) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(512) NULL,
  `category` VARCHAR(128) NULL,
  `rating` DECIMAL(3,2) NULL DEFAULT 0.00,
  `review_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`category`),
  INDEX (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
