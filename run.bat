@echo off
title AI Mini-SOC Platform Launcher
color 0b

echo ===================================================================
echo   AI-BASED SUSPICIOUS LOG DETECTOR ^& SECURITY ANALYTICS PLATFORM
echo   MCA Internship Mini-SOC Project
echo ===================================================================
echo.

echo [*] Activating Python virtual environment and starting FastAPI backend...
start "AI Mini-SOC Backend" cmd /k ".\.venv\Scripts\activate.bat && set PYTHONPATH=. && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Starting Vite Frontend Development Server...
start "AI Mini-SOC Frontend" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo [+] Services launched successfully!
echo     - Frontend SOC Dashboard: http://localhost:5173
echo     - Backend API Swagger:    http://127.0.0.1:8000/api/docs
echo.
echo Evaluator Demo Tip:
echo   1. Navigate to http://localhost:5173/login
echo   2. Click the 'Admin' preset button and log in.
echo   3. Click 'Run Security Simulation' to watch live alerts appear!
echo ===================================================================
pause
