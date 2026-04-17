# Action Checklist - Stylist Booking 404 Fix

## What Was Fixed
✅ Stylists table now has password column
✅ All stylists have hashed passwords (stylist123)
✅ Backend has enhanced logging for debugging
✅ Migration script created for existing databases

## What You Need To Do

### Step 1: Update Database
Choose ONE option:

**Option A: Fresh Database (Recommended)**
- [ ] Open phpMyAdmin
- [ ] Delete `salon_admin` database
- [ ] Import `salon-admin-panel/server/database.sql`
- [ ] Confirm database created with stylists having passwords

**Option B: Migrate Existing Database**
- [ ] Open terminal in `salon-admin-panel/server`
- [ ] Run: `node add-stylist-password.js`
- [ ] Confirm script completes successfully
- [ ] Check database: `SELECT email, password FROM stylists;`

### Step 2: Restart Backend
- [ ] Stop backend server (Ctrl+C)
- [ ] Run: `npm start` in `salon-admin-panel/server`
- [ ] Confirm server starts on port 3001
- [ ] Check health: `http://192.168.12.156:3001/api/health`

### Step 3: Test Stylist Login
- [ ] Open Stylist App
- [ ] Enter: `sarah@salon.com`
- [ ] Enter: `stylist123`
- [ ] Tap "Sign In"
- [ ] Confirm login succeeds
- [ ] Confirm bookings load immediately

### Step 4: Verify Backend Logs
Check backend console for these logs:
- [ ] `Stylist login attempt: sarah@salon.com`
- [ ] `Stylist logged in successfully: sarah@salon.com`
- [ ] `verifyToken middleware - Token present: true`
- [ ] `verifyToken middleware - Token verified for user ID: 1`
- [ ] `Fetching bookings for stylist ID: 1`
- [ ] `Found X bookings for stylist 1`

### Step 5: Test Booking Operations
- [ ] View pending bookings
- [ ] Accept a pending booking
- [ ] Confirm status changes to "confirmed"
- [ ] Mark booking as complete
- [ ] Confirm status changes to "completed"
- [ ] Switch between tabs without errors
- [ ] Logout successfully
- [ ] Login again to verify flow works

## Stylist Test Credentials

| Email | Password |
|-------|----------|
| sarah@salon.com | stylist123 |
| emily@salon.com | stylist123 |
| michael@salon.com | stylist123 |

## Expected Results

✅ Stylist can login
✅ Bookings load immediately after login
✅ No 404 errors
✅ No AsyncStorage errors
✅ No navigation errors
✅ Booking status updates work
✅ Tab switching works
✅ Logout works
✅ Re-login works

## If Something Goes Wrong

### Login Still Fails
- [ ] Check backend console for error message
- [ ] Verify password hash is correct
- [ ] Run migration script again
- [ ] Restart backend

### Bookings Still Show 404
- [ ] Check backend is running
- [ ] Check backend console for token verification logs
- [ ] Verify database has password column
- [ ] Verify stylists have passwords

### Backend Won't Start
- [ ] Check if port 3001 is already in use
- [ ] Check if bcryptjs is installed: `npm list bcryptjs`
- [ ] Check if mysql2 is installed: `npm list mysql2`
- [ ] Run: `npm install` to reinstall dependencies

## Files to Check

1. `salon-admin-panel/server/database.sql` - Has password column and hashed passwords
2. `salon-admin-panel/server/server.js` - Has logging in verifyToken and /api/stylists/bookings
3. `salon-admin-panel/server/add-stylist-password.js` - Migration script exists

## Success Criteria

All of these should be true:
- [ ] Stylist can login with credentials
- [ ] Token is generated and stored
- [ ] Bookings load without 404 error
- [ ] Backend console shows token verification logs
- [ ] Booking status updates work
- [ ] Logout works without errors
- [ ] Re-login works after logout

## Next Steps After Fix

1. Test all three stylists (Sarah, Emily, Michael)
2. Test booking operations (accept, decline, complete)
3. Test tab navigation
4. Test logout and re-login
5. Verify admin panel can see all bookings
6. Verify user app can create bookings for stylists

---

**Status**: Ready to implement
**Estimated Time**: 5-10 minutes
**Difficulty**: Easy

Start with Step 1 and work through the checklist!
