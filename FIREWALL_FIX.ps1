# Firewall Configuration Script for Salon Booking System
# This script adds Node.js and port 3001 to Windows Firewall exceptions

# Run as Administrator!
# Right-click PowerShell and select "Run as Administrator"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Salon Booking System - Firewall Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsIdentity]::GetCurrent()).Groups -contains 'S-1-5-32-544'
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Node.js path
$nodePath = "C:\Program Files\nodejs\node.exe"

# Check if Node.js exists
if (-not (Test-Path $nodePath)) {
    Write-Host "ERROR: Node.js not found at $nodePath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found Node.js at: $nodePath" -ForegroundColor Green
Write-Host ""

# Add Node.js to firewall (Inbound)
Write-Host "Adding Node.js to Firewall (Inbound)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Node.js (Inbound)" `
        -Direction Inbound `
        -Program $nodePath `
        -Action Allow `
        -Profile Private,Domain `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✓ Node.js Inbound rule added" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Node.js Inbound rule" -ForegroundColor Red
}

# Add Node.js to firewall (Outbound)
Write-Host "Adding Node.js to Firewall (Outbound)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Node.js (Outbound)" `
        -Direction Outbound `
        -Program $nodePath `
        -Action Allow `
        -Profile Private,Domain `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✓ Node.js Outbound rule added" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Node.js Outbound rule" -ForegroundColor Red
}

# Add port 3001 to firewall (Inbound)
Write-Host "Adding Port 3001 to Firewall (Inbound)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Port 3001 (Salon Backend)" `
        -Direction Inbound `
        -LocalPort 3001 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Domain `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✓ Port 3001 Inbound rule added" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Port 3001 Inbound rule" -ForegroundColor Red
}

# Add port 3001 to firewall (Outbound)
Write-Host "Adding Port 3001 to Firewall (Outbound)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Port 3001 (Salon Backend) Outbound" `
        -Direction Outbound `
        -LocalPort 3001 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Domain `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✓ Port 3001 Outbound rule added" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add Port 3001 Outbound rule" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firewall Configuration Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart the backend server" -ForegroundColor White
Write-Host "2. Reload the mobile apps" -ForegroundColor White
Write-Host "3. Try logging in again" -ForegroundColor White
Write-Host ""
Write-Host "Backend restart command:" -ForegroundColor Cyan
Write-Host "cd salon-admin-panel/server && npm start" -ForegroundColor Green
