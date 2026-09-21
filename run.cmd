@echo off
title Homie Home Dev Launcher
echo ===================================================
echo   Starting Homie Home (Backend + Frontend)
echo ===================================================

echo [1/2] Launching Backend API on http://localhost:4000...
start "Homie Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/2] Launching Frontend Client on http://localhost:5173...
start "Homie Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening http://localhost:5173 in browser...
start http://localhost:5173

echo.
echo Both servers are running! To stop, close their respective command prompt windows.
exit
