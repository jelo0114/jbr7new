-- complete_import.sql
-- Complete SQL import file for JBR7 Bags reviews and orders system
-- Run this file in phpMyAdmin or MySQL CLI to set up the complete system

USE `jbr7_db`;

-- ============================================
-- 1. Update orders table
-- ============================================
-- Note: If columns already exist, you may need to drop them first or skip these ALTER statements

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

-- ============================================
-- 2. Create order_items table
-- ============================================
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

-- ============================================
-- 3. Update reviews table
-- ============================================
ALTER TABLE `reviews`
ADD COLUMN `order_item_id` INT UNSIGNED NULL DEFAULT NULL AFTER `item_id`;

ALTER TABLE `reviews`
ADD COLUMN `comment` TEXT NULL AFTER `body`;

-- Add index and foreign key for order_item_id
ALTER TABLE `reviews` ADD INDEX (`order_item_id`);
ALTER TABLE `reviews` ADD FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE SET NULL;

-- ============================================
-- 4. Create items table for explore page
-- ============================================
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

-- ============================================
-- 5. Insert items data
-- ============================================
INSERT INTO `items` (`item_id`, `title`, `description`, `price`, `image`, `category`) VALUES
('eco-colored-tote', 'Eco Colored Tote Bag', 'Tote Bag Katsa White, Black and Colored — lightweight, durable, and perfect for everyday use.', 55.00, 'Tote Bag/Colored.png', 'jute-tote'),
('riki-tall-bag', 'Riki Tall Bag', 'Size: 29x22 x 1.5 inches', 850.00, 'Riki Bag/Riki.jpg', 'riki'),
('ringlight-bag', 'Ring Light Bag', 'Spacious duffel with premium materials, perfect for weekend getaways', 500.00, 'RingLight/Ringlight.jpg', 'ringlight'),
('plain-brass-backpack', 'Plain Brass Cotton Back Pack', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'One/ph-11134207-7ras8-m9txs8bfjp3gc0.jpg', 'backpack'),
('two-colored-backpack', 'Two Colored Brass Cotton Back Pack', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Two Color/ph-11134207-7rasg-m9ty0a4dge0z1e.jpg', 'backpack'),
('vanity-mirror-bag', 'Vanity Mirror Bag', 'Durable canvas tote with reinforced handles and internal pockets', 400.00, 'Mirror Bag/68ba1e35671d997f6eb3ed1c376a4b27.jpg', 'vanity'),
('envelope-bag', 'Envelope Bags', 'Size 15*12.5inches', 70.00, 'Envelope Bag/ablue.png', 'envelop-module'),
('boys-kiddie-bag', 'Boys Kiddie Bag', 'Sizes: S, M, L', 140.00, 'Boys Kiddie Bag/BOYS.jpg', 'boys-kiddie'),
('girls-kiddie-bag', 'Girls Kiddie Bag', 'Sizes: S, M, L', 140.00, 'Girls Kiddie Bag/GIRL.jpg', 'girls-kiddie'),
('katrina-plain', 'Katrina Plain', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Katrina Plain/Copy%20of%20Green%20Grey%20Simple%20Modern%20New%20Arrival%20Instagram%20Post%20(1).png', 'backpack'),
('katrina-two-colors', 'Katrina Two Colors', 'Size: 16.5 x 12 x 4.5 inches Fabric Used: Brass Cotton', 180.00, 'Katrina Two Colors/1.png', 'backpack'),
('module-bag', 'Module Bag', 'Size 15*12.5*3.5 inches Fabric Used: Poly Rubber and PVC Transparent', 90.00, 'Module/ph-11134207-7r98r-lxmbqd55abtt7c.avif', 'envelop-module')
ON DUPLICATE KEY UPDATE 
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `price` = VALUES(`price`),
  `image` = VALUES(`image`),
  `category` = VALUES(`category`);

-- ============================================
-- Done! The database is ready for use.
-- ============================================
