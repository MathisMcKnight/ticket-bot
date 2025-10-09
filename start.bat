@echo off
echo ========================================
echo Starting Discord Ticket Bot...
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create a .env file based on .env.example
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo ERROR: Dependencies not installed!
    echo Please run setup.bat first
    echo.
    pause
    exit /b 1
)

REM Start the bot
echo Bot is starting...
echo Press Ctrl+C to stop the bot
echo.
npm start
