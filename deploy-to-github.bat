@echo off
setlocal
color 0A
echo ========================================================
echo       SENKU VAULT • GITHUB REPOSITORY DEPLOYMENT
echo              Kingdom of Science Engine
echo ========================================================
echo.
echo 1. Create an empty public repository on GitHub:
echo    https://github.com/new
echo    (Recommended repository name: senku-vault)
echo.
set /p REPO_URL="Enter your GitHub Repository URL (Press Enter for default: https://github.com/subrat-sahu444/senku-vault.git): "

if "%REPO_URL%"=="" (
    set REPO_URL=https://github.com/subrat-sahu444/senku-vault.git
)

echo.
echo [1/3] Configuring git remote origin to:
echo       %REPO_URL%
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo [2/3] Ensuring branch is main...
git branch -M main

echo.
echo [3/3] Pushing files to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! Senku Vault is now live on GitHub:
    echo  %REPO_URL%
    echo.
    echo  To make the site publicly accessible for everyone:
    echo  1. Deploy with 1 click on Render (Free Full-Stack):
    echo     Go to https://render.com -^> New Web Service -^> Connect this repo
    echo  2. Or enable GitHub Pages in your repo Settings!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. 
    echo Please ensure you created the repository '%REPO_URL%' on GitHub first!
)
echo.
pause
