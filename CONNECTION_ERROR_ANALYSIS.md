# "Connection Failed" Error - Complete Analysis

## Error Message
```
Error: Connection failed. Please try again.
```

This error occurs when the mobile app cannot establish a connection to the backend server.

---

## Root Causes

### 1. **Network Connectivity Issues** (Most Common - 70%)
**What happens:**
- Device/emulator cannot reach the server's IP address
- Network packets are not reaching the destination

**Why it happens:**
- Device is on different WiFi network than computer
- Device is on mobile data instead of WiFi
- WiFi network is not connected
- Network cable is unplugged
- Router is offline

**How to fix:**
```
1. Check device WiFi settings
2. Verify device is on SAME WiFi as computer
3. Check WiFi signal strength
4. Restart WiFi on device
5. Restart router
```

---

### 2. **Wrong IP Address** (20%)
**What happens:**
- App is configured with incorrect server IP
- App tries to connect to non-existent address

**Why it happens:**
- Computer IP changed (DHCP)
- Wrong IP was entered in config
- IP address was hardcoded incorrectly

**Current Configuration:**
```javascript
// For Android Emulator:
const API_BASE_URL = 'http://10.0.2.2:3001';

// For Physical Device on WiFi:
const API_BASE_URL = 'http://192.168.12.156:3001';
```

**How to fix:**
```
1. Run: ipconfig
2. Find IPv4 Address under WiFi adapter
3. Update both app config files:
   - salon-user-app/config/api.js
   - salon-stylist-app/config/api.js
4. Restart apps
```

---

### 3. **Backend Server Not Running** (5%)
**What happens:**
- App tries to connect but no server is listening
- Connection is refused

**Why it happens:**
- Backend process crashed
- Backend was never started
- Backend crashed due to database error

**How to fix:**
```
1. Check if backend is running:
   - Look for "Server running on port 3001" message
   - Check terminal for errors
   
2. If not running, start it:
   cd salon-admin-panel/server
   npm start
   
3. Verify output:
   Server running on port 3001
   WebSocket server running on ws://0.0.0.0:3001
```

---

### 4. **Firewall Blocking Connection** (3%)
**What happens:**
- Server is running but firewall blocks incoming connections
- Connection times out

**Why it happens:**
- Windows Defender Firewall is enabled
- Third-party firewall is blocking port 3001
- Network security policy blocks the port

**How to fix:**
```
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" or "node.exe"
4. Check "Private" checkbox
5. Click OK
6. Restart backend server
```

---

### 5. **Port 3001 Already in Use** (1%)
**What happens:**
- Another application is using port 3001
- Backend cannot start on that port

**Why it happens:**
- Another Node.js process is running
- Another application claimed port 3001
- Previous backend process didn't fully close

**How to fix:**
```
1. Check what's using port 3001:
   netstat -ano | Select-String "3001"
   
2. Kill the process:
   taskkill /PID <process_id> /F
   
3. Start backend again:
   npm start
```

---

### 6. **Database Connection Error** (1%)
**What happens:**
- Backend starts but cannot connect to database
- Login endpoint fails silently

**Why it happens:**
- MySQL is not running
- Database credentials are wrong
- Database doesn't exist

**How to fix:**
```
1. Start XAMPP
2. Start MySQL service
3. Verify database exists:
   - Open phpMyAdmin
   - Check for "salon_admin" database
   
4. Check backend logs for errors
5. Restart backend
```

---

## Diagnostic Flowchart

```
Connection Failed Error
│
├─ Is backend running?
│  ├─ NO → Start backend: npm start
│  └─ YES → Continue
│
├─ Can device reach server IP?
│  ├─ NO → Check network connectivity
│  │       - Same WiFi?
│  │       - Correct IP?
│  │       - Firewall blocking?
│  └─ YES → Continue
│
├─ Is port 3001 open?
│  ├─ NO → Check firewall
│  │       - Allow Node.js through firewall
│  └─ YES → Continue
│
├─ Is database connected?
│  ├─ NO → Start MySQL
│  │       - Check credentials
│  └─ YES → Continue
│
└─ Connection should work now!
```

---

## Solution Priority (Try in Order)

### Priority 1: Check Network (Most Likely)
```bash
# On device:
1. Settings → WiFi
2. Connect to same network as computer
3. Verify WiFi is connected
4. Try login again
```

