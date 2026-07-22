"use client";

import React, { ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#070707]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className={`glass-panel w-full ${maxWidth} rounded-lg border border-[#D4AF37]/25 shadow-[0_0_20px_rgba(212,175,55,0.1)] relative z-10 flex flex-col max-h-[90vh] overflow-hidden`}>
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#D4AF37]/15">
          <h3 className="font-space font-bold text-sm tracking-wider text-[#D4AF37] uppercase">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#99907c] hover:text-[#e5e2e1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-5 overflow-y-auto font-sans text-xs text-[#99907c]">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex items-start space-x-3 text-[#e5e2e1]">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="font-sans text-[11px] leading-relaxed text-[#99907c]">{message}</p>
        </div>

        <div className="flex justify-end space-x-3 border-t border-[#D4AF37]/10 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#161616] border border-[#D4AF37]/10 rounded hover:bg-[#1f1f1f] text-[#99907c] font-mono text-[10px] uppercase font-bold transition-all duration-300"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-[#f2ca50] text-[#3c2f00] border border-[#D4AF37] rounded hover:bg-[#ffe088] font-mono text-[10px] uppercase font-bold transition-all duration-300"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
