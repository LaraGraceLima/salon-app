# Quick Restart Commands - Remote Update Fix

## 🚀 Correct Startup Commands

### Terminal 1 - Backend Server
```bash
cd salon-admin-panel/server && node server.js
```

### Terminal 2 - Admin Panel
```bash
cd salon-admin-panel && npm run dev
```

### Terminal 3 - User App (LAN Mode)
```bash
cd salon-user-app && npx expo start --lan --clear
```

### Terminal 4 - Stylist App (LAN Mode)
```bash
cd salon-stylist-app && npx expo start --lan --clear --port 8082
```

## 📱 Expected URLs

After running these commands, you should see:

- **Backend**: Running on port 3001 ✅
- **Admin Panel**: http://localhost:5173 ✅
- **User App**: exp://10.220.244.90:8081 ✅
- **Stylist App**: exp://10.220.244.90:8082 ✅

## 🔧 Key Flags Explained

- `--lan`: Uses network IP instead of localhost
- `--clear`: Clears Metro bundler cache
- `--port 8082`: Avoids port conflicts between apps

## ⚡ One-Line Restart (PowerShell)

```powershell
# Stop all processes and restart with correct settings
Get-Process -Name "node","expo" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-admin-panel\server'; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-admin-panel'; npm run dev"  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-user-app'; npx expo start --lan --clear"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-stylist-app'; npx expo start --lan --clear --port 8082"
```

This ensures users can successfully download remote updates via QR codes!