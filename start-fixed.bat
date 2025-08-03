@echo off
echo 🚀 Starting Tenant Ticketing System...

echo.
echo 📋 Checking ports...
netstat -ano | findstr :5002 >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 5002 is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5002') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :3002 >nul
if %errorlevel% == 0 (
    echo ⚠️  Port 3002 is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 🔧 Starting backend server on port 5002...
start "Backend Server" cmd /k "set PORT=5002 && node server-demo.js"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo 🎨 Starting frontend server on port 3002...
cd client
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ Both servers are starting!
echo 📱 Frontend: http://localhost:3002
echo 🔧 Backend: http://localhost:5002
echo 🏥 Health Check: http://localhost:5002/health
echo.
pause
