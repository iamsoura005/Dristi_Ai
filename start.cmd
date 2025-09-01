@echo off
REM Simple launcher for HackLoop Medical AI Application
title HackLoop Launcher

echo.
echo ================================================
echo          HackLoop Medical AI Launcher
echo ================================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Kill existing processes
echo Cleaning up ports 3000 and 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1

echo.
echo Starting HackLoop Medical AI Application...
echo.

REM Start backend in new window
echo [1/2] Starting Backend Server...
start "HackLoop Backend" cmd /k "title HackLoop Backend Server && cd /d "%~dp0\backend" && call venv\Scripts\activate.bat 2>nul && echo Backend starting on port 5000... && python app.py"

REM Wait a moment
timeout /t 8 /nobreak >nul

REM Start frontend in new window  
echo [2/2] Starting Frontend Server...
start "HackLoop Frontend" cmd /k "title HackLoop Frontend Server && cd /d "%~dp0\frontend" && echo Frontend starting on port 3000... && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 12 /nobreak >nul

echo.
echo ================================================
echo            Application Started!
echo ================================================
echo.
echo Application URL: http://localhost:3000
echo Backend API:     http://localhost:5000
echo.
echo Opening in browser...
start http://localhost:3000

echo.
echo Services are running in separate windows.
echo To stop: Close the "HackLoop Backend" and "HackLoop Frontend" windows.
echo.
echo Press any key to exit this launcher...
pause >nul
exit