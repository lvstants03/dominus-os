from nicegui import ui
import os
import json
import time
import logging

logger = logging.getLogger(__name__)

def get_service_logs(service_name):
    """Doc 50 dong cuoi cua file log dich vu"""
    log_dir = os.path.join(os.path.dirname(__file__), "..", "logs")
    log_file = os.path.join(log_dir, f"{service_name}.log")
    if not os.path.exists(log_file):
        return f"System: No logs found for {service_name}. Log path does not exist."
    try:
        with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            return "".join(lines[-50:])
    except Exception as e:
        return f"Error reading logs: {e}"

def send_service_command(service, action):
    """Ghi lenh dieu khien dich vu vao file config de PySide6 App thuc thi"""
    try:
        config_dir = os.path.join(os.path.dirname(__file__), "..", "dominus-assistant", "config")
        os.makedirs(config_dir, exist_ok=True)
        cmd_file = os.path.join(config_dir, "service_control.json")
        
        cmd_data = {
            "service": service,
            "action": action,
            "timestamp": time.time()
        }
        with open(cmd_file, "w", encoding="utf-8") as f:
            json.dump(cmd_data, f)
        return True
    except Exception as e:
        logger.error(f"Error sending service command: {e}")
        return False

def render_services(container: ui.column):
    """Render trang quan ly va giam sat cac dich vu he thong"""
    with container:
        ui.label('SYSTEM SERVICES & EXECUTIVE LOGS').classes('text-sm font-mono-lbl tracking-widest gold-text font-bold mb-2')
        
        # Grid cac dich vu kem nut dieu khien
        with ui.row().classes('w-full gap-4 no-wrap'):
            # Markov Brain Card
            with ui.column().classes('grow glass-panel p-4 gap-2 justify-between'):
                with ui.row().classes('w-full justify-between items-center'):
                    ui.label('Markov Brain').classes('text-xs font-mono-lbl font-bold gold-text')
                    with ui.row().classes('items-center gap-1'):
                        ui.label('ONLINE').classes('text-[9px] text-green-400 font-mono-lbl')
                        ui.badge().classes('w-1.5 h-1.5 rounded-full bg-green-500')
                ui.label('Probability & Heuristics Analysis Node').classes('text-[9px] text-[#99907c]')
                
                with ui.row().classes('w-full gap-2 justify-end'):
                    ui.button('Restart', on_click=lambda: send_service_command('markov_brain', 'restart')) \
                        .classes('text-[10px] font-mono-lbl').props('dense outlined color=amber-500')
                    ui.button('Stop', on_click=lambda: send_service_command('markov_brain', 'stop')) \
                        .classes('text-[10px] font-mono-lbl').props('dense outlined color=red-500')

            # Dominus Core Card
            with ui.column().classes('grow glass-panel p-4 gap-2 justify-between'):
                with ui.row().classes('w-full justify-between items-center'):
                    ui.label('Dominus Core').classes('text-xs font-mono-lbl font-bold gold-text')
                    with ui.row().classes('items-center gap-1'):
                        ui.label('ONLINE').classes('text-[9px] text-green-400 font-mono-lbl')
                        ui.badge().classes('w-1.5 h-1.5 rounded-full bg-green-500')
                ui.label('FastAPI API Gateway & Auth Service').classes('text-[9px] text-[#99907c]')
                
                with ui.row().classes('w-full gap-2 justify-end'):
                    ui.button('Restart', on_click=lambda: send_service_command('backend', 'restart')) \
                        .classes('text-[10px] font-mono-lbl').props('dense outlined color=amber-500')

        # Panel hien thi Logs Console
        with ui.column().classes('w-full glass-panel p-4 gap-3 mt-4 grow'):
            with ui.row().classes('w-full justify-between items-center'):
                ui.label('CONSOLE OUTPUT LOGS').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                service_select = ui.select(
                    options=['markov_brain', 'backend'],
                    value='markov_brain'
                ).classes('w-40 font-mono-lbl').props('dense outlined color=amber-500')
            
            # Khung textarea log
            log_display = ui.textarea() \
                .classes('w-full font-mono-lbl text-[10px] text-[#D4AF37] h-64') \
                .props('readonly outlined fill-background=true')
            
            def update_log_view():
                log_display.value = get_service_logs(service_select.value)
            
            ui.timer(2.0, update_log_view)
