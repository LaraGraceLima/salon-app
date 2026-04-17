# Backend Restart Required - Stylist Bookings 404 Fix

## Problem
Stylist app is getting 404 error when fetching bookings, even though:
- Password exists in database
- Token is being generated correctly
- Token is being sent with Authorization header

## Root Cause
The backend server hasn't been restarted after the code changes were made. The endpoint exists in the code but the running server doesn't have it loaded.

## Solution: Restart Backend

### Step 1: Stop the Backend Server
1. Go to the terminal where backend is running
2. Press `Ctrl+C` to stop the server
3. Wait for it to fully stop

### Step 2: Restart the Backend Server
```bash
cd salon-admin-panel/server
npm start
```

You should see:
```
Server running on port 3001
WebSocket server running on ws://0.0.0.0:3001
```

### Step 3: Verify Backend is Running
Open in browser: `http://192.168.12.156:3001/api/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-03-17T...",
  "server": "192.168.12.156:3001"
}
```

### Step 4: Test Stylist App
1. Open Stylist App
2. Login: sarah@salon.com / stylist123
3. Bookings should load without 404 error
4. Check console for logs:
   ```
   Fetching from URL: http://192.168.12.156:3001/api/stylists/bookings
   Response status: 200
   Bookings fetched: X
   ```

## Backend Console Logs

After restart, when stylist logs in and fetches bookings, you should see:

```
Stylist login attempt: sarah@salon.com
Stylist logged in successfully: sarah@salon.com
verifyToken middleware - Token present: true
verifyToken middleware - Token verified for user ID: 1
Fetching bookings for stylist ID: 1
Found 1 bookings for stylist 1
```

## If Still Getting 404

### Check 1: Backend is Actually Running
```bash
# In another terminal, check if port 3001 is listening
netstat -an | grep 3001
# or
lsof -i :3001
```

### Check 2: Verify Endpoint Exists
Open in browser: `http://192.168.12.156:3001/api/test`

Should return:
```json
{
  "message": "Backend is working",
  "timestamp": "2026-03-17T..."
}
```

### Check 3: Check Backend Logs
Look for these logs when fetching bookings:
- `verifyToken middleware - Token present: true`
- `Fetching bookings for stylist ID: 1`

If you don't see these, the request isn't reaching the backend.

### Check 4: Verify Network Connection
- Stylist app and backend must be on same WiFi
- Check IP address: `192.168.12.156`
- Ping from device: `ping 192.168.12.156`

## Complete Restart Procedure

If the above doesn't work, do a complete restart:

```bash
# 1. Stop backend
Ctrl+C

# 2. Stop admin panel (if running)
Ctrl+C

# 3. Stop user app (if running)
Ctrl+C

# 4. Stop stylist app (if running)
Ctrl+C

# 5. Restart backend
cd salon-admin-panel/server
npm start

# 6. In another terminal, restart admin panel
cd salon-admin-panel
npm run dev

# 7. In another terminal, restart user app
cd salon-user-app
npm start

# 8. In another terminal, restart stylist app
cd salon-stylist-app
npm start
```

## Expected Result

After restart:
- ✅ Stylist can login
- ✅ Bookings load without 404 error
- ✅ Backend console shows verification logs
- ✅ Can accept/decline/complete bookings
- ✅ Can logout and re-login

## Files That Changed (Requiring Restart)

1. `salon-admin-panel/server/server.js`
   - Added logging to verifyToken middleware
   - Added logging to /api/stylists/bookings endpoint
   - Added /api/test endpoint

2. `salon-admin-panel/server/database.sql`
   - Added password column to stylists table
   - Added hashed passwords to stylists

3. `salon-stylist-app/screens/BookingsScreen.js`
   - Enhanced error logging
   - Added URL logging
   - Added response status logging

## Why Restart is Needed

Node.js loads all code when the server starts. Changes to:
- Route definitions
- Middleware
- Database queries

...require a restart to take effect. The running server doesn't automatically reload code changes.

## Quick Checklist

- [ ] Stopped backend server (Ctrl+C)
- [ ] Ran `npm start` in salon-admin-panel/server
- [ ] Verified server started on port 3001
- [ ] Tested /api/health endpoint
- [ ] Opened Stylist App
- [ ] Logged in with sarah@salon.com / stylist123
- [ ] Verified bookings load without 404
- [ ] Checked backend console for logs

---

**Status**: Backend restart required
**Time to Fix**: 2-3 minutes
**Difficulty**: Very Easy
