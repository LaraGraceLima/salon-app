# Complete System Testing Checklist

## 🚀 QUICK START

### Option 1: Use Startup Script
```bash
# Double-click to run:
start-all-services.bat

# Or run PowerShell version:
powershell -ExecutionPolicy Bypass -File start-all-services.ps1
```

### Option 2: Manual Startup
```bash
# Terminal 1 - Backend
cd salon-admin-panel/server && node server.js

# Terminal 2 - Admin Panel  
cd salon-admin-panel && npm run dev

# Terminal 3 - User App
cd salon-user-app && expo start

# Terminal 4 - Stylist App
cd salon-stylist-app && expo start
```

---

## ✅ TESTING CHECKLIST

### 1. Backend Server
- [ ] Server starts on port 3001
- [ ] WebSocket starts on port 3002
- [ ] Database connects successfully
- [ ] IP address is displayed in console
- [ ] No error messages

### 2. Admin Panel
- [ ] Opens at http://localhost:5173
- [ ] Login works: `admin@salon.com` / `admin123`
- [ ] Dashboard loads with data
- [ ] Can view stylists, services, bookings
- [ ] All CRUD operations work

### 3. User App - Auto IP Detection
- [ ] App starts in Expo Go
- [ ] **AUTO IP TEST**: Login works immediately
- [ ] If fails: "Refresh IP Connection" button works
- [ ] Success message shows detected IP
- [ ] Login: `user@example.com` / `password123`

### 4. User App - Full Functionality
- [ ] Home screen loads with featured content
- [ ] Can browse all stylists
- [ ] Can view services
- [ ] Service details screen works
- [ ] Stylist selection works
- [ ] **Booking flow**: Select stylist → service → date/time → confirm
- [ ] **Currency**: All prices show ₱ (PHP pesos)
- [ ] "My Bookings" shows created booking
- [ ] Enhanced UI design visible

### 5. Stylist App - Auto IP Detection
- [ ] App starts in Expo Go
- [ ] **AUTO IP TEST**: Login works immediately
- [ ] If fails: "Refresh IP Connection" button works
- [ ] Success message shows detected IP
- [ ] Login: `sarah@salon.com` / `stylist123`

### 6. Stylist App - New Dashboard
- [ ] **Dashboard loads first** (new feature)
- [ ] Welcome message shows stylist name
- [ ] Statistics cards display:
  - [ ] Total bookings count
  - [ ] Total revenue in ₱ (PHP pesos)
  - [ ] Pending/confirmed/completed counts
- [ ] **Charts display**:
  - [ ] Weekly bookings bar chart
  - [ ] Monthly bookings bar chart
- [ ] Quick stats show:
  - [ ] Success rate percentage
  - [ ] Average revenue
- [ ] Navigation tabs work: Dashboard, Bookings, Profile

### 7. Stylist App - Booking Management
- [ ] "My Bookings" tab shows pending bookings
- [ ] Can accept bookings (changes to confirmed)
- [ ] Can decline bookings (changes to cancelled)
- [ ] Can mark confirmed bookings as completed
- [ ] **Currency**: All prices show ₱ (PHP pesos)
- [ ] Enhanced UI design visible

### 8. End-to-End Booking Flow
- [ ] **User creates booking** in User App
- [ ] **Booking appears** in Admin Panel
- [ ] **Booking appears** in Stylist App (pending)
- [ ] **Stylist accepts** booking
- [ ] **Status updates** in Admin Panel
- [ ] **User sees confirmed** booking in "My Bookings"

### 9. Auto IP Detection Stress Test
- [ ] **Change network** (switch WiFi/mobile data)
- [ ] **User App**: Tap "Refresh IP Connection"
- [ ] **Stylist App**: Tap "Refresh IP Connection"
- [ ] Both apps detect new IP automatically
- [ ] All functionality works after IP change

---

## 🔧 TROUBLESHOOTING

### Backend Issues
```bash
# Check if ports are in use
netstat -an | findstr :3001
netstat -an | findstr :3002

# Kill processes if needed
taskkill /F /PID [PID_NUMBER]
```

### Database Issues
```bash
cd salon-admin-panel/server
node setup-db.js
```

### App Connection Issues
1. Check backend console for IP address
2. Use "Refresh IP Connection" button in apps
3. Verify firewall allows Node.js
4. Test API manually: `http://[YOUR-IP]:3001/api/stylists`

---

## 🎯 SUCCESS CRITERIA

### All Systems Working
- ✅ Backend server running (ports 3001, 3002)
- ✅ Admin panel accessible and functional
- ✅ User app connects automatically
- ✅ Stylist app connects automatically
- ✅ Auto IP detection works
- ✅ Complete booking flow works
- ✅ New dashboard shows analytics
- ✅ PHP peso currency displays
- ✅ Enhanced UI visible throughout

### Auto IP Detection Working
- ✅ Apps connect on first try
- ✅ "Refresh IP Connection" works
- ✅ Success messages show detected IP
- ✅ Works after network changes
- ✅ Tests multiple IP ranges automatically

---

## 📱 LOGIN CREDENTIALS REFERENCE

| App | Email | Password |
|-----|-------|----------|
| Admin Panel | admin@salon.com | admin123 |
| User App | user@example.com | password123 |
| Stylist App | sarah@salon.com | stylist123 |
| Stylist App | emily@salon.com | stylist123 |
| Stylist App | michael@salon.com | stylist123 |

---

## 🆕 NEW FEATURES TO TEST

### Stylist Dashboard
- Analytics overview with charts
- Real-time booking statistics
- Revenue tracking in PHP pesos
- Success rate calculations
- Professional business appearance

### Enhanced UI
- Modern card designs with shadows
- Better typography and spacing
- PHP peso currency throughout
- Improved navigation and user experience
- Professional color scheme

### Auto IP Detection
- Automatic backend server discovery
- Manual refresh capability
- Multiple IP range testing
- Network change adaptation
- User-friendly error handling

**Ready for complete system testing!** 🚀