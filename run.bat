@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

REM Kill any existing processes on ports 3000 and 5000
echo Cleaning up any existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ========================================
echo     HackLoop Medical AI Application
echo ========================================
echo.
echo Starting Frontend + Backend + ML System...
echo.

REM Set current directory
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo Current directory: %CD%
echo.

REM Quick checks
echo Checking prerequisites...

REM Check Python
python --version >nul 2>&1 || (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo ✓ Python: OK

REM Check Node.js
node --version >nul 2>&1 || (
    echo ERROR: Node.js not found. Please install Node.js
    pause
    exit /b 1
)
echo ✓ Node.js: OK

REM Check npm
npm --version >nul 2>&1 || (
    echo ERROR: npm not found. Please install npm
    pause
    exit /b 1
)
echo ✓ npm: OK

echo.
echo Prerequisites check passed!
echo.

REM Check directories
if not exist "backend" (
    echo ERROR: backend directory not found
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend directory not found
    pause
    exit /b 1
)

echo Installing Dependencies...
echo.

REM Backend setup
echo Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if !errorlevel! neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo Installing backend dependencies...
call venv\Scripts\activate.bat && pip install -r requirements.txt >nul 2>&1
if !errorlevel! neq 0 (
    echo WARNING: Some backend dependencies may have issues
    echo Continuing anyway...
)
cd ..
echo ✓ Backend: Ready

REM Frontend setup
echo Setting up Frontend...
cd frontend
npm install >nul 2>&1
if !errorlevel! neq 0 (
    echo WARNING: Some frontend dependencies may have issues
    echo Continuing anyway...
)
cd ..
echo ✓ Frontend: Ready

echo.
echo Starting Services...
echo.

REM Start backend
echo Starting Backend Server on port 5000...
start "HackLoop Backend" cmd /k "title HackLoop Backend && cd /d "%SCRIPT_DIR%\backend" && call venv\Scripts\activate.bat && echo Backend starting... && python app.py"

REM Wait for backend
echo Waiting for backend to start...
timeout /t 10 /nobreak >nul

REM Start frontend
echo Starting Frontend Server on port 3000...
start "HackLoop Frontend" cmd /k "title HackLoop Frontend && cd /d "%SCRIPT_DIR%\frontend" && echo Frontend starting... && npm run dev"

echo.
echo Waiting for services to initialize...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo Service URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   Health:   http://localhost:5000/health
echo.
echo Features Available:
echo   ✓ Fundus Disease Detection (ML)
echo   ✓ Color Blindness Testing (ML)
echo   ✓ User Authentication
echo   ✓ Medical AI Chatbot
echo   ✓ Report Generation and Email
echo   ✓ Historical Results Tracking
echo.

echo Opening application in browser...
start http://localhost:3000

echo.
echo ========================================
echo          Application Running
echo ========================================
echo.
echo To stop all services:
echo   - Close both server windows (HackLoop Backend ^& Frontend)
echo   - Or press Ctrl+C in each server window
echo.
echo Troubleshooting:
echo   - Backend logs: Check "HackLoop Backend" window
echo   - Frontend logs: Check "HackLoop Frontend" window
echo   - If ports busy: This script kills existing processes
echo.
echo Happy coding with HackLoop Medical AI!
echo.
echo This window can be closed safely.
echo The servers will continue running.
echo.
echo Press any key to exit this launcher...
pause >nul
exit