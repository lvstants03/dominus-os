@echo off
setlocal enabledelayedexpansion

:MENU
cls
echo =====================================================================
echo                    DOMINUS OS - MASTER LAUNCHER
echo =====================================================================
echo.
echo   [1] Khoi dong Desktop Runner (FastAPI + NextJS + Tauri App)
echo   [2] Dung toan bo tien trinh va giai phong cong (Stop All)
echo   [3] Redeploy Docker Services (Giu nguyen Database)
echo   [4] Clean Deploy (Dung sach se va build lai tu dau)
echo   [5] Mo Dominus Investor Launcher (Sub-module)
echo   [0] Thoat
echo.
echo =====================================================================
set /p CHOICE="Nhap lua chon cua ban [0-5]: "

if "%CHOICE%"=="1" goto RUN_DESKTOP
if "%CHOICE%"=="2" goto STOP_ALL
if "%CHOICE%"=="3" goto REDEPLOY
if "%CHOICE%"=="4" goto CLEAN_DEPLOY
if "%CHOICE%"=="5" goto INVESTOR_MENU
if "%CHOICE%"=="0" goto EXIT

echo Lua chon khong hop le! Vui long chon lai.
timeout /t 2 >nul
goto MENU

:RUN_DESKTOP
echo.
echo [*] Kiem tra va giai phong sach se cac cong 8082 va 3000...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1" >nul 2>&1

echo [*] Khoi dong Backend FastAPI [Port 8082]...
start "FastAPIBackend" cmd /c "cd /d %~dp0dominus-investor && call %~dp0MarkovBrain\.venv\Scripts\activate.bat && set PYTHONPATH=. && python src/main.py"

echo [*] Khoi dong Frontend Next.js [Port 3000]...
start "NextJSFrontend" cmd /c "cd /d %~dp0dominus-frontend && npm run dev"

echo [*] Dang cho cac dich vu khoi dong...
timeout /t 5 > nul

echo [*] Khoi dong ung dung Desktop Tauri...
echo [!] Khi ban dong cua so Desktop, toan bo tien trinh ngam se tu dong duoc don dep.
echo.
start /wait "" "%~dp0dominus-frontend\src-tauri\target\debug\app.exe"

echo.
echo [*] Phat hien Desktop da dong. Dang don dep toan bo tien trinh ngam...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1" >nul 2>&1
echo [v] Da don dep toan bo tien trinh thanh cong!
timeout /t 2 > nul
goto MENU

:STOP_ALL
echo.
echo [*] Dang dung toan bo tien trinh va giai phong cac cong...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"
pause
goto MENU

:REDEPLOY
echo.
echo [*] Dang thuc hien Redeploy Docker...
call "%~dp0scripts\redeploy.bat"
goto MENU

:CLEAN_DEPLOY
echo.
echo [*] Dang thuc hien Clean Deploy...
call "%~dp0scripts\deploy_clean.bat"
goto MENU

:INVESTOR_MENU
call "%~dp0dominus-investor\run.bat"
goto MENU

:EXIT
echo Tam biet!
timeout /t 1 >nul
exit /b 0