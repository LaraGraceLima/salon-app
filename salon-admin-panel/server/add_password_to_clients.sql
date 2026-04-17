-- Add password column to clients table
ALTER TABLE clients ADD COLUMN password VARCHAR(255) DEFAULT NULL;

-- Insert a test user with password (password123)
INSERT INTO clients (name, email, phone, password) VALUES 
('Test User', 'user@example.com', '555-0100', '$2a$10$YourHashedPasswordHere');
