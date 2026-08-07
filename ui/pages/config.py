import sys
from pathlib import Path

# Đảm bảo dominus-core nằm trong sys.path để import src
_file_path = Path(__file__).resolve()
_project_root = _file_path.parent.parent.parent
_dominus_core = _project_root / "dominus-core"
if _dominus_core.exists() and str(_dominus_core) not in sys.path:
    sys.path.insert(0, str(_dominus_core))
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from nicegui import ui
import logging
import httpx
from src.database.connection import get_db_session
from src.database.models.assistant import DominusAssistantConfig

logger = logging.getLogger(__name__)

def get_config():
    """Doc cau hinh Dominus Assistant tu PostgreSQL"""
    try:
        with get_db_session() as session:
            cfg = session.query(DominusAssistantConfig).first()
            if not cfg:
                cfg = DominusAssistantConfig(
                    gemini_api_key="",
                    assistant_name="DOMINUS",
                    assistant_voice="Charon",
                    user_name="Sir",
                    ui_color="#00d4ff",
                    briefing_enabled=True
                )
                session.add(cfg)
                session.commit()
                session.refresh(cfg)
            return {
                "gemini_api_key": cfg.gemini_api_key or "",
                "assistant_name": cfg.assistant_name,
                "assistant_voice": cfg.assistant_voice,
                "user_name": cfg.user_name,
                "ui_color": cfg.ui_color,
                "briefing_enabled": cfg.briefing_enabled
            }
    except Exception as e:
        logger.error(f"Error loading assistant config: {e}")
        return {
            "gemini_api_key": "",
            "assistant_name": "DOMINUS",
            "assistant_voice": "Charon",
            "user_name": "Sir",
            "ui_color": "#00d4ff",
            "briefing_enabled": True
        }

def save_config(data):
    """Luu cau hinh xuong PostgreSQL va ghi file cuc bo api_keys.json"""
    try:
        with get_db_session() as session:
            cfg = session.query(DominusAssistantConfig).first()
            if not cfg:
                cfg = DominusAssistantConfig()
                session.add(cfg)
            
            cfg.gemini_api_key = data["gemini_api_key"]
            cfg.assistant_name = data["assistant_name"]
            cfg.assistant_voice = data["assistant_voice"]
            cfg.user_name = data["user_name"]
            cfg.ui_color = data["ui_color"]
            cfg.briefing_enabled = data["briefing_enabled"]
            session.commit()
            
        try:
            import json
            import os
            from pathlib import Path
            config_dir = Path.home() / ".gemini" / "antigravity-ide"
            os.makedirs(config_dir, exist_ok=True)
            api_file = config_dir / "api_keys.json"
            
            local_data = {
                "gemini_api_key": data["gemini_api_key"],
                "assistant_name": data["assistant_name"],
                "assistant_voice": data["assistant_voice"],
                "user_name": data["user_name"],
                "ui_color": data["ui_color"],
                "os_system": "Windows"
            }
            api_file.write_text(json.dumps(local_data, indent=4), encoding="utf-8")
        except Exception as ex:
            logger.error(f"Error saving local config: {ex}")
            
        return True
    except Exception as e:
        logger.error(f"Error saving assistant config: {e}")
        return False

