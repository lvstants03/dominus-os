import os
import re

def convert_file(file_path):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} does not exist.")
        return
        
    print(f"Converting {file_path}...")
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        
    # 1. Thay the import PyQt6 thanh PySide6
    # Dac biet, trong PySide6 thi dung Signal, Slot thay cho pyqtSignal, pyqtSlot
    content = content.replace("from PyQt6.QtCore import", "from PySide6.QtCore import")
    content = content.replace("from PyQt6.QtGui import", "from PySide6.QtGui import")
    content = content.replace("from PyQt6.QtWidgets import", "from PySide6.QtWidgets import")
    content = content.replace("from PyQt6.QtWebEngineWidgets import", "from PySide6.QtWebEngineWidgets import")
    content = content.replace("PyQt6", "PySide6")
    
    # Chen them alias cho pyqtSignal, pyqtSlot neu co import tu PySide6.QtCore
    if "from PySide6.QtCore import" in content:
        # Thay the pyqtSignal bang Signal as pyqtSignal
        content = re.sub(
            r"from PySide6\.QtCore import \(([^)]+)\)",
            lambda m: "from PySide6.QtCore import (" + m.group(1).replace("pyqtSignal", "Signal as pyqtSignal").replace("pyqtSlot", "Slot as pyqtSlot") + ")",
            content
        )
        content = re.sub(
            r"from PySide6\.QtCore import ([^\n]+)",
            lambda m: "from PySide6.QtCore import " + m.group(1).replace("pyqtSignal", "Signal as pyqtSignal").replace("pyqtSlot", "Slot as pyqtSlot") if "(" not in m.group(0) else m.group(0),
            content
        )
        
    # 2. Rebrand ten thuong hieu
    content = content.replace("J.A.R.V.I.S", "DOMINUS")
    content = content.replace("JARVIS", "DOMINUS")
    content = content.replace("Jarvis", "Dominus")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Success: Converted {file_path}")

# Thu thi convert cho ui.py va main.py cua dominus-assistant
assistant_dir = os.path.join(os.path.dirname(__file__), "dominus-assistant")
convert_file(os.path.join(assistant_dir, "ui.py"))
convert_file(os.path.join(assistant_dir, "main.py"))
print("All files converted successfully.")
