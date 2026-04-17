# Immediate Action - Network Error Fix

## The Problem
App can't connect to backend: `Network request failed`

## Quick Fix (5 Minutes)

### Step 1: Check Your IP Address
```bash
ipconfig
```

Find IPv4 Address (example: 192.168.12.156)

### Step 2: Verify Backend is Running
Check terminal - should show:
```
Server running on port 3001
```

If not, restart:
```bash
cd salon-admin-panel/server
npm start
```

### Step 3: Update API Config (If IP Changed)
If your IP is different from 192.168.12.156:

**File**: `salon-stylist-app/config/api.js`
```javascript
const API_BASE_URL = 'http://YOUR_IP:3001';
```

**File**: `salon-user-app/config/api.js`
```javascript
const API_BASE_URL = 'http://YOUR_IP:3001';
```

### Step 4: Reload App
- Press `r` in terminal
- Or restart the app

### Step 5: Try Login Again
- Email: sarah@salon.com
- Password: stylist123

## Verify Connection Works

From device, open browser and go to:
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

## Checklist

- [ ] Found your IP address with `ipconfig`
- [ ] Backend is running on port 3001
- [ ] Updated API config if IP changed
- [ ] Device is on same WiFi
- [ ] Reloaded app (press `r`)
- [ ] Can access http://IP:3001/api/health from device

---

**Time**: 5 minutes
**Difficulty**: Easy
