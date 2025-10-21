@echo off
echo ================================================
echo   Student Life Hub - Full Stack Startup
echo ================================================
echo.

REM Check if dependencies are installed
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

echo Starting servers...
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3001
echo.
echo Press Ctrl+C to stop all servers
echo ================================================
echo.

REM Start backend in new window
start "Backend API" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo Close this window or press any key to continue...
pause >nul