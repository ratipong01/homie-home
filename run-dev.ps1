Write-Host "=========================================" -ForegroundColor DarkYellow
Write-Host " 🏠 Starting Homie Home Full-Stack Dev   " -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor DarkYellow

Write-Host "1. Starting Backend API on http://localhost:4000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Write-Host "2. Starting Frontend Client on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host "`nBoth services are launching in separate windows." -ForegroundColor White
Write-Host "To stop, close both PowerShell windows." -ForegroundColor Gray
