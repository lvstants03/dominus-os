@echo off
chcp 65001 > nul
echo =====================================================================
echo                 HE THONG DIEU HANH DOMINUS OS
echo =====================================================================
echo.
echo [*] Dang khoi chay cac dich vu he thong...
echo.

echo [1/3] Khoi chay MarkovBrain (Cops 8000)...
start "MarkovBrain" cmd /k "cd MarkovBrain && set "PYTHONPATH=." && call .venv\Scripts\activate && python src/main.py"

echo [2/3] Khoi chay Dominus Backend (Cong 8001)...
start "DominusBackend" cmd /k "cd dominus-backend && set "PYTHONPATH=." && call ..\MarkovBrain\.venv\Scripts\activate && python src/main.py"

echo [3/3] Khoi chay Dominus Frontend (Cong 3000)...
start "DominusFrontend" cmd /k "cd dominus-frontend && npm run dev"

echo.
echo [*] Dang cho ung dung khoi dong de tu dong mo trinh duyet (5s)...
timeout /t 5 > nul
start http://localhost:3000

echo.
echo =====================================================================
echo [OK] Tat ca dich vu dang duoc khoi chay song song.
echo Vui loi kiem tra cac cua so terminal rieng de xem log!
echo =====================================================================
echo.
pause
