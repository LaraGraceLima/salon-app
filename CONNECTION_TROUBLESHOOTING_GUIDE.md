# Connection Troubleshooting Guide

## Current Status
- **Backend Server**: Running on `192.168.12.156:3001` ✓
- **Admin Panel**: Running on `http://localhost:5173` ✓
- **User App**: Running on port 8081 ✓
- **Stylist App**: Running on port 8082 ✓

## "Connection Failed" Error - Step-by-Step Fix

### Step 1: Verify Backend is Running
```bash
# Check if backend is responding
curl http://192.168.12.156:3001/api/services
```
Expected: HTTP 200 OK with JSON response

### Step 2: Check Your Device Network
The mobile device MUST be on the same WiFi network as your computer.

**On your device:**
1. Go to WiFi settings
2. Connect to the same WiFi network as your computer
3. Note the WiFi name (SSID)

**On your computer:**
1. Open Command Prompt/PowerShell
2. Run: `ipconfig`
3. Find your WiFi adapter (usually "Wireless LAN adapter WiFi")
4. Note the IPv4 address (should be `192.168.12.156`)

### Step 3: Verify Device Can Reach Server
**On your mobile device:**
1. Open a browser
2. Try to access: `http://192.168.12.156:3001/api/services`
3. If it works, you'll see JSON data
4. If it fails, your device cannot reach the server

### Step 4: If Device Cannot Reach Server

**Option A: Check WiFi Connection**
- Disconnect and reconnect to WiFi
- Restart your device
- Restart your computer's WiFi

**Option B: Check Firewall**
Windows Firewall might be blocking the connection:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Ensure Node.js is allowed for both Private and Public networks
4. Ensure port 3001 is open

**Option C: Check IP Address Changed**
If you previously had a different IP address:
1. Update both app config files with the new IP:
   - `salon-user-app/config/api.js`
   - `salon-stylist-app/config/api.js`
2. Restart both Expo apps

### Step 5: Verify API Configuration

**User App Config** (`salon-user-app/config/api.js`):
```javascript
const API_BASE_URL = 'http://192.168.12.156:3001';
export default API_BASE_URL;
```

**Stylist App Config** (`salon-stylist-app/config/api.js`):
```javascript
const API_BASE_URL = 'http://192.168.12.156:3001';
export default API_BASE_URL;
```

### Step 6: Test Login Credentials

**User App:**
- Email: `user@example.com`
- Password: `password123`

**Stylist App:**
- Email: `sarah@salon.com` (or any stylist email)
- Password: `stylist123`

## Common Issues & Solutions

### Issue: "Connection failed: Network request failed"
**Cause**: Device cannot reach the server IP address
**Solution**: 
1. Verify device is on same WiFi network
2. Check if IP address is correct (run `ipconfig` on computer)
3. Update app config files if IP changed
4. Restart Expo apps

### Issue: "Connection failed: Timeout"
**Cause**: Server is not responding or network is very slow
**Solution**:
1. Verify backend is running: `npm start` in `salon-admin-panel/server`
2. Check if port 3001 is listening: `netstat -an | findstr 3001`
3. Restart backend server

### Issue: "Connection failed: ECONNREFUSED"
**Cause**: Server is not running or port is not open
**Solution**:
1. Start backend: `cd salon-admin-panel/server && npm start`
2. Verify it's listening on port 3001
3. Check Windows Firewall settings

### Issue: "Invalid credentials" (after connection works)
**Cause**: Wrong email or password
**Solution**:
1. For users: Use `user@example.com` / `password123`
2. For stylists: Use `sarah@salon.com` / `stylist123`
3. Check database for correct credentials

## Network Diagnostic Commands

```bash
# Check if backend is running
netstat -an | findstr 3001

# Check if port is listening
netstat -ano | findstr :3001

# Test connection from computer
curl http://192.168.12.156:3001/api/services

# Get your current IP
ipconfig | findstr IPv4

# Ping the server (from device)
ping 192.168.12.156
```

## If All Else Fails

1. **Restart Everything**:
   - Stop all Expo apps
   - Stop backend server
   - Restart your computer
   - Start backend: `npm start` in `salon-admin-panel/server`
   - Start user app: `npm start -- --offline` in `salon-user-app`
   - Start stylist app: `npm start -- --port 8082 --offline` in `salon-stylist-app`

2. **Check Database**:
   - Ensure MySQL is running in XAMPP
   - Ensure database `salon_admin` is imported
   - Check if tables have data

3. **Use Local Testing**:
   - Test admin panel at `http://localhost:5173`
   - This confirms backend is working
   - If admin panel works but apps don't, it's a network issue

## Success Indicators

✓ Backend responds to HTTP requests
✓ Device is on same WiFi network
✓ Device can reach server IP in browser
✓ Login credentials are correct
✓ AsyncStorage is working (token saved)

Once all these are confirmed, the apps should connect successfully.
