from nicegui import ui
import httpx
import logging

logger = logging.getLogger(__name__)

def render_analytics(container: ui.column):
    """Render giao dien trang thong ke phan tich MarkovBrain"""
    with container:
        ui.label('MARKET INTELLIGENCE & STATISTICS').classes('text-sm font-mono-lbl tracking-widest gold-text font-bold mb-2')
        
        # Grid cac card thong tin nhanh
        with ui.row().classes('w-full gap-4 no-wrap'):
            with ui.column().classes('grow glass-panel p-4 gap-1'):
                ui.label('ACTIVE GAME').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-wider uppercase')
                game_label = ui.label('Connecting...').classes('text-base font-bold text-[#e5e2e1] font-title')
            
            with ui.column().classes('grow glass-panel p-4 gap-1'):
                ui.label('MARKET ACCURACY (WIN RATE)').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-wider uppercase')
                win_rate_label = ui.label('0.0%').classes('text-base font-bold text-green-400 font-title')
                
            with ui.column().classes('grow glass-panel p-4 gap-1'):
                ui.label('AI PREDICTION ENGINE').classes('text-[9px] text-[#99907c] font-mono-lbl tracking-wider uppercase')
                engine_label = ui.label('Analyzing...').classes('text-base font-bold text-amber-400 font-title')

        # Hang nut bam Export du lieu
        with ui.row().classes('w-full gap-3 mt-4 items-center'):
            ui.label('EXPORT DATA:').classes('text-[10px] font-mono-lbl text-[#99907c] mr-2')
            ui.button('Export Draw History', icon='download', on_click=lambda: ui.download('http://127.0.0.1:8000/api/export/history')) \
                .classes('font-mono-lbl text-xs py-1 text-black').props('color=amber-500 dense')
            ui.button('Export AI Predictions', icon='download', on_click=lambda: ui.download('http://127.0.0.1:8000/api/export/predictions')) \
                .classes('font-mono-lbl text-xs py-1 text-black').props('color=amber-500 dense')
            ui.button('Export Demo Bets', icon='download', on_click=lambda: ui.download('http://127.0.0.1:8000/api/export/demo-bets')) \
                .classes('font-mono-lbl text-xs py-1 text-black').props('color=amber-500 dense')

        # Bieu do Win Rate Trend va phan tich chi tiet
        with ui.row().classes('w-full gap-6 mt-4 no-wrap'):
            # Cot trai: Bieu do ECharts
            with ui.column().classes('grow-[2] glass-panel p-4 gap-4'):
                ui.label('WIN RATE PERFORMANCE TREND (BLOCKS OF 30)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                chart = ui.echart({
                    'backgroundColor': 'transparent',
                    'textStyle': {'color': '#99907c', 'fontFamily': 'JetBrains Mono'},
                    'tooltip': {'trigger': 'axis'},
                    'grid': {'left': '3%', 'right': '4%', 'bottom': '3%', 'containLabel': True},
                    'xAxis': {
                        'type': 'category',
                        'boundaryGap': False,
                        'data': [],
                        'axisLine': {'lineStyle': {'color': 'rgba(212, 175, 55, 0.15)'}}
                    },
                    'yAxis': {
                        'type': 'value',
                        'min': 30,
                        'max': 100,
                        'axisLine': {'lineStyle': {'color': 'rgba(212, 175, 55, 0.15)'}},
                        'splitLine': {'lineStyle': {'color': 'rgba(212, 175, 55, 0.05)'}}
                    },
                    'series': [{
                        'name': 'Win Rate',
                        'type': 'line',
                        'smooth': True,
                        'data': [],
                        'itemStyle': {'color': '#D4AF37'},
                        'areaStyle': {
                            'color': {
                                'type': 'linear',
                                'x': 0, 'y': 0, 'x2': 0, 'y2': 1,
                                'colorStops': [
                                    {'offset': 0, 'color': 'rgba(212, 175, 55, 0.25)'},
                                    {'offset': 1, 'color': 'rgba(212, 175, 55, 0.0)'}
                                ]
                            }
                        }
                    }]
                }).classes('w-full h-64')
                
            # Cot phai: Golden Hours
            with ui.column().classes('grow glass-panel p-4 gap-4'):
                ui.label('GOLDEN HOURS ANALYSIS').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                golden_hours_container = ui.column().classes('w-full gap-2')

        # Weird Breaks Analysis
        with ui.column().classes('w-full glass-panel p-4 gap-3 mt-4'):
            ui.label('WEIRD BREAKS DETECTED (HIGH CONFIDENCE LOSSES)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
            weird_breaks_container = ui.column().classes('w-full gap-2 max-h-48 overflow-y-auto')

        # Hai bang du lieu lon song song
        with ui.row().classes('w-full gap-6 mt-4 no-wrap items-stretch'):
            # Cot trai: Lịch sử quay số thật
            with ui.column().classes('grow glass-panel p-4 gap-3 w-1/2'):
                ui.label('REAL DRAW HISTORY (LATEST 15)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                # Header bang
                with ui.row().classes('w-full justify-between items-center px-2 py-1 bg-[#1a1a1a]/80 text-[10px] font-mono-lbl text-[#99907c] uppercase tracking-wider rounded'):
                    ui.label('Kỳ quay').classes('w-16')
                    ui.label('Số mở thưởng').classes('grow text-center')
                    ui.label('Tổng').classes('w-10 text-center')
                    ui.label('T/X').classes('w-10 text-center')
                    ui.label('C/L').classes('w-10 text-center')
                    ui.label('Giờ').classes('w-14 text-right')
                    
                draw_history_container = ui.column().classes('w-full gap-1 max-h-80 overflow-y-auto')
                
            # Cot phai: Lịch sử dự đoán AI
            with ui.column().classes('grow glass-panel p-4 gap-3 w-1/2'):
                ui.label('AI PREDICTIONS LOG (LATEST 15)').classes('text-[10px] font-mono-lbl font-bold tracking-widest gold-text')
                
                # Header bang
                with ui.row().classes('w-full justify-between items-center px-2 py-1 bg-[#1a1a1a]/80 text-[10px] font-mono-lbl text-[#99907c] uppercase tracking-wider rounded'):
                    ui.label('Kỳ cược').classes('w-16')
                    ui.label('Dự đoán Tài/Xỉu').classes('grow text-center')
                    ui.label('Dự đoán Chẵn/Lẻ').classes('grow text-center')
                    ui.label('Kết quả').classes('w-12 text-center')
                    ui.label('Trạng thái').classes('w-16 text-right')
                    
                predictions_container = ui.column().classes('w-full gap-1 max-h-80 overflow-y-auto')

        async def fetch_markov_data():
            try:
                async with httpx.AsyncClient() as client:
                    # 1. Fetch stats
                    res_stats = await client.get('http://127.0.0.1:8000/api/statistics', timeout=2.0)
                    if res_stats.status_code == 200:
                        data = res_stats.json()
                        lottery_code = data.get("lottery_code", "UNKNOWN").upper()
                        target_domain = data.get("target_domain", "EE88")
                        game_label.set_text(f"{lottery_code} ({target_domain})")
                        
                        pred_stats = data.get("prediction_stats", {})
                        p_win = pred_stats.get("parity", {}).get("win_rate", 0.0)
                        s_win = pred_stats.get("size", {}).get("win_rate", 0.0)
                        avg_win = (p_win + s_win) / 2 if (p_win > 0 and s_win > 0) else (p_win or s_win or 0.0)
                        win_rate_label.set_text(f"{avg_win:.1f}%")
                        
                        ai_rec = data.get("data", {}).get("ai_recommendation", {})
                        engine_name = ai_rec.get("engine", "Markov Chain")
                        engine_label.set_text(engine_name)

                    # 2. Fetch market analysis (golden hours, weird breaks, blocks)
                    res_analysis = await client.get('http://127.0.0.1:8000/api/market-analysis', timeout=2.0)
                    if res_analysis.status_code == 200:
                        analysis_data = res_analysis.json().get("data", {})
                        
                        # Render Golden Hours
                        golden_hours_container.clear()
                        g_hours = analysis_data.get("golden_hours", [])
                        if g_hours:
                            for idx, item in enumerate(g_hours[:3]):
                                with golden_hours_container:
                                    with ui.row().classes('w-full justify-between items-center p-2 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded text-xs font-mono-lbl'):
                                        ui.label(f"Khung {item['hour']}")
                                        ui.label(f"Win Rate: {item['win_rate']}% (Tổng {item['total_bets']} lệnh)").classes('text-green-400 font-bold')
                        else:
                            with golden_hours_container:
                                ui.label('Chưa đủ dữ liệu phân tích khung giờ vàng.').classes('text-xs text-[#99907c] italic')

                        # Render Weird Breaks
                        weird_breaks_container.clear()
                        w_breaks = analysis_data.get("weird_breaks", [])
                        if w_breaks:
                            for item in w_breaks[:10]:
                                details_str = "; ".join(item.get("details", []))
                                with weird_breaks_container:
                                    with ui.row().classes('w-full justify-between items-center p-2 bg-[#0e0e0e]/50 border border-red-500/10 rounded text-xs font-mono-lbl'):
                                        ui.label(f"Kỳ {item['issue']} ({item['time']})").classes('text-[#e5e2e1] font-bold')
                                        ui.label(details_str).classes('text-red-400 grow text-right ml-4')
                        else:
                            with weird_breaks_container:
                                ui.label('Không phát hiện lần bẻ cầu dị bất thường nào (độ tin cậy >= 68% nhưng thua).').classes('text-xs text-[#99907c] italic')

                        # Update Chart
                        blocks = analysis_data.get("blocks_30", [])
                        if blocks:
                            chart_issues = [b["block_range"].split(" - ")[1][-4:] for b in blocks] # Lay 4 so cuoi cua ky cuoi
                            chart_rates = [b["win_rate"] for b in blocks]
                            
                            chart.options['xAxis']['data'] = chart_issues
                            chart.options['series'][0]['data'] = chart_rates
                            chart.update()

                    # 3. Fetch Draw History (Latest 15)
                    res_history = await client.get('http://127.0.0.1:8000/api/history?limit=15', timeout=2.0)
                    if res_history.status_code == 200:
                        draws = res_history.json().get("data", [])
                        draw_history_container.clear()
                        if draws:
                            for r in draws:
                                issue = r.get("issue", "")
                                numbers_str = " ".join(map(str, r.get("numbers") or []))
                                total = r.get("total", 0)
                                is_tai = "Tài" if r.get("is_tai") else "Xỉu"
                                is_le = "Lẻ" if r.get("is_le") else "Chẵn"
                                time_str = r.get("time", "").split(" ")[-1] if " " in r.get("time", "") else r.get("time", "")
                                
                                color_tai = "text-amber-500" if r.get("is_tai") else "text-blue-400"
                                color_le = "text-orange-400" if r.get("is_le") else "text-purple-400"

                                with draw_history_container:
                                    with ui.row().classes('w-full justify-between items-center px-2 py-1.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded text-xs font-mono-lbl no-wrap'):
                                        ui.label(issue[-6:] if len(issue) > 6 else issue).classes('w-16 font-bold text-[#e5e2e1]')
                                        ui.label(numbers_str).classes('grow text-center text-amber-100')
                                        ui.label(str(total)).classes('w-10 text-center font-bold text-[#e5e2e1]')
                                        ui.label(is_tai).classes(f'w-10 text-center {color_tai}')
                                        ui.label(is_le).classes(f'w-10 text-center {color_le}')
                                        ui.label(time_str).classes('w-14 text-right text-[#99907c]')
                        else:
                            with draw_history_container:
                                ui.label('Chưa có lịch sử quay số.').classes('text-xs text-[#99907c] italic')

                    # 4. Fetch Predictions History (Latest 15)
                    res_preds = await client.get('http://127.0.0.1:8000/api/predictions?limit=15', timeout=2.0)
                    if res_preds.status_code == 200:
                        preds = res_preds.json().get("data", [])
                        predictions_container.clear()
                        if preds:
                            for p in preds:
                                issue = p.get("issue", "")
                                
                                raw_size = p.get("predicted_size")
                                s_conf = p.get("size_confidence") or 0.0
                                size_pred = "Bỏ qua"
                                if raw_size == "Tai": size_pred = f"Tài ({s_conf:.0f}%)"
                                elif raw_size == "Xiu": size_pred = f"Xỉu ({s_conf:.0f}%)"
                                
                                raw_parity = p.get("predicted_parity")
                                p_conf = p.get("parity_confidence") or 0.0
                                parity_pred = "Bỏ qua"
                                if raw_parity == "Le": parity_pred = f"Lẻ ({p_conf:.0f}%)"
                                elif raw_parity == "Chan": parity_pred = f"Chẵn ({p_conf:.0f}%)"
                                
                                act_size = p.get("actual_size", "")
                                act_parity = p.get("actual_parity", "")
                                real_res = "-"
                                if act_size or act_parity:
                                    r_s = "Tài" if act_size == "Tai" else "Xỉu" if act_size == "Xiu" else ""
                                    r_p = "Lẻ" if act_parity == "Le" else "Chẵn" if act_parity == "Chan" else ""
                                    real_res = f"{r_s}/{r_p}"
                                
                                status_s = p.get("status_size", "ignored")
                                status_p = p.get("status_parity", "ignored")
                                
                                status_txt = "Bỏ qua"
                                status_class = "text-[#99907c]"
                                
                                if status_s == "pending" or status_p == "pending":
                                    status_txt = "Chờ KQ"
                                    status_class = "text-amber-500 font-bold"
                                elif status_s != "ignored" or status_p != "ignored":
                                    wins = sum(1 for x in [status_s, status_p] if x == "win")
                                    losses = sum(1 for x in [status_s, status_p] if x == "lose")
                                    if losses == 0 and wins > 0:
                                        status_txt = "WIN"
                                        status_class = "text-green-400 font-bold"
                                    elif wins == 0 and losses > 0:
                                        status_txt = "LOSE"
                                        status_class = "text-red-400 font-bold"
                                    elif wins > 0 and losses > 0:
                                        status_txt = "1W/1L"
                                        status_class = "text-blue-400 font-bold"
                                
                                with predictions_container:
                                    with ui.row().classes('w-full justify-between items-center px-2 py-1.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded text-xs font-mono-lbl no-wrap'):
                                        ui.label(issue[-6:] if len(issue) > 6 else issue).classes('w-16 font-bold text-[#e5e2e1]')
                                        ui.label(size_pred).classes('grow text-center text-amber-100')
                                        ui.label(parity_pred).classes('grow text-center text-amber-100')
                                        ui.label(real_res).classes('w-12 text-center text-[#99907c]')
                                        ui.label(status_txt).classes(f'w-16 text-right {status_class}')
                        else:
                            with predictions_container:
                                ui.label('Chưa có lịch sử dự đoán.').classes('text-xs text-[#99907c] italic')
            except Exception as e:
                logger.error(f"Error fetching analytics data: {e}")
                
        ui.timer(5.0, fetch_markov_data)
        # Chạy ngay lần đầu tiên
        ui.timer(0.1, fetch_markov_data, once=True)
