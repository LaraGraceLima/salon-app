# Quick Start Guide - Salon Admin Panel

## 🚀 Get Running in 5 Minutes

### Prerequisites
- XAMPP installed with MySQL
- Node.js installed
- 2 Command Prompt windows

---

## Step 1: Setup Database (2 minutes)

### Using phpMyAdmin (Easiest)
1. Start XAMPP and click "Start" next to MySQL
2. Open `http://localhost/phpmyadmin` in browser
3. Click "SQL" tab
4. Copy all content from `server/database.sql`
5. Paste into SQL editor and click "Go"

✅ Database is ready!

---

## Step 2: Start Backend Server (1 minute)

**In Command Prompt #1:**

```bash
cd salon-admin-panel/server
npm install
npm start
```

You should see:
```
Server running on port 3001
WebSocket server running on ws://localhost:3001
```

✅ Backend is running!

---

## Step 3: Start Frontend (1 minute)

**In Command Prompt #2:**

```bash
cd salon-admin-panel
npm run dev
```

You should see:
```
VITE v8.0.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

✅ Frontend is running!

---

## Step 4: Login (1 minute)

1. Open browser: `http://localhost:5173`
2. Login with:
   - **Email:** admin@salon.com
   - **Password:** admin123

✅ You're in! 🎉

---

## What You Can Do Now

### 📊 Dashboard
- View total counts of clients, stylists, services, and bookings
- See recent bookings

### 👥 Clients
- Add new clients
- Edit client information
- Delete clients

### 💇 Stylists
- Create stylist accounts
- Set specializations
- Manage status (active/inactive)

### ✂️ Services
- Create salon services
- Set pricing and duration
- Add descriptions

### 📅 Bookings
- View all bookings
- Filter by status
- Update booking status
- Real-time updates

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| MySQL won't start | Open XAMPP, click Start next to MySQL |
| Port 3001 in use | Change PORT in `server/.env` |
| Database error | Run `server/database.sql` again in phpMyAdmin |
| Can't login | Use admin@salon.com / admin123 |
| Blank page | Check browser console (F12) for errors |

---

## 📁 Project Structure

```
salon-admin-panel/
├── src/                 # React frontend
│   ├── pages/          # Login, Dashboard, Clients, etc.
│   ├── components/     # Sidebar
│   └── App.jsx         # Main app
├── server/             # Node.js backend
│   ├── server.js       # Express + WebSocket
│   └── database.sql    # Database schema
└── README.md           # Full documentation
```

---

## 🎨 Customization

### Change Colors
Edit `src/components/Sidebar.css`:
```css
.sidebar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Change Admin Credentials
1. Update `server/database.sql` admin insert
2. Re-run the SQL

### Change Port
Edit `server/.env`:
```
PORT=3002
```

---

## 📚 Full Documentation

See `README.md` for:
- Complete API documentation
- WebSocket events
- Technology stack
- Security notes
- Future enhancements

---

## 🚀 Next Steps

1. **Explore the app** - Try adding clients, stylists, and services
2. **Test bookings** - Create and manage bookings
3. **Check real-time updates** - Open app in 2 browser tabs
4. **Customize** - Change colors, add features
5. **Deploy** - Deploy to production when ready

---

## 💡 Tips

- **Real-time sync**: Changes appear instantly across all open tabs
- **Demo data**: Sample clients, stylists, and services are pre-loaded
- **Responsive design**: Works on desktop and tablet
- **WebSocket**: Live updates without page refresh

---

## ❓ Need Help?

1. Check `SETUP_GUIDE.md` for detailed setup
2. Check `README.md` for API documentation
3. Check browser console (F12) for errors
4. Check backend console for server errors

---

**Happy coding! 🎉**
