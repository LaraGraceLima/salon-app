# Troubleshooting Guide

## Common Issues and Solutions

---

## 🔴 Database Issues

### Issue: "Cannot connect to database"

**Symptoms:**
- Backend crashes on startup
- Error: "connect ECONNREFUSED 127.0.0.1:3306"

**Solutions:**

1. **Check MySQL is running:**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - Wait for it to show "Running"

2. **Check database exists:**
   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Look for `salon_admin` database in left sidebar
   - If not there, import `server/database.sql`

3. **Check credentials:**
   - Verify `server/.env` has correct credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=salon_admin
   ```

4. **Reset MySQL:**
   - Stop MySQL in XAMPP
   - Wait 5 seconds
   - Start MySQL again

---

### Issue: "Table doesn't exist"

**Symptoms:**
- Error: "Table 'salon_admin.clients' doesn't exist"

**Solutions:**

1. **Re-import database:**
   - Open phpMyAdmin
   - Click "SQL" tab
   - Copy all from `server/database.sql`
   - Paste and click "Go"

2. **Check database selected:**
   - In phpMyAdmin, click on `salon_admin` database
   - Verify tables appear in left sidebar

3. **Manually create tables:**
   - If import fails, create tables one by one
   - Copy each CREATE TABLE statement from `database.sql`
   - Paste into phpMyAdmin SQL tab

---

### Issue: "Access denied for user 'root'@'localhost'"

**Symptoms:**
- Error: "Access denied for user 'root'@'localhost'"

**Solutions:**

1. **Check MySQL password:**
   - Default XAMPP MySQL password is empty
   - Update `server/.env`:
   ```
   DB_PASSWORD=
   ```

2. **If you set a password:**
   - Update `server/.env` with your password:
   ```
   DB_PASSWORD=your-password
   ```

3. **Reset MySQL password:**
   - Stop MySQL in XAMPP
   - Delete `mysql/data/mysql` folder
   - Start MySQL (it will recreate with default settings)

---

## 🔴 Backend Issues

### Issue: "Port 3001 already in use"

**Symptoms:**
- Error: "listen EADDRINUSE :::3001"
- Backend won't start

**Solutions:**

1. **Change port in .env:**
   ```
   PORT=3002
   ```

2. **Kill process using port 3001:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

3. **Check if another instance is running:**
   - Look for Node.js in Task Manager
   - End the process
   - Try starting backend again

---

### Issue: "Cannot find module 'express'"

**Symptoms:**
- Error: "Cannot find module 'express'"
- Backend crashes on startup

**Solutions:**

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Check package.json exists:**
   - Verify `server/package.json` exists
   - Verify it has all dependencies listed

3. **Clear npm cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

4. **Delete node_modules and reinstall:**
   ```bash
   rm -r node_modules
   npm install
   ```

---

### Issue: "Backend not responding"

**Symptoms:**
- Frontend shows "Cannot GET /api/clients"
- Network tab shows failed requests

**Solutions:**

1. **Check backend is running:**
   - Look for "Server running on port 3001" in console
   - If not there, start backend: `npm start`

2. **Check CORS configuration:**
   - Verify `server/server.js` has CORS enabled:
   ```javascript
   app.use(cors());
   ```

3. **Check API URL:**
   - Verify frontend is calling correct URL
   - Should be `http://localhost:3001`

4. **Check firewall:**
   - Windows Firewall might block port 3001
   - Add Node.js to firewall exceptions

---

### Issue: "WebSocket connection failed"

**Symptoms:**
- Console shows WebSocket error
- Real-time updates not working

**Solutions:**

1. **Check WebSocket server is running:**
   - Backend console should show "WebSocket server running on ws://localhost:3001"

2. **Check firewall:**
   - WebSocket might be blocked by firewall
   - Add Node.js to firewall exceptions

3. **Check browser console:**
   - Open F12 → Console
   - Look for WebSocket errors
   - Note the error message

---

## 🔴 Frontend Issues

### Issue: "Blank white page"

**Symptoms:**
- Frontend loads but shows nothing
- No errors in console

**Solutions:**

1. **Check browser console:**
   - Press F12
   - Click "Console" tab
   - Look for red errors

2. **Check if frontend is running:**
   - Look for "VITE v8.0.0 ready" in console
   - If not there, run: `npm run dev`

3. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear all cache
   - Reload page

4. **Check React is loaded:**
   - Open DevTools (F12)
   - Check "Elements" tab
   - Look for React root element

---

### Issue: "Cannot GET /"

**Symptoms:**
- Error: "Cannot GET /"
- Page shows error message

**Solutions:**

1. **Check frontend is running:**
   - Should see "VITE v8.0.0 ready in XXX ms"
   - Should show "Local: http://localhost:5173/"

2. **Check correct URL:**
   - Go to `http://localhost:5173`
   - Not `http://localhost:3001`

3. **Check vite.config.js:**
   - Verify it exists and is configured correctly

4. **Restart frontend:**
   - Stop frontend (Ctrl+C)
   - Run: `npm run dev`

---

### Issue: "Login fails with 'Invalid credentials'"

**Symptoms:**
- Cannot login even with correct credentials
- Error: "Invalid credentials"

**Solutions:**

1. **Check default credentials:**
   - Email: `admin@salon.com`
   - Password: `admin123`

2. **Check database has admin:**
   - Open phpMyAdmin
   - Go to `salon_admin` → `admins` table
   - Verify admin record exists

3. **Check backend is running:**
   - Backend must be running for login to work
   - Check console for "Server running on port 3001"

4. **Check CORS:**
   - Open DevTools (F12)
   - Check Network tab
   - Look for CORS errors

---

