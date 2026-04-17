-- Add new fields to stylists table
USE salon_admin;

-- Add years_of_experience column
ALTER TABLE stylists 
ADD COLUMN IF NOT EXISTS years_of_experience INT DEFAULT 0 AFTER specialization;

-- Add bio/description column
ALTER TABLE stylists 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL AFTER years_of_experience;

-- Add profile_image column
ALTER TABLE stylists 
ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) DEFAULT NULL AFTER bio;

-- Add achievements column
ALTER TABLE stylists 
ADD COLUMN IF NOT EXISTS achievements TEXT DEFAULT NULL AFTER profile_image;

-- Add rating column
ALTER TABLE stylists 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00 AFTER achievements;

-- Add total_bookings column
ALTER TABLE stylists 
ADD COLUMN IF NOT EXISTS total_bookings INT DEFAULT 0 AFTER rating;

-- Update existing stylists with sample data
UPDATE stylists SET 
  years_of_experience = 5,
  bio = 'Experienced stylist specializing in modern cuts and styles.',
  achievements = 'Certified Hair Stylist, Award Winner 2023',
  rating = 4.8,
  total_bookings = 150
WHERE email = 'sarah@salon.com';

UPDATE stylists SET 
  years_of_experience = 7,
  bio = 'Expert in hair coloring techniques and color correction.',
  achievements = 'Master Colorist Certification, 10+ Years Experience',
  rating = 4.9,
  total_bookings = 200
WHERE email = 'emily@salon.com';

UPDATE stylists SET 
  years_of_experience = 4,
  bio = 'Creative stylist for special events and occasions.',
  achievements = 'Wedding Specialist, Fashion Week Stylist',
  rating = 4.7,
  total_bookings = 120
WHERE email = 'michael@salon.com';

SELECT 'Stylist fields added successfully!' AS message;
