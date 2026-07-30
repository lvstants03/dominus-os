import sys
import os
from pathlib import Path

# Đã sửa PYTHONPATH ở ServiceOrchestrator nên không cần lọc sys.path tránh lỗi loại bỏ nhầm thư mục .venv của MarkovBrain


project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "dominus-core"))

try:
    from src.database.connection import init_db
    init_db()
except Exception as e:
    print(f"Database init warning: {e}")

from nicegui import ui
from ui.dashboard import build_dashboard

build_dashboard()

ui.run(
    title="DOMINUS OS Dashboard",
    port=8084,
    host="0.0.0.0",
    reload=True,
    show=False,
    dark=True,
)
