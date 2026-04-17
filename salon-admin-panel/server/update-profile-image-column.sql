-- Update profile_image column to support base64 images
USE salon_admin;

-- Change profile_image column to MEDIUMTEXT to support base64 images
ALTER TABLE stylists 
MODIFY COLUMN profile_image MEDIUMTEXT DEFAULT NULL;

SELECT 'Profile image column updated to support base64 images!' AS message;
