# Device Connection Test Guide

## Quick Test on Your Mobile Device

### Test 1: Can Your Device Reach the Server?

1. **Open a web browser on your mobile device**
2. **Type this URL**: `http://192.168.12.156:3001/api/health`
3. **Expected result**: You should see JSON like:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-03-17T05:39:01.000Z",
     "server": "192.168.12.156:3001"
   }
   ```

**If you see this**: ✓ Your device can reach the server! The connection issue is elsewhere.

**If you get an error**: ✗ Your device cannot reach the server. See troubleshooting below.

---

### Test 2: Check WiFi Network

1. **On your mobile device**, go to WiFi settings
2. **Note the WiFi name (SSID)** you're connected to
3. **On your computer**, open Command Prompt and run:
   ```bash
   ipconfig
   ```
4. **Find your WiFi adapter** and note the IPv4 address
5. **Compare**: Both devices should show they're on the same network

---

### Test 3: Verify Server IP Address

**On your computer**, open Command Prompt and run:
```bash
ipconfig | findstr IPv4
```

You should see:
```
IPv4 Address. . . . . . . . . . . : 192.168.12.156
```

**If the IP is different**, you need to update the app config files:
- `salon-user-app/config/api.js`
- `salon-stylist-app/config/api.js`

Then restart the Expo apps.

---

## Troubleshooting Connection Issues

### Problem: Browser shows "Cannot reach server"

**Cause**: Device is not on the same WiFi network

**Solution**:
1. On your mobile device, go to WiFi settings
2. Disconnect from current WiFi
3. Connect to the same WiFi network as your computer
4. Try the health check again

---

### Problem: Browser shows "Connection timeout"

**Cause**: Server is not running or port is blocked

**Solution**:
1. On your computer, verify backend is running:
   ```bash
   cd salon-admin-panel/server
   npm start
   ```
2. You should see: `Server running on port 3001`
3. Check if port is listening:
   ```bash
   netstat -an | findstr 3001
   ```
4. If not listening, restart the server

---

### Problem: Browser shows "Connection refused"

**Cause**: Windows Firewall is blocking the connection

**Solution**:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js in the list
4. Ensure it's checked for both "Private" and "Public" networks
5. Click OK
6. Restart the backend server

---

### Problem: Health check works but app still shows "Connection failed"

**Cause**: App config has wrong IP address

**Solution**:
1. Check your current IP:
   ```bash
   ipconfig | findstr IPv4
   ```
2. Update both app config files with the correct IP:
   - `salon-user-app/config/api.js`
   - `salon-stylist-app/config/api.js`
3. Restart both Expo apps

---

## Step-by-Step Connection Fix

### Step 1: Verify Backend is Running
```bash
cd salon-admin-panel/server
npm start
```
Expected output: `Server running on port 3001`

### Step 2: Get Your Computer's IP
```bash
ipconfig | findstr IPv4
```
Note the IP address (should be `192.168.12.156`)

### Step 3: Connect Device to Same WiFi
- Go to WiFi settings on your mobile device
- Connect to the same WiFi network as your computer

### Step 4: Test Health Check on Device
- Open browser on mobile device
- Go to: `http://192.168.12.156:3001/api/health`
- Should see JSON response

### Step 5: Update App Config (if needed)
If IP is different from `192.168.12.156`:
- Edit `salon-user-app/config/api.js`
- Edit `salon-stylist-app/config/api.js`
- Change IP to your current IP
- Restart Expo apps

### Step 6: Try Login Again
- Use correct credentials:
  - User: `user@example.com` / `password123`
  - Stylist: `sarah@salon.com` / `stylist123`

---

## Success Checklist

- [ ] Backend is running (`npm start` in server folder)
- [ ] Device is on same WiFi network as computer
- [ ] Health check works in device browser
- [ ] App config has correct IP address
- [ ] Expo app is restarted after config changes
- [ ] Using correct login credentials

Once all items are checked, the app should connect successfully!

---

## Still Having Issues?

1. **Restart everything**:
   - Stop backend server
   - Stop Expo apps
   - Restart your computer
   - Start backend again
   - Start Expo apps again

2. **Check database**:
   - Ensure MySQL is running in XAMPP
   - Ensure `salon_admin` database is imported
   - Check if tables have data

3. **Test admin panel**:
   - Go to `http://localhost:5173`
   - Try to login with `admin@salon.com` / `admin123`
   - If admin panel works, backend is fine
   - If admin panel doesn't work, backend has issues

4. **Check firewall**:
   - Open Windows Defender Firewall
   - Ensure Node.js is allowed
   - Ensure port 3001 is open
