"use client";

import React, { useEffect, useState } from "react";
import { fetchMarkovStats } from "../../core/api";
import { ShieldCheck, TrendingUp, AlertOctagon, Download } from "lucide-react";

interface PredictionRecord {
  issue: string;
  time: string;
  predicted_parity: string;
  parity_confidence: number;
  predicted_size: string;
  size_confidence: number;
  actual_parity: string;
  actual_size: string;
  status_parity: string;
  status_size: string;
}

interface WeirdBreak {
  issue: string;
  time: string;
  details: string[];
}

interface Block30 {
  block_range: string;
  time_range: string;
  total_bets: number;
  win_rate: number;
  status: string;
}

interface GoldenHour {
  hour: string;
  win_rate: number;
  total_bets: number;
}

interface MarketAnalysisData {
  weird_breaks: WeirdBreak[];
  blocks_30: Block30[];
  golden_hours: GoldenHour[];
}

interface DrawRecord {
  issue: string;
  numbers?: number[];
  num_1?: number;
  num_2?: number;
  num_3?: number;
  num_4?: number;
  num_5?: number;
  total: number;
  is_tai: boolean;
  is_le: boolean;
  drawn_at: string;
}

export default function MarkovAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisData | null>(null);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [nextBets, setNextBets] = useState<{ parity: number; size: number }>({ parity: 0, size: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const statsData = await fetchMarkovStats();
      if (statsData) setStats(statsData);

      // Fetch predictions history
      const predRes = await fetch("http://localhost:8000/api/predictions?limit=15");
      if (predRes.ok) {
        const predData = await predRes.json();
        setPredictions(predData.data || []);
      }

      // Fetch market analysis
      const marketRes = await fetch("http://localhost:8000/api/market-analysis?limit=100");
      if (marketRes.ok) {
        const mData = await marketRes.json();
        setMarketAnalysis(mData.data || null);
      }

      // Fetch raw history
      const historyRes = await fetch("http://localhost:8000/api/history?limit=15");
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.data || []);
      }

      // Fetch next bets calculated from balance API
      const balanceRes = await fetch("http://localhost:8000/api/balance");
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        if (balanceData.next_bet_amounts) {
          setNextBets({
            parity: balanceData.next_bet_amounts.parity || 0,
            size: balanceData.next_bet_amounts.size || 0,
          });
        }
      }
    } catch (err) {
      console.error("Error loading complete Markov analytics:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-lg animate-pulse flex items-center justify-center min-h-[300px]">
        <span className="font-mono text-xs text-[#99907c] tracking-widest">LOADING ANALYTICS ENGINE...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-panel p-6 rounded-lg border-red-500/20 text-center">
        <span className="font-mono text-xs text-red-400">MARKOV ENGINE OFFLINE</span>
      </div>
    );
  }

  const pStats = stats.prediction_stats || {
    parity: { wins: 0, total: 0, win_rate: 0.0 },
    size: { wins: 0, total: 0, win_rate: 0.0 },
    overall_win_rate: 0.0,
  };

  const currentStreaks = stats.data?.streaks || {
    le_streak: { state: "Chan", count: 0, max_history: 0 },
    tai_streak: { state: "Xiu", count: 0, max_history: 0 },
  };

  const rec = stats.data?.ai_recommendation || {
    parity: { decision: "BỎ QUA", confidence: 50, rationale: "-" },
    size: { decision: "BỎ QUA", confidence: 50, rationale: "-" },
  };

  const prob = stats.data?.probabilities || { le: 0.5, chan: 0.5, tai: 0.5, xiu: 0.5 };

  // Calculate local ratio percentages
  const parityWinRatePct = pStats.parity?.win_rate ? pStats.parity.win_rate * 100 : 0;
  const sizeWinRatePct = pStats.size?.win_rate ? pStats.size.win_rate * 100 : 0;
  const overallWinRatePct = pStats.overall_win_rate ? pStats.overall_win_rate * 100 : 0;

  // Golden hours WR calculations helper
  const getGoldenHourRepresentation = () => {
    if (!marketAnalysis || !marketAnalysis.golden_hours || marketAnalysis.golden_hours.length === 0) {
      return "Không có dữ liệu";
    }
    const top = marketAnalysis.golden_hours[0];
    return `Giờ Vàng: ${top.hour} (${top.win_rate}%)`;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Overall Win Rate */}
        <div className="glass-panel p-4 rounded-lg space-y-2">
          <div className="font-space text-[10px] text-[#99907c] uppercase tracking-wider">Hiệu Suất Toàn Cục</div>
          <div className="font-space font-bold text-2xl text-[#D4AF37]">{overallWinRatePct.toFixed(1)}%</div>
          <div className="font-sans text-[9px] text-[#99907c]">Tỷ lệ thắng trung bình các hạng mục cược</div>
        </div>
        {/* Metric 2: Parity Win Rate */}
        <div className="glass-panel p-4 rounded-lg space-y-2">
          <div className="font-space text-[10px] text-[#99907c] uppercase tracking-wider">Thắng Cược Chẵn/Lẻ</div>
          <div className="font-space font-bold text-2xl text-[#e5e2e1]">{parityWinRatePct.toFixed(1)}%</div>
          <div className="flex justify-between font-mono text-[9px] text-[#99907c]">
            <span>Số trận thắng:</span>
            <span>{pStats.parity?.wins || 0}/{pStats.parity?.total || 0}</span>
          </div>
        </div>
        {/* Metric 3: Size Win Rate */}
        <div className="glass-panel p-4 rounded-lg space-y-2">
          <div className="font-space text-[10px] text-[#99907c] uppercase tracking-wider">Thắng Cược Tài/Xỉu</div>
          <div className="font-space font-bold text-2xl text-[#e5e2e1]">{sizeWinRatePct.toFixed(1)}%</div>
          <div className="flex justify-between font-mono text-[9px] text-[#99907c]">
            <span>Số trận thắng:</span>
            <span>{pStats.size?.wins || 0}/{pStats.size?.total || 0}</span>
          </div>
        </div>
        {/* Metric 4: Total Analyzed */}
        <div className="glass-panel p-4 rounded-lg space-y-2">
          <div className="font-space text-[10px] text-[#99907c] uppercase tracking-wider">Tổng Kỳ Đã Phân Tích</div>
          <div className="font-space font-bold text-2xl text-[#D4AF37]">{(pStats.parity?.total || 0) + (pStats.size?.total || 0) || stats.limit_analyzed}</div>
          <div className="font-sans text-[9px] text-[#99907c]">Kỷ lục học và lọc dữ liệu liên tục</div>
        </div>
      </div>

      {/* Recommendations Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommendation Parity */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-[#D4AF37] space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-space font-bold text-xs text-[#D4AF37] uppercase tracking-wider">Khuyến Nghị Cược: Chẵn / Lẻ</span>
            <span className="font-mono text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded">Parity Engine</span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0e0e0e]/60 p-2.5 border border-[#D4AF37]/5 rounded text-center">
                <div className="font-mono text-[9px] text-[#99907c] uppercase">Xác suất Lẻ</div>
                <div className="font-space font-bold text-base text-[#fb7185] mt-1">{(prob.le * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-[#0e0e0e]/60 p-2.5 border border-[#D4AF37]/5 rounded text-center">
                <div className="font-mono text-[9px] text-[#99907c] uppercase">Xác suất Chẵn</div>
                <div className="font-space font-bold text-base text-green-400 mt-1">{(prob.chan * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="bg-[#0e0e0e]/40 p-2 border border-[#D4AF37]/5 rounded flex justify-between items-center font-mono text-[10px]">
              <span className="text-[#99907c]">Chỉ số bệt (Streak):</span>
              <span className="font-bold text-[#D4AF37]">
                {currentStreaks.le_streak.state === "Le" ? "Lẻ" : "Chẵn"} {currentStreaks.le_streak.count} kỳ (Cực đại: {currentStreaks.le_streak.max_history})
              </span>
            </div>

            {/* Recommendation Box */}
            <div className="p-4 bg-[#111]/80 border border-[#D4AF37]/15 rounded space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-space font-bold text-sm text-[#e5e2e1] uppercase">{rec.parity.decision}</span>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                  rec.parity.decision.includes("BỎ") ? "bg-gray-500/10 text-gray-400" : "bg-green-500/15 text-green-400 border border-green-500/25"
                }`}>
                  {rec.parity.decision.includes("BỎ") ? "NO BET" : "BUY SIGNAL"}
                </span>
              </div>
              {/* Progress bar confidence */}
              <div className="w-full bg-[#1c1b1b] h-1.5 rounded overflow-hidden">
                <div className="bg-[#D4AF37] h-full transition-all duration-500" style={{ width: `${rec.parity.confidence || 50}%` }} />
              </div>
              <div className="flex justify-between font-mono text-[9px] text-[#99907c]">
                <span>Độ tin cậy: {rec.parity.confidence}%</span>
                <span>Tiền cược kỳ tới: <strong className="text-[#D4AF37]">{nextBets.parity.toLocaleString("vi-VN")} VND</strong></span>
              </div>
              <p className="font-sans text-[10px] text-[#99907c] leading-relaxed border-t border-[#D4AF37]/5 pt-1.5 mt-1.5">
                {rec.parity.rationale}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation Size */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-amber-500 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-space font-bold text-xs text-amber-500 uppercase tracking-wider">Khuyến Nghị Cược: Tài / Xỉu</span>
            <span className="font-mono text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">Size Engine</span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0e0e0e]/60 p-2.5 border border-[#D4AF37]/5 rounded text-center">
                <div className="font-mono text-[9px] text-[#99907c] uppercase">Xác suất Tài</div>
                <div className="font-space font-bold text-base text-amber-500 mt-1">{(prob.tai * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-[#0e0e0e]/60 p-2.5 border border-[#D4AF37]/5 rounded text-center">
                <div className="font-mono text-[9px] text-[#99907c] uppercase">Xác suất Xỉu</div>
                <div className="font-space font-bold text-base text-sky-400 mt-1">{(prob.xiu * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="bg-[#0e0e0e]/40 p-2 border border-[#D4AF37]/5 rounded flex justify-between items-center font-mono text-[10px]">
              <span className="text-[#99907c]">Chỉ số bệt (Streak):</span>
              <span className="font-bold text-amber-500">
                {currentStreaks.tai_streak.state === "Tai" ? "Tài" : "Xỉu"} {currentStreaks.tai_streak.count} kỳ (Cực đại: {currentStreaks.tai_streak.max_history})
              </span>
            </div>

            {/* Recommendation Box */}
            <div className="p-4 bg-[#111]/80 border border-[#D4AF37]/15 rounded space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-space font-bold text-sm text-[#e5e2e1] uppercase">{rec.size.decision}</span>
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                  rec.size.decision.includes("BỎ") ? "bg-gray-500/10 text-gray-400" : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                }`}>
                  {rec.size.decision.includes("BỎ") ? "NO BET" : "BUY SIGNAL"}
                </span>
              </div>
              {/* Progress bar confidence */}
              <div className="w-full bg-[#1c1b1b] h-1.5 rounded overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${rec.size.confidence || 50}%` }} />
              </div>
              <div className="flex justify-between font-mono text-[9px] text-[#99907c]">
                <span>Độ tin cậy: {rec.size.confidence}%</span>
                <span>Tiền cược kỳ tới: <strong className="text-amber-500">{nextBets.size.toLocaleString("vi-VN")} VND</strong></span>
              </div>
              <p className="font-sans text-[10px] text-[#99907c] leading-relaxed border-t border-[#D4AF37]/5 pt-1.5 mt-1.5">
                {rec.size.rationale}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Logs and prediction history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Draw history */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-space font-bold text-xs text-[#e5e2e1] uppercase tracking-wider">Lịch sử kết quả xổ số (15 kỳ)</span>
            <a
              href="http://localhost:8000/api/export/history"
              download
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </a>
          </div>
          <div className="overflow-x-auto max-h-[350px] scrollbar-thin">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#99907c]">
                  <th className="py-2 px-3">Kỳ Xổ Số</th>
                  <th className="py-2 px-3">Bóng Số</th>
                  <th className="py-2 px-3">Tổng</th>
                  <th className="py-2 px-3">Tai/Xỉu</th>
                  <th className="py-2 px-3">Chẵn/Lẻ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.issue} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5">
                    <td className="py-2 px-3 text-[#D4AF37] font-bold">{record.issue}</td>
                    <td className="py-2 px-3 text-[#e5e2e1]">
                      {record.numbers ? record.numbers.join(", ") : ""}
                    </td>
                    <td className="py-2 px-3">{record.total}</td>
                    <td className="py-2 px-3">
                      <span className={record.is_tai ? "text-amber-500 font-bold" : "text-sky-400"}>
                        {record.is_tai ? "Tài" : "Xỉu"}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={record.is_le ? "text-[#fb7185] font-bold" : "text-green-400"}>
                        {record.is_le ? "Lẻ" : "Chẵn"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prediction history */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-space font-bold text-xs text-[#e5e2e1] uppercase tracking-wider">Lịch sử dự đoán AI gần đây</span>
            <a
              href="http://localhost:8000/api/export/predictions"
              download
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </a>
          </div>
          <div className="overflow-x-auto max-h-[350px] scrollbar-thin">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#99907c]">
                  <th className="py-2 px-2">Kỳ Số</th>
                  <th className="py-2 px-2">Dự Đoán P</th>
                  <th className="py-2 px-2">% P</th>
                  <th className="py-2 px-2">Dự Đoán S</th>
                  <th className="py-2 px-2">% S</th>
                  <th className="py-2 px-2">Thật</th>
                  <th className="py-2 px-2">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => {
                  const pStatus = p.status_parity;
                  const sStatus = p.status_size;
                  return (
                    <tr key={p.issue} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5">
                      <td className="py-2 px-2 text-[#D4AF37] font-bold">{p.issue}</td>
                      <td className="py-2 px-2">{p.predicted_parity}</td>
                      <td className="py-2 px-2 text-[#99907c]">{p.parity_confidence}%</td>
                      <td className="py-2 px-2">{p.predicted_size}</td>
                      <td className="py-2 px-2 text-[#99907c]">{p.size_confidence}%</td>
                      <td className="py-2 px-2 text-[#e5e2e1]">
                        {p.actual_parity ? `${p.actual_parity}/${p.actual_size}` : "-"}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`font-semibold px-1 rounded text-[10px] ${
                          pStatus === "win" || sStatus === "win"
                            ? "bg-green-500/10 text-green-400"
                            : pStatus === "lose" || sStatus === "lose"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-gray-500/15 text-gray-400"
                        }`}>
                          {pStatus === "win" || sStatus === "win" ? "WIN" : pStatus === "lose" || sStatus === "lose" ? "LOSE" : "PENDING"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Market Health (Golden Hour) & Weird Breaks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Health Analytics */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-space font-bold text-xs text-[#D4AF37] uppercase tracking-wider">Sức Khỏe Thị Trường (30 Kỳ)</h3>
            <span className="font-mono text-[9px] text-[#fb7185] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              {getGoldenHourRepresentation()}
            </span>
          </div>

          {/* Golden hour summary */}
          {marketAnalysis && (
            <div className="grid grid-cols-4 gap-2 text-center">
              {marketAnalysis.golden_hours.slice(0, 4).map((gh, idx) => (
                <div key={idx} className="p-2 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded space-y-1">
                  <div className="font-mono text-[8px] text-[#99907c]">{gh.hour}</div>
                  <div className="font-space font-bold text-xs text-[#D4AF37]">{gh.win_rate}%</div>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-x-auto max-h-[220px] scrollbar-thin">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#99907c]">
                  <th className="py-2 px-3">Phạm Vi Kỳ</th>
                  <th className="py-2 px-3">Lượt Cược</th>
                  <th className="py-2 px-3">Tỷ Lệ Thắng</th>
                  <th className="py-2 px-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {marketAnalysis?.blocks_30.map((block, idx) => (
                  <tr key={idx} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5">
                    <td className="py-2 px-3">{block.block_range}</td>
                    <td className="py-2 px-3 text-[#e5e2e1]">{block.total_bets}</td>
                    <td className="py-2 px-3 text-[#D4AF37]">{block.win_rate}%</td>
                    <td className="py-2 px-3">
                      <span className={block.status === "Ổn định" ? "text-green-400" : block.status === "Hỗn loạn" ? "text-red-400" : "text-[#99907c]"}>
                        {block.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weird Breaks List */}
        <div className="glass-panel p-5 rounded-lg border-l-4 border-l-red-500/30 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <h3 className="font-space font-bold text-xs text-[#e5e2e1] uppercase tracking-wider">Kỳ Gãy Lạ Gần Đây (Xác suất &gt;= 68% Thua)</h3>
          </div>
          <div className="overflow-x-auto max-h-[250px] scrollbar-thin">
            <table className="w-full text-left font-mono text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-red-500/20 text-[#99907c]">
                  <th className="py-2 px-2">Kỳ Số</th>
                  <th className="py-2 px-2">Chi Tiết Kỳ Gãy / Tỷ Lệ AI</th>
                </tr>
              </thead>
              <tbody>
                {marketAnalysis?.weird_breaks.map((wb) => (
                  <tr key={wb.issue} className="border-b border-red-500/5 hover:bg-red-500/5">
                    <td className="py-2 px-2 text-red-400 font-bold">{wb.issue}</td>
                    <td className="py-2 px-2 text-[#99907c]">
                      {wb.details.join(" | ")}
                    </td>
                  </tr>
                ))}
                {(!marketAnalysis?.weird_breaks || marketAnalysis.weird_breaks.length === 0) && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-[#99907c]">Không ghi nhận kỳ gãy lạ nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2nd-Order Markov Matrix (Original layout maintained at bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h3 className="font-space font-bold text-sm tracking-wider text-[#D4AF37] uppercase">
            Parity Transition Matrix (Markov 2nd-Order)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.markov_parity_matrix ? (
              Object.entries(stats.markov_parity_matrix).map(([state, probVal]: any) => (
                <div key={state} className="p-3 bg-[#0e0e0e]/60 border border-[#D4AF37]/10 rounded flex justify-between items-center">
                  <span className="font-mono text-xs text-[#99907c]">{state}</span>
                  <span className="font-space font-bold text-sm text-[#e5e2e1]">{(probVal * 100).toFixed(1)}%</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-[#99907c] font-mono">Insufficient historical data</span>
            )}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h3 className="font-space font-bold text-sm tracking-wider text-[#D4AF37] uppercase">
            Size Transition Matrix (Markov 2nd-Order)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.markov_size_matrix ? (
              Object.entries(stats.markov_size_matrix).map(([state, probVal]: any) => (
                <div key={state} className="p-3 bg-[#0e0e0e]/60 border border-[#D4AF37]/10 rounded flex justify-between items-center">
                  <span className="font-mono text-xs text-[#99907c]">{state}</span>
                  <span className="font-space font-bold text-sm text-[#e5e2e1]">{(probVal * 100).toFixed(1)}%</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-[#99907c] font-mono">Insufficient historical data</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
