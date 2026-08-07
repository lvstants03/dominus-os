@echo off
chcp 65001 > nul
echo =====================================================================
echo                 HE THONG DIEU HANH DOMINUS OS (TAURI)
echo =====================================================================
echo.
echo [*] Dang cau hinh moi truong cho Rust...
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

echo [*] Dang khoi dong ung dung Desktop Tauri (Rust + Next.js)...
echo [!] Cac service con (MarkovBrain, Backend) se tu dong khoi chay boi Rust.
echo.
cd /d "%~dp0dominus-frontend"
npm run tauri dev
