"use client";

import React, { ReactNode } from "react";

interface Column<T> {
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  maxHeight = "max-h-[400px]",
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto ${maxHeight} scrollbar-thin`}>
      <table className="w-full text-left font-mono text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#D4AF37]/20 text-[#99907c]">
            {columns.map((col, idx) => (
              <th key={idx} className={`py-2 px-3 ${col.className || ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center">
                <span className="font-mono text-[10px] tracking-widest text-[#99907c] animate-pulse">
                  FETCHING RECORD NODES...
                </span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-[#99907c]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5 transition-colors duration-150"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-2.5 px-3 ${col.className || ""}`}>
                    {col.render(row, rowIdx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
