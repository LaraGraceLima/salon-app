# Quick Connection Fix - 5 Minutes

## The Problem
Mobile app shows "Connection failed" when trying to login.

## The Solution

### Step 1: Check Backend (30 seconds)
```bash
# Open Command Prompt and run:
curl http://192.168.12.156:3001/api/health
```
**Expected**: JSON response with `"status": "ok"`

If you get an error, start the backend:
```bash
cd salon-admin-panel/server
npm start
```

### Step 2: Check Device WiFi (1 minute)
1. On your mobile device, go to **WiFi settings**
2. **Disconnect** from current WiFi
3. **Connect** to the same WiFi network as your computer
4. Wait 10 seconds for connection to establish

### Step 3: Test Device Connection (1 minute)
1. Open a **browser** on your mobile device
2. Go to: `http://192.168.12.156:3001/api/health`
3. **If you see JSON**: ✓ Device can reach server! Go to Step 5.
4. **If you get an error**: ✗ Device cannot reach server. Go to Step 4.

### Step 4: Fix Network Connection (2 minutes)
**Option A: Check IP Address**
```bash
# On your computer, run:
ipconfig | findstr IPv4
```
If IP is NOT `192.168.12.156`:
- Update `salon-user-app/config/api.js`
- Update `salon-stylist-app/config/api.js`
- Change IP to your current IP
- Restart Expo apps

**Option B: Check Firewall**
1. Open **Windows Defender Firewall**
2. Click **"Allow an app through firewall"**
3. Find **Node.js** in the list
4. Check both **Private** and **Public** boxes
5. Click **OK**
6. Restart backend server

### Step 5: Try Login Again (1 minute)
Use these credentials:

**User App:**
- Email: `user@example.com`
- Password: `password123`

**Stylist App:**
- Email: `sarah@salon.com`
- Password: `stylist123`

---

## Still Not Working?

### Restart Everything
```bash
# 1. Stop all services (Ctrl+C in each terminal)
# 2. Restart backend
cd salon-admin-panel/server
npm start

# 3. Restart user app (in new terminal)
cd salon-user-app
npm start -- --offline

# 4. Restart stylist app (in new terminal)
cd salon-stylist-app
npm start -- --port 8082 --offline
```

### Check Database
1. Open XAMPP Control Panel
2. Ensure **MySQL** is running
3. Open **phpMyAdmin**
4. Check if `salon_admin` database exists
5. Check if tables have data

### Test Admin Panel
1. Go to `http://localhost:5173`
2. Login with: `admin@salon.com` / `admin123`
3. If admin panel works, backend is fine
4. If admin panel doesn't work, backend has issues

---

## Success Indicators

✓ Backend responds to health check
✓ Device is on same WiFi network
✓ Device can reach server in browser
✓ Login credentials are correct
✓ App successfully logs in

Once all these are confirmed, you're good to go!
