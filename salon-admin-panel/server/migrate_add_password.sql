-- Migration: Add password column to clients table
-- Run this in phpMyAdmin or MySQL client

USE salon_admin;

-- Check if password column exists, if not add it
ALTER TABLE clients ADD COLUMN password VARCHAR(255) NULL;

-- Insert test user if not exists
INSERT IGNORE INTO clients (id, name, email, phone, password) VALUES 
(999, 'Test User', 'user@example.com', '555-0100', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm');