### Priority 2: Verify Backend Running
```bash
# On computer:
1. Check terminal shows:
   "Server running on port 3001"
   "WebSocket server running on ws://0.0.0.0:3001"
   
2. If not, restart:
   cd salon-admin-panel/server
   npm start
```

### Priority 3: Check IP Address
```bash
# On computer:
1. Run: ipconfig
2. Find IPv4 under WiFi adapter
3. Update app configs if changed
4. Restart apps
```

### Priority 4: Check Firewall
```bash
# On computer:
1. Open Windows Defender Firewall
2. Allow Node.js through firewall
3. Restart backend
```

### Priority 5: Check Database
```bash
# On computer:
1. Start XAMPP
2. Start MySQL
3. Verify database exists
4. Restart backend
```

---

## Current System Status

✅ **Backend Server**: Running on port 3001
✅ **WebSocket**: Running on ws://0.0.0.0:3001
✅ **Database**: Connected (salon_admin)
✅ **Port 3001**: LISTENING
✅ **Firewall**: Configured (Node.js allowed)

**API Endpoints:**
- User Login: `POST /api/users/login`
- Stylist Login: `POST /api/stylists/login`
- Services: `GET /api/services`

---

## Quick Checklist

- [ ] Device is on same WiFi as computer
- [ ] Backend server is running (check terminal)
- [ ] Port 3001 is listening (netstat shows LISTENING)
- [ ] Correct IP in app config (10.0.2.2 for emulator, 192.168.12.156 for WiFi)
- [ ] Firewall allows Node.js
- [ ] MySQL is running
- [ ] Database "salon_admin" exists
- [ ] No other process using port 3001

---

## Testing Connection

### Test 1: Ping Server
```bash
# On device:
ping 10.0.2.2        # For emulator
ping 192.168.12.156  # For WiFi device
```
Should get responses ✅

### Test 2: Access API in Browser
```
# On device browser:
http://10.0.2.2:3001/api/services        # Emulator
http://192.168.12.156:3001/api/services  # WiFi device
```
Should return JSON list ✅

### Test 3: Check Port
```bash
# On computer:
netstat -ano | Select-String "3001"
```
Should show LISTENING ✅

---

## Common Scenarios

### Scenario 1: Using Android Emulator
**Solution:**
- Use IP: `10.0.2.2:3001`
- This is special IP for emulator to reach host
- Already configured in current setup

### Scenario 2: Using Physical Device on WiFi
**Solution:**
- Use IP: `192.168.12.156:3001`
- Device must be on same WiFi
- Can test with: `ping 192.168.12.156`

### Scenario 3: Using iOS Simulator
**Solution:**
- Use IP: `localhost:3001` or `127.0.0.1:3001`
- Simulator runs on same machine

### Scenario 4: Using Multiple Devices
**Solution:**
- Each device needs same IP
- All must be on same WiFi network
- Backend handles multiple connections

---

## Error Messages & Meanings

| Error | Cause | Solution |
|-------|-------|----------|
| Connection failed | Network unreachable | Check WiFi, IP address |
| Connection timeout | Server not responding | Start backend, check firewall |
| Connection refused | Port not listening | Check if backend running |
| Invalid credentials | Wrong password | Check login credentials |
| Server error | Database issue | Start MySQL, check database |

---

## Prevention Tips

1. **Always verify backend is running before testing**
2. **Check network connectivity first**
3. **Use correct IP for your setup** (emulator vs WiFi)
4. **Keep firewall configured** to allow Node.js
5. **Restart services** if connection fails
6. **Check logs** for detailed error messages

---

## Still Not Working?

1. **Restart everything:**
   - Close apps
   - Stop backend
   - Restart backend
   - Reopen apps

2. **Check logs:**
   - Backend terminal for errors
   - Device console for error details

3. **Try different IP:**
   - If using 192.168.12.156, try 10.0.2.2
   - If using 10.0.2.2, try 192.168.12.156

4. **Restart computer:**
   - Sometimes helps with network issues
   - Clears any stuck connections

5. **Check network:**
   - Restart WiFi router
   - Reconnect device to WiFi
   - Check for network issues

---

**The error is almost always a network connectivity issue. Make sure your device can reach the server IP address!**
