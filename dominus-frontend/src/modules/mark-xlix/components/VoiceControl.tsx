"use client";

import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, Power } from "lucide-react";

export default function VoiceControl() {
  const [active, setActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);

  return (
    <div className="glass-panel p-6 rounded-lg space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-space font-bold text-lg tracking-wider text-[#e5e2e1] uppercase">
          Mark-XLIX Core Control
        </h2>
        <button
          onClick={() => setActive(!active)}
          className={`p-2 rounded border transition-all duration-300 ${
            active
              ? "bg-[#D4AF37] border-[#D4AF37] text-[#3c2f00]"
              : "bg-transparent border-[#D4AF37]/20 text-[#99907c] hover:border-[#D4AF37]/50"
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Pulsing Visualizer Node */}
      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        <div
          className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-500 ${
            active
              ? "border-[#D4AF37] animate-gold-pulse bg-[#D4AF37]/5"
              : "border-[#99907c]/20 bg-transparent"
          }`}
        >
          <Volume2
            className={`w-8 h-8 transition-colors duration-500 ${
              active ? "text-[#D4AF37]" : "text-[#99907c]/30"
            }`}
          />
        </div>
        <div className="font-mono text-[10px] text-[#99907c] tracking-widest uppercase">
          {active ? "JARVIS LISTENING..." : "JARVIS SLEEPING"}
        </div>
      </div>

      {/* Control Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setMicOn(!micOn)}
          disabled={!active}
          className={`flex items-center justify-center space-x-2 p-3 rounded font-mono text-xs uppercase border transition-all duration-300 ${
            !active
              ? "opacity-30 cursor-not-allowed border-[#99907c]/10 text-[#99907c]/40"
              : micOn
              ? "bg-[#1c1b1b]/80 border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#1c1b1b]"
              : "bg-[#1c1b1b]/40 border-red-500/20 text-red-400 hover:bg-[#1c1b1b]"
          }`}
        >
          {micOn ? (
            <>
              <Mic className="w-4 h-4" />
              <span>Mic Enabled</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span>Mic Muted</span>
            </>
          )}
        </button>

        <button
          onClick={() => setCameraOn(!cameraOn)}
          disabled={!active}
          className={`flex items-center justify-center space-x-2 p-3 rounded font-mono text-xs uppercase border transition-all duration-300 ${
            !active
              ? "opacity-30 cursor-not-allowed border-[#99907c]/10 text-[#99907c]/40"
              : cameraOn
              ? "bg-[#1c1b1b]/80 border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#1c1b1b]"
              : "bg-[#1c1b1b]/40 border-red-500/20 text-red-400 hover:bg-[#1c1b1b]"
          }`}
        >
          {cameraOn ? (
            <>
              <Video className="w-4 h-4" />
              <span>Cam Active</span>
            </>
          ) : (
            <>
              <VideoOff className="w-4 h-4" />
              <span>Cam Stopped</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
