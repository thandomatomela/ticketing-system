# Tenant Ticketing System Startup Script
Write-Host "🚀 Starting Tenant Ticketing System..." -ForegroundColor Green

Write-Host "📋 Checking and freeing ports..." -ForegroundColor Yellow
$backendProcesses = Get-NetTCPConnection -LocalPort 5002 -ErrorAction SilentlyContinue
if ($backendProcesses) {
    $backendProcesses | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "✅ Freed port 5002" -ForegroundColor Green
}

$frontendProcesses = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($frontendProcesses) {
    $frontendProcesses | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Host "✅ Freed port 3002" -ForegroundColor Green
}

Write-Host "🔧 Starting backend server..." -ForegroundColor Cyan
$env:PORT = "5002"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server-demo.js" -WindowStyle Normal

Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🎨 Starting frontend server..." -ForegroundColor Cyan
Set-Location client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Write-Host "✅ Startup complete!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "🔧 Backend: http://localhost:5002" -ForegroundColor White
Write-Host "🏥 Health Check: http://localhost:5002/health" -ForegroundColor White

Read-Host "Press Enter to exit"
