# Firebase Database Migration Script
Write-Host "Running Firebase Database Migration..." -ForegroundColor Green

# Read the SQL file content
$sqlContent = Get-Content "add-firebase-columns.sql" -Raw

# Split into individual statements
$statements = $sqlContent -split ";"

# Connect to MySQL and execute each statement
foreach ($statement in $statements) {
    $statement = $statement.Trim()
    if ($statement -and $statement -ne "") {
        $preview = $statement.Substring(0, [Math]::Min(50, $statement.Length))
        Write-Host "Executing: $preview..." -ForegroundColor Yellow
        
        # Execute the SQL statement
        try {
            mysql -u root salon_admin -e "$statement"
            Write-Host "Success" -ForegroundColor Green
        } catch {
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
}

Write-Host "Firebase migration completed!" -ForegroundColor Green