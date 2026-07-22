"use client";

import React from "react";
import { Terminal, BrainCircuit, Mic, ChevronLeft, ChevronRight, LogOut } from "lucide-react";

interface SidebarProps {
  activeService: string;
  setActiveService: (service: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ activeService, setActiveService, isCollapsed, setIsCollapsed, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "core", label: "Dominus Core Node", icon: Terminal },
    { id: "markov", label: "MarkovBrain AI", icon: BrainCircuit },
  ];

  return (
    <aside
      className={`relative bg-[#0e0e0e] border-r border-[#D4AF37]/15 flex flex-col justify-between shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-[#D4AF37]/15 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <div className={`flex items-center overflow-hidden ${isCollapsed ? "justify-center" : "space-x-3"}`}>
          <div className="w-8 h-8 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.15)] shrink-0 overflow-hidden">
            <img src="/favicon-package/favicon-96x96.png" className="w-5 h-5 object-contain" alt="Dominus Logo" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-space font-bold text-sm text-[#e5e2e1] tracking-wider uppercase block">
                Dominus OS
              </span>
              <span className="font-mono text-[8px] text-[#99907c] tracking-widest uppercase">
                AI EXECUTIVE LAYER
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {!isCollapsed && (
          <span className="font-mono text-[9px] text-[#99907c] uppercase tracking-wider block px-2 mb-2">
            Systems Control
          </span>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeService === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveService(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded font-space text-xs uppercase font-bold tracking-wider transition-all duration-300 ${
                isCollapsed ? "justify-center p-2.5" : "space-x-3 px-3 py-2.5"
              } ${
                isActive
                  ? "bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37]"
                  : "border border-transparent text-[#99907c] hover:text-[#e5e2e1] hover:bg-[#161616]"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#D4AF37]" : "text-[#99907c]"}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Session Profile & LogOut */}
      <div className="p-3 border-t border-[#D4AF37]/10 flex flex-col gap-2">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"} overflow-hidden`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/45 flex items-center justify-center font-bold text-[10px] text-[#D4AF37] uppercase shrink-0">
              {user?.username?.substring(0, 2) || "U"}
            </div>
            {!isCollapsed && (
              <div className="truncate font-mono text-[10px] text-[#e5e2e1]">
                <span className="block font-bold truncate">{user?.username}</span>
                <span className="block text-[8px] text-[#99907c] uppercase">{user?.role}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống"
              className="p-1 hover:bg-red-950/20 text-[#99907c] hover:text-red-400 rounded transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {isCollapsed && (
          <button
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống"
            className="w-full flex justify-center py-1 hover:bg-red-950/20 text-[#99907c] hover:text-red-400 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#D4AF37]/15 bg-[#0a0a0a] overflow-hidden">
        {isCollapsed ? (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="System Online" />
          </div>
        ) : (
          <div className="font-mono text-[8px] text-[#99907c] uppercase tracking-wider truncate">
            Node Status: Secure Connection
          </div>
        )}
      </div>

      {/* Floating Toggle Collapse Button in vertical center */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-50 w-6 h-6 rounded-full bg-[#0e0e0e] border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 text-[#D4AF37] flex items-center justify-center transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.15)] hover:scale-110"
        title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
