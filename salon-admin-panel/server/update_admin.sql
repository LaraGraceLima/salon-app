-- Update existing admin password
USE salon_admin;

-- Delete existing admin if any
DELETE FROM admins WHERE email = 'admin@salon.com';

-- Insert new admin with correct password hash (admin123)
INSERT INTO admins (name, email, password) VALUES 
('Admin User', 'admin@salon.com', '$2a$10$XnSc38ie/yGURL2OwJ7iTOTq5YQ/B23aLIJIpq3Mjp1.FFS9NFKFu');

-- Verify
SELECT * FROM admins;
