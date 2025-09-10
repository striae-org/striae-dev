@echo off
REM ======================================
REM STRIAE COMPLETE DEPLOYMENT SCRIPT
REM ======================================
REM This script deploys the entire Striae application:
REM 1. Worker dependencies installation
REM 2. Workers (all 6 workers)
REM 3. Worker secrets/environment variables
REM 4. Pages (frontend)
REM 5. Pages secrets/environment variables

echo [94m🚀 Striae Complete Deployment Script[0m
echo ======================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Step 1: Install Worker Dependencies
echo [95mStep 1/5: Installing Worker Dependencies[0m
echo ----------------------------------------
echo [93m📦 Installing npm dependencies for all workers...[0m
call "%SCRIPT_DIR%install-workers.bat"
if %ERRORLEVEL% neq 0 (
    echo [91m❌ Worker dependencies installation failed![0m
    exit /b 1
)
echo [92m✅ All worker dependencies installed successfully[0m
echo.

REM Step 2: Deploy Workers
echo [95mStep 2/5: Deploying Workers[0m
echo ----------------------------
echo [93m� Deploying all 6 Cloudflare Workers...[0m
call npm run deploy-workers
if %ERRORLEVEL% neq 0 (
    echo [91m❌ Worker deployment failed![0m
    exit /b 1
)
echo [92m✅ All workers deployed successfully[0m
echo.

REM Step 2: Deploy Worker Secrets
echo [95mStep 3/5: Deploying Worker Secrets[0m
echo -----------------------------------
echo [93m🔐 Deploying worker environment variables...[0m
call npm run deploy-workers:secrets
if %ERRORLEVEL% neq 0 (
    echo [91m❌ Worker secrets deployment failed![0m
    exit /b 1
)
echo [92m✅ Worker secrets deployed successfully[0m
echo.

REM Step 3: Deploy Pages
echo [95mStep 4/5: Deploying Pages[0m
echo --------------------------
echo [93m🌐 Building and deploying Pages...[0m
call npm run deploy-pages
if %ERRORLEVEL% neq 0 (
    echo [91m❌ Pages deployment failed![0m
    exit /b 1
)
echo [92m✅ Pages deployed successfully[0m
echo.

REM Step 4: Deploy Pages Secrets
echo [95mStep 5/5: Deploying Pages Secrets[0m
echo ----------------------------------
echo [93m🔑 Deploying Pages environment variables...[0m
call npm run deploy-pages:secrets
if %ERRORLEVEL% neq 0 (
    echo [91m❌ Pages secrets deployment failed![0m
    exit /b 1
)
echo [92m✅ Pages secrets deployed successfully[0m
echo.

REM Success summary
echo ==========================================
echo [92m🎉 COMPLETE DEPLOYMENT SUCCESSFUL! 🎉[0m
echo ==========================================
echo.
echo [94mDeployed Components:[0m
echo   ✅ Worker dependencies (npm install)
echo   ✅ 6 Cloudflare Workers
echo   ✅ Worker environment variables
echo   ✅ Cloudflare Pages frontend
echo   ✅ Pages environment variables
echo.
echo [94mNext Steps:[0m
echo   1. Test your application endpoints
echo   2. Verify all services are working
echo   3. Configure custom domain (optional)
echo.
echo [92m✨ Your Striae application is now fully deployed![0m
