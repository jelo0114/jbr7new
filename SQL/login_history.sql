-- login_history.sql
-- Creates a `login_history` table for jbr7_db to track user login sessions

USE `jbr7_db`;

CREATE TABLE IF NOT EXISTS `login_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(512) NULL,
  `login_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_time` TIMESTAMP NULL DEFAULT NULL,
  `session_duration` INT NULL DEFAULT NULL COMMENT 'Duration in seconds',
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  INDEX (`login_time`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
