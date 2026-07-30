# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

block_cipher = None
project_root = Path('.').resolve()

a = Analysis(
    ['dominus-assistant/main.py'],
    pathex=[str(project_root), str(project_root / 'dominus-core')],
    binaries=[],
    datas=[
        ('dominus-assistant/core/prompt.txt', 'core'),
        ('dominus-assistant/actions', 'actions'),
        ('ui', 'ui'),
    ],
    hiddenimports=[
        'PySide6.QtWebEngineWidgets',
        'nicegui',
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'psycopg2',
        'cv2',
        'sounddevice',
        'google.genai',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='DominusOS',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='dominus-assistant/config/dominus.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='DominusOS',
)
