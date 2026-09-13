@echo off
cd /d "%~dp0.."

echo =====================================================================
echo           DOMINUS OS - REDEPLOY - CAP NHAT CODE VA GIU DATABASE
echo =====================================================================
echo.
echo [*] Thao tac nay chi build lai code moi cua cac service va GIU NGUYEN Database.
echo.

REM 1. Dung cac containers ma KHONG xoa volumes
echo [*] Dang dung cac containers hien tai...
docker compose down --remove-orphans

REM 2. Build lai code cho cac ung dung bao gom ca Frontend
echo [*] Dang build lai code ung dung...
docker compose build markovbrain dominus-core dominus-investor dominus-frontend

REM 3. Khoi dong lai toan bo stack voi database cu
echo [*] Dang khoi dong lai he thong...
docker compose up -d

echo.
echo [*] Kiem tra trang thai cac Container dang hoat dong:
echo ---------------------------------------------------------------------
docker compose ps
echo ---------------------------------------------------------------------

echo.
echo =====================================================================
echo [THANH CONG] He thong da duoc Redeploy thanh cong! DULIEU DA DUOC GIU NGUYEN.
echo =====================================================================
echo - Dominus Frontend : http://localhost:3000
echo - Dominus Core API : http://localhost:8003
echo - Dominus Investor : http://localhost:8082
echo - MarkovBrain API  : http://localhost:8000
echo =====================================================================
echo.
pause
