@echo off
cd /d "%~dp0.."

echo =====================================================================
echo           DOMINUS OS - CLEAN DEPLOY - XOA SACH DATA VA IMAGES
echo =====================================================================
echo.
echo [CANH BAO] Thao tac nay se xoa toan bo Containers, Images va Database Volumes!
echo.

REM 1. Dung va xoa tat ca containers, volumes, networks va images lien quan
echo [*] Dang dung va don dep toan bo container, volume, network...
docker compose down -v --rmi all --remove-orphans

REM 2. Don dep toan bo he thong Docker
echo [*] Dang don dep triet de Docker System va Volumes...
docker system prune -a --volumes -f
docker builder prune -a -f

REM 3. Build lai toan bo images khong dung cache
echo [*] Dang build lai toan bo cac Microservices tu dau bao gom ca Frontend...
docker compose build --no-cache

REM 4. Khoi chay toan bo services o che do background
echo [*] Dang khoi chay toan bo he thong Dominus OS...
docker compose up -d

echo.
echo [*] Kiem tra trang thai cac Container dang hoat dong:
echo ---------------------------------------------------------------------
docker compose ps
echo ---------------------------------------------------------------------

echo.
echo =====================================================================
echo [THANH CONG] He thong da duoc Clean Deploy thanh cong!
echo =====================================================================
echo - Dominus Frontend : http://localhost:3000
echo - Dominus Core API : http://localhost:8003
echo - Dominus Investor : http://localhost:8082
echo - MarkovBrain API  : http://localhost:8000
echo - PostgreSQL       : localhost:5432
echo - Redis            : localhost:6379
echo =====================================================================
echo.
pause
