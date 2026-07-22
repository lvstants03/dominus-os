"use client";

import React, { useState } from "react";
import Sidebar from "../modules/core/components/Sidebar";
import GatewayConsole from "../modules/core/components/GatewayConsole";
import MarkovTabs from "../modules/markov-brain/components/MarkovTabs";
import VoiceControl from "../modules/mark-xlix/components/VoiceControl";
import AuthScreen from "../modules/core/components/AuthScreen";
import { Mic } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeService, setActiveService] = useState("markov");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  if (!user) {
    return <AuthScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-screen bg-[#131313] overflow-hidden text-[#e5e2e1]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeService={activeService}
        setActiveService={setActiveService}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        user={user}
        onLogout={() => setUser(null)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1 p-6 max-w-[1440px] mx-auto w-full space-y-6 flex flex-col justify-between">
          {/* Header Command Center */}
          <header className="flex flex-row items-center justify-between py-4 border-b border-[#D4AF37]/15">
            <div>
              <h1 className="font-space font-bold text-2xl tracking-widest text-[#D4AF37] uppercase flex items-center gap-2">
                <span>Dominus OS Dashboard</span>
              </h1>
              <p className="font-mono text-[9px] text-[#99907c] tracking-[0.2em] uppercase mt-1">
                Central Executive Intelligence Operating System
              </p>
            </div>
            
            {/* Global Actions / Utilities */}
            <div className="relative">
              <button
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                className={`p-2 rounded-full border transition-all duration-300 ${
                  showVoicePanel
                    ? "bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                    : "bg-[#0e0e0e]/80 border-[#D4AF37]/15 text-[#99907c] hover:border-[#D4AF37]/45 hover:text-[#e5e2e1]"
                }`}
                title="Bật trợ lý giọng nói Mark-XLIX"
              >
                <Mic className="w-4 h-4" />
              </button>

              {showVoicePanel && (
                <div className="absolute right-0 mt-3 w-80 z-50 animate-fade-in shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  <VoiceControl />
                </div>
              )}
            </div>
          </header>

          {/* Dynamic Component Content Rendering */}
          <section className="flex-1 py-2">
            {activeService === "core" && <GatewayConsole />}
            {activeService === "markov" && <MarkovTabs />}
          </section>

          {/* Footer System Console */}
          <footer className="mt-auto pt-6 border-t border-[#D4AF37]/15 flex flex-col md:flex-row items-center justify-between text-[#99907c] font-mono text-[9px] uppercase tracking-wider">
            <div>
              Console Session: ACTIVE_NODE_COMMUNICATION_SECURE
            </div>
            <div className="mt-2 md:mt-0">
              Dominus-OS Project © 2026 MIT LICENSE
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
