@echo off
title Senku Vault - Powered by the Senku Engine
color 0A
echo.
echo ====================================================================
echo             SENKU VAULT - KINGDOM OF SCIENCE
echo       Powered by the Senku Engine (10 Billion Percent Clean)
echo       Instagram Reels, YouTube 4K ^& WhatsApp Status Downloader
echo                       100%% Ad-Free Sanctuary
echo ====================================================================
echo.
echo [1/2] Checking local dependencies...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found. Please install Node.js from https://nodejs.org
    pause
    exit /b
)

echo [2/2] Starting Senku Vault Engine...
start "" http://localhost:3000
node server.js
pause
