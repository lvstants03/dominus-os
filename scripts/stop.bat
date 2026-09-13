@echo off
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%\stop.ps1"

pause
