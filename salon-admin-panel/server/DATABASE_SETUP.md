# Database Setup Instructions

## Issue
The `clients` table needs a `password` column to support user signup/login.

## Solution

### Option 1: Using phpMyAdmin (Recommended)

1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Select the `salon_admin` database
3. Select the `clients` table
4. Click on the "Structure" tab
5. Click "Add" to add a new column
6. Fill in the details:
   - Column name: `password`
   - Type: `VARCHAR`
   - Length: `255`
   - Null: `Yes`
7. Click "Save"

### Option 2: Using SQL Query

Run this SQL query in phpMyAdmin's SQL tab:

```sql
ALTER TABLE clients ADD COLUMN password VARCHAR(255) NULL;

-- Insert test user (password: password123)
INSERT IGNORE INTO clients (id, name, email, phone, password) VALUES 
(999, 'Test User', 'user@example.com', '555-0100', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm');
```

### Option 3: Re-import Database

1. Drop the existing `salon_admin` database
2. Re-import the updated `database.sql` file which now includes the password column

## After Setup

Once the password column is added, users can:
- Create new accounts via the signup screen
- Login with their credentials
- Access the full app features

## Test Credentials

After setup, you can test with:
- Email: `user@example.com`
- Password: `password123`
