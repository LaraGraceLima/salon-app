@echo off
echo [1/4] Starting Backend Server...
start "Backend Server" cmd /k "cd salon-admin-panel\server && node server.js"
timeout /t 3 /nobreak >nul

echo [2/4] Starting Admin Panel...
start "Admin Panel" cmd /k "cd salon-admin-panel && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/4] Starting User App...
start "User App" cmd /k "cd salon-user-app && expo start --offline"
timeout /t 3 /nobreak >nul

echo [4/4] Starting Stylist App...
start "Stylist App" cmd /k "cd salon-stylist-app && expo start --offline"

echo All services started!
