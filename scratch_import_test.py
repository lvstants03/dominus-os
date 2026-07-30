import sys
from pathlib import Path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root / "dominus-core"))
print("sys.path:", sys.path)
try:
    import src
    print("src file:", getattr(src, "__file__", "No __file__ (Namespace package)"))
    print("src path:", getattr(src, "__path__", "No __path__"))
    from src.database.models.assistant import DominusAssistantConfig
    print("Import thành công DominusAssistantConfig!")
except Exception as e:
    import traceback
    traceback.print_exc()
