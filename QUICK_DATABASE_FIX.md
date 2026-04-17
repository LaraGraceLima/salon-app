# Quick Database Fix

## Problem
Server error: "Unknown column 'notes' in 'field list'"

## Solution (Choose One)

### Method 1: Automated Fix (Easiest)
```bash
cd salon-admin-panel/server
node fix-database.js
```

Then restart backend:
```bash
npm start
```

### Method 2: Manual SQL (phpMyAdmin)
1. Open phpMyAdmin
2. Select database: `salon_admin`
3. Go to SQL tab
4. Run this command:
```sql
ALTER TABLE bookings ADD COLUMN notes TEXT DEFAULT NULL AFTER date_time;
```

### Method 3: Command Line
```bash
mysql -u root -p salon_admin -e "ALTER TABLE bookings ADD COLUMN notes TEXT DEFAULT NULL AFTER date_time;"
```

---

## Verify Fix

Run this to check:
```bash
mysql -u root -p salon_admin -e "DESCRIBE bookings;"
```

You should see `notes` column in the list.

---

## Test It

1. **Restart backend**
   ```bash
   cd salon-admin-panel/server
   npm start
   ```

2. **Create a booking**
   - Login to user app
   - Go to Stylists
   - Select a stylist
   - Create booking with notes
   - Should succeed ✓

3. **Check stylist app**
   - Login as stylist
   - Should see the new booking ✓
   - Can accept/decline/complete ✓

---

## Done!

The database is now fixed and ready for bookings.
