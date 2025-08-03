@echo off
echo ========================================
echo   Tenant Ticketing System Startup
echo ========================================
echo.

echo [1/4] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [2/4] Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo [3/4] Installing frontend dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo [4/4] Creating environment file...
if not exist .env (
    copy .env.example .env
    echo Created .env file from template
) else (
    echo .env file already exists
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Start MongoDB (see instructions below)
echo 2. Run: npm run dev (for backend)
echo 3. Run: cd client && npm start (for frontend)
echo.
echo MongoDB Options:
echo - Install MongoDB locally: https://www.mongodb.com/try/download/community
echo - Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
echo - Use Docker: docker run -d -p 27017:27017 mongo:6.0
echo.
pause
