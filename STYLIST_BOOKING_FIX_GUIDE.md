# Stylist App - Booking Fetch 404 Fix

## Problem
Stylist app was getting 404 error when trying to fetch bookings. The endpoint `/api/stylists/bookings` requires authentication, but stylists couldn't login because they didn't have passwords in the database.

## Root Cause
The `stylists` table in the database was missing the `password` column, so:
1. Stylists couldn't login (no password to verify)
2. No token could be generated
3. Bookings endpoint returned 401 (unauthorized) which appeared as 404

## Solution

### Step 1: Update Database Schema
The `database.sql` file has been updated to include the `password` column in the stylists table:

```sql
CREATE TABLE IF NOT EXISTS stylists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  specialization VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  password VARCHAR(255),  -- NEW COLUMN
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Add Hashed Passwords to Stylists
The INSERT statement now includes hashed passwords for all stylists:

```sql
INSERT INTO stylists (name, email, phone, specialization, status, password) VALUES 
('Sarah Williams', 'sarah@salon.com', '555-1001', 'Hair Cutting', 'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm'),
('Emily Brown', 'emily@salon.com', '555-1002', 'Hair Coloring', 'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm'),
('Michael Davis', 'michael@salon.com', '555-1003', 'Styling', 'active', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm');
```

All passwords are hashed with bcryptjs. The plain password is: `stylist123`

### Step 3: Apply Migration (If Database Already Exists)
If you already have the database created without the password column, run the migration script:

```bash
cd salon-admin-panel/server
node add-stylist-password.js
```

This script will:
1. Add the password column if it doesn't exist
2. Set passwords for all existing stylists
3. Confirm the operation

### Step 4: Restart Backend
After updating the database, restart the backend server:

```bash
cd salon-admin-panel/server
npm start
```

## Testing

### Login Test
1. Open Stylist App
2. Enter credentials:
   - Email: `sarah@salon.com`
   - Password: `stylist123`
3. Tap "Sign In"
4. **Expected**: Login succeeds, token is generated, app navigates to Bookings tab

### Bookings Fetch Test
1. After successful login, bookings should load immediately
2. Check console for logs:
   ```
   BookingsScreen - Token from params: [token preview]...
   Fetching stylist bookings with token: [token preview]...
   Bookings fetched: [number]
   ```
3. **Expected**: Bookings display without 404 error

### Backend Logs
When fetching bookings, you should see in backend console:
```
verifyToken middleware - Token present: true
verifyToken middleware - Token verified for user ID: 1
Fetching bookings for stylist ID: 1
Found X bookings for stylist 1
```

## Stylist Credentials

All stylists can now login with password `stylist123`:

| Name | Email | Password |
|------|-------|----------|
| Sarah Williams | sarah@salon.com | stylist123 |
| Emily Brown | emily@salon.com | stylist123 |
| Michael Davis | michael@salon.com | stylist123 |

## Files Modified

1. **salon-admin-panel/server/database.sql**
   - Added `password VARCHAR(255)` column to stylists table
   - Updated INSERT statement with hashed passwords

2. **salon-admin-panel/server/server.js**
   - Added logging to `verifyToken` middleware
   - Added logging to `/api/stylists/bookings` endpoint

3. **salon-admin-panel/server/add-stylist-password.js** (NEW)
   - Migration script to add password column and set passwords for existing stylists

## How It Works Now

```
1. Stylist enters credentials in LoginScreen
   ↓
2. POST /api/stylists/login with email and password
   ↓
3. Backend verifies password using bcrypt.compare()
   ↓
4. If valid, JWT token is generated and returned
   ↓
5. Token stored in App.js state
   ↓
6. Token passed to BookingsScreen via navigation params
   ↓
7. BookingsScreen sends GET /api/stylists/bookings with Authorization header
   ↓
8. verifyToken middleware verifies JWT token
   ↓
9. Extracts stylist_id from token
   ↓
10. Queries bookings for that stylist_id
   ↓
11. Returns bookings to app
```

## Troubleshooting

### Still Getting 404 Error
1. Verify backend is running: `http://192.168.12.156:3001/api/health`
2. Check backend console for token verification logs
3. Verify database has password column: `DESCRIBE stylists;`
4. Verify stylists have passwords: `SELECT email, password FROM stylists;`

### Login Still Fails
1. Check if password hash is correct
2. Run migration script: `node add-stylist-password.js`
3. Verify bcryptjs is installed: `npm list bcryptjs`

### Bookings Still Not Loading
1. Check if token is being passed to BookingsScreen
2. Verify token is valid (check backend logs)
3. Verify stylist has bookings in database
4. Check if stylist_id matches in bookings table

## Security Notes

- Passwords are hashed using bcryptjs with 10 salt rounds
- Tokens are JWT with 24-hour expiration
- Token verification happens on every protected endpoint
- Passwords are never logged or exposed

## Next Steps

1. Re-import database.sql or run migration script
2. Restart backend server
3. Test stylist login with credentials above
4. Verify bookings load without errors
5. Test booking status updates
