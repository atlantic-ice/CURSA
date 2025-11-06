@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === CURSA Quick Start ===
echo.

REM Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check/ask for Gemini API key
if not exist ".env" (
    echo.
    echo Do you want to enable AI features ^(Gemini 2.5 Flash^)? ^(Y/N^)
    set /p AI_CHOICE=
    if /i "%AI_CHOICE%"=="Y" (
        echo.
        echo To get your Gemini API key:
        echo   1. Go to https://aistudio.google.com/app/apikey
        echo   2. Sign in with Google account
        echo   3. Create API key
        echo   4. Copy the key
        echo.
        echo Open the page now? ^(Y/N^)
        set /p OPEN_PAGE=
        if /i "%OPEN_PAGE%"=="Y" start https://aistudio.google.com/app/apikey
        echo.
        set /p API_KEY=Paste your Gemini API key here: 
        echo GEMINI_API_KEY=!API_KEY!> .env
        echo API key saved to .env
    )
)

REM Setup venv
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Install dependencies
echo Installing backend dependencies...
.venv\Scripts\python.exe -m pip install -q --upgrade pip
.venv\Scripts\python.exe -m pip install -q -r backend\requirements.txt

echo Installing frontend dependencies...
cd frontend
call npm install --no-audit --no-fund >nul 2>&1
cd ..

REM Launch servers
echo.
echo Starting backend and frontend...
start "CURSA Backend" cmd /k "cd /d %~dp0backend && set PYTHONIOENCODING=utf-8 && %~dp0.venv\Scripts\python.exe run.py"
timeout /t 3 /nobreak >nul
start "CURSA Frontend" cmd /k "cd /d %~dp0frontend && npm start"
timeout /t 8 /nobreak >nul

REM Open browser
start http://localhost:3000/

echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000
echo.
echo Close the "CURSA Backend" and "CURSA Frontend" windows to stop.
echo.
pause
