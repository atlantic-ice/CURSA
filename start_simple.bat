@echo off
setlocal
echo Launching CURSA (simple mode)...
powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%~dp0start_simple.ps1"
endlocal
