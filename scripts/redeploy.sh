#!/bin/bash
set -e

echo "====================================================================="
echo "          DOMINUS OS - REDEPLOY (LINUX / VPS)"
echo "====================================================================="
echo "[*] Cap nhat code moi cho cac service - GIU NGUYEN DATABASE..."
echo ""

docker compose down --remove-orphans
docker compose build markovbrain dominus-core dominus-investor dominus-frontend
docker compose up -d

echo ""
echo "[*] Kiem tra trang thai cac Container:"
docker compose ps

echo ""
echo "====================================================================="
echo "[THANH CONG] He thong da duoc Redeploy thanh cong! DULIEU CSDL AN TOAN."
echo "====================================================================="
