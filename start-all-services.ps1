# Salon Booking System - Complete Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SALON BOOKING SYSTEM - STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host ""

# Function to start service in new window
function Start-Service {
    param($Name, $Path, $Command)
    Write-Host "[Starting] $Name..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; $Command"
    Start-Sleep -Seconds 2
}

# Start Backend Server
Start-Service "Backend Server" "salon-admin-panel\server" "node server.js"

# Start Admin Panel
Start-Service "Admin Panel" "salon-admin-panel" "npm run dev"

# Start User App
Start-Service "User App" "salon-user-app" "expo start"

# Start Stylist App
Start-Service "Stylist App" "salon-stylist-app" "expo start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    ALL SERVICES STARTED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "SERVICE URLS:" -ForegroundColor Yellow
Write-Host "Backend Server: " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Green
Write-Host "Admin Panel: " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "User App: " -NoNewline; Write-Host "Check Expo terminal for QR code" -ForegroundColor Green
Write-Host "Stylist App: " -NoNewline; Write-Host "Check Expo terminal for QR code" -ForegroundColor Green
Write-Host ""

Write-Host "LOGIN CREDENTIALS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin Panel:" -ForegroundColor Cyan
Write-Host "  Email: admin@salon.com"
Write-Host "  Password: admin123"
Write-Host ""
Write-Host "User App:" -ForegroundColor Cyan
Write-Host "  Email: user@example.com"
Write-Host "  Password: password123"
Write-Host ""
Write-Host "Stylist App:" -ForegroundColor Cyan
Write-Host "  Email: sarah@salon.com"
Write-Host "  Password: stylist123"
Write-Host "  Alternative: emily@salon.com / stylist123"
Write-Host "  Alternative: michael@salon.com / stylist123"
Write-Host ""

Write-Host "AUTO IP DETECTION:" -ForegroundColor Yellow
Write-Host "✓ Apps will automatically detect backend IP" -ForegroundColor Green
Write-Host "✓ If connection fails, use 'Refresh IP Connection' button" -ForegroundColor Green
Write-Host "✓ Tests multiple IP ranges automatically" -ForegroundColor Green
Write-Host ""

Write-Host "NEW FEATURES:" -ForegroundColor Yellow
Write-Host "✓ Stylist Dashboard with analytics and charts" -ForegroundColor Green
Write-Host "✓ PHP Peso currency (₱) throughout apps" -ForegroundColor Green
Write-Host "✓ Enhanced UI design and navigation" -ForegroundColor Green
Write-Host "✓ Real-time booking statistics" -ForegroundColor Green
Write-Host ""

Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")