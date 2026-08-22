@echo off
echo =====================================================================
echo                 DOMINUS OS - DESKTOP RUNNER
echo =====================================================================
echo.

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo [*] Kiem tra va giai phong sach se cac cong 8082 va 3000...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%\stop.ps1" >nul 2>&1

echo [*] Khoi dong Backend FastAPI [Port 8082]...
start "FastAPIBackend" cmd /c "cd /d %ROOT_DIR%\dominus-investor && call %ROOT_DIR%\MarkovBrain\.venv\Scripts\activate.bat && set PYTHONPATH=. && python src/main.py"

echo [*] Khoi dong Frontend Next.js [Port 3000]...
start "NextJSFrontend" cmd /c "cd /d %ROOT_DIR%\dominus-frontend && npm run dev"

echo [*] Dang cho cac dich vu khoi dong...
timeout /t 5 > nul

echo [*] Khoi dong ung dung Desktop Tauri...
echo.
echo [!] He thong dang hoat dong. Khi ban dong cua so Desktop, toan bo tien trinh ngam se tu dong duoc don dep sach se.
echo.

REM Chay va doi ung dung Desktop dong lai (Auto-Cleanup on Exit)
start /wait "" "%ROOT_DIR%\dominus-frontend\src-tauri\target\debug\app.exe"

echo.
echo [*] Phat hien ung dung Desktop da dong. Dang tu dong tat toan bo tien trinh ngam...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%\stop.ps1" >nul 2>&1

echo [v] Da don dep toan bo tien trinh thanh cong!
timeout /t 2 > nul
