@echo off
REM Colivio Edge Function Deployment Script for Windows
REM This script helps deploy the backend server to Supabase Edge Functions

echo ========================================
echo Colivio Edge Function Deployment
echo ========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Supabase CLI is not installed
    echo.
    echo Install it with:
    echo   npm install -g supabase
    echo.
    exit /b 1
)

echo [OK] Supabase CLI is installed
echo.

REM Check if logged in
echo Checking Supabase authentication...
supabase projects list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Not logged in to Supabase
    echo.
    echo Please run:
    echo   supabase login
    echo.
    exit /b 1
)

echo [OK] Logged in to Supabase
echo.

REM Project reference
set PROJECT_REF=xxhiqqamjhkhbykmehnr

echo Linking to Supabase project: %PROJECT_REF%
supabase link --project-ref %PROJECT_REF%

if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to link to project
    echo.
    echo Please check:
    echo   1. Project ID is correct
    echo   2. You have access to this project
    echo.
    exit /b 1
)

echo [OK] Project linked
echo.

REM Deploy the Edge Function
echo Deploying Edge Function: make-server-5bec5893
echo.

supabase functions deploy make-server-5bec5893

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] Deployment failed
    echo.
    echo Common issues:
    echo   1. Check server code for syntax errors
    echo   2. Ensure all dependencies are available
    echo   3. Check Supabase project settings
    echo.
    exit /b 1
)

echo.
echo [OK] Edge Function deployed successfully!
echo.

REM Test the deployment
echo Testing deployment...
set HEALTH_URL=https://%PROJECT_REF%.supabase.co/functions/v1/make-server-5bec5893/health

echo Health check URL: %HEALTH_URL%
echo.

curl -s -o nul -w "%%{http_code}" "%HEALTH_URL%" > temp_status.txt
set /p RESPONSE=<temp_status.txt
del temp_status.txt

if "%RESPONSE%"=="200" (
    echo [OK] Health check passed!
    echo    Server is online and responding
    echo.
    echo Deployment successful! Your Colivio backend is ready!
    echo.
    echo Next steps:
    echo   1. Open your app in the browser
    echo   2. Try signing up with a test account
    echo   3. Check the browser console for connection status
    echo.
) else (
    echo [!] Health check returned status: %RESPONSE%
    echo    Expected: 200
    echo.
    echo The function deployed but may have issues.
    echo Check the logs:
    echo   supabase functions logs make-server-5bec5893
    echo.
)

REM Show logs command
echo To view logs, run:
echo   supabase functions logs make-server-5bec5893
echo.
echo To view all functions:
echo   supabase functions list
echo.

pause
