# 🚀 Quick Start - Local LAN Mode

## One Command to Start Everything

```powershell
.\start-mobile-hotspot-mode.ps1
```

## What This Does

✅ Starts backend on `localhost:3001`
✅ Starts admin panel on `localhost:5173`
✅ Starts user app in LAN mode (port 8081)
✅ Starts stylist app in LAN mode (port 8082)
✅ Optimized for mobile hotspot testing

## Mobile Testing (3 Steps)

### 1️⃣ Enable Mobile Hotspot
Windows Settings → Mobile hotspot → Turn ON

### 2️⃣ Connect Phone
Connect phone WiFi to PC's hotspot

### 3️⃣ Scan QR Codes
Open Expo Go → Scan QR codes from terminals

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
- URL: `http://localhost:5173`

## Service URLs

| Service | URL | Access |
|---------|-----|--------|
| Backend | `http://localhost:3001` | API endpoints |
| Admin Panel | `http://localhost:5173` | Web browser |
| User App | LAN mode (port 8081) | Expo Go QR |
| Stylist App | LAN mode (port 8082) | Expo Go QR |

## Quick Checks

### Backend Running?
```powershell
curl http://localhost:3001/api/stylists
```
Should return JSON data

### Admin Panel Working?
Open browser: `http://localhost:5173`

### Apps Ready?
Check Expo terminals for QR codes

## Troubleshooting

### "Server Error"
→ Restart backend: `cd salon-admin-panel/server && node server.js`

### QR Code Not Working
→ Check phone is on PC's mobile hotspot WiFi

### Profile Failed to Load
→ Re-login to refresh token

## Quick Restart

Close all terminals → Run script again:
```powershell
.\start-mobile-hotspot-mode.ps1
```

## What's Changed

✅ Firebase disabled (no setup needed)
✅ Localhost is #1 priority
✅ LAN mode for mobile apps
✅ Auto IP detection optimized
❌ Profile pictures disabled

## Need Help?

See detailed guides:
- `LOCAL_LAN_MOBILE_HOTSPOT_GUIDE.md` - Full setup guide
- `FIREBASE_DISABLED_LOCAL_LAN_READY.md` - Technical details

---

**Ready to test!** 🎉
