-- jbr7_db_init.sql
-- Run this in phpMyAdmin or via mysql CLI to create database and users table

CREATE DATABASE IF NOT EXISTS jbr7_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jbr7_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
