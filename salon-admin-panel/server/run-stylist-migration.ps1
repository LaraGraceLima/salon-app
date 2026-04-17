# Run Stylist Fields Migration
Write-Host "Running stylist fields migration..." -ForegroundColor Cyan

# Read the SQL file
$sqlContent = Get-Content -Path "add-stylist-fields.sql" -Raw

# Execute using mysql command
$sqlContent | mysql -u root -p salon_admin

Write-Host "Migration completed!" -ForegroundColor Green
Write-Host "New fields added to stylists table:" -ForegroundColor Yellow
Write-Host "  - years_of_experience" -ForegroundColor White
Write-Host "  - bio" -ForegroundColor White
Write-Host "  - profile_image" -ForegroundColor White
Write-Host "  - achievements" -ForegroundColor White
Write-Host "  - rating" -ForegroundColor White
Write-Host "  - total_bookings" -ForegroundColor White
