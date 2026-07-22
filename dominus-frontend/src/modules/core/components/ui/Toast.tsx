"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Sparkles, Target } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "prediction" | "bet";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case "prediction":
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
      case "bet":
        return <Target className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-green-500/30";
      case "error":
        return "border-red-500/30";
      case "warning":
        return "border-amber-500/30";
      case "prediction":
        return "border-indigo-500/30";
      case "bet":
        return "border-emerald-500/30";
      case "info":
      default:
        return "border-[#D4AF37]/30";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass-panel p-4 rounded border ${getBorderColor(t.type)} flex items-start space-x-3 shadow-lg animate-slide-in`}
          >
            {getIcon(t.type)}
            <div className="flex-1 space-y-1">
              <h5 className="font-space font-bold text-xs text-[#e5e2e1] uppercase">{t.title}</h5>
              <div 
                className="font-sans text-[11px] text-[#99907c] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: t.message }}
              />
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#99907c] hover:text-[#e5e2e1] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
