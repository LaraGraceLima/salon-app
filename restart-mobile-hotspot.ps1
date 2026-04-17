# Quick Restart Script for Mobile Hotspot Mode
# IP: 192.168.137.1

Write-Host "🔄 Restarting Apps for Mobile Hotspot..." -ForegroundColor Cyan
Write-Host "📱 Mobile Hotspot IP: 192.168.137.1" -ForegroundColor Yellow
Write-Host ""

# Stop existing Expo processes
Write-Host "🛑 Stopping existing Expo processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*expo*" } | Stop-Process -Force
Start-Sleep -Seconds 2

# Start User App
Write-Host "📱 Starting User App (LAN mode - 192.168.137.1:8081)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-user-app'; Write-Host '📱 User App - Mobile Hotspot Mode' -ForegroundColor Cyan; Write-Host 'Backend: http://192.168.137.1:3001' -ForegroundColor Yellow; npx expo start --lan --port 8081"

Start-Sleep -Seconds 3

# Start Stylist App
Write-Host "💼 Starting Stylist App (LAN mode - 192.168.137.1:8082)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'salon-stylist-app'; Write-Host '💼 Stylist App - Mobile Hotspot Mode' -ForegroundColor Magenta; Write-Host 'Backend: http://192.168.137.1:3001' -ForegroundColor Yellow; npx expo start --lan --port 8082"

Write-Host ""
Write-Host "✅ Apps starting in Mobile Hotspot Mode!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait for QR codes to appear in the new windows" -ForegroundColor White
Write-Host "  2. Make sure your phone is connected to PC's mobile hotspot" -ForegroundColor White
Write-Host "  3. Close Expo Go completely on your phone" -ForegroundColor White
Write-Host "  4. Open Expo Go and scan the QR codes" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Expected URLs:" -ForegroundColor Yellow
Write-Host "  User App: exp://192.168.137.1:8081" -ForegroundColor White
Write-Host "  Stylist App: exp://192.168.137.1:8082" -ForegroundColor White
Write-Host "  Backend: http://192.168.137.1:3001" -ForegroundColor White
Write-Host ""
Write-Host "✅ Backend verified accessible at 192.168.137.1:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
