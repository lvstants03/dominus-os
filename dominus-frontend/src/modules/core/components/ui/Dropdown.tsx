"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  label?: string;
  width?: string;
}

export default function Dropdown({ options, selectedValue, onChange, label, width = "w-48" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${width}`}>
      {label && <label className="block font-mono text-[9px] text-[#99907c] uppercase mb-1">{label}</label>}
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-[#0e0e0e] border border-[#D4AF37]/20 rounded px-3 py-1.5 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none transition-all duration-300"
        >
          <span>{selectedOption?.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#99907c] shrink-0" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-40 mt-1 w-full rounded bg-[#0f172a] border border-[#D4AF37]/20 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-mono transition-all duration-300 ${
                  option.value === selectedValue
                    ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "text-[#99907c] hover:text-[#e5e2e1] hover:bg-[#161616]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
