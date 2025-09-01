# HackLoop Medical AI Application Launcher - PowerShell Version
# Run this script to start both frontend and backend servers

param(
    [switch]$SkipDependencies = $false
)

# Set error handling
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================"
Write-Host "    HackLoop Medical AI Application"
Write-Host "========================================"
Write-Host ""
Write-Host "Starting Frontend + Backend + ML System..." -ForegroundColor Green
Write-Host ""

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Kill existing processes on ports 3000 and 5000
Write-Host "Cleaning up any existing processes..." -ForegroundColor Yellow
try {
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process on port 3000: $($_.OwningProcess)" -ForegroundColor Gray
    }
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process on port 5000: $($_.OwningProcess)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Port cleanup completed" -ForegroundColor Gray
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Python not found. Please install Python 3.8+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js not found. Please install Node.js" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>&1
    Write-Host "✓ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: npm not found. Please install npm" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Prerequisites check passed!" -ForegroundColor Green
Write-Host ""

# Check directories
if (!(Test-Path "backend")) {
    Write-Host "✗ ERROR: backend directory not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (!(Test-Path "frontend")) {
    Write-Host "✗ ERROR: frontend directory not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (!$SkipDependencies) {
    Write-Host "Installing Dependencies..." -ForegroundColor Yellow
    Write-Host ""

    # Backend setup
    Write-Host "Setting up Backend..." -ForegroundColor Cyan
    Set-Location "backend"
    
    if (!(Test-Path "venv")) {
        Write-Host "Creating virtual environment..." -ForegroundColor Gray
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ ERROR: Failed to create virtual environment" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    }

    Write-Host "Installing backend dependencies..." -ForegroundColor Gray
    & "venv\Scripts\activate.ps1"
    pip install -r requirements.txt *>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ WARNING: Some backend dependencies may have issues" -ForegroundColor Yellow
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
    deactivate 2>$null
    Set-Location ".."
    Write-Host "✓ Backend: Ready" -ForegroundColor Green

    # Frontend setup
    Write-Host "Setting up Frontend..." -ForegroundColor Cyan
    Set-Location "frontend"
    npm install *>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ WARNING: Some frontend dependencies may have issues" -ForegroundColor Yellow
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
    Set-Location ".."
    Write-Host "✓ Frontend: Ready" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Services..." -ForegroundColor Yellow
Write-Host ""

# Start backend
Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Cyan
$backendPath = Join-Path $ScriptDir "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$backendPath'; & venv\Scripts\activate.ps1; Write-Host 'Backend starting...' -ForegroundColor Green; python app.py }" -WindowStyle Normal

# Wait for backend
Write-Host "Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Start frontend
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Cyan
$frontendPath = Join-Path $ScriptDir "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$frontendPath'; Write-Host 'Frontend starting...' -ForegroundColor Green; npm run dev }" -WindowStyle Normal

Write-Host ""
Write-Host "Waiting for services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Application Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Health:   http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "Features Available:" -ForegroundColor Yellow
Write-Host "  ✓ Fundus Disease Detection (ML)" -ForegroundColor Green
Write-Host "  ✓ Color Blindness Testing (ML)" -ForegroundColor Green
Write-Host "  ✓ User Authentication" -ForegroundColor Green
Write-Host "  ✓ Medical AI Chatbot" -ForegroundColor Green
Write-Host "  ✓ Report Generation and Email" -ForegroundColor Green
Write-Host "  ✓ Historical Results Tracking" -ForegroundColor Green
Write-Host ""

Write-Host "Opening application in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "          Application Running" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  - Close both PowerShell server windows" -ForegroundColor White
Write-Host "  - Or press Ctrl+C in each server window" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  - Backend logs: Check backend PowerShell window" -ForegroundColor White
Write-Host "  - Frontend logs: Check frontend PowerShell window" -ForegroundColor White
Write-Host "  - If ports busy: This script kills existing processes" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding with HackLoop Medical AI!" -ForegroundColor Green
Write-Host ""
Write-Host "This window can be closed safely." -ForegroundColor Gray
Write-Host "The servers will continue running." -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to exit this launcher..." -ForegroundColor Yellow
Read-Host