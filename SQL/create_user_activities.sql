-- create_user_activities.sql
-- Creates user_activities table for tracking user activities and rewards

USE `jbr7_db`;

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
