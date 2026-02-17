@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

title CURSA Launcher

echo.
echo =================================================================
echo =                  CURSA INTELLIGENT LAUNCHER                   =
echo =================================================================
echo.

REM --- 1. Check Core Requirements ---
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.
    pause
    exit /b 1
)
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js.
    pause
    exit /b 1
)

REM --- 2. Check AI Configuration ---
if not exist ".env" (
    echo [SETUP] AI Configuration required.
    echo.
    echo Do you want to enable AI features ^(Gemini^)? [Y/N]
    set /p AI_CHOICE="> "
    if /i "!AI_CHOICE!"=="Y" (
        echo.
        echo Please enter your Gemini API key ^(from aistudio.google.com^):
        set /p API_KEY="Key: "
        echo GEMINI_API_KEY=!API_KEY!> .env
        echo [OK] Saved configuration.
    ) else (
        echo [INFO] AI features disabled.
    )
    echo.
)

REM --- 3. Intelligent Dependency Check ---
set "MISSING_DEPS=0"
if not exist ".venv" set "MISSING_DEPS=1"
if not exist "frontend\node_modules" set "MISSING_DEPS=1"

if "!MISSING_DEPS!"=="1" (
    echo [INFO] First run or missing dependencies detected.
    echo [INFO] Starting automatic installation...
    goto :INSTALL_ALL
)

REM --- 4. Fast Start / Update Prompt ---
echo [READY] System is ready to launch.
echo.
echo Press 'U' to Update dependencies, or wait 3s to Launch...
choice /c UL /n /t 3 /d L /m "[U]pdate / [L]aunch > "
if %errorlevel% equ 1 goto :INSTALL_ALL
goto :LAUNCH

:INSTALL_ALL
echo.
echo [1/2] Setting up Backend Environment...
if not exist ".venv" (
    echo        Creating virtual environment...
    python -m venv .venv
)
echo        Installing/Updating Python packages...
call .venv\Scripts\python.exe -m pip install -q --upgrade pip
call .venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt

echo.
echo [2/2] Setting up Frontend Environment...
echo        Installing NPM packages...
cd frontend
call npm install --no-audit --no-fund --loglevel=error
cd ..
echo.
echo [OK] Installation Complete.
echo.

:LAUNCH
echo [START] Launching Applications...
echo -----------------------------------------------------------------

REM Start Backend
start "CURSA Backend" cmd /k "cd /d %~dp0backend && title CURSA Backend && set PYTHONIOENCODING=utf-8 && ..\.venv\Scripts\python.exe run.py"

REM Start Frontend (BROWSER=none prevents duplicate tab)
start "CURSA Frontend" cmd /k "cd /d %~dp0frontend && title CURSA Frontend && set BROWSER=none && npm start"

REM Wait for services to spin up
echo [WAIT] Waiting for services to initialize...
timeout /t 5 /nobreak >nul

REM Open Browser
start http://localhost:3000

echo.
echo [SUCCESS] Application is running!
echo.
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:5000
echo.
echo    - Close the popup windows to stop the server.
echo    - Close this window to keep it running in background.
echo.
timeout /t 10
