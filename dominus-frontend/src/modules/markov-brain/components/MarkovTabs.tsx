"use client";

import React, { useState, useEffect, useRef } from "react";
import MarkovAnalytics from "./MarkovAnalytics";
import MarkovTradingPanel from "./MarkovTradingPanel";
import MarkovConnectionPanel from "./MarkovConnectionPanel";
import MarkovAlgorithmConfig from "./MarkovAlgorithmConfig";
import { useToast } from "../../core/components/ui/Toast";
import { RefreshCw, Radio, Settings, Wallet, Trash2 } from "lucide-react";

export default function MarkovTabs() {
  const [activeTab, setActiveTab] = useState("analytics");
  const { showToast } = useToast();

  // Internal sidebar state for Markov
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [realBalance, setRealBalance] = useState(0);
  const [dbConfig, setDbConfig] = useState<any>(null);

  // Active game mode state variables
  const [lotteryId, setLotteryId] = useState(48);
  const [lotteryCode, setLotteryCode] = useState("mb75g");
  const [aiEngine, setAiEngine] = useState("Loading...");

  // Store last processed issue codes to prevent duplicate toasts
  const lastPredIssueRef = useRef<string | null>(null);
  const lastBetIssueRef = useRef<string | null>(null);

  const tabs = [
    { id: "analytics", label: "Analytics & Statistics" },
    { id: "trading", label: "Mock Trading Console" },
    { id: "connection", label: "Sync & Connection" },
    { id: "algorithm", label: "Parameters & Config" },
  ];

  const fetchMarkovQuickStats = async () => {
    try {
      // 1. Fetch statistics & socket status
      const statsRes = await fetch("http://localhost:8000/api/statistics?limit=1");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setWsStatus(statsData.ws_status || "disconnected");
        setLotteryId(statsData.lottery_id || 48);
        setLotteryCode(statsData.lottery_code || "mb75g");
        
        if (statsData.data?.ai_recommendation) {
          setAiEngine(statsData.data.ai_recommendation.engine || "Heuristics (3-Layer)");
        } else {
          setAiEngine("Heuristics (3-Layer)");
        }
      }

      // 2. Fetch real balance
      const balanceRes = await fetch("http://localhost:8000/api/balance");
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        if (balanceData.balances) {
          setRealBalance(balanceData.balances.real_balance || 0);
        }
      }

      // 3. Fetch active database configuration parameters
      const configRes = await fetch("http://localhost:8000/api/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setDbConfig(configData);
      }
    } catch (err) {
      console.warn("Failed to fetch Markov quick sidebar status:", err);
    }
  };

  // Poll predictions and bets to notify new events
  const pollNewEvents = async () => {
    try {
      // 1. Check predictions
      const predRes = await fetch("http://localhost:8000/api/predictions?limit=1");
      if (predRes.ok) {
        const predData = await predRes.json();
        const latest = predData.data?.[0];
        if (latest && latest.issue) {
          if (lastPredIssueRef.current === null) {
            lastPredIssueRef.current = latest.issue;
          } else if (latest.issue !== lastPredIssueRef.current) {
            lastPredIssueRef.current = latest.issue;
            
            const hasP = latest.predicted_parity && latest.predicted_parity !== "Không có" && latest.predicted_parity !== "BO QUA";
            const hasS = latest.predicted_size && latest.predicted_size !== "Không có" && latest.predicted_size !== "BO QUA";

            if (hasP || hasS) {
              let content = `<strong>Kỳ Quay:</strong> #${latest.issue}<br>`;
              if (hasP) {
                const pVal = latest.predicted_parity === "Le" ? "Lẻ" : "Chẵn";
                content += `• Chẵn/Lẻ: <strong>${pVal}</strong> (${latest.parity_confidence}%)<br>`;
              }
              if (hasS) {
                const sVal = latest.predicted_size === "Tai" ? "Tài" : "Xỉu";
                content += `• Tài/Xỉu: <strong>${sVal}</strong> (${latest.size_confidence}%)<br>`;
              }
              showToast(`Tín Hiệu Dự Đoán #${latest.issue}`, content, "prediction");
            }
          }
        }
      }

      // 2. Check bets placement
      const balanceRes = await fetch("http://localhost:8000/api/balance?limit=1");
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        const latestBet = balanceData.demo_bets?.[0];
        if (latestBet && latestBet.issue) {
          if (lastBetIssueRef.current === null) {
            lastBetIssueRef.current = latestBet.issue;
          } else if (latestBet.issue !== lastBetIssueRef.current) {
            lastBetIssueRef.current = latestBet.issue;

            const market = latestBet.market_type === "parity" ? "Chẵn/Lẻ" : "Tài/Xỉu";
            const content = `<strong>Kỳ Quay:</strong> #${latestBet.issue}<br>• Hạng mục: ${market}<br>• Lựa chọn: <strong>${latestBet.prediction}</strong><br>• Tiền cược: <strong>${latestBet.amount.toLocaleString("vi-VN")} VND</strong>`;
            showToast(`Đặt Cược Giả Lập #${latestBet.issue}`, content, "bet");
          }
        }
      }
    } catch (err) {
      console.warn("Event notification poller offline:", err);
    }
  };

  const handleQuickReconnect = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/reconnect", {
        method: "POST",
      });
      if (res.ok) {
        showToast("Quick Reconnect", "Đang kết nối lại Socket Scraper...", "success");
        fetchMarkovQuickStats();
      }
    } catch (err) {
      showToast("Lỗi", "Không thể gửi lệnh Reconnect.", "error");
    }
  };

  const handleGameChange = async (val: string) => {
    const [idStr, code] = val.split("_");
    const id = parseInt(idStr);
    try {
      const res = await fetch("http://localhost:8000/api/config-lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lottery_id: id,
          lottery_code: code,
        }),
      });
      if (res.ok) {
        setLotteryId(id);
        setLotteryCode(code);
        showToast("Đổi Game Thành Công", `Đã chuyển đổi đích sang: ${code.toUpperCase()}`, "success");
        fetchMarkovQuickStats();
      }
    } catch (err) {
      showToast("Lỗi Hệ Thống", "Đổi game mode thất bại.", "error");
    }
  };

  const handleManualSync = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/trigger-fetch", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Sync Thành Công", data.message || "Manual sync completed!", "success");
      }
    } catch (err) {
      showToast("Lỗi Sync", "Gửi tín hiệu đồng bộ thất bại.", "error");
    }
  };

  const handleResetSystemData = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử dự đoán và lịch sử cược?")) return;
    try {
      const [clearRes, clearBetsRes] = await Promise.all([
        fetch("http://localhost:8000/api/clear", { method: "POST" }),
        fetch("http://localhost:8000/api/balance/clear-bets", { method: "POST" })
      ]);
      if (clearRes.ok && clearBetsRes.ok) {
        showToast("Reset Thành Công", "Đã xóa sạch dữ liệu dự đoán và lịch sử cược giả lập.", "success");
        fetchMarkovQuickStats();
        window.dispatchEvent(new Event("markovConfigChanged"));
      } else {
        showToast("Lỗi Reset", "Một hoặc nhiều tác vụ xóa thất bại.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Không thể gửi yêu cầu Reset dữ liệu.", "error");
    }
  };

  // Helper mapping game title
  const getGameTitle = (code: string) => {
    if (code === "mb45g") return "Miền Bắc 45 Giây";
    if (code === "mb75g") return "Miền Bắc 75 Giây";
    if (code === "pmb5p") return "Miền Bắc 5 Phút";
    return code.toUpperCase();
  };

  useEffect(() => {
    fetchMarkovQuickStats();
    pollNewEvents();

    const statsInterval = setInterval(fetchMarkovQuickStats, 5000);
    const eventsInterval = setInterval(pollNewEvents, 3000);

    // Listen for config changes from MarkovAlgorithmConfig to load parameters instantly
    const handleConfigChanged = () => {
      fetchMarkovQuickStats();
    };
    window.addEventListener("markovConfigChanged", handleConfigChanged);

    return () => {
      clearInterval(statsInterval);
      clearInterval(eventsInterval);
      window.removeEventListener("markovConfigChanged", handleConfigChanged);
    };
  }, []);

  const pCfg = dbConfig?.parity_config || {};

  return (
    <div className="space-y-4">
      {/* Service-Specific Header for MarkovBrain AI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#D4AF37]/10 gap-4">
        <div className="flex items-center space-x-3">
          <span className="font-space font-bold text-base text-[#D4AF37] uppercase tracking-wider">MarkovBrain AI Service</span>
          <span className="text-[10px] text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/25 font-semibold font-mono">
            {getGameTitle(lotteryCode)}
          </span>
        </div>

        {/* Upper Right Action Container containing Tab Selectors & Reset System button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#0e0e0e]/85 border border-[#D4AF37]/15 rounded p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 font-space text-[10px] uppercase font-bold tracking-wider rounded transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                    : "text-[#99907c] hover:text-[#e5e2e1]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetSystemData}
            className="p-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-500/30 hover:border-red-500/60 text-red-400 rounded transition-all duration-300 flex items-center space-x-1.5 font-mono text-[9px] uppercase tracking-wider font-bold shrink-0"
            title="Xóa toàn bộ lịch sử dự đoán và cược"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Data</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Cột trái (Markov Quick Sidebar) */}
        <div className="w-64 shrink-0 space-y-6">
          {/* Real Balance Wallet */}
          <div className="glass-panel p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2 text-[#D4AF37]">
              <Wallet className="w-4 h-4" />
              <span className="font-space font-bold text-xs uppercase tracking-wider">Real Account Wallet</span>
            </div>
            <div>
              <div className="font-space font-bold text-lg text-[#e5e2e1]">
                {realBalance.toLocaleString("vi-VN")} VND
              </div>
              <p className="font-sans text-[9px] text-[#99907c]">Số dư thực tế tài khoản sàn game</p>
            </div>
          </div>

          {/* Socket Gateway Connection Badge */}
          <div className="glass-panel p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className="font-space font-bold text-xs uppercase tracking-wider text-[#e5e2e1]">
                  {wsStatus === "connected" ? "Socket: Online" : "Socket: Offline"}
                </span>
              </div>
              <button
                onClick={handleQuickReconnect}
                title="Reconnect socket quickly"
                className="p-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] rounded transition-all duration-300"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <p className="font-sans text-[9px] text-[#99907c]">Scraper lắng nghe luồng kết quả trực tuyến</p>
          </div>

          {/* Active Configuration Widget */}
          <div className="glass-panel p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2 text-[#D4AF37]">
              <Settings className="w-4 h-4" />
              <span className="font-space font-bold text-xs uppercase tracking-wider">Active Configuration</span>
            </div>
            <div className="space-y-3">
              {/* Game Mode Selector */}
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[9px] text-[#99907c] uppercase">Game Mode</label>
                <div className="flex space-x-2">
                  <select
                    value={`${lotteryId}_${lotteryCode}`}
                    onChange={(e) => handleGameChange(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-[#D4AF37]/20 rounded px-2.5 py-1.5 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
                  >
                    <option value="47_mb45g">Miền Bắc 45 Giây</option>
                    <option value="48_mb75g">Miền Bắc 75 Giây</option>
                    <option value="45_pmb5p">Miền Bắc 5 Phút</option>
                  </select>
                  <button
                    onClick={handleManualSync}
                    title="Sync database draws fallback"
                    className="p-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded transition-all duration-300 flex items-center justify-center shrink-0 w-8"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Engine Status */}
              <div className="flex flex-col space-y-1">
                <label className="font-mono text-[9px] text-[#99907c] uppercase">AI Engine Module</label>
                <div className="font-mono text-[9px] text-[#D4AF37] border border-[#D4AF37]/25 px-2.5 py-1.5 bg-[#D4AF37]/5 uppercase tracking-wider rounded text-center font-bold">
                  {aiEngine}
                </div>
              </div>
            </div>
          </div>

          {/* PostgreSQL Database Parameters Widget */}
          <div className="glass-panel p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-space font-bold text-xs text-[#D4AF37] uppercase tracking-wider">
                Algorithm Params
              </span>
              <span className="font-mono text-[8px] text-green-400 bg-green-500/10 border border-green-500/25 px-1 py-0.5 rounded uppercase">
                Postgres
              </span>
            </div>
            
            <div className="space-y-2 font-mono text-[9px] text-[#99907c]">
              <div className="flex justify-between">
                <span>Min Buy Threshold:</span>
                <span className="text-[#e5e2e1] font-bold">
                  {pCfg.buy_threshold_min !== undefined ? `${(pCfg.buy_threshold_min * 100).toFixed(0)}%` : "55%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Extreme Reversal:</span>
                <span className="text-red-400 font-bold">
                  {pCfg.reversal_threshold !== undefined ? `${(pCfg.reversal_threshold * 100).toFixed(0)}%` : "85%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AR Window Size:</span>
                <span className="text-[#e5e2e1] font-bold">
                  {pCfg.ar_window_min !== undefined ? `${pCfg.ar_window_min}-${pCfg.ar_window_max}` : "10-30 draws"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>AR Threshold:</span>
                <span className="text-[#D4AF37] font-bold">
                  {pCfg.ar_threshold_min !== undefined ? `${pCfg.ar_threshold_min.toFixed(2)}-${pCfg.ar_threshold_max.toFixed(2)}` : "0.70-0.88"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Post-Loss Cooldown:</span>
                <span className="text-[#e5e2e1] font-bold">
                  {pCfg.cooling_off_loss_limit !== undefined ? `${pCfg.cooling_off_loss_limit} rounds` : "2 rounds"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Post-Win Cooldown:</span>
                <span className="text-[#e5e2e1] font-bold">
                  {pCfg.win_streak_pause_limit !== undefined ? `${pCfg.win_streak_pause_limit} rounds` : "2 rounds"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fractional Kelly:</span>
                <span className="text-purple-400 font-bold">
                  {pCfg.streak_safety_trap_multiplier !== undefined ? `x${pCfg.streak_safety_trap_multiplier}` : "x2"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải (Tab contents chính) */}
        <div className="flex-1 space-y-6">
          {/* Tab content */}
          <div className="transition-all duration-300">
            {activeTab === "analytics" && <MarkovAnalytics />}
            {activeTab === "trading" && <MarkovTradingPanel />}
            {activeTab === "connection" && <MarkovConnectionPanel />}
            {activeTab === "algorithm" && <MarkovAlgorithmConfig />}
          </div>
        </div>
      </div>
    </div>
  );
}
