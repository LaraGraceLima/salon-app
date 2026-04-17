# Connection Failed - Troubleshooting Guide

## Current System Status

✅ **Backend Server**: Running on port 3001
✅ **WebSocket**: Running on ws://0.0.0.0:3001
✅ **Admin Panel**: Running on port 5173
✅ **User App**: Running on port 8081 (Expo)
✅ **Stylist App**: Running on port 8082 (Expo)

**Server IP Address**: `192.168.12.156`
**API Endpoint**: `http://192.168.12.156:3001`

---

## Why Connection Failed?

The most common reasons:

1. **Device not on same WiFi network** ❌
2. **IP address changed** ❌
3. **Firewall blocking connection** ❌
4. **Backend not running** ✅ (It is running)
5. **Wrong IP in app config** ✅ (Correct IP configured)

---

## Step-by-Step Fix

### Step 1: Verify Device WiFi Network
**On your device/emulator:**
1. Go to Settings → WiFi
2. Check which network you're connected to
3. **IMPORTANT**: Must be on the SAME WiFi as your computer
4. Your computer is on: **Wi-Fi** (192.168.12.156)

### Step 2: Verify IP Address Hasn't Changed
**On your computer:**
```
Run: ipconfig
Look for: IPv4 Address under Wi-Fi adapter
Current IP: 192.168.12.156
```

If IP changed, update both app configs:
- `salon-user-app/config/api.js`
- `salon-stylist-app/config/api.js`

### Step 3: Test Backend Connection
**From your device, try accessing:**
```
http://192.168.12.156:3001/api/services
```

If this works in browser, backend is accessible.

### Step 4: Check Firewall
**Windows Firewall might be blocking:**
1. Go to Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Make sure Node.js is allowed
4. Or temporarily disable firewall for testing

### Step 5: Restart All Services
If still failing, restart everything:

**Terminal 1 - Backend:**
```bash
cd salon-admin-panel/server
npm start
```

**Terminal 2 - Admin Panel:**
```bash
cd salon-admin-panel
npm run dev
```

**Terminal 3 - User App:**
```bash
cd salon-user-app
npm start -- --offline
```

**Terminal 4 - Stylist App:**
```bash
cd salon-stylist-app
npm start -- --port 8082 --offline
```

---

## Login Credentials

### User App
- Email: `user@example.com`
- Password: `password123`

### Stylist App
- Email: `sarah@salon.com`
- Password: `stylist123`

### Admin Panel
- Email: `admin@salon.com`
- Password: `admin123`

---

## Network Diagram

```
Your Computer (192.168.12.156)
├── Backend Server (port 3001)
├── Admin Panel (port 5173)
├── User App (port 8081)
└── Stylist App (port 8082)

Your Device/Emulator (Must be on same WiFi)
├── User App → connects to 192.168.12.156:3001
└── Stylist App → connects to 192.168.12.156:3001
```

---

## Common Issues & Solutions

### Issue 1: "Connection Failed" on Login
**Cause**: Device not on same WiFi
**Solution**: 
1. Check device WiFi settings
2. Connect to same network as computer
3. Verify IP: 192.168.12.156

### Issue 2: "Connection Failed" after IP change
**Cause**: Computer IP changed
**Solution**:
1. Run `ipconfig` to get new IP
2. Update both app config files
3. Restart apps

### Issue 3: WebSocket connection fails
**Cause**: Firewall blocking port 3001
**Solution**:
1. Check Windows Firewall
2. Allow Node.js through firewall
3. Or disable firewall temporarily

### Issue 4: "Failed to download remote update"
**Cause**: Expo trying to check for updates
**Solution**: Already fixed - apps run with `--offline` flag

---

## Quick Checklist

- [ ] Device is on same WiFi as computer
- [ ] Computer IP is 192.168.12.156
- [ ] Backend server is running (port 3001)
- [ ] WebSocket is running (ws://0.0.0.0:3001)
- [ ] Admin panel is running (port 5173)
- [ ] User app is running (port 8081)
- [ ] Stylist app is running (port 8082)
- [ ] Firewall allows Node.js
- [ ] App configs have correct IP
- [ ] Device can ping 192.168.12.156

---

## Test Connection

**From your device terminal (if available):**
```bash
ping 192.168.12.156
```

Should see responses. If not, device is not on same network.

---

## If Still Not Working

1. **Restart computer** - Sometimes helps with network issues
2. **Restart device** - Clear any cached connections
3. **Check router** - Make sure WiFi is working
4. **Use USB cable** - Connect device via USB for debugging
5. **Check logs** - Look at backend terminal for errors

---

## Backend Logs

Check the backend terminal for any error messages:
```
Server running on port 3001
WebSocket server running on ws://0.0.0.0:3001
```

If you see errors, the backend might not be working properly.

---

**Current Status**: All services running ✅
**Next Step**: Verify device is on same WiFi network
