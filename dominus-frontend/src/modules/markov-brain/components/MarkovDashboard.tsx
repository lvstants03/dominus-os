"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Award, ShieldAlert, DollarSign } from "lucide-react";
import { fetchMarkovStats } from "../../core/api";

interface StatsData {
  total_records: number;
  overall_win_rate_parity: number;
  overall_win_rate_size: number;
  current_streak_parity: number;
  current_streak_size: number;
  active_lottery_code: string;
  next_draw_prediction?: {
    predicted_parity: string;
    predicted_size: string;
    parity_confidence?: number;
    size_confidence?: number;
  };
}

export default function MarkovDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    const data = await fetchMarkovStats();
    if (data) {
      setStats(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // 10 seconds refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-lg animate-pulse flex items-center justify-center">
        <span className="font-mono text-xs text-[#99907c] tracking-widest">
          SYNCING WITH MARKOVLOTTO ENGINE...
        </span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-panel p-6 rounded-lg border-red-500/20">
        <div className="text-red-400 font-mono text-xs uppercase">
          MarkovBrain Service Connection Lost
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-space font-bold text-lg tracking-wider text-[#e5e2e1] uppercase">
          MarkovLotto Analytics Service
        </h2>
        <span className="font-mono text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 border border-[#D4AF37]/20 uppercase">
          Active: {stats.active_lottery_code}
        </span>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Parity Win Rate */}
        <div className="glass-panel p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
            <Award className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#99907c] uppercase">
              Parity Win Rate
            </div>
            <div className="font-space font-bold text-xl text-[#e5e2e1]">
              {(stats.overall_win_rate_parity * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Size Win Rate */}
        <div className="glass-panel p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#99907c] uppercase">
              Size Win Rate
            </div>
            <div className="font-space font-bold text-xl text-[#e5e2e1]">
              {(stats.overall_win_rate_size * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Streak Info */}
        <div className="glass-panel p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
            <ShieldAlert className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#99907c] uppercase">
              Streaks (Parity/Size)
            </div>
            <div className="font-space font-bold text-lg text-[#e5e2e1]">
              {stats.current_streak_parity} / {stats.current_streak_size}
            </div>
          </div>
        </div>

        {/* Total Records */}
        <div className="glass-panel p-4 rounded-lg flex items-center space-x-4">
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
            <DollarSign className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#99907c] uppercase">
              Total Processed Draws
            </div>
            <div className="font-space font-bold text-xl text-[#e5e2e1]">
              {stats.total_records}
            </div>
          </div>
        </div>
      </div>

      {/* Next Draw Prediction Box */}
      {stats.next_draw_prediction && (
        <div className="glass-panel-glow p-5 rounded-lg border-[#D4AF37]/35">
          <h3 className="font-space font-semibold text-sm text-[#D4AF37] uppercase tracking-wider mb-3">
            Active Prediction Signal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-[#131313]/50 border border-[#D4AF37]/10 rounded">
              <div className="font-mono text-[10px] text-[#99907c] uppercase">
                Odd/Even Target
              </div>
              <div className="font-space font-bold text-lg text-[#e5e2e1] mt-1">
                {stats.next_draw_prediction.predicted_parity}
              </div>
              {stats.next_draw_prediction.parity_confidence && (
                <div className="font-mono text-[10px] text-[#D4AF37] mt-1">
                  Confidence: {stats.next_draw_prediction.parity_confidence}%
                </div>
              )}
            </div>

            <div className="p-3 bg-[#131313]/50 border border-[#D4AF37]/10 rounded">
              <div className="font-mono text-[10px] text-[#99907c] uppercase">
                Big/Small Target
              </div>
              <div className="font-space font-bold text-lg text-[#e5e2e1] mt-1">
                {stats.next_draw_prediction.predicted_size}
              </div>
              {stats.next_draw_prediction.size_confidence && (
                <div className="font-mono text-[10px] text-[#D4AF37] mt-1">
                  Confidence: {stats.next_draw_prediction.size_confidence}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