def render_config(container: ui.column):
    """Render trang cau hinh he thong (AI Assistant & MarkovBrain Bot)"""
    cfg_data = get_config()

    with container:
        ui.label('SYSTEM CONFIGURATION').classes('text-sm font-mono-lbl tracking-widest gold-text font-bold mb-2')
        
        # Tabs navigation
        with ui.tabs().classes('w-full border-b border-[#D4AF37]/15') as tabs:
            tab_assistant = ui.tab('AI Assistant').classes('text-xs font-mono-lbl text-[#99907c]')
            tab_bot = ui.tab('MarkovBrain Bot').classes('text-xs font-mono-lbl text-[#99907c]')
            
        with ui.tab_panels(tabs, value=tab_assistant).classes('w-full bg-transparent p-0 mt-4'):
            
            # PANEL 1: AI ASSISTANT
            with ui.tab_panel(tab_assistant).classes('p-0 gap-4'):
                with ui.column().classes('w-full glass-panel p-6 gap-4'):
                    # 1. API key & Identity
                    with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                        ui.label('Gemini API Key').classes('text-xs font-mono-lbl w-32')
                        api_key_input = ui.input(value=cfg_data["gemini_api_key"], password=True, password_toggle_button=True) \
                            .classes('grow font-mono-lbl').props('dense outlined color=amber-500 placeholder="AIza..."')

                    with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                        ui.label('Assistant Name').classes('text-xs font-mono-lbl w-32')
                        name_input = ui.input(value=cfg_data["assistant_name"]) \
                            .classes('grow font-mono-lbl').props('dense outlined color=amber-500')

                    with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                        ui.label('User Name (Address)').classes('text-xs font-mono-lbl w-32')
                        user_name_input = ui.input(value=cfg_data["user_name"]) \
                            .classes('grow font-mono-lbl').props('dense outlined color=amber-500')

                    # 2. Voice & UI Theme
                    with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                        ui.label('Assistant Voice').classes('text-xs font-mono-lbl w-32')
                        voice_select = ui.select(
                            options=['Charon', 'Puck', 'Kore', 'Fenrir', 'Aoede'],
                            value=cfg_data["assistant_voice"]
                        ).classes('grow font-mono-lbl').props('dense outlined color=amber-500')

                    with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                        ui.label('UI Theme Color (Hex)').classes('text-xs font-mono-lbl w-32')
                        color_input = ui.input(value=cfg_data["ui_color"]) \
                            .classes('grow font-mono-lbl').props('dense outlined color=amber-500 placeholder="#d4af37"')

                    # 3. Settings
                    with ui.row().classes('w-full items-center justify-between'):
                        ui.label('Kich hoat Morning Briefing').classes('text-xs font-mono-lbl')
                        briefing_switch = ui.switch(value=cfg_data["briefing_enabled"]).props('color=amber-500')

                    # Nut luu cau hinh
                    with ui.row().classes('w-full justify-end gap-3 mt-4'):
                        def trigger_shortcut():
                            try:
                                import os
                                flag_path = os.path.join(os.path.dirname(__file__), "..", "dominus-assistant", "config", "trigger_shortcut.flag")
                                os.makedirs(os.path.dirname(flag_path), exist_ok=True)
                                with open(flag_path, "w") as f:
                                    f.write("trigger")
                                ui.notify('Da gui yeu cau tao Shortcut len Windows Desktop', type='positive')
                            except Exception as e:
                                ui.notify(f'Gui yeu cau that bai: {e}', type='negative')
                        
                        ui.button('Create Desktop Icon', icon='shortcut', on_click=trigger_shortcut) \
                            .classes('font-mono-lbl text-xs py-2').props('flat color=amber-500')

                        def on_save():
                            data = {
                                "gemini_api_key": api_key_input.value,
                                "assistant_name": name_input.value,
                                "assistant_voice": voice_select.value,
                                "user_name": user_name_input.value,
                                "ui_color": color_input.value,
                                "briefing_enabled": briefing_switch.value
                            }
                            if save_config(data):
                                ui.notify('Da luu cau hinh thanh cong', type='positive')
                            else:
                                ui.notify('Luu cau hinh that bai', type='negative')

                        ui.button('Save Settings', icon='save', on_click=on_save) \
                            .classes('font-mono-lbl text-xs text-black py-2').props('color=amber-500')

            # PANEL 2: MARKOV BRAIN BOT
            with ui.tab_panel(tab_bot).classes('p-0 gap-4'):
                with ui.column().classes('w-full gap-4'):
                    
                    # 1. Cấu hình game & kết nối
                    with ui.column().classes('w-full glass-panel p-6 gap-4'):
                        ui.label('LOTTERY GAME & WEBSOCKET SETUP').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                        
                        # Chọn game xổ số
                        with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                            ui.label('Tro choi Active').classes('text-xs font-mono-lbl w-32')
                            lottery_select = ui.select(
                                options={
                                    'pmb45s': 'Mien Bac 45s (ID: 43)',
                                    'pmb75s': 'Mien Bac 75s (ID: 44)',
                                    'pmb5p': 'Mien Bac 5 phut (ID: 45)'
                                },
                                value='pmb45s'
                            ).classes('grow font-mono-lbl').props('dense outlined color=amber-500')

                        # WebSocket Token
                        with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                            ui.label('Token dang nhap').classes('text-xs font-mono-lbl w-32')
                            token_input = ui.input() \
                                .classes('grow font-mono-lbl').props('dense outlined color=amber-500 placeholder="Nhap token hoac full URL WebSocket"')

                        # Cookie & CF Auth Token
                        with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                            ui.label('cf-auth-token').classes('text-xs font-mono-lbl w-32')
                            cf_token_input = ui.input() \
                                .classes('grow font-mono-lbl').props('dense outlined color=amber-500 placeholder="Dung cho HTTP fetcher"')
                                
                        with ui.row().classes('w-full gap-4 items-center justify-between no-wrap'):
                            ui.label('Browser Cookie').classes('text-xs font-mono-lbl w-32')
                            cookie_input = ui.input() \
                                .classes('grow font-mono-lbl').props('dense outlined color=amber-500 placeholder="Cookie de fetch so du user"')

                        # Các nút hành động game/connection
                        with ui.row().classes('w-full justify-end gap-3 mt-2'):
                            async def on_reconnect():
                                try:
                                    async with httpx.AsyncClient() as client:
                                        res = await client.post('http://127.0.0.1:8000/api/reconnect')
                                        if res.status_code == 200:
                                            ui.notify('Da phat lenh Reconnect WebSocket!', type='info')
                                except Exception as e:
                                    ui.notify(f'Khong the ket noi API: {e}', type='negative')

                            async def on_force_fetch():
                                try:
                                    async with httpx.AsyncClient() as client:
                                        res = await client.post('http://127.0.0.1:8000/api/trigger-fetch')
                                        if res.status_code == 200:
                                            ui.notify(res.json().get("message", "Da fetch thanh cong!"), type='positive')
                                except Exception as e:
                                    ui.notify(f'Force fetch that bai: {e}', type='negative')

                            async def on_save_bot_conn():
                                try:
                                    async with httpx.AsyncClient() as client:
                                        # 1. Update Game Lottery
                                        game_map = {
                                            'pmb45s': 43,
                                            'pmb75s': 44,
                                            'pmb5p': 45
                                        }
                                        l_code = lottery_select.value
                                        l_id = game_map.get(l_code, 43)
                                        await client.post('http://127.0.0.1:8000/api/config-lottery', json={
                                            "lottery_id": l_id,
                                            "lottery_code": l_code
                                        })
                                        
                                        # 2. Update Token
                                        if token_input.value:
                                            await client.post('http://127.0.0.1:8000/api/config-token', json={
                                                "token": token_input.value.strip(),
                                                "cf_auth_token": cf_token_input.value.strip() if cf_token_input.value else None,
                                                "cookie": cookie_input.value.strip() if cookie_input.value else None
                                            })
                                        ui.notify('Da cap nhat cau hinh game va token ket noi!', type='positive')
                                except Exception as e:
                                    ui.notify(f'Luu that bai: {e}', type='negative')

                            ui.button('Reconnect WS', icon='wifi', on_click=on_reconnect) \
                                .classes('font-mono-lbl text-xs py-2').props('flat color=amber-500')
                            ui.button('Force Fetch Sync', icon='download', on_click=on_force_fetch) \
                                .classes('font-mono-lbl text-xs py-2').props('flat color=amber-500')
                            ui.button('Save Connection', icon='save', on_click=on_save_bot_conn) \
                                .classes('font-mono-lbl text-xs text-black py-2').props('color=amber-500')

                    # 2. Presets Manager (Algorithm Presets)
                    with ui.column().classes('w-full glass-panel p-6 gap-4'):
                        ui.label('ALGORITHM PRESETS MANAGER').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                        
                        presets_select = ui.select(options=[], label='Chọn Preset').classes('grow font-mono-lbl').props('dense outlined color=amber-500')
                        
                        async def fetch_presets():
                            try:
                                async with httpx.AsyncClient() as client:
                                    res = await client.get('http://127.0.0.1:8000/api/config/presets')
                                    if res.status_code == 200:
                                        presets = res.json().get("presets", [])
                                        presets_select.options = {p: p for p in presets}
                                        if presets:
                                            if not presets_select.value or presets_select.value not in presets:
                                                presets_select.value = presets[0]
                                        presets_select.update()
                            except Exception as e:
                                logger.error(f"Error fetching presets list: {e}")
                                
                        async def on_activate_preset():
                            if not presets_select.value:
                                ui.notify('Vui lòng chọn một preset để kích hoạt!', type='warning')
                                return
                            try:
                                async with httpx.AsyncClient() as client:
                                    res = await client.post(f'http://127.0.0.1:8000/api/config/presets/{presets_select.value}/activate')
                                    if res.status_code == 200:
                                        ui.notify(f'Đã kích hoạt Preset {presets_select.value}!', type='positive')
                                        await fetch_bot_config()
                                    else:
                                        ui.notify('Kích hoạt Preset thất bại!', type='negative')
                            except Exception as e:
                                ui.notify(f'Lỗi kết nối API: {e}', type='negative')
                                
                        async def on_delete_preset():
                            if not presets_select.value:
                                return
                            if presets_select.value == 'default':
                                ui.notify('Không thể xóa preset default!', type='warning')
                                return
                            try:
                                async with httpx.AsyncClient() as client:
                                    res = await client.delete(f'http://127.0.0.1:8000/api/config/presets/{presets_select.value}')
                                    if res.status_code == 200:
                                        ui.notify(f'Đã xóa Preset {presets_select.value}!', type='positive')
                                        await fetch_presets()
                                    else:
                                        ui.notify('Xóa Preset thất bại!', type='negative')
                            except Exception as e:
                                ui.notify(f'Lỗi kết nối API: {e}', type='negative')

                        with ui.row().classes('w-full justify-between items-center gap-2'):
                            ui.button('Kích hoạt Preset', icon='play_arrow', on_click=on_activate_preset) \
                                .classes('font-mono-lbl text-xs py-2 text-black').props('color=amber-500')
                            ui.button('Xóa Preset', icon='delete', on_click=on_delete_preset) \
                                .classes('font-mono-lbl text-xs py-2').props('flat color=red-500')

                        ui.label('LƯU PRESET MỚI').classes('text-[9px] font-mono-lbl text-[#99907c] mt-2')
                        with ui.row().classes('w-full items-center gap-4 no-wrap'):
                            new_preset_name = ui.input(placeholder='Tên preset mới').classes('grow font-mono-lbl').props('dense outlined color=amber-500')
                            
                            async def on_save_new_preset():
                                name = (new_preset_name.value or "").strip()
                                if not name:
                                    ui.notify('Vui lòng nhập tên preset!', type='warning')
                                    return
                                try:
                                    async with httpx.AsyncClient() as client:
                                        res_curr = await client.get('http://127.0.0.1:8000/api/config')
                                        if res_curr.status_code == 200:
                                            curr_data = res_curr.json()
                                            p_cfg = curr_data.get("parity_config", {})
                                            s_cfg = curr_data.get("size_config", {})
                                            
                                            # Update params snapshot
                                            for k, inp in ai_inputs.items():
                                                if inp.value is not None:
                                                    p_cfg[k] = inp.value
                                                    s_cfg[k] = inp.value
                                                    
                                            res_save = await client.post('http://127.0.0.1:8000/api/config/save-preset', json={
                                                "preset_name": name,
                                                "parity_config": p_cfg,
                                                "size_config": s_cfg
                                            })
                                            if res_save.status_code == 200:
                                                ui.notify(f'Đã lưu Preset "{name}" thành công!', type='positive')
                                                new_preset_name.value = ""
                                                await fetch_presets()
                                            else:
                                                ui.notify('Lưu preset thất bại!', type='negative')
                                except Exception as e:
                                    ui.notify(f'Lỗi kết nối API: {e}', type='negative')
                                    
                            ui.button('Lưu preset', icon='save', on_click=on_save_new_preset) \
                                .classes('font-mono-lbl text-xs py-2 text-black').props('color=amber-500')

                    # 3. Cấu hình thuật toán AI (37 tham số chia theo 7 Expansion Panels)
                    with ui.column().classes('w-full glass-panel p-6 gap-4'):
                        ui.label('AI ANALYZER ALGORITHM PARAMETERS (37 PARAMETERS)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                        
                        ai_inputs = {}

                        # PANEL 1: Sliding & AR Windows
                        with ui.expansion('1. Sliding & AR Windows', icon='view_week').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Sliding Min').classes('text-xs w-28 text-[#99907c]')
                                        ai_inputs["n_sliding_min"] = ui.number(value=30).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Sliding Max').classes('text-xs w-28 text-[#99907c]')
                                        ai_inputs["n_sliding_max"] = ui.number(value=120).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Sliding Ratio').classes('text-xs w-28 text-[#99907c]')
                                        ai_inputs["n_sliding_ratio"] = ui.number(value=0.15, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('AR Window Min').classes('text-xs w-28 text-[#99907c]')
                                        ai_inputs["ar_window_min"] = ui.number(value=15).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('AR Window Max').classes('text-xs w-28 text-[#99907c]')
                                        ai_inputs["ar_window_max"] = ui.number(value=60).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('AR Window Ratio').classes('text-xs w-28 text-[#99907c]')
                                        ai_inputs["ar_window_ratio"] = ui.number(value=0.10, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # PANEL 2: AR Thresholds
                        with ui.expansion('2. Auto-Regressive Thresholds', icon='trending_up').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('AR Thresh Multiplier').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["ar_threshold_multiplier"] = ui.number(value=1.5, step=0.1).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('AR Thresh Min').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["ar_threshold_min"] = ui.number(value=0.02, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('AR Thresh Max').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["ar_threshold_max"] = ui.number(value=0.15, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # PANEL 3: Recent Samples & Streaks
                        with ui.expansion('3. Recent Samples & Streaks', icon='repeat').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Recent Min').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["n_recent_min"] = ui.number(value=5).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Recent Max').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["n_recent_max"] = ui.number(value=20).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Recent Ratio').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["n_recent_ratio"] = ui.number(value=0.10, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Streak Thresh').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["streak_confidence_threshold"] = ui.number(value=68).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Streak Min Samples').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["streak_min_samples"] = ui.number(value=3).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Streak Safety Trap Mult').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["streak_safety_trap_multiplier"] = ui.number(value=1.5, step=0.1).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Streak Safety Trap Min').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["streak_safety_trap_min"] = ui.number(value=0.05, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # PANEL 4: Saturation & Win/Loss Limits
                        with ui.expansion('4. Saturation & Win/Loss Limits', icon='speed').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Saturation Percentile').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["saturation_percentile"] = ui.number(value=90).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Saturation Limit Min').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["saturation_limit_min"] = ui.number(value=0.01, step=0.001).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Saturation Limit Max').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["saturation_limit_max"] = ui.number(value=0.05, step=0.001).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Cooling Off Loss Limit').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["cooling_off_loss_limit"] = ui.number(value=3).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Win Streak Pause Limit').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["win_streak_pause_limit"] = ui.number(value=5).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # PANEL 5: Buying Thresholds
                        with ui.expansion('5. Buying Thresholds', icon='shopping_cart').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Buy Thresh Mult').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["buy_threshold_multiplier"] = ui.number(value=1.0, step=0.1).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Buy Thresh Min').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["buy_threshold_min"] = ui.number(value=0.52, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Buy Thresh Max').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["buy_threshold_max"] = ui.number(value=0.95, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Min Prob Thresh').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["min_probability_threshold"] = ui.number(value=0.55, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # PANEL 6: Moving Average & Filters
                        with ui.expansion('6. Moving Average & Filters', icon='filter_alt').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('MA50 Window').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["ma50_window"] = ui.number(value=50).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center'):
                                        ui.label('Kich hoat bo loc MA50').classes('text-xs text-[#99907c]')
                                        ai_inputs["ma50_filter_active"] = ui.switch().props('color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('WR Filter Window').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["win_rate_filter_window"] = ui.number(value=15).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('WR Filter Min Total').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["win_rate_filter_min_total"] = ui.number(value=5).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('WR Filter Threshold').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["win_rate_filter_threshold"] = ui.number(value=0.55, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # PANEL 7: Reversal, Volatility & Regimes
                        with ui.expansion('7. Reversal, Volatility & Regimes', icon='psychology').classes('w-full border border-[#D4AF37]/10 rounded bg-[#0e0e0e]/20 text-xs font-mono-lbl'):
                            with ui.row().classes('w-full p-4 gap-6 no-wrap'):
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Reversal Thresh').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["reversal_threshold"] = ui.number(value=0.68, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Volatility Penalty').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["volatility_penalty"] = ui.number(value=0.05, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center'):
                                        ui.label('Che do Song (Oscillate)').classes('text-xs text-[#99907c]')
                                        ai_inputs["oscillation_mode"] = ui.switch().props('color=amber-500')
                                with ui.column().classes('grow gap-2'):
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Min Streak To Reverse').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["min_streak_to_reverse"] = ui.number(value=3).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Streak Bonus Mult').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["streak_bonus_multiplier"] = ui.number(value=0.10, step=0.01).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center'):
                                        ui.label('Tu dong dieu chinh nguong').classes('text-xs text-[#99907c]')
                                        ai_inputs["dynamic_threshold_adjustment"] = ui.switch().props('color=amber-500')
                                    with ui.row().classes('w-full justify-between items-center no-wrap'):
                                        ui.label('Dynamic WR Window').classes('text-xs w-36 text-[#99907c]')
                                        ai_inputs["dynamic_win_rate_window"] = ui.number(value=30).classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')

                        # Nút Save preset
                        with ui.row().classes('w-full justify-end gap-3 mt-4'):
                            async def on_save_ai_preset():
                                try:
                                    async with httpx.AsyncClient() as client:
                                        # Lấy config hiện tại để mixin
                                        res_curr = await client.get('http://127.0.0.1:8000/api/config')
                                        if res_curr.status_code == 200:
                                            curr_data = res_curr.json()
                                            p_cfg = curr_data.get("parity_config", {})
                                            s_cfg = curr_data.get("size_config", {})
                                            
                                            # Update các trường thay đổi từ input vào cả 2 config parity và size
                                            for key, input_widget in ai_inputs.items():
                                                val = input_widget.value
                                                if val is not None:
                                                    p_cfg[key] = val
                                                    s_cfg[key] = val
                                            
                                            # Gửi lên API lưu preset
                                            res_save = await client.post('http://127.0.0.1:8000/api/config/save-preset', json={
                                                "preset_name": "default",
                                                "parity_config": p_cfg,
                                                "size_config": s_cfg
                                            })
                                            
                                            if res_save.status_code == 200:
                                                ui.notify('Da luu preset tham so thuat toan AI thanh cong!', type='positive')
                                            else:
                                                err_msg = res_save.json().get("detail", "Luu that bai")
                                                ui.notify(f'Loi backend: {err_msg}', type='negative')
                                except Exception as e:
                                    ui.notify(f'Khong the ket noi API: {e}', type='negative')

                            ui.button('Save AI Preset', icon='save', on_click=on_save_ai_preset) \
                                .classes('font-mono-lbl text-xs text-black py-2').props('color=amber-500')

                    # 4. Lịch sử kết nối WebSocket
                    with ui.column().classes('w-full glass-panel p-6 gap-2 mt-4'):
                        ui.label('WEBSOCKET CONNECTION LOGS (LATEST 30)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                        socket_logs_container = ui.column().classes('w-full gap-1 max-h-48 overflow-y-auto font-mono-lbl text-[11px] bg-[#0e0e0e]/30 p-2 border border-[#D4AF37]/5 rounded')

                    # 5. Developer Control Panel (Mock Draw & Import)
                    with ui.column().classes('w-full glass-panel p-6 gap-4 mt-4'):
                        ui.label('DEVELOPER & DATA CONTROL').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                        
                        # Mock Draw
                        ui.label('MOCK DRAW (KỲ QUAY GIẢ LẬP)').classes('text-[9px] font-mono-lbl text-[#99907c]')
                        with ui.row().classes('w-full items-center gap-4 no-wrap'):
                            mock_issue = ui.input(placeholder='Mã kỳ quay (ví dụ: 20260730001)').classes('grow font-mono-lbl').props('dense outlined color=amber-500')
                            mock_numbers = ui.input(placeholder='5 số mở thưởng (ví dụ: 1,2,3,4,5)').classes('grow font-mono-lbl').props('dense outlined color=amber-500')
                            
                            async def on_mock_draw():
                                issue = (mock_issue.value or "").strip()
                                num_str = (mock_numbers.value or "").strip()
                                if not issue or not num_str:
                                    ui.notify('Vui lòng điền đầy đủ thông tin kỳ quay và số mở thưởng!', type='warning')
                                    return
                                try:
                                    nums = [int(n.strip()) for n in num_str.split(',') if n.strip().isdigit()]
                                    if len(nums) != 5:
                                        ui.notify('Vui lòng nhập đúng 5 số, phân tách bằng dấu phẩy!', type='warning')
                                        return
                                    async with httpx.AsyncClient() as client:
                                        res = await client.post('http://127.0.0.1:8000/api/mock-draw', json={
                                            "issue": issue,
                                            "numbers": nums
                                        })
                                        if res.status_code == 200:
                                            ui.notify('Đã gửi kỳ quay giả lập thành công!', type='positive')
                                            mock_issue.value = ""
                                            mock_numbers.value = ""
                                        else:
                                            ui.notify(f"Mock draw thất bại: {res.json().get('detail')}", type='negative')
                                except Exception as e:
                                    ui.notify(f'Lỗi kết nối API: {e}', type='negative')
                                    
                            ui.button('Mock', icon='add', on_click=on_mock_draw) \
                                .classes('font-mono-lbl text-xs py-2 text-black').props('color=amber-500')
                                
                        # Import History
                        ui.label('IMPORT HISTORY JSON (DÁN LỊCH SỬ TỪ NETWORK)').classes('text-[9px] font-mono-lbl text-[#99907c] mt-2')
                        import_textarea = ui.textarea(placeholder='Dán payload JSON lịch sử kỳ quay số tại đây...').classes('w-full font-mono-lbl text-xs bg-[#0e0e0e]/50 border border-[#D4AF37]/15 rounded p-2')
                        
                        async def on_import_history():
                            raw_json = (import_textarea.value or "").strip()
                            if not raw_json:
                                return
                            try:
                                import json
                                payload = json.loads(raw_json)
                                async with httpx.AsyncClient() as client:
                                    res = await client.post('http://127.0.0.1:8000/api/import-history', json=payload)
                                    if res.status_code == 200:
                                        result = res.json()
                                        ui.notify(f"Đã import thành công {result.get('imported_records', 0)} kỳ quay mới!", type='positive')
                                        import_textarea.value = ""
                                    else:
                                        ui.notify('Import thất bại!', type='negative')
                            except Exception as e:
                                ui.notify(f'Dữ liệu JSON không hợp lệ hoặc lỗi kết nối: {e}', type='negative')
                                
                        ui.button('Import History Data', icon='file_upload', on_click=on_import_history) \
                            .classes('font-mono-lbl text-xs py-2 text-black w-full mt-2').props('color=amber-500')

        # Logic Load dữ liệu động cho Tab Bot khi được vẽ lần đầu
        async def fetch_bot_config():
            try:
                async with httpx.AsyncClient() as client:
                    # Load config kết nối & game
                    res_stats = await client.get('http://127.0.0.1:8000/api/statistics', timeout=2.0)
                    if res_stats.status_code == 200:
                        s_data = res_stats.json()
                        lottery_select.set_value(s_data.get("lottery_code", "pmb45s"))
                    
                    # Load config tham số AI
                    res_ai = await client.get('http://127.0.0.1:8000/api/config', timeout=2.0)
                    if res_ai.status_code == 200:
                        ai_data = res_ai.json()
                        p_cfg = ai_data.get("parity_config", {})
                        
                        # Điền giá trị vào các ô input (hỗ trợ cả number và switch/checkbox)
                        for key, input_widget in ai_inputs.items():
                            if key in p_cfg:
                                val = p_cfg[key]
                                if isinstance(input_widget, ui.switch):
                                    input_widget.set_value(bool(val))
                                else:
                                    input_widget.set_value(val)
            except Exception as e:
                logger.error(f"Error fetching bot config: {e}")

        # Logic Load Socket Connection Logs
        async def fetch_socket_logs():
            try:
                async with httpx.AsyncClient() as client:
                    res = await client.get('http://127.0.0.1:8000/api/socket/history?limit=30')
                    if res.status_code == 200:
                        logs_data = res.json().get("data", [])
                        socket_logs_container.clear()
                        if logs_data:
                            for log in logs_data:
                                l_time = log.get("time", "").split(" ")[-1] if " " in log.get("time", "") else log.get("time", "")
                                l_evt = log.get("event", "INFO").upper()
                                l_detail = log.get("details", "")
                                
                                color = "text-green-400"
                                if "ERROR" in l_evt or "FAIL" in l_evt or "DISCONNECT" in l_evt:
                                    color = "text-red-400 font-bold"
                                elif "WARN" in l_evt:
                                    color = "text-amber-500"
                                elif "INFO" in l_evt:
                                    color = "text-blue-400"
                                    
                                with socket_logs_container:
                                    with ui.row().classes('w-full no-wrap items-baseline gap-2 py-0.5 border-b border-[#D4AF37]/5'):
                                        ui.label(l_time).classes('text-[#99907c] shrink-0')
                                        ui.label(f"[{l_evt}]").classes(f'{color} shrink-0 text-[10px]')
                                        ui.label(l_detail).classes('text-[#e5e2e1] grow break-all')
                        else:
                            with socket_logs_container:
                                ui.label('Chua ghi nhan lich su ket noi WebSocket nao.').classes('text-[#99907c] italic')
            except Exception as e:
                logger.error(f"Error fetching socket logs: {e}")

        # Nạp dữ liệu cấu hình bot sau khi load giao diện
        ui.timer(0.2, fetch_bot_config, once=True)
        ui.timer(0.2, fetch_presets, once=True)
        ui.timer(10.0, fetch_presets)
        ui.timer(5.0, fetch_socket_logs)
        ui.timer(0.2, fetch_socket_logs, once=True)
