# 🔥 Firebase Database Setup

## Quick Setup Instructions

Since MySQL command line isn't available, please run these SQL commands manually in phpMyAdmin:

### 1. Open phpMyAdmin
1. Go to http://localhost/phpmyadmin
2. Select the `salon_admin` database
3. Click on "SQL" tab

### 2. Run These SQL Commands

Copy and paste each command one by one:

```sql
-- Add profile image URL to stylists table
ALTER TABLE stylists ADD COLUMN profile_image_url TEXT DEFAULT NULL;
```

```sql
-- Add profile image URL to clients table  
ALTER TABLE clients ADD COLUMN profile_image_url TEXT DEFAULT NULL;
```

```sql
-- Add service image URL to services table
ALTER TABLE services ADD COLUMN service_image_url TEXT DEFAULT NULL;
```

```sql
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
```

```sql
-- Insert sample gallery images (placeholder URLs)
INSERT INTO gallery_images (title, description, image_url, category, is_featured) VALUES
('Modern Hair Cut', 'Professional hair cutting service', 'https://via.placeholder.com/400x300/667eea/ffffff?text=Hair+Cut', 'haircuts', TRUE),
('Hair Coloring', 'Expert hair coloring and highlights', 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Hair+Color', 'coloring', TRUE),
('Styling Service', 'Professional hair styling for events', 'https://via.placeholder.com/400x300/f093fb/ffffff?text=Styling', 'styling', FALSE),
('Salon Interior', 'Our modern salon environment', 'https://via.placeholder.com/400x300/4facfe/ffffff?text=Salon', 'interior', FALSE);
```

```sql
-- Update existing services with placeholder images
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/667eea/ffffff?text=Hair+Cut' WHERE name LIKE '%Cut%';
```

```sql
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/764ba2/ffffff?text=Hair+Color' WHERE name LIKE '%Color%';
```

```sql
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/f093fb/ffffff?text=Styling' WHERE name LIKE '%Styling%';
```

```sql
UPDATE services SET service_image_url = 'https://via.placeholder.com/300x200/4facfe/ffffff?text=Service' WHERE service_image_url IS NULL;
```

### 3. Verify Setup
After running all commands, check that these columns exist:
- `stylists` table should have `profile_image_url` column
- `clients` table should have `profile_image_url` column  
- `services` table should have `service_image_url` column
- New `gallery_images` table should exist with sample data

## ✅ Firebase Integration Status

### Configured:
- ✅ Firebase config updated with your credentials
- ✅ Firebase SDK installed in both React Native apps
- ✅ FirebaseService created for image uploads
- ✅ ProfileScreen updated to use Firebase
- ✅ Backend API endpoint for profile image URLs

### Ready to Test:
1. Run the SQL commands above in phpMyAdmin
2. Restart the backend server
3. Test profile picture upload in Stylist app

### Firebase Project: exampleapp-17653
- **Storage Bucket**: exampleapp-17653.firebasestorage.app
- **Project ID**: exampleapp-17653
- **Free Tier**: 5GB storage, 1GB/day downloads

Your Firebase integration is ready! Once you run the SQL commands, you can test profile picture uploads in the stylist app.