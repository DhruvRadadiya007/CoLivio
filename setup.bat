@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo 🚀 Colivio Project Setup Assistant
echo ==========================================

:: Step 1: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please download it from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=v" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js version !NODE_VER! found.

:: Step 2: Install dependencies
echo ==========================================
echo 📦 Installing dependencies...
echo ==========================================
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully.

:: Step 3: Run Automated Tests
echo ==========================================
echo 🧪 Running Automated Unit Tests...
echo ==========================================
call npm test
if %errorlevel% neq 0 (
    echo [WARNING] Automated tests failed! Please check the output above. 
    echo But setup can still continue...
) else (
    echo [OK] All automated tests passed!
)

:: Step 4: Check for Supabase CLI
echo ==========================================
echo ⚡ Checking for Supabase CLI...
echo ==========================================
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Supabase CLI not found. You'll need it to deploy the backend.
    echo To install it: npm install -g supabase
) else (
    echo [OK] Supabase CLI found.
)

echo ==========================================
echo ✅ Setup complete! 
echo ==========================================
echo - Use 'npm test' to run tests manually.
echo - Use 'npm run dev' to start the development server.
echo - Read 'REQUIREMENTS.md' for more details.
echo ==========================================
pause
