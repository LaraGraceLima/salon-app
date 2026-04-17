# Network Request Failed - Fix Guide

## Problem
App shows: `ERROR Login error: [TypeError: Network request failed]`

This means the app can't connect to the backend at `http://192.168.12.156:3001`

## Causes

1. **Device not on same WiFi** - App and backend must be on same network
2. **IP address changed** - 192.168.12.156 might not be correct anymore
3. **Backend not running** - Server might have stopped
4. **Firewall blocking** - Windows firewall might block the connection
5. **Port 3001 not accessible** - Backend might be on different port

## Solutions

### Step 1: Verify Backend is Running
```bash
# In backend terminal, you should see:
Server running on port 3001
WebSocket server running on ws://0.0.0.0:3001
```

If not running, restart:
```bash
cd salon-admin-panel/server
npm start
```

### Step 2: Check Your IP Address
Find your computer's IP address:

**Windows:**
```bash
ipconfig
```

Look for "IPv4 Address" under your WiFi adapter (usually 192.168.x.x)

**Example output:**
```
Ethernet adapter Ethernet:
   IPv4 Address. . . . . . . . . : 192.168.12.156
```

### Step 3: Update API Configuration if IP Changed
If your IP is different from 192.168.12.156:

**File**: `salon-stylist-app/config/api.js`
```javascript
const API_BASE_URL = 'http://YOUR_NEW_IP:3001';
```

**File**: `salon-user-app/config/api.js`
```javascript
const API_BASE_URL = 'http://YOUR_NEW_IP:3001';
```

### Step 4: Verify Device is on Same WiFi
- Check device WiFi network name
- Should match your computer's WiFi network
- Both must be on same network

### Step 5: Test Connection from Device
On your device/emulator, try to access:
```
http://192.168.12.156:3001/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "server": "192.168.12.156:3001"
}
```

### Step 6: Reload App
After making changes:
- Press `r` in terminal to reload app
- Or restart the app

## Common Issues

### "Connection refused"
- Backend not running
- Wrong IP address
- Wrong port

### "Network timeout"
- Device not on same WiFi
- Firewall blocking connection
- IP address incorrect

### "Cannot reach server"
- Backend stopped
- IP changed
- Device on different network

## Firewall Fix (Windows)

If firewall is blocking:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js in the list
4. Check both "Private" and "Public"
5. Click OK

Or run as Administrator:
```bash
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```

## Quick Checklist

- [ ] Backend is running on port 3001
- [ ] Your IP address is correct (run `ipconfig`)
- [ ] Device is on same WiFi network
- [ ] API config has correct IP address
- [ ] Can access http://IP:3001/api/health from device
- [ ] Firewall allows Node.js
- [ ] App reloaded after changes

## If Still Not Working

1. Restart backend: `npm start` in `salon-admin-panel/server`
2. Restart app: Press `r` in terminal
3. Check backend console for errors
4. Verify IP address with `ipconfig`
5. Test from device: `http://IP:3001/api/health`

---

**Status**: Network error troubleshooting guide
**Time**: 5-10 minutes to fix
