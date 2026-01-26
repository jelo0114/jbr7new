-- saveitems.sql
-- Creates a `saved_items` table for jbr7_db

USE `jbr7_db`;

CREATE TABLE IF NOT EXISTS `saved_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `item_id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NULL,
  `price` DECIMAL(10,2) NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
