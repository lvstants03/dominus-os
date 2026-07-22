"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, Settings, Play, Download, AlertTriangle, RefreshCw, Trash2, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "../../core/components/ui/Toast";
import { ConfirmModal } from "../../core/components/ui/Modal";
import Table from "../../core/components/ui/Table";

interface BetLog {
  id: string | number;
  issue: string;
  market_type: string;
  prediction: string;
  amount: number;
  strategy: string;
  status: string;
  win_amount: number;
  balance_after: number;
  time: string;
}

interface CapitalCollapse {
  timestamp: number;
  time: string;
  issue: string;
  market_type: string;
  loss_streak: number;
  amount_required: number;
  balance_current: number;
  base_amount: number;
  strategy: string;
}

interface BalanceDetails {
  real_balance: number;
  demo_balance: number;
  peak_demo_balance: number;
  demo_bet_amount: number;
  demo_bet_strategy: string;
}

interface RiskDetails {
  strategy: string;
  is_paused: boolean;
  pause_remaining_hours: number;
  win_rate_used: number;
  ev_per_bet: number;
  pct_of_balance: number;
  max_streak_tolerated: number;
  expected_balance_after_100: number;
  expected_growth_pct_100: number;
  daily_loss_limit: number | null;
  daily_loss_count: number;
}

interface BalanceData {
  status: string;
  balances: BalanceDetails;
  demo_bets: BetLog[];
  total_bets: number;
  max_loss_streak_tolerated: number;
  is_bankrupt: boolean;
  capital_collapses: CapitalCollapse[];
  risk_info?: {
    parity: RiskDetails;
    size: RiskDetails;
  };
  strategy_labels?: Record<string, string>;
  summary?: {
    net_profit: number;
    total_wins: number;
    total_losses: number;
    win_rate: number;
  };
}

