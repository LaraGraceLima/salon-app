-- Add salon_info table for dynamic salon information
CREATE TABLE IF NOT EXISTS salon_info (
  id INT PRIMARY KEY DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  currency VARCHAR(10),
  timezone VARCHAR(50),
  business_hours JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default salon info
INSERT INTO salon_info (id, name, tagline, address, phone, email, currency, timezone, business_hours) 
VALUES (
  1, 
  'JKD SALON', 
  'Your premier beauty destination ✨', 
  '123 Salon St, Brgy. Elegance, Quezon City, Metro Manila', 
  '+63 912 345 6789', 
  'hello@salonsuite.com', 
  'PHP', 
  'Asia/Manila',
  '{"Monday":{"open":true,"from":"09:00","to":"18:00"},"Tuesday":{"open":true,"from":"09:00","to":"18:00"},"Wednesday":{"open":true,"from":"09:00","to":"18:00"},"Thursday":{"open":true,"from":"09:00","to":"18:00"},"Friday":{"open":true,"from":"09:00","to":"20:00"},"Saturday":{"open":true,"from":"08:00","to":"20:00"},"Sunday":{"open":false,"from":"10:00","to":"16:00"}}'
) ON DUPLICATE KEY UPDATE name=name;
