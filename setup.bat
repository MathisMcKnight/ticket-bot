@echo off
echo ========================================
echo Discord Ticket Bot - Windows Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: PostgreSQL command line tools not found.
    echo Make sure PostgreSQL is installed and accessible.
    echo.
)

REM Install dependencies
echo Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a .env file based on .env.example
echo 2. Fill in your Discord bot credentials
echo 3. Set up your PostgreSQL database
echo 4. Run start.bat to launch the bot
echo.
pause
