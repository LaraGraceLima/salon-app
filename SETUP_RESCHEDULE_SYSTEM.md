# Setup Reschedule Notification System

## Quick Setup (3 Steps)

### Step 1: Run Database Migration

**Option A - If creating new database:**
The database.sql file already includes the reschedule columns.

**Option B - If database already exists:**
```bash
mysql -u root -p salon_admin < salon-admin-panel/server/add-reschedule-columns.sql
```

### Step 2: Restart Backend Server

```bash
cd salon-admin-panel/server
# Stop current server (Ctrl+C)
node server.js
```

### Step 3: Test the System

1. Open Admin Dashboard: `http://localhost:3000`
2. Open Stylist Dashboard: `http://localhost:3002`
3. Open User App
4. Reschedule an appointment from user app
5. Watch for real-time notifications in admin and stylist dashboards

## What You'll See

### When Client Reschedules:

**Admin Dashboard:**
- Yellow alert banner appears at top
- Shows: "Appointment Rescheduled"
- Old and new values highlighted in red/green
- Auto-dismisses after 30 seconds

**Stylist Dashboard:**
- Mobile alert at top of screen
- Same information as admin
- Close button to dismiss

**User App:**
- Success alert showing old and new appointment details

## Features Working

✅ Real-time WebSocket notifications
✅ Visual change highlighting (red = old, green = new)
✅ Conflict detection
✅ Reschedule history tracking
✅ Auto-dismiss notifications

## Troubleshooting

### No notifications showing?
1. Check backend is running: `node server.js`
2. Check WebSocket connection in browser console
3. Verify database migration ran successfully

### Conflict detection not working?
1. Check `/api/bookings/check-conflict` endpoint returns correct data
2. Verify stylist_id and date/time parameters are correct

### "Could not reschedule booking" error?
1. Check backend console for error details
2. Verify database columns exist: `DESCRIBE bookings;`
3. If columns don't exist, run the migration

### Database errors?
1. Run migration again
2. Check columns exist: `DESCRIBE bookings;`

## Files Modified

- `salon-admin-panel/server/server.js` - Added reschedule endpoint
- `salon-admin-panel/src/pages/Bookings.jsx` - Added admin alert UI
- `salon-stylist-app/screens/BookingsScreen.js` - Added stylist alert UI
- `salon-user-app/screens/MyBookingsScreen.js` - Added success notification
- `salon-admin-panel/server/database.sql` - Added reschedule columns
- `salon-admin-panel/server/add-reschedule-columns.sql` - Database migration

## Next Steps

After setup, test by:
1. Creating a booking
2. Rescheduling from user app
3. Verifying admin/stylist see the notification
4. Checking old/new values are highlighted correctly