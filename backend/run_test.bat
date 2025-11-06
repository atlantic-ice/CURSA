@echo off
timeout /t 2 /nobreak > nul
cd /d "%~dp0"
python test_full_flow.py
pause
