"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Cpu, Database, Network } from "lucide-react";

interface HealthDetail {
  status: string;
  host?: string;
  port?: number;
  message?: string;
}

interface GatewayHealth {
  status: string;
  timestamp: string;
  services: {
    database: HealthDetail;
    redis: HealthDetail;
    gemini_api: HealthDetail;
    markov_brain_http: HealthDetail;
    markov_brain_ws: HealthDetail;
    mark_xlix: HealthDetail;
  };
}

export default function GatewayConsole() {
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch("http://localhost:8001/api/gateway/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.warn("Failed to fetch gateway health logs:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-lg animate-pulse flex items-center justify-center min-h-[300px]">
        <span className="font-mono text-xs text-[#99907c] tracking-widest">CONNECTING TO GATEWAY NODE...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Node Panel */}
      <div className="glass-panel p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-space font-bold text-lg text-[#D4AF37] uppercase tracking-wider">
            Dominus Executive Node
          </h2>
          <p className="font-mono text-[9px] text-[#99907c] uppercase mt-1">
            Node status:{" "}
            <span className={health?.status === "healthy" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {health?.status === "healthy" ? "ACTIVE / UNCOMPROMISED" : "SYSTEM DEGRADED"}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[9px] text-[#99907c]">
          <span>GATEWAY PORT: 8001</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
        </div>
      </div>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Infrastructure */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#e5e2e1]">
            <Database className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Core Infrastructure</h3>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {/* PostgreSQL */}
            <div className="flex justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded">
              <span className="text-[#99907c]">PostgreSQL Connection</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                health?.services?.database?.status === "healthy"
                  ? "bg-green-500/10 border border-green-500/25 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {health?.services?.database?.status === "healthy" ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            {/* Redis */}
            <div className="flex justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded">
              <span className="text-[#99907c]">Redis Cache Memory</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                health?.services?.redis?.status === "healthy"
                  ? "bg-green-500/10 border border-green-500/25 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {health?.services?.redis?.status === "healthy" ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            {/* Gemini API */}
            <div className="flex justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded">
              <span className="text-[#99907c]">Gemini Intelligence LLM</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                health?.services?.gemini_api?.status === "healthy"
                  ? "bg-green-500/10 border border-green-500/25 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {health?.services?.gemini_api?.status === "healthy" ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* Microservices Nodes */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#e5e2e1]">
            <Network className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Microservices Nodes</h3>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {/* MarkovBrain HTTP */}
            <div className="flex justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded">
              <span className="text-[#99907c]">MarkovBrain API Node (HTTP)</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                health?.services?.markov_brain_http?.status === "healthy"
                  ? "bg-green-500/10 border border-green-500/25 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {health?.services?.markov_brain_http?.status === "healthy" ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            {/* MarkovBrain WS */}
            <div className="flex justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded">
              <span className="text-[#99907c]">MarkovBrain Scanner (WebSocket)</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                health?.services?.markov_brain_ws?.status === "healthy"
                  ? "bg-green-500/10 border border-green-500/25 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {health?.services?.markov_brain_ws?.status === "healthy" ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>

            {/* Mark-XLIX */}
            <div className="flex justify-between items-center p-2.5 bg-[#0e0e0e]/50 border border-[#D4AF37]/5 rounded">
              <span className="text-[#99907c]">Mark-XLIX Jarvis Node</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                health?.services?.mark_xlix?.status === "healthy"
                  ? "bg-green-500/10 border border-green-500/25 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {health?.services?.mark_xlix?.status === "healthy" ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Console Output Logs */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex items-center space-x-3 text-[#e5e2e1]">
          <Cpu className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="font-space font-bold text-sm tracking-wider uppercase">Executive Console Output</h3>
        </div>
        <div className="p-4 bg-[#0e0e0e] border border-[#D4AF37]/10 rounded font-mono text-[10px] text-[#D4AF37] h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
          <div>[SYSTEM] Central Gate Node active at http://localhost:8001</div>
          <div>[SYSTEM] Listening for outbound AI proxy execution packages...</div>
          {health?.status === "healthy" ? (
            <div className="text-green-400">[HEALTH] Core health check passed: database, redis and services verified.</div>
          ) : (
            <div className="text-red-400">[HEALTH] WARNING: Core system state degraded, check offline services!</div>
          )}
          <div>[GATEWAY] API routing loaded: /api/gateway/health proxy initialized.</div>
          <div>[GATEWAY] PostgreSQL pool size set to 20 connection threads.</div>
          <div>[GATEWAY] Redis connection pooling established at redis://localhost:6379/0</div>
        </div>
      </div>
    </div>
  );
}
