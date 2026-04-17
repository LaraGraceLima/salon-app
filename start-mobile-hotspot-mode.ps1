# Mobile Hotspot Mode Startup Script
# This script ensures all services run in LAN mode for mobile hotspot compatibility

Write-Host "🔥 Starting Salon System in Mobile Hotspot LAN Mode..." -ForegroundColor Green
Write-Host "📱 Optimized for mobile hotspot local testing" -ForegroundColor Yellow

# Stop any existing processes
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "expo" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait for processes to stop
Start-Sleep -Seconds 3

# Start Backend Server (localhost mode)
Write-Host "🚀 Starting Backend Server (localhost:3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-admin-panel/server'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; node server.js"

# Wait for backend to initialize
Start-Sleep -Seconds 5

# Start Admin Panel (localhost mode)
Write-Host "🎛️ Starting Admin Panel (localhost:5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-admin-panel'; Write-Host 'Admin Panel Starting...' -ForegroundColor Blue; npm run dev"

# Wait for admin panel to initialize
Start-Sleep -Seconds 5

# Start User App (LAN mode for mobile hotspot)
Write-Host "📱 Starting User App (LAN mode - port 8081)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-user-app'; Write-Host 'User App Starting in LAN Mode...' -ForegroundColor Cyan; npx expo start --lan --port 8081"

# Wait for user app to initialize
Start-Sleep -Seconds 5

# Start Stylist App (LAN mode for mobile hotspot)
Write-Host "💼 Starting Stylist App (LAN mode - port 8082)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-stylist-app'; Write-Host 'Stylist App Starting in LAN Mode...' -ForegroundColor Magenta; npx expo start --lan --port 8082"

Write-Host ""
Write-Host "✅ All services starting in Mobile Hotspot LAN Mode!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Yellow
Write-Host "   🔧 Backend API: http://localhost:3001" -ForegroundColor White
Write-Host "   🎛️ Admin Panel: http://localhost:5173" -ForegroundColor White
Write-Host "   📱 User App: LAN mode on port 8081" -ForegroundColor White
Write-Host "   💼 Stylist App: LAN mode on port 8082" -ForegroundColor White
Write-Host ""
Write-Host "📱 Mobile Access (Mobile Hotspot):" -ForegroundColor Yellow
Write-Host "   • Connect your phone to your PC's mobile hotspot" -ForegroundColor White
Write-Host "   • Open Expo Go app on your mobile device" -ForegroundColor White
Write-Host "   • Scan QR codes from the Expo terminals" -ForegroundColor White
Write-Host "   • Apps will automatically detect and connect to backend" -ForegroundColor White
Write-Host "   • Backend accessible via localhost on PC" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Auto IP Detection:" -ForegroundColor Yellow
Write-Host "   • Apps prioritize localhost for backend connection" -ForegroundColor White
Write-Host "   • Fallback to mobile hotspot IPs if needed" -ForegroundColor White
Write-Host "   • Check Expo terminal logs for detected IP" -ForegroundColor White
Write-Host ""
Write-Host "🔄 To restart all services, run this script again" -ForegroundColor Cyan
Write-Host "⏹️ To stop all services, close all PowerShell windows" -ForegroundColor Red

# Keep this window open
Write-Host ""
Write-Host "Press any key to exit this status window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")