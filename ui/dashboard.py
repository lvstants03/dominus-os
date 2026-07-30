from nicegui import ui
import logging

logger = logging.getLogger(__name__)

def build_dashboard():
    """Xay dung bo cuc giao dien chinh cua DOMINUS OS Dashboard theo DESIGN.md"""
    
    ui.add_head_html("""
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&family=Geist:wght@400;600&display=swap');
            
            body {
                background-color: #131313;
                color: #e5e2e1;
                font-family: 'Geist', sans-serif;
            }
            .glass-panel {
                background: rgba(14, 14, 14, 0.65);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(212, 175, 55, 0.15);
                border-radius: 4px;
            }
            .glass-panel-heavy {
                background: rgba(14, 14, 14, 0.85);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(212, 175, 55, 0.25);
                border-radius: 6px;
            }
            .gold-border {
                border-color: rgba(212, 175, 55, 0.25);
            }
            .gold-text {
                color: #D4AF37;
                font-family: 'Space Grotesk', sans-serif;
            }
            .gold-glow {
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.08);
            }
            .font-title {
                font-family: 'Space Grotesk', sans-serif;
            }
            .font-mono-lbl {
                font-family: 'JetBrains Mono', monospace;
            }
            /* Custom Scrollbar */
            ::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            ::-webkit-scrollbar-track {
                background: #131313;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(212, 175, 55, 0.2);
                border-radius: 2px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(212, 175, 55, 0.4);
            }
        </style>
    """, shared=True)

    @ui.page('/')
    def main_page():
        state = {'active_tab': 'analytics'}
        
        with ui.header().classes('bg-[#0e0e0e]/95 border-b border-[#D4AF37]/15 py-4 px-6 items-center justify-between gold-glow'):
            with ui.row().classes('items-center gap-3'):
                ui.icon('memory', color='amber-500').classes('text-2xl')
                with ui.column().classes('gap-0'):
                    ui.label('DOMINUS OS').classes('font-bold text-lg tracking-widest gold-text')
                    ui.label('Central Executive Node').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-wider uppercase')
            
            with ui.row().classes('items-center gap-4 font-mono-lbl text-xs'):
                with ui.row().classes('items-center gap-1.5'):
                    ui.label('SYSTEM:').classes('text-[#99907c]')
                    ui.label('ACTIVE / SECURED').classes('text-green-400 font-bold')
                    ui.badge().classes('w-2 h-2 rounded-full bg-green-500 animate-pulse')

        # Main Layout
        with ui.row().classes('w-full h-[calc(100vh-80px)] p-6 gap-6 no-wrap'):
            # Sidebar
            with ui.column().classes('w-64 shrink-0 h-full justify-between gap-6'):
                with ui.column().classes('w-full glass-panel p-4 gap-2'):
                    ui.label('EXECUTIVE NAVIGATION').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-widest uppercase mb-2 px-2')
                    
                    btn_analytics = ui.button('Analytics', icon='analytics') \
                        .classes('w-full justify-start text-xs font-mono-lbl font-bold tracking-wider py-3')
                    btn_trading = ui.button('Mock Trading', icon='query_stats') \
                        .classes('w-full justify-start text-xs font-mono-lbl font-bold tracking-wider py-3')
                    btn_config = ui.button('AI Assistant', icon='psychology') \
                        .classes('w-full justify-start text-xs font-mono-lbl font-bold tracking-wider py-3')
                    btn_services = ui.button('Service Logs', icon='terminal') \
                        .classes('w-full justify-start text-xs font-mono-lbl font-bold tracking-wider py-3')
                
                # Wallet & Quick status
                with ui.column().classes('w-full glass-panel p-4 gap-3'):
                    with ui.row().classes('items-center gap-2 gold-text'):
                        ui.icon('account_balance_wallet')
                        ui.label('WALLET BALANCE').classes('text-[10px] font-mono-lbl font-bold tracking-widest')
                    with ui.column().classes('gap-0'):
                        self_balance = ui.label('Loading...').classes('text-xl font-bold text-[#e5e2e1] font-title')
            
            # Content container
            with ui.column().classes('grow h-full overflow-hidden'):
                panel_analytics = ui.column().classes('w-full h-full overflow-y-auto gap-4')
                panel_trading = ui.column().classes('w-full h-full overflow-y-auto gap-4')
                panel_config = ui.column().classes('w-full h-full overflow-y-auto gap-4')
                panel_services = ui.column().classes('w-full h-full overflow-y-auto gap-4')
                
                # Load pages
                from ui.pages.analytics import render_analytics
                from ui.pages.trading import render_trading
                from ui.pages.config import render_config
                from ui.pages.services import render_services
                
                render_analytics(panel_analytics)
                render_trading(panel_trading)
                render_config(panel_config)
                render_services(panel_services)
                
                # Switch tab logic
                def switch_tab(tab_name):
                    state['active_tab'] = tab_name
                    panel_analytics.set_visibility(tab_name == 'analytics')
                    panel_trading.set_visibility(tab_name == 'trading')
                    panel_config.set_visibility(tab_name == 'config')
                    panel_services.set_visibility(tab_name == 'services')
                    
                    for btn, name in [
                        (btn_analytics, 'analytics'),
                        (btn_trading, 'trading'),
                        (btn_config, 'config'),
                        (btn_services, 'services')
                    ]:
                        if name == tab_name:
                            btn.props('flat=false color=amber-500')
                            btn.classes('text-black')
                        else:
                            btn.props('flat=true color=white')
                            btn.classes('text-[#99907c]')
                
                btn_analytics.on('click', lambda: switch_tab('analytics'))
                btn_trading.on('click', lambda: switch_tab('trading'))
                btn_config.on('click', lambda: switch_tab('config'))
                btn_services.on('click', lambda: switch_tab('services'))
                
                # Default tab
                switch_tab('analytics')
                
                # Auto update balance
                async def update_balance():
                    try:
                        import httpx
                        async with httpx.AsyncClient() as client:
                            res = await client.get('http://127.0.0.1:8000/api/balance')
                            if res.status_code == 200:
                                data = res.json()
                                balances_data = data.get("balances", {})
                                real = balances_data.get("real_balance", 0.0)
                                demo = balances_data.get("demo_balance", 0.0)
                                self_balance.text = f"{real:,.0f} VND"
                            else:
                                self_balance.text = "0 VND"
                    except Exception:
                        self_balance.text = "0 VND"
                
                ui.timer(3.0, update_balance)
