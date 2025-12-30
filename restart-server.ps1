# Restart the backend server
# This script stops any process on port 3001 and starts the server again

Write-Host "🛑 Stopping server on port 3001..." -ForegroundColor Yellow

# Find and stop process on port 3001
$process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) {
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Stopped process $process" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No process found on port 3001" -ForegroundColor Cyan
}

Write-Host "`n🚀 Starting server..." -ForegroundColor Yellow
npm run server:dev

