# Connection Troubleshooting Guide

## Current Status

✅ **Backend Server**: Running on port 3001
✅ **User App**: Running on port 8081 with QR code
✅ **Stylist App**: Running on port 8082 with QR code
✅ **Admin Panel**: Running on port 5173

## Connection Issues - Solutions

### Issue: "Connection Failed" when trying to login

**Possible Causes:**

1. **Device not on same WiFi network**
   - Ensure your device is connected to the same WiFi as your computer
   - Check WiFi name and password

2. **IP Address Changed**
   - Your IP might have changed from 10.220.244.90
   - Run `ipconfig` to check current IP
   - Update `config/api.js` in both apps if IP changed

3. **Firewall Blocking Port 3001**
   - Windows Firewall might be blocking port 3001
   - Add exception for port 3001 in Windows Firewall

4. **Backend Not Accessible**
   - Verify backend is running: Check terminal for "Server running on port 3001"
   - Try accessing from computer: http://localhost:3001/api/stylists
   - Should return JSON array of stylists

## Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

```bash
# Check if backend is running
# Terminal should show:
# Server running on port 3001
# WebSocket server running on ws://0.0.0.0:3001
```

### Step 2: Check Your IP Address

```bash
# On Windows, run:
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 10.220.244.90
```

### Step 3: Update API Configuration if IP Changed

If your IP is different from 10.220.244.90:

**For User App:**
- Edit: `salon-user-app/config/api.js`
- Change: `const API_BASE_URL = 'http://YOUR_NEW_IP:3001';`

**For Stylist App:**
- Edit: `salon-stylist-app/config/api.js`
- Change: `const API_BASE_URL = 'http://YOUR_NEW_IP:3001';`

Then restart the apps (press 'r' in terminal).

### Step 4: Test Connection from Computer

Open browser and try:
```
http://localhost:3001/api/stylists
```

Should return JSON with stylist list. If this works, backend is fine.

### Step 5: Check Windows Firewall

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Look for Node.js or npm
4. Ensure it's checked for both Private and Public networks
5. If not there, click "Allow another app" and add Node.js

### Step 6: Verify Device WiFi Connection

1. On your mobile device, go to WiFi settings
2. Verify you're connected to the same WiFi as your computer
3. Try pinging the IP from device (if possible)

## Quick Fixes

### Fix 1: Restart Backend Server

```bash
# Stop the backend (Ctrl+C in terminal)
# Then restart:
npm start
```

### Fix 2: Clear App Cache

```bash
# Stop the Expo app (Ctrl+C)
# Restart with:
npm start -- --offline
```

### Fix 3: Reload App

- Press 'r' in the Expo terminal to reload the app
- Or close Expo Go and scan QR code again

## Testing Connection

### From Computer Terminal

```bash
# Test if backend is accessible
curl http://localhost:3001/api/stylists

# Should return JSON array
```

### From Mobile Device

1. Open browser in Expo Go
2. Try: http://10.220.244.90:3001/api/stylists
3. Should show JSON data

## Common Error Messages

### "Connection Failed"
- Backend not running
- Wrong IP address
- Firewall blocking
- Device not on same WiFi

### "Failed to Download Remote Update"
- Apps are running in offline mode (this is normal)
- Ignore this error

### "Unable to resolve asset"
- Fixed - app.json updated
- Restart app if still seeing this

## Still Having Issues?

1. **Verify all 4 services are running:**
   - Backend: port 3001
   - Admin Panel: port 5173
   - User App: port 8081
   - Stylist App: port 8082

2. **Check IP address:**
   - Run `ipconfig` on computer
   - Update both app configs if needed

3. **Restart everything:**
   - Stop all services
   - Restart backend first
   - Then restart both Expo apps

4. **Check firewall:**
   - Windows Firewall might be blocking port 3001
   - Add Node.js to firewall exceptions

## Success Indicators

✅ Backend shows: "Server running on port 3001"
✅ Apps show QR codes without icon errors
✅ Can login with credentials
✅ Can see bookings/stylists data
✅ Real-time updates work via WebSocket
