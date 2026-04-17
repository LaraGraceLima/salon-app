# Quick Restart Guide - 2 Minutes

## The Issue
Stylist app getting 404 error for bookings endpoint.

## The Fix
**Restart the backend server.**

## How to Restart

### Step 1: Stop Backend
- Find the terminal running backend
- Press `Ctrl+C`
- Wait for it to stop

### Step 2: Start Backend
```bash
cd salon-admin-panel/server
npm start
```

Wait for:
```
Server running on port 3001
WebSocket server running on ws://0.0.0.0:3001
```

### Step 3: Test
1. Open Stylist App
2. Login: `sarah@salon.com` / `stylist123`
3. Bookings should load
4. No 404 error

## Done!

That's it. The backend restart loads all the code changes that were made.

---

**Time**: 2 minutes
**Difficulty**: Very easy
