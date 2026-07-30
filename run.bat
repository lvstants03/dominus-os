@echo off
chcp 65001 > nul
echo =====================================================================
echo                 HE THONG DIEU HANH DOMINUS OS
echo =====================================================================
echo.
echo [*] Dang khoi dong executive console...

call MarkovBrain\.venv\Scripts\activate
set "PYTHONPATH=dominus-core;."
set PYTHONWARNINGS=ignore
python dominus-assistant/main.py