export default function MarkovTradingPanel() {
  const { showToast } = useToast();

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [betAmountInput, setBetAmountInput] = useState("");
  const [customBalanceInput, setCustomBalanceInput] = useState("");
  const [strategySelect, setStrategySelect] = useState("dkm_adaptive_pro");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal confirm states
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/balance?page=${currentPage}&limit=${pageSize}`);
      if (res.ok) {
        const data: BalanceData = await res.json();
        setBalance(data);
        if (data.balances) {
          setStrategySelect(data.balances.demo_bet_strategy);
        }
      }
    } catch (err) {
      console.error("Error loading balance data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const handleUpdateBalance = async () => {
    const amount = parseFloat(customBalanceInput.replace(/,/g, ""));
    if (isNaN(amount) || amount < 0) {
      showToast("Cảnh Báo", "Vui lòng nhập số tiền hợp lệ!", "warning");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/balance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo_balance: amount }),
      });
      if (res.ok) {
        setCustomBalanceInput("");
        showToast("Thành Công", "Đã cập nhật số dư giả lập mới!", "success");
        loadData();
      }
    } catch (err) {
      showToast("Lỗi Hệ Thống", "Không thể cập nhật số dư.", "error");
    }
  };

  const handleUpdateBetAmount = async () => {
    const amount = parseFloat(betAmountInput.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) {
      showToast("Cảnh Báo", "Mức đặt cược cơ bản phải lớn hơn 0!", "warning");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/balance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      });
      if (res.ok) {
        setBetAmountInput("");
        showToast("Thành Công", "Đã cập nhật mức cược cơ bản mới!", "success");
        loadData();
      }
    } catch (err) {
      showToast("Lỗi Hệ Thống", "Không thể cập nhật mức cược.", "error");
    }
  };

  const handleUpdateStrategy = async (strategy: string) => {
    setStrategySelect(strategy);
    try {
      const res = await fetch("http://localhost:8000/api/balance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy: strategy,
        }),
      });
      if (res.ok) {
        showToast("Thành Công", "Đã thay đổi chiến thuật cược giả lập!", "success");
        loadData();
      }
    } catch (err) {
      showToast("Lỗi Hệ Thống", "Không thể thay đổi chiến thuật.", "error");
    }
  };

  const handleConfirmResetBalance = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/balance/reset", {
        method: "POST",
      });
      if (res.ok) {
        showToast("Reset Thành Công", "Số dư giả lập đã được khôi phục về 10,000,000 VND và xóa cược ảo!", "success");
        setCurrentPage(1);
        loadData();
      }
    } catch (err) {
      showToast("Lỗi", "Không thể gửi yêu cầu reset.", "error");
    }
  };

  const handleConfirmClearBets = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/balance/clear-bets", {
        method: "POST",
      });
      if (res.ok) {
        showToast("Dọn Dẹp Thành Công", "Đã dọn dẹp bộ nhớ đệm và kích hoạt scraper tải lại lịch sử xổ số!", "success");
        setCurrentPage(1);
        loadData();
      }
    } catch (err) {
      showToast("Lỗi", "Không thể gửi yêu cầu dọn dẹp.", "error");
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-lg animate-pulse flex items-center justify-center min-h-[300px]">
        <span className="font-mono text-xs text-[#99907c] tracking-widest">LOADING TRADING SYSTEM...</span>
      </div>
    );
  }

  if (!balance || !balance.balances) {
    return (
      <div className="glass-panel p-6 rounded-lg border-red-500/20 text-center">
        <span className="font-mono text-xs text-red-400">TRADING SERVER OFFLINE</span>
      </div>
    );
  }

  const details = balance.balances;
  const bets = balance.demo_bets || [];
  const collapses = balance.capital_collapses || [];
  const riskInfo = balance.risk_info;
  const totalBets = balance.total_bets || 0;
  const totalPages = Math.ceil(totalBets / pageSize) || 1;

  // Preparing data for growth equity chart
  const chartData = [...bets]
    .reverse()
    .map((bet, idx) => ({
      index: idx + 1,
      balance: bet.balance_after || 0,
      issue: bet.issue,
    }));

  // Column definitions for Bets Ledger Table
  const betColumns = [
    { header: "Thời Gian", render: (row: BetLog) => <span className="text-[#99907c]">{row.time || "-"}</span> },
    { header: "Kỳ Quay", render: (row: BetLog) => <span className="text-[#D4AF37] font-bold">#{row.issue}</span> },
    { header: "Hạng Mục", render: (row: BetLog) => <span>{row.market_type === "parity" ? "Chẵn/Lẻ" : "Tài/Xỉu"}</span> },
    { header: "Lựa Chọn", render: (row: BetLog) => <span className="text-[#e5e2e1] font-semibold">{row.prediction}</span> },
    { 
      header: "Động Cơ AI", 
      render: (row: BetLog) => {
        const eng = row.strategy || "Heuristics";
        const isCombined = eng.includes("DKM") || eng.includes("adaptive");
        return (
          <span className={isCombined ? "text-[#D4AF37]" : "text-[#99907c]"}>
            {eng}
          </span>
        );
      }
    },
    { header: "Tiền Cược", render: (row: BetLog) => (row.amount || 0).toLocaleString("vi-VN") + " VND", className: "text-right" },
    {
      header: "Trạng Thái",
      render: (row: BetLog) => (
        <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
          row.status === "win"
            ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25"
            : row.status === "lose"
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          {row.status.toUpperCase()}
        </span>
      )
    },
    {
      header: "Kết Quả Lợi Nhuận",
      className: "text-right",
      render: (row: BetLog) => {
        const isWin = row.status === "win";
        const val = isWin ? row.win_amount : row.amount;
        return (
          <span className={isWin ? "text-green-400 font-bold" : "text-red-400"}>
            {isWin ? "+" : "-"}{val.toLocaleString("vi-VN")} VND
          </span>
        );
      }
    },
    { header: "Số Dư Sau Cược", render: (row: BetLog) => (row.balance_after || 0).toLocaleString("vi-VN") + " VND", className: "text-right" }
  ];

  // Column definitions for Capital Collapse Logs Table
  const collapseColumns = [
    { header: "Thời Gian", render: (row: CapitalCollapse) => row.time, className: "text-[#99907c]" },
    { header: "Kỳ Quay", render: (row: CapitalCollapse) => <span className="text-[#D4AF37] font-bold">#{row.issue}</span> },
    { header: "Hạng Mục", render: (row: CapitalCollapse) => <span>{row.market_type === "parity" ? "Chẵn/Lẻ" : "Tài/Xỉu"}</span> },
    { header: "Chuỗi Thua", render: (row: CapitalCollapse) => <span className="text-red-400 font-bold">Thua x{row.loss_streak}</span> },
    { header: "Cược Yêu Cầu", render: (row: CapitalCollapse) => (row.amount_required || 0).toLocaleString("vi-VN") + " VND", className: "text-right" },
    { header: "Số Dư Lúc Đó", render: (row: CapitalCollapse) => (row.balance_current || 0).toLocaleString("vi-VN") + " VND", className: "text-right" },
    { header: "Cược Cơ Bản", render: (row: CapitalCollapse) => (row.base_amount || 0).toLocaleString("vi-VN") + " VND", className: "text-right" },
    { 
      header: "Chiến Thuật", 
      render: (row: CapitalCollapse) => {
        const lbl = balance.strategy_labels?.[row.strategy] || row.strategy || "Cố định";
        return <span className="text-[10px] text-[#99907c]">{lbl}</span>;
      } 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overdraft Warning Banner */}
      {balance.is_bankrupt && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3 text-red-400 animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-space font-bold text-xs uppercase">Cảnh Báo Quản Lý Vốn</h4>
            <p className="font-sans text-[11px] leading-relaxed mt-1 text-red-400/80">
              Số dư tài khoản giả lập hiện tại của bạn không đủ đáp ứng mức cược tối thiểu tiếp theo của thuật toán. Vui lòng bấm Reset số dư hoặc hạ mức cược cơ bản xuống để tránh gián đoạn.
            </p>
          </div>
        </div>
      )}

      {/* Capital collapse active pauses */}
      {riskInfo && (riskInfo.parity.is_paused || riskInfo.size.is_paused) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start space-x-3 text-amber-500">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-space font-bold text-xs uppercase">Hệ Thống Đang Tạm Dừng Cược Bảo Vệ Vốn</h4>
            <p className="font-sans text-[11px] leading-relaxed mt-1 text-amber-500/80">
              {riskInfo.parity.is_paused && `Kèo Chẵn/Lẻ: Còn ${riskInfo.parity.pause_remaining_hours.toFixed(1)} giờ để tự động mở lại. `}
              {riskInfo.size.is_paused && `Kèo Tài/Xỉu: Còn ${riskInfo.size.pause_remaining_hours.toFixed(1)} giờ để tự động mở lại. `}
              Hệ thống tự động kích hoạt chế độ đóng băng tạm thời để bảo vệ tài khoản khi phát hiện sụt giảm sút nghiêm trọng &gt;25% vốn.
            </p>
          </div>
        </div>
      )}

      {/* Wallet overview & main actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between text-[#D4AF37]">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5" />
              <h3 className="font-space font-bold text-sm tracking-wider uppercase">Demo Balance</h3>
            </div>
            <div className="flex space-x-1.5">
              <button
                onClick={() => setIsResetOpen(true)}
                title="Reset balance to 10M"
                className="p-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] rounded transition-all duration-300"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsClearOpen(true)}
                title="Clear all bets history"
                className="p-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded transition-all duration-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div>
            <div className={`font-space font-bold text-2xl ${balance.is_bankrupt ? "text-red-400" : "text-[#e5e2e1]"}`}>
              {(details.demo_balance || 0).toLocaleString("vi-VN")} VND
            </div>
            <div className="font-mono text-[9px] text-[#99907c] uppercase mt-1">
              Peak: {(details.peak_demo_balance || 0).toLocaleString("vi-VN")} VND
            </div>
          </div>
          {/* Custom Balance adjustment */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Custom Balance..."
              value={customBalanceInput}
              onChange={(e) => setCustomBalanceInput(e.target.value)}
              className="bg-[#0e0e0e]/80 border border-[#D4AF37]/20 rounded px-2.5 py-1 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/60 focus:outline-none flex-1"
            />
            <button
              onClick={handleUpdateBalance}
              className="bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold px-3 py-1 rounded border border-[#D4AF37] hover:bg-[#ffe088]"
            >
              Set
            </button>
          </div>
        </div>

        {/* Bet Config Card */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <Settings className="w-5 h-5" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Bet Settings</h3>
          </div>
          <div>
            <div className="font-space font-bold text-xl text-[#e5e2e1]">
              {(details.demo_bet_amount || 0).toLocaleString("vi-VN")} VND
            </div>
            <div className="font-mono text-[9px] text-[#99907c] uppercase mt-1">
              Base Stake Amount
            </div>
          </div>
          {/* Custom Stake adjustment */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Base Bet Amount..."
              value={betAmountInput}
              onChange={(e) => setBetAmountInput(e.target.value)}
              className="bg-[#0e0e0e]/80 border border-[#D4AF37]/20 rounded px-2.5 py-1 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/60 focus:outline-none flex-1"
            />
            <button
              onClick={handleUpdateBetAmount}
              className="bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold px-3 py-1 rounded border border-[#D4AF37] hover:bg-[#ffe088]"
            >
              Update
            </button>
          </div>
        </div>

        {/* Bot Strategy Controls */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-space font-bold text-xs text-[#D4AF37] uppercase tracking-wider">Bot Strategy</span>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded border border-green-500/35 bg-green-500/10 text-green-400 font-mono text-[10px] uppercase font-bold">
              <Play className="w-3 h-3" />
              <span>Autoplay Active</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[9px] text-[#99907c] uppercase">Select money rule</label>
            <select
              value={strategySelect}
              onChange={(e) => handleUpdateStrategy(e.target.value)}
              className="w-full bg-[#0e0e0e]/80 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/60 focus:outline-none"
            >
              <option value="martingale_x3">Gấp thếp x3 (Martingale)</option>
              <option value="kelly_half_martingale_x3">Tối ưu - Dynamic Kelly & Martingale</option>
              <option value="dkm_adaptive_pro">Chuyên nghiệp - Adaptive DKM Pro Engine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Analysis Banner */}
      <div className="glass-panel p-4 rounded-lg flex justify-between items-center border-l-4 border-l-[#D4AF37] flex-wrap gap-4">
        <div>
          <span className="font-sans text-xs text-[#99907c] block">Khả năng chịu chuỗi thua liên tiếp (Risk Tolerated)</span>
          <span className="font-sans text-[11px] text-[#e5e2e1] font-semibold mt-1 block">
            {balance.max_loss_streak_tolerated >= 5 ? "Tài khoản rất an toàn!" : "Cảnh báo rủi ro gãy vốn cao!"}
          </span>
        </div>
        <div className="font-space font-bold text-xl text-[#D4AF37]">{balance.max_loss_streak_tolerated} kỳ liên tiếp</div>
      </div>

      {/* Custom Capital Risk Analytics Panel */}
      {riskInfo && (
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-2 text-[#D4AF37] border-b border-[#D4AF37]/15 pb-2">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-space font-bold text-xs uppercase tracking-wider">Bảng Phân Tích Rủi Ro & Lợi Nhuận Thực Tế (Capital Risk Panel)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Parity Risk Details */}
            <div className="space-y-2.5">
              <div className="font-space font-bold text-[#D4AF37] uppercase text-[10px] border-b border-[#D4AF37]/5 pb-1">Hạng mục: Chẵn / Lẻ</div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Win Rate thực tế:</span>
                <span className="text-[#e5e2e1] font-semibold">{(riskInfo.parity.win_rate_used * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">EV mỗi kỳ cược (x1.95):</span>
                <span className={`font-semibold ${riskInfo.parity.ev_per_bet >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {riskInfo.parity.ev_per_bet >= 0 ? "+" : ""}{(riskInfo.parity.ev_per_bet * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">% vốn cược mỗi kỳ:</span>
                <span className="text-[#e5e2e1] font-semibold">{(riskInfo.parity.pct_of_balance).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Sụt giảm trong 24h:</span>
                <span className={`font-semibold ${
                  riskInfo.parity.daily_loss_limit && riskInfo.parity.daily_loss_count >= riskInfo.parity.daily_loss_limit ? "text-red-400" : "text-amber-500"
                }`}>
                  {riskInfo.parity.daily_loss_count} / {riskInfo.parity.daily_loss_limit ?? "Không giới hạn"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Kỳ vọng số dư sau 100 kỳ:</span>
                <span className="text-[#e5e2e1] font-semibold">{(riskInfo.parity.expected_balance_after_100 || 0).toLocaleString("vi-VN")} VND</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Tỷ lệ tăng trưởng dự kiến:</span>
                <span className={`font-semibold ${riskInfo.parity.expected_growth_pct_100 >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {riskInfo.parity.expected_growth_pct_100 >= 0 ? "+" : ""}{(riskInfo.parity.expected_growth_pct_100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Size Risk Details */}
            <div className="space-y-2.5">
              <div className="font-space font-bold text-[#D4AF37] uppercase text-[10px] border-b border-[#D4AF37]/5 pb-1">Hạng mục: Tài / Xỉu</div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Win Rate thực tế:</span>
                <span className="text-[#e5e2e1] font-semibold">{(riskInfo.size.win_rate_used * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">EV mỗi kỳ cược (x1.95):</span>
                <span className={`font-semibold ${riskInfo.size.ev_per_bet >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {riskInfo.size.ev_per_bet >= 0 ? "+" : ""}{(riskInfo.size.ev_per_bet * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">% vốn cược mỗi kỳ:</span>
                <span className="text-[#e5e2e1] font-semibold">{(riskInfo.size.pct_of_balance).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Sụt giảm trong 24h:</span>
                <span className={`font-semibold ${
                  riskInfo.size.daily_loss_limit && riskInfo.size.daily_loss_count >= riskInfo.size.daily_loss_limit ? "text-red-400" : "text-amber-500"
                }`}>
                  {riskInfo.size.daily_loss_count} / {riskInfo.size.daily_loss_limit ?? "Không giới hạn"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Kỳ vọng số dư sau 100 kỳ:</span>
                <span className="text-[#e5e2e1] font-semibold">{(riskInfo.size.expected_balance_after_100 || 0).toLocaleString("vi-VN")} VND</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D4AF37]/5">
                <span className="text-[#99907c]">Tỷ lệ tăng trưởng dự kiến:</span>
                <span className={`font-semibold ${riskInfo.size.expected_growth_pct_100 >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {riskInfo.size.expected_growth_pct_100 >= 0 ? "+" : ""}{(riskInfo.size.expected_growth_pct_100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart - growth graph */}
      {chartData.length > 0 && (
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h3 className="font-space font-bold text-sm tracking-wider text-[#D4AF37] uppercase">
            Equity Curve (Growth Trend)
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="index" stroke="#4d4635" fontSize={10} className="font-mono" />
                <YAxis stroke="#4d4635" fontSize={10} className="font-mono" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1b1b",
                    borderColor: "rgba(212, 175, 55, 0.2)",
                    borderRadius: "4px",
                    color: "#e5e2e1",
                    fontSize: "11px",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                />
                <Area type="monotone" dataKey="balance" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#goldGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bets Table */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <h3 className="font-space font-bold text-sm tracking-wider text-[#e5e2e1] uppercase">
              Demo Bets Ledger
            </h3>
            {balance.summary && (
              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                balance.summary.net_profit >= 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                Lợi nhuận ròng: {balance.summary.net_profit >= 0 ? "+" : ""}{balance.summary.net_profit.toLocaleString("vi-VN")} VND
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Pagination Controls */}
            <div className="flex items-center space-x-1.5 mr-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 disabled:opacity-30 text-[#D4AF37] rounded transition-all duration-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[9px] text-[#99907c] uppercase">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 disabled:opacity-30 text-[#D4AF37] rounded transition-all duration-300"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href="http://localhost:8000/api/export/demo-bets"
              download
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
        
        <Table 
          columns={betColumns} 
          data={bets} 
          emptyMessage="Chưa có lượt đặt cược giả lập nào." 
        />
      </div>

      {/* Capital Collapse Logs Table */}
      <div className="glass-panel p-5 rounded-lg border-l-4 border-l-red-500/40 space-y-4">
        <div>
          <h3 className="font-space font-bold text-sm tracking-wider text-[#e5e2e1] uppercase">
            Lịch Sử Gãy Quản Lý Vốn (Capital Collapse Logs)
          </h3>
          <p className="font-sans text-[9px] text-[#99907c] mt-0.5">
            Ghi nhận các chuỗi thua liên tiếp vượt quá giới hạn an toàn của tài khoản giả lập.
          </p>
        </div>
        <Table columns={collapseColumns} data={collapses} emptyMessage="Chưa ghi nhận sự kiện gãy quản lý vốn nào." />
      </div>

      {/* Custom Confirm Modals */}
      <ConfirmModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleConfirmResetBalance}
        title="Reset Số Dư Giả Lập"
        message="Bạn có chắc chắn muốn Reset số dư giả lập về 10,000,000 VND và xóa sạch lịch sử cược ảo không?"
        confirmLabel="Reset Ngay"
        cancelLabel="Hủy Bỏ"
      />

      <ConfirmModal
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={handleConfirmClearBets}
        title="Xóa Sạch Lịch Sử Cược & Xổ Số"
        message="Bạn có chắc chắn muốn Xóa sạch lịch sử cược ảo và dữ liệu xổ số trong bộ nhớ đệm để kích hoạt scraper tải lại không?"
        confirmLabel="Xóa Sạch"
        cancelLabel="Hủy Bỏ"
      />
    </div>
  );
}
