from nicegui import ui
import httpx
import logging
import time

logger = logging.getLogger(__name__)

def render_trading(container: ui.column):
    """Render giao dien trang Mock & Real Trading Console"""
    
    with container:
        ui.label('TRADING SYSTEM & EXECUTION').classes('text-sm font-mono-lbl tracking-widest gold-text font-bold mb-2')
        
        # Grid cac card thong tin nhanh
        with ui.row().classes('w-full gap-4 items-stretch no-wrap'):
            # Card tin hieu cược hien tai
            with ui.column().classes('grow glass-panel p-4 gap-2 justify-between w-1/2'):
                with ui.row().classes('w-full justify-between items-center'):
                    ui.label('LATEST AI BET SIGNAL').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-wider uppercase')
                    market_status_badge = ui.badge('STABLE', color='green-500').classes('text-[8px] font-mono-lbl')
                
                # Signal details
                with ui.column().classes('gap-1'):
                    issue_label = ui.label('Kỳ quay: --').classes('text-xs font-mono-lbl text-[#e5e2e1]')
                    with ui.row().classes('items-baseline gap-1'):
                        ui.label('Tài/Xỉu:').classes('text-xs text-[#99907c]')
                        size_decision_label = ui.label('BỎ QUA').classes('text-sm font-bold text-amber-500 font-title')
                        size_amount_label = ui.label('(-- VND)').classes('text-[10px] text-[#99907c] font-mono-lbl')
                    with ui.row().classes('items-baseline gap-1'):
                        ui.label('Chẵn/Lẻ:').classes('text-xs text-[#99907c]')
                        parity_decision_label = ui.label('BỎ QUA').classes('text-sm font-bold text-amber-500 font-title')
                        parity_amount_label = ui.label('(-- VND)').classes('text-[10px] text-[#99907c] font-mono-lbl')

            # Card so du Demo Balance
            with ui.column().classes('grow glass-panel p-4 gap-2 justify-between w-1/2'):
                ui.label('DEMO CAPITAL BALANCES').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-wider uppercase')
                
                with ui.column().classes('gap-0.5'):
                    demo_balance_lbl = ui.label('10,000,000 VND').classes('text-lg font-bold text-green-400 font-title')
                    demo_strategy_lbl = ui.label('Chiến thuật: Fixed').classes('text-[10px] text-[#99907c] font-mono-lbl')
                
                # Nut dieu khien nhanh capital
                with ui.row().classes('w-full gap-2'):
                    async def on_reset_demo():
                        try:
                            async with httpx.AsyncClient() as client:
                                res = await client.post('http://127.0.0.1:8000/api/balance/reset')
                                if res.status_code == 200:
                                    ui.notify('Đã reset số dư giả lập về 10M VND và xóa lịch sử!', type='positive')
                                    await fetch_trading_data()
                        except Exception as e:
                            ui.notify(f'Reset thất bại: {e}', type='negative')

                    async def on_clear_data():
                        try:
                            async with httpx.AsyncClient() as client:
                                res = await client.post('http://127.0.0.1:8000/api/balance/clear-bets')
                                if res.status_code == 200:
                                    ui.notify('Đã xóa sạch bộ nhớ tạm và nạp lại lịch sử mới!', type='positive')
                                    await fetch_trading_data()
                        except Exception as e:
                            ui.notify(f'Đồng bộ thất bại: {e}', type='negative')

                    ui.button('Reset Demo', icon='restart_alt', on_click=on_reset_demo) \
                        .classes('text-[10px] font-mono-lbl px-2 py-0.5').props('flat color=amber-500 dense')
                    ui.button('Sync Scraper', icon='sync', on_click=on_clear_data) \
                        .classes('text-[10px] font-mono-lbl px-2 py-0.5').props('flat color=amber-500 dense')

        # Panel Cau hinh Real va Demo
        with ui.row().classes('w-full gap-4 mt-4 items-stretch no-wrap'):
            # Cot 1: Real Auto Trading Config
            with ui.column().classes('grow glass-panel p-4 gap-3 w-1/2'):
                ui.label('REAL TRADING CONTROL').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                # Switch Auto Bet
                async def on_toggle_auto(e):
                    try:
                        async with httpx.AsyncClient() as client:
                            res = await client.post('http://127.0.0.1:8000/api/bet/toggle', json={"enabled": e.value})
                            if res.status_code == 200:
                                ui.notify(f"{'Bật' if e.value else 'Tắt'} Auto Bet thật thành công!", type='info')
                    except Exception as ex:
                        ui.notify(f'Lỗi kết nối API: {ex}', type='negative')

                with ui.row().classes('items-center justify-between w-full'):
                    ui.label('Kích hoạt Real Auto Bet').classes('text-xs font-mono-lbl text-[#e5e2e1]')
                    auto_bet_switch = ui.switch(on_change=on_toggle_auto).props('color=amber-500')

                # Input Tien Cuoc That
                async def on_save_real_config():
                    try:
                        async with httpx.AsyncClient() as client:
                            res = await client.post('http://127.0.0.1:8000/api/bet/config', json={
                                "amount": float(real_amount_input.value or 0.0),
                                "min_confidence": int(real_conf_input.value or 50)
                            })
                            if res.status_code == 200:
                                ui.notify('Đã cập nhật cấu hình Real Bet!', type='positive')
                    except Exception as ex:
                        ui.notify(f'Lỗi cập nhật Real Bet: {ex}', type='negative')

                with ui.row().classes('items-center justify-between w-full no-wrap gap-2'):
                    ui.label('Cược Real').classes('text-xs font-mono-lbl text-[#99907c]')
                    real_amount_input = ui.number(value=10000, suffix='VND').classes('w-28 font-mono-lbl').props('dense outlined color=amber-500')
                
                with ui.row().classes('items-center justify-between w-full no-wrap gap-2'):
                    ui.label('Confidence tối thiểu').classes('text-xs font-mono-lbl text-[#99907c]')
                    real_conf_input = ui.number(value=60, suffix='%').classes('w-20 font-mono-lbl').props('dense outlined color=amber-500')
                    
                ui.button('Save Real Config', icon='save', on_click=on_save_real_config) \
                    .classes('font-mono-lbl text-[10px] w-full py-1 text-black').props('color=amber-500 dense')

            # Cot 2: Demo Finance Config
            with ui.column().classes('grow glass-panel p-4 gap-3 w-1/2'):
                ui.label('DEMO FINANCE CONFIG').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                # Strategy selector
                async def on_save_demo_config():
                    try:
                        async with httpx.AsyncClient() as client:
                            res = await client.post('http://127.0.0.1:8000/api/balance/config', json={
                                "amount": float(demo_bet_input.value or 0.0),
                                "strategy": demo_strat_select.value,
                                "autotune_enabled": demo_autotune_switch.value
                            })
                            if res.status_code == 200:
                                ui.notify('Đã cập nhật cấu hình Demo!', type='positive')
                                await fetch_trading_data()
                    except Exception as ex:
                        ui.notify(f'Lỗi cập nhật Demo: {ex}', type='negative')

                with ui.row().classes('items-center justify-between w-full no-wrap gap-2'):
                    ui.label('Chiến thuật Demo').classes('text-xs font-mono-lbl text-[#99907c]')
                    demo_strat_select = ui.select(options={'fixed': 'Fixed'}, value='fixed').classes('grow font-mono-lbl').props('dense outlined color=amber-500')

                with ui.row().classes('items-center justify-between w-full no-wrap gap-2'):
                    ui.label('Cược cơ bản Demo').classes('text-xs font-mono-lbl text-[#99907c]')
                    demo_bet_input = ui.number(value=100000, suffix='VND').classes('w-28 font-mono-lbl').props('dense outlined color=amber-500')
                
                with ui.row().classes('items-center justify-between w-full'):
                    ui.label('Auto-tune parameters AI').classes('text-xs font-mono-lbl text-[#99907c]')
                    demo_autotune_switch = ui.switch().props('color=amber-500')

                ui.button('Save Demo Config', icon='save', on_click=on_save_demo_config) \
                    .classes('font-mono-lbl text-[10px] w-full py-1 text-black').props('color=amber-500 dense')

        # ─── PHẦN 2: BẢNG PHÂN TÍCH RỦI RO & QUẢN LÝ VỐN ───────────────────────────
        with ui.row().classes('w-full gap-4 mt-4 items-stretch no-wrap'):
            # Risk Parity Column
            with ui.column().classes('grow glass-panel p-4 gap-2 w-1/2'):
                ui.label('RISK PROFILE: PARITY (CHẴN LẺ)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                with ui.column().classes('w-full gap-1.5 text-xs font-mono-lbl mt-1'):
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Lượng cược kì tới').classes('text-[#99907c]')
                        parity_next_bet = ui.label('Loading...').classes('text-[#e5e2e1] font-bold')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Tỉ lệ cược / Số dư').classes('text-[#99907c]')
                        parity_pct = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Chuỗi thua (Hiện tại / Tối đa)').classes('text-[#99907c]')
                        parity_streak = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Tỉ lệ thắng trượt sử dụng').classes('text-[#99907c]')
                        parity_wr = ui.label('Loading...').classes('text-green-400')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Kỳ vọng toán học (EV / Lệnh)').classes('text-[#99907c]')
                        parity_ev = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Kỳ vọng Growth sau 100 kỳ').classes('text-[#99907c]')
                        parity_growth = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Trạng thái Cooling-off').classes('text-[#99907c]')
                        parity_cooling = ui.label('Bình thường').classes('text-green-400')

            # Risk Size Column
            with ui.column().classes('grow glass-panel p-4 gap-2 w-1/2'):
                ui.label('RISK PROFILE: SIZE (TÀI XỈU)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                with ui.column().classes('w-full gap-1.5 text-xs font-mono-lbl mt-1'):
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Lượng cược kì tới').classes('text-[#99907c]')
                        size_next_bet = ui.label('Loading...').classes('text-[#e5e2e1] font-bold')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Tỉ lệ cược / Số dư').classes('text-[#99907c]')
                        size_pct = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Chuỗi thua (Hiện tại / Tối đa)').classes('text-[#99907c]')
                        size_streak = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Tỉ lệ thắng trượt sử dụng').classes('text-[#99907c]')
                        size_wr = ui.label('Loading...').classes('text-green-400')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Kỳ vọng toán học (EV / Lệnh)').classes('text-[#99907c]')
                        size_ev = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Kỳ vọng Growth sau 100 kỳ').classes('text-[#99907c]')
                        size_growth = ui.label('Loading...').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Trạng thái Cooling-off').classes('text-[#99907c]')
                        size_cooling = ui.label('Bình thường').classes('text-green-400')

        # ─── PHẦN 3: BẢNG LỊCH SỬ CHÁY TÀI KHOẢN & TÓM TẮT HIỆU SUẤT ─────────────
        with ui.row().classes('w-full gap-4 mt-4 items-stretch no-wrap'):
            # Performance Summary Column
            with ui.column().classes('grow glass-panel p-4 gap-3 w-1/2'):
                ui.label('PERFORMANCE SUMMARY').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                with ui.column().classes('w-full gap-2 text-xs font-mono-lbl mt-1'):
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Tổng số cược giả lập').classes('text-[#99907c]')
                        summary_total = ui.label('0').classes('text-[#e5e2e1] font-bold')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Số cược Thắng / Thua').classes('text-[#99907c]')
                        summary_win_loss = ui.label('0W / 0L').classes('text-[#e5e2e1]')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Tỉ lệ thắng bình quân').classes('text-[#99907c]')
                        summary_win_rate = ui.label('0.0%').classes('text-green-400 font-bold')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Lợi nhuận ròng (Net Profit)').classes('text-[#99907c]')
                        summary_profit = ui.label('0 VND').classes('text-green-400 font-bold')
                    with ui.row().classes('w-full justify-between items-center'):
                        ui.label('Lợi nhuận đỉnh (Peak Profit)').classes('text-[#99907c]')
                        summary_peak = ui.label('0 VND').classes('text-amber-400')

            # Capital Collapses Column
            with ui.column().classes('grow glass-panel p-4 gap-3 w-1/2'):
                ui.label('CAPITAL COLLAPSES (LỊCH SỬ CHÁY TÀI KHOẢN)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                with ui.row().classes('w-full justify-between items-center px-2 py-1 bg-[#1a1a1a]/80 text-[10px] font-mono-lbl text-[#99907c] uppercase tracking-wider rounded'):
                    ui.label('Thời gian').classes('w-20')
                    ui.label('Số cược đạt được').classes('grow text-center')
                    ui.label('Số dư đỉnh').classes('w-24 text-right')
                    
                collapses_container = ui.column().classes('w-full gap-1 max-h-36 overflow-y-auto')

        # Bang lich su cuoc gia lap
        with ui.column().classes('w-full glass-panel p-4 gap-3 mt-4 grow'):
            ui.label('DEMO BETS HISTORY (RECENT 20)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
            demo_bets_container = ui.column().classes('w-full gap-2 grow overflow-y-auto max-h-72')

        async def fetch_trading_data():
            try:
                async with httpx.AsyncClient() as client:
                    # 1. Fetch next-action (latest signal)
                    res_signal = await client.get('http://127.0.0.1:8000/api/next-action', timeout=2.0)
                    if res_signal.status_code == 200:
                        sig_data = res_signal.json()
                        issue_label.set_text(f"Kỳ quay: #{sig_data.get('issue', '--')}")
                        
                        p_data = sig_data.get("parity", {})
                        p_dec = p_data.get("decision", "BỎ QUA")
                        p_amt = p_data.get("amount", 0.0)
                        parity_decision_label.set_text(p_dec)
                        parity_amount_label.set_text(f"({p_amt:,.0f} VND)" if p_amt > 0 else "")
                        parity_decision_label.classes(remove='text-green-400 text-red-400 text-amber-500')
                        if "MUA" in p_dec:
                            parity_decision_label.classes('text-green-400')
                        else:
                            parity_decision_label.classes('text-amber-500')

                        s_data = sig_data.get("size", {})
                        s_dec = s_data.get("decision", "BỎ QUA")
                        s_amt = s_data.get("amount", 0.0)
                        size_decision_label.set_text(s_dec)
                        size_amount_label.set_text(f"({s_amt:,.0f} VND)" if s_amt > 0 else "")
                        size_decision_label.classes(remove='text-green-400 text-red-400 text-amber-500')
                        if "MUA" in s_dec:
                            size_decision_label.classes('text-green-400')
                        else:
                            size_decision_label.classes('text-amber-500')

                    # 2. Fetch real status
                    res_status = await client.get('http://127.0.0.1:8000/api/bet/status', timeout=2.0)
                    if res_status.status_code == 200:
                        status_data = res_status.json()
                        auto_bet_switch.set_value(status_data.get("auto_bet_enabled", False))
                        real_amount_input.set_value(status_data.get("real_bet_amount", 10000.0))
                        real_conf_input.set_value(status_data.get("min_confidence", 60))

                    # 3. Fetch balances & demo history & money management info
                    res_balance = await client.get('http://127.0.0.1:8000/api/balance?limit=20', timeout=2.0)
                    if res_balance.status_code == 200:
                        bal_data = res_balance.json()
                        
                        # Update labels
                        balances = bal_data.get("balances", {})
                        demo_bal = balances.get("demo_balance", 10000000.0)
                        demo_balance_lbl.set_text(f"{demo_bal:,.0f} VND")
                        
                        strat_labels = bal_data.get("strategy_labels", {})
                        curr_strat = balances.get("demo_bet_strategy", "fixed")
                        strat_txt = strat_labels.get(curr_strat, curr_strat)
                        demo_strategy_lbl.set_text(f"Chiến thuật: {strat_txt}")
                        
                        # Setup Dropdown Options
                        if len(demo_strat_select.options) <= 1:
                            demo_strat_select.options = strat_labels
                            demo_strat_select.value = curr_strat
                            demo_strat_select.update()

                        demo_bet_input.set_value(balances.get("demo_bet_amount", 100000.0))
                        demo_autotune_switch.set_value(bal_data.get("autotune_enabled", True))

                        # Setup Market stability
                        next_bets = bal_data.get("next_bet_amounts", {})
                        p_streak_val = next_bets.get("parity_streak", 0)
                        s_streak_val = next_bets.get("size_streak", 0)
                        if p_streak_val >= 5 or s_streak_val >= 5:
                            market_status_badge.set_text('STREAK WARNING')
                            market_status_badge.props('color=red-500')
                        else:
                            market_status_badge.set_text('STABLE')
                            market_status_badge.props('color=green-500')

                        # ─── UPDATE RISK INFO PARITY ────────────────────────────────
                        p_risk = bal_data.get("risk_info", {}).get("parity", {})
                        if p_risk:
                            parity_next_bet.set_text(f"{p_risk.get('next_bet', 0):,.0f} VND")
                            parity_pct.set_text(f"{p_risk.get('pct_of_balance', 0.0)}% số dư")
                            parity_streak.set_text(f"{p_streak_val} / {p_risk.get('max_streak_tolerated', 0)}")
                            
                            p_wr_val = p_risk.get("win_rate_used", 0.5) * 100
                            parity_wr.set_text(f"{p_wr_val:.1f}%")
                            parity_ev.set_text(f"{p_risk.get('ev_per_bet', 0.0):+.4f}")
                            
                            p_grow = p_risk.get("expected_growth_pct_100", 0.0)
                            p_grow_bal = p_risk.get("expected_balance_after_100", demo_bal)
                            parity_growth.set_text(f"{p_grow:+.1f}% ({p_grow_bal:,.0f} VND)")
                            parity_growth.classes(remove='text-green-400 text-red-400')
                            parity_growth.classes('text-green-400' if p_grow >= 0 else 'text-red-400')

                            is_p_paused = p_risk.get("is_paused", False)
                            p_hours = p_risk.get("pause_remaining_hours", 0.0)
                            if is_p_paused:
                                parity_cooling.set_text(f"Ngắt cược ({p_hours}h)")
                                parity_cooling.classes(remove='text-green-400 text-red-400')
                                parity_cooling.classes('text-red-400 font-bold')
                            else:
                                parity_cooling.set_text('Bình thường')
                                parity_cooling.classes(remove='text-green-400 text-red-400')
                                parity_cooling.classes('text-green-400')

                        # ─── UPDATE RISK INFO SIZE ──────────────────────────────────
                        s_risk = bal_data.get("risk_info", {}).get("size", {})
                        if s_risk:
                            size_next_bet.set_text(f"{s_risk.get('next_bet', 0):,.0f} VND")
                            size_pct.set_text(f"{s_risk.get('pct_of_balance', 0.0)}% số dư")
                            size_streak.set_text(f"{s_streak_val} / {s_risk.get('max_streak_tolerated', 0)}")
                            
                            s_wr_val = s_risk.get("win_rate_used", 0.5) * 100
                            size_wr.set_text(f"{s_wr_val:.1f}%")
                            size_ev.set_text(f"{s_risk.get('ev_per_bet', 0.0):+.4f}")
                            
                            s_grow = s_risk.get("expected_growth_pct_100", 0.0)
                            s_grow_bal = s_risk.get("expected_balance_after_100", demo_bal)
                            size_growth.set_text(f"{s_grow:+.1f}% ({s_grow_bal:,.0f} VND)")
                            size_growth.classes(remove='text-green-400 text-red-400')
                            size_growth.classes('text-green-400' if s_grow >= 0 else 'text-red-400')

                            is_s_paused = s_risk.get("is_paused", False)
                            s_hours = s_risk.get("pause_remaining_hours", 0.0)
                            if is_s_paused:
                                size_cooling.set_text(f"Ngắt cược ({s_hours}h)")
                                size_cooling.classes(remove='text-green-400 text-red-400')
                                size_cooling.classes('text-red-400 font-bold')
                            else:
                                size_cooling.set_text('Bình thường')
                                size_cooling.classes(remove='text-green-400 text-red-400')
                                size_cooling.classes('text-green-400')

                        # ─── UPDATE PERFORMANCE SUMMARY ─────────────────────────────
                        sum_data = bal_data.get("summary", {})
                        if sum_data:
                            s_total = sum_data.get("total_bets", 0)
                            s_wins = sum_data.get("wins", 0)
                            s_losses = sum_data.get("losses", 0)
                            summary_total.set_text(str(s_total))
                            summary_win_loss.set_text(f"{s_wins}W / {s_losses}L")
                            
                            s_wr = sum_data.get("win_rate", 0.0)
                            summary_win_rate.set_text(f"{s_wr:.1f}%")
                            
                            net_prof = sum_data.get("net_profit_vnd", 0.0)
                            summary_profit.set_text(f"{net_prof:+,.0f} VND")
                            summary_profit.classes(remove='text-green-400 text-red-400')
                            summary_profit.classes('text-green-400' if net_prof >= 0 else 'text-red-400')
                            
                            peak_prof = balances.get("peak_demo_balance", demo_bal) - 10000000.0
                            summary_peak.set_text(f"{peak_prof:+,.0f} VND")

                        # ─── UPDATE CAPITAL COLLAPSES ───────────────────────────────
                        collapses_container.clear()
                        col_list = bal_data.get("capital_collapses", [])
                        if col_list:
                            for c in col_list[:5]:
                                c_time = c.get("time", "").split(" ")[-1] if " " in c.get("time", "") else c.get("time", "")
                                c_bets = c.get("bets_completed", 0)
                                c_peak = c.get("peak_balance", 0.0)
                                with collapses_container:
                                    with ui.row().classes('w-full justify-between items-center px-2 py-1 bg-[#0e0e0e]/50 border border-red-500/10 rounded text-[11px] font-mono-lbl no-wrap'):
                                        ui.label(c_time).classes('w-20 text-[#99907c]')
                                        ui.label(f"{c_bets} cược").classes('grow text-center text-red-400 font-bold')
                                        ui.label(f"{c_peak:,.0f} VND").classes('w-24 text-right text-amber-400')
                        else:
                            with collapses_container:
                                ui.label('Chưa ghi nhận sự kiện cháy tài khoản nào.').classes('text-xs text-[#99907c] italic p-2')

                        # Update Demo bets list
                        demo_bets_container.clear()
                        bets_list = bal_data.get("demo_bets", [])
                        if bets_list:
                            for bet in bets_list:
                                issue = bet.get("issue", "--")
                                m_type = "Chẵn Lẻ" if bet.get("market_type") == "parity" else "Tài Xỉu"
                                select_cua = "LẺ" if bet.get("bet_target") == "Le" else "CHẴN" if bet.get("bet_target") == "Chan" else "TÀI" if bet.get("bet_target") == "Tai" else "XỈU"
                                amt = bet.get("amount", 0.0)
                                status = bet.get("status", "pending")
                                
                                status_txt = "Đang chờ"
                                status_class = "text-amber-500"
                                if status == "win":
                                    win_amt = bet.get("win_amount", 0.0)
                                    status_txt = f"WIN (+{win_amt:,.0f} VND)"
                                    status_class = "text-green-400 font-bold"
                                elif status == "lose":
                                    status_txt = f"LOSE (-{amt:,.0f} VND)"
                                    status_class = "text-red-400 font-bold"

                                with demo_bets_container:
                                    with ui.row().classes('w-full justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded text-xs font-mono-lbl'):
                                        ui.label(f"#{issue}")
                                        ui.label(f"{m_type}: {select_cua}")
                                        ui.label(f"{amt:,.0f} VND").classes('text-[#99907c]')
                                        ui.label(status_txt).classes(status_class)
                        else:
                            with demo_bets_container:
                                ui.label('Chưa có lịch sử cược giả lập.').classes('text-xs text-[#99907c] italic')
            except Exception as e:
                logger.error(f"Error fetching trading data: {e}")

        ui.timer(4.0, fetch_trading_data)
        # Chạy ngay lần đầu tiên
        ui.timer(0.1, fetch_trading_data, once=True)
