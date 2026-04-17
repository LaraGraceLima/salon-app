USE salon_admin;

-- Add category column if not exists
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';

-- Add service_image_url if not exists
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_image_url TEXT DEFAULT NULL;

-- Update existing services with categories
UPDATE services SET category = 'Hair' WHERE name LIKE '%Hair%' OR name LIKE '%Cut%' OR name LIKE '%Color%';
UPDATE services SET category = 'Beard' WHERE name LIKE '%Beard%' OR name LIKE '%Shave%';
UPDATE services SET category = 'Styling' WHERE name LIKE '%Styl%';
UPDATE services SET category = 'General' WHERE category IS NULL OR category = '';

SELECT 'Migration complete' AS status;
