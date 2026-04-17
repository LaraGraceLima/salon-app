# Quick Fix - Stylist Booking 404 Error

## The Issue
Stylist app can't fetch bookings (404 error) because stylists don't have passwords in the database.

## Quick Fix (Choose One)

### Option A: Fresh Database (Recommended)
1. Delete existing `salon_admin` database in phpMyAdmin
2. Re-import `salon-admin-panel/server/database.sql`
3. Restart backend: `npm start` in `salon-admin-panel/server`
4. Test login with: `sarah@salon.com / stylist123`

### Option B: Migrate Existing Database
1. Open terminal in `salon-admin-panel/server`
2. Run: `node add-stylist-password.js`
3. Restart backend: `npm start`
4. Test login with: `sarah@salon.com / stylist123`

## What Changed

### Database Schema
Added `password` column to stylists table:
```sql
password VARCHAR(255)
```

### Stylist Passwords
All stylists now have password: `stylist123` (hashed with bcryptjs)

- sarah@salon.com / stylist123
- emily@salon.com / stylist123
- michael@salon.com / stylist123

### Backend Logging
Added debug logs to help troubleshoot:
- Token verification logs
- Stylist ID extraction logs
- Bookings fetch logs

## Test It

1. Open Stylist App
2. Login: `sarah@salon.com` / `stylist123`
3. Should see bookings load immediately
4. No 404 error
5. Can accept/decline/complete bookings

## If Still Not Working

Check backend console for these logs:
```
verifyToken middleware - Token present: true
verifyToken middleware - Token verified for user ID: 1
Fetching bookings for stylist ID: 1
Found X bookings for stylist 1
```

If you see "Token present: false" → Token not being sent
If you see "Token verification failed" → Token is invalid
If you see "Found 0 bookings" → Stylist has no bookings (normal)

## Files to Update

1. **salon-admin-panel/server/database.sql** ✓ Updated
2. **salon-admin-panel/server/server.js** ✓ Updated with logging
3. **salon-admin-panel/server/add-stylist-password.js** ✓ Created (migration script)

Done! The stylist app should now work.