### Issue: "Cannot read property 'map' of undefined"

**Symptoms:**
- Error in console: "Cannot read property 'map' of undefined"
- Page crashes

**Solutions:**

1. **Check API response:**
   - Open DevTools (F12)
   - Go to Network tab
   - Check API response is valid JSON

2. **Check backend is running:**
   - Verify backend is running
   - Check for errors in backend console

3. **Check database has data:**
   - Open phpMyAdmin
   - Check tables have data

4. **Add error handling:**
   - Check component has proper error handling
   - Verify state is initialized

---

### Issue: "CORS error"

**Symptoms:**
- Error: "Access to XMLHttpRequest blocked by CORS policy"
- API calls fail

**Solutions:**

1. **Check backend CORS:**
   - Verify `server/server.js` has:
   ```javascript
   app.use(cors());
   ```

2. **Check API URL:**
   - Frontend should call `http://localhost:3001`
   - Not `http://localhost:5173`

3. **Check backend is running:**
   - Backend must be running for CORS to work

4. **Check firewall:**
   - Firewall might block cross-origin requests
   - Add Node.js to exceptions

---

## 🔴 Data Issues

### Issue: "No data showing in tables"

**Symptoms:**
- Tables are empty
- No clients, stylists, or services

**Solutions:**

1. **Check database has data:**
   - Open phpMyAdmin
   - Go to `salon_admin` database
   - Check each table has records

2. **Re-import sample data:**
   - Run `server/database.sql` again
   - This will add sample data

3. **Check API is returning data:**
   - Open DevTools (F12)
   - Go to Network tab
   - Check API response

4. **Check backend is running:**
   - Verify backend is running
   - Check for errors in backend console

---

### Issue: "Changes not saving"

**Symptoms:**
- Add/edit/delete operations don't work
- No error message

**Solutions:**

1. **Check backend is running:**
   - Verify backend is running
   - Check for errors in backend console

2. **Check database connection:**
   - Verify MySQL is running
   - Check database credentials

3. **Check browser console:**
   - Open F12 → Console
   - Look for error messages

4. **Check network tab:**
   - Open F12 → Network
   - Check API request/response
   - Look for errors

---

### Issue: "Real-time updates not working"

**Symptoms:**
- Changes in one tab don't appear in another
- WebSocket not connecting

**Solutions:**

1. **Check WebSocket is running:**
   - Backend console should show "WebSocket server running"

2. **Check browser console:**
   - Open F12 → Console
   - Look for WebSocket errors

3. **Check firewall:**
   - WebSocket might be blocked
   - Add Node.js to firewall exceptions

4. **Restart backend:**
   - Stop backend (Ctrl+C)
   - Start backend again: `npm start`

---

## 🔴 Performance Issues

### Issue: "App is slow"

**Symptoms:**
- Page takes long to load
- Interactions are sluggish

**Solutions:**

1. **Check network:**
   - Open DevTools (F12)
   - Go to Network tab
   - Check API response times

2. **Check database:**
   - Verify MySQL is running smoothly
   - Check for slow queries

3. **Check browser:**
   - Close other tabs
   - Clear browser cache
   - Restart browser

4. **Check backend:**
   - Look for errors in backend console
   - Check CPU/memory usage

---

### Issue: "High memory usage"

**Symptoms:**
- App uses lots of RAM
- Browser becomes unresponsive

**Solutions:**

1. **Check for memory leaks:**
   - Open DevTools (F12)
   - Go to Memory tab
   - Take heap snapshot
   - Look for large objects

2. **Restart browser:**
   - Close and reopen browser
   - This clears memory

3. **Check backend:**
   - Look for memory leaks in Node.js
   - Restart backend if needed

---

## 🟡 Warning Messages

### Warning: "Deprecated API"

**Solution:**
- Update to latest version of dependencies
- Run: `npm update`

### Warning: "Missing dependency"

**Solution:**
- Install missing dependency
- Run: `npm install`

---

## 🟢 Verification Checklist

Before reporting an issue, verify:

- [ ] MySQL is running in XAMPP
- [ ] Database `salon_admin` exists
- [ ] Backend is running on port 3001
- [ ] Frontend is running on port 5173
- [ ] Browser console has no errors (F12)
- [ ] Backend console has no errors
- [ ] Correct credentials are used
- [ ] All dependencies are installed
- [ ] Firewall is not blocking ports

---

## 📞 Getting Help

If issue persists:

1. **Check all documentation:**
   - README.md
   - SETUP_GUIDE.md
   - QUICK_START.md

2. **Check browser console:**
   - Press F12
   - Look for error messages
   - Note the exact error

3. **Check backend console:**
   - Look for error messages
   - Note the exact error

4. **Restart everything:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Restart MySQL in XAMPP
   - Start backend again
   - Start frontend again

5. **Fresh install:**
   - Delete `node_modules` folders
   - Delete `package-lock.json`
   - Run `npm install` again
   - Start fresh

---

## 🆘 Emergency Reset

If everything is broken:

1. **Stop all services:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Stop MySQL in XAMPP

2. **Clean up:**
   ```bash
   # Delete node_modules
   rm -r node_modules
   rm -r server/node_modules
   
   # Delete lock files
   rm package-lock.json
   rm server/package-lock.json
   ```

3. **Reinstall:**
   ```bash
   npm install
   cd server
   npm install
   ```

4. **Reset database:**
   - Open phpMyAdmin
   - Drop `salon_admin` database
   - Re-import `server/database.sql`

5. **Start fresh:**
   - Start MySQL in XAMPP
   - Start backend: `npm start`
   - Start frontend: `npm run dev`

---

**Still having issues? Check the documentation files or restart your system.**
