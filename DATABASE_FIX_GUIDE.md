# Database Fix Guide - Unknown Column Error

## Problem
The server is returning "Unknown column 'notes'" error when creating bookings.

## Root Cause
The `bookings` table in the database is missing the `notes` column that the server code is trying to insert.

## Solution

### Option 1: Run the Fix Script (Recommended)

```bash
cd salon-admin-panel/server
node fix-database.js
```

This will:
1. Check if the notes column exists
2. Add it if missing
3. Verify the table structure

### Option 2: Manual SQL Fix

Run this SQL command in phpMyAdmin or MySQL client:

```sql
ALTER TABLE bookings ADD COLUMN notes TEXT DEFAULT NULL AFTER date_time;
```

### Option 3: Reimport Database

If you want to start fresh:

1. Drop the existing database:
```sql
DROP DATABASE salon_admin;
```

2. Reimport the updated database.sql:
```bash
mysql -u root -p < salon-admin-panel/server/database.sql
```

---

## Verify the Fix

After applying the fix, verify the table structure:

```sql
DESCRIBE bookings;
```

You should see:
```
+------------+------------------------------------------+------+-----+---------+----------------+
| Field      | Type                                     | Null | Key | Default | Extra          |
+------------+------------------------------------------+------+-----+---------+----------------+
| id         | int                                      | NO   | PRI | NULL    | auto_increment |
| client_id  | int                                      | NO   | MUL | NULL    |                |
| stylist_id | int                                      | NO   | MUL | NULL    |                |
| service_id | int                                      | NO   | MUL | NULL    |                |
| date_time  | datetime                                 | NO   |     | NULL    |                |
| notes      | text                                     | YES  |     | NULL    |                |
| status     | enum('pending','confirmed','completed'...) | NO   |     | pending |                |
| created_at | timestamp                                | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------+------------------------------------------+------+-----+---------+----------------+
```

---

## Test Booking Creation

After fixing the database:

1. **Login to user app**
   - Email: user@example.com
   - Password: password123

2. **Create a booking**
   - Navigate to Stylists
   - Select a stylist
   - Fill in booking details
   - Add notes (optional)
   - Confirm booking

3. **Verify in database**
   ```sql
   SELECT * FROM bookings ORDER BY created_at DESC LIMIT 1;
   ```

4. **Check stylist app**
   - Login as stylist: sarah@salon.com / stylist123
   - Should see the new booking
   - Can accept/decline/complete it

---

## Verify Data Flow

### User App → Database
1. User creates booking with notes
2. Server receives: `{ stylist_id, service_id, date_time, notes }`
3. Server inserts into bookings table
4. Booking saved with notes column

### Database → Stylist App
1. Stylist app calls `/api/bookings`
2. Server queries bookings table with JOIN to get client/stylist/service names
3. Returns formatted booking data
4. Stylist app displays bookings
5. Stylist can accept/decline/complete

---

## Complete Booking Workflow

```
User App                    Backend                 Database            Stylist App
   |                           |                        |                    |
   |-- Create Booking -------->|                        |                    |
   |                           |-- INSERT bookings ---->|                    |
   |                           |                        |                    |
   |<-- Success Response -------|                        |                    |
   |                           |                        |                    |
   |-- View My Bookings ------>|                        |                    |
   |                           |-- SELECT bookings ---->|                    |
   |<-- Bookings List ---------|                        |                    |
   |                           |                        |                    |
   |                           |                        |                    |
   |                           |                        |    Stylist Logs In |
   |                           |                        |<-- Login ----------|
   |                           |                        |                    |
   |                           |                        |    View Bookings   |
   |                           |<-- SELECT bookings ----|                    |
   |                           |                        |                    |
   |                           |-- Formatted Data ----->|                    |
   |                           |                        |    Display Bookings|
   |                           |                        |                    |
   |                           |                        |    Accept Booking  |
   |                           |<-- UPDATE status ------|                    |
   |                           |                        |                    |
   |-- View My Bookings ------>|                        |                    |
   |                           |-- SELECT bookings ---->|                    |
   |<-- Updated Status --------|                        |                    |
```

---

## Troubleshooting

### Issue: Still getting "Unknown column" error
**Solution**: 
1. Verify the fix was applied: `DESCRIBE bookings;`
2. Restart the backend server
3. Try creating a booking again

### Issue: Bookings not showing in stylist app
**Solution**:
1. Verify bookings exist in database: `SELECT * FROM bookings;`
2. Check stylist_id matches: `SELECT * FROM bookings WHERE stylist_id = 1;`
3. Verify API endpoint returns data: Test `/api/bookings` in browser

### Issue: Stylist can't update booking status
**Solution**:
1. Check token is valid
2. Verify booking exists
3. Check status update endpoint is working

---

## Files Updated

1. **database.sql** - Added notes column to bookings table
2. **add_notes_column.sql** - Migration script for existing databases
3. **fix-database.js** - Automated fix script
4. **server.js** - Already handles notes column correctly

---

## Summary

The database was missing the `notes` column. This has been fixed by:
1. Updating database.sql with the notes column
2. Creating migration scripts
3. Creating an automated fix script

**Next Steps**:
1. Run `node fix-database.js` to add the column
2. Restart the backend server
3. Test booking creation
4. Verify data appears in stylist app

---

**Status**: Ready to fix
