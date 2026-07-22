"use client";

import React, { useEffect, useState } from "react";
import { Server, Database, Brain, Activity, PlayCircle } from "lucide-react";
import { fetchGatewayHealth } from "../api";

interface ServiceHealth {
  status: string;
  latency_ms?: number;
  websocket_status?: string;
  error?: string;
}

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    gemini_api: ServiceHealth;
    markov_brain: ServiceHealth;
    mark_xlix: ServiceHealth;
  };
}

export default function HealthMonitor() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    const health = await fetchGatewayHealth();
    if (health) {
      setData(health);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 5000); // 5 seconds polling
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-[#99907c] font-mono text-xs">
        CONNECTING TO GATEWAY...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel p-4 rounded-lg border-red-500/20">
        <div className="text-red-400 font-mono text-xs">
          GATEWAY CONNECTION OFFLINE
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    if (status === "healthy") return "bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]";
    if (status === "offline") return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";
    return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]";
  };

  const getIcon = (key: string) => {
    switch (key) {
      case "database":
        return <Database className="w-4 h-4 text-[#D4AF37]" />;
      case "redis":
        return <Server className="w-4 h-4 text-[#D4AF37]" />;
      case "gemini_api":
        return <Brain className="w-4 h-4 text-[#D4AF37]" />;
      case "markov_brain":
        return <Activity className="w-4 h-4 text-[#D4AF37]" />;
      case "mark_xlix":
        return <PlayCircle className="w-4 h-4 text-[#D4AF37]" />;
      default:
        return <Server className="w-4 h-4 text-[#D4AF37]" />;
    }
  };

  const renameService = (key: string) => {
    switch (key) {
      case "database":
        return "Shared Database (PG)";
      case "redis":
        return "Shared Cache (Redis)";
      case "gemini_api":
        return "Google Gemini API";
      case "markov_brain":
        return "MarkovBrain Engine";
      case "mark_xlix":
        return "Mark-XLIX (Jarvis)";
      default:
        return key;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-space font-bold text-lg tracking-wider text-[#e5e2e1] uppercase">
          System Core Health
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(data.status)} animate-gold-pulse`} />
          <span className="font-mono text-xs uppercase text-[#D4AF37]">
            {data.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(data.services).map(([key, service]) => (
          <div key={key} className="glass-panel p-4 rounded-lg flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              {getIcon(key)}
              <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} ${service.status === "healthy" ? "animate-gold-pulse" : ""}`} />
            </div>
            <div>
              <div className="font-space font-semibold text-sm text-[#e5e2e1]">
                {renameService(key)}
              </div>
              <div className="font-mono text-[10px] text-[#99907c] uppercase mt-1">
                {service.status === "healthy" && service.latency_ms
                  ? `latency: ${service.latency_ms}ms`
                  : service.status}
              </div>
              {service.websocket_status && (
                <div className="font-mono text-[9px] text-[#D4AF37] uppercase mt-0.5">
                  ws: {service.websocket_status}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
