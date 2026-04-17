-- Add Firebase image URL columns to existing tables

-- Add profile image URL to stylists table
ALTER TABLE stylists ADD COLUMN profile_image_url TEXT DEFAULT NULL;

-- Add profile image URL to clients table  
ALTER TABLE clients ADD COLUMN profile_image_url TEXT DEFAULT NULL;

-- Add service image URL to services table
ALTER TABLE services ADD COLUMN service_image_url TEXT DEFAULT NULL;

-- Add gallery images table for salon portfolio
CREATE TABLE IF NOT EXISTS gallery_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample gallery images (placeholder URLs)
INSERT INTO gallery_images (title, description, image_url, category, is_featured) VALUES
('Modern Hair Cut', 'Professional hair cutting service', 'https://via.placeholder.com/400x300/667eea/ffffff?text=Hair+Cut', 'haircuts', TRUE),
('Hair Coloring', 'Expert hair coloring and highlights', 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Hair+Color', 'coloring', TRUE),
('Styling Service', 'Professional hair styling for events', 'https://via.placeholder.com/400x300/f093fb/ffffff?text=Styling', 'styling', FALSE),
('Salon Interior', 'Our modern salon environment', 'https://via.placeholder.com/400x300/4facfe/ffffff?text=Salon', 'interior', FALSE);

-- Update existing services with placeholder images
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/667eea/ffffff?text=Hair+Cut' WHERE name LIKE '%Cut%';
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/764ba2/ffffff?text=Hair+Color' WHERE name LIKE '%Color%';
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/f093fb/ffffff?text=Styling' WHERE name LIKE '%Styling%';
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/4facfe/ffffff?text=Service' WHERE service_image_url IS NULL;