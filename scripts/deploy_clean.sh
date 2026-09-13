#!/bin/bash
set -e

echo "====================================================================="
echo "          DOMINUS OS - CLEAN DEPLOY (LINUX / VPS)"
echo "====================================================================="
echo "[CANH BAO] Xoa toan bo Containers, Images va Database Volumes..."
echo ""

docker compose down -v --rmi all --remove-orphans
docker system prune -a --volumes -f
docker builder prune -a -f
docker compose build --no-cache
docker compose up -d

echo ""
echo "[*] Kiem tra trang thai cac Container:"
docker compose ps

echo ""
echo "====================================================================="
echo "[THANH CONG] He thong da duoc Clean Deploy tren VPS/Linux!"
echo "====================================================================="
