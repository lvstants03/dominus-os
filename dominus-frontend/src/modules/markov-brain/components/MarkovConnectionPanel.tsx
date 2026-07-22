"use client";

import React, { useEffect, useState } from "react";
import { Link, Clipboard, Check, RefreshCw, Radio, Settings, ShieldAlert, Cpu } from "lucide-react";
import { useToast } from "../../core/components/ui/Toast";
import Table from "../../core/components/ui/Table";

interface SocketLog {
  timestamp?: number;
  time: string;
  event: string;
  details: string;
}

export default function MarkovConnectionPanel() {
  const { showToast } = useToast();

  const [tokenInput, setTokenInput] = useState("");
  const [cookieInput, setCookieInput] = useState("");
  const [cfTokenInput, setCfTokenInput] = useState("");
  
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchInterval, setFetchInterval] = useState(60);

  const [copiedText, setCopiedText] = useState("");
  const [socketLogs, setSocketLogs] = useState<SocketLog[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Active tab inside automation section
  const [activeSnippetTab, setActiveSnippetTab] = useState<"console" | "bookmarklet" | "tampermonkey">("console");

  const fetchSocketLogs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/socket/history?limit=30");
      if (res.ok) {
        const data = await res.json();
        setSocketLogs(data.data || []);
      }
    } catch (err) {
      console.warn("Socket history offline:", err);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    fetchSocketLogs();
    const interval = setInterval(fetchSocketLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateToken = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/config-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput || null,
          cookie: cookieInput || null,
          cf_auth_token: cfTokenInput || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setTokenInput("");
        setCookieInput("");
        setCfTokenInput("");
        showToast("Đồng Bộ Thành Công", "Đã cập nhật WebSocket token và Cookie vào hệ thống!", "success");
        fetchSocketLogs();
      } else {
        showToast("Lỗi Đồng Bộ", data.message || "Failed to update token.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Không thể gửi dữ liệu cấu hình tới server.", "error");
    }
  };

  const handleUpdateFetch = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/config-fetcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: fetchUrl,
          interval: fetchInterval,
        }),
      });
      if (res.ok) {
        setFetchUrl("");
        showToast("Cập Nhật Thành Công", "Đã lưu cấu hình HTTP fetcher target!", "success");
      } else {
        showToast("Lỗi Cấu Hình", "Không thể lưu thông tin fetcher.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Có lỗi xảy ra khi cập nhật fetcher.", "error");
    }
  };

  const handleReconnect = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/reconnect", {
        method: "POST",
      });
      if (res.ok) {
        showToast("Reconnect", "Đã gửi tín hiệu khởi động lại WebSocket!", "success");
        fetchSocketLogs();
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Không thể khởi động lại socket.", "error");
    }
  };

  // Base raw script that handles capturing WS traffic
  const rawConsoleCode = `(function() {
    'use strict';

    let storedToken = null;
    let storedCfAuthToken = null;
    let isUnloading = false;
    let reloadTimeout = null;

    // Ngăn chặn reload khi người dùng chủ động rời trang
    window.addEventListener('beforeunload', () => {
        isUnloading = true;
    });

    // Hàm tải lại trang an toàn có debounce 3s
    function safeReload(reason) {
        if (isUnloading) return;
        if (reloadTimeout) return;
        console.log("[Auto-Sync] Yêu cầu tải lại trang do: " + reason + ". Đang đợi 3s...");
        reloadTimeout = setTimeout(() => {
            if (!isUnloading) {
                window.location.reload();
            }
        }, 3000);
    }

    const originalFetch = window.fetch;

    // Gửi thông tin WebSocket Token, cf-auth-token và Cookie về local bot
    function syncToBot() {
        if (!storedToken) return;
        originalFetch('http://127.0.0.1:8000/api/config-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: storedToken,
                cf_auth_token: storedCfAuthToken || null,
                cookie: document.cookie || null
            })
        })
        .then(r => r.json())
        .then(d => {
            console.log("Successfully synced with local bot!", d);
        })
        .catch(err => {
            console.error("Failed to sync with local bot:", err);
        });
    }

    // 1. Hook WebSocket (Bắt WS Token) + Tự động reload an toàn
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        const isMainWs = url.includes("token=");
        if (isMainWs) {
            try {
                storedToken = url.split("token=")[1].split("&")[0];
                syncToBot();
            } catch (e) {
                console.error("Error extracting token:", e);
            }
        }

        const ws = new OriginalWebSocket(url, protocols);

        // Chỉ theo dõi trạng thái mất kết nối của WebSocket chính
        if (isMainWs) {
            ws.addEventListener('close', function(event) {
                if (!isUnloading) {
                    safeReload('WebSocket đóng');
                }
            });
            ws.addEventListener('error', function(error) {
                if (!isUnloading) {
                    safeReload('WebSocket lỗi');
                }
            });
        }

        return ws;
    };
    window.WebSocket.prototype = OriginalWebSocket.prototype;

    // 2. Hook Fetch (Bắt cf-auth-token)
    window.fetch = async function(resource, init) {
        if (init && init.headers) {
            let cfToken = null;
            if (init.headers.get && typeof init.headers.get === 'function') {
                cfToken = init.headers.get('cf-auth-token');
            } else {
                for (let key in init.headers) {
                    if (key.toLowerCase() === 'cf-auth-token') {
                        cfToken = init.headers[key];
                        break;
                    }
                }
            }
            if (cfToken && cfToken !== storedCfAuthToken) {
                storedCfAuthToken = cfToken;
                console.log("Captured cf-auth-token (Fetch):", cfToken);
                syncToBot();
            }
        }
        return originalFetch.apply(this, arguments);
    };

    // 3. Hook XMLHttpRequest (Bắt cf-auth-token qua prototype tránh lỗi instanceof)
    const OriginalXHR = window.XMLHttpRequest;
    const originalSetRequestHeader = OriginalXHR.prototype.setRequestHeader;
    OriginalXHR.prototype.setRequestHeader = function(header, value) {
        if (header && header.toLowerCase() === 'cf-auth-token') {
            if (value !== storedCfAuthToken) {
                storedCfAuthToken = value;
                console.log("Captured cf-auth-token (XHR):", value);
                syncToBot();
            }
        }
        return originalSetRequestHeader.apply(this, arguments);
    };

    // 4. Nhận lệnh tải lại trang từ local bot
    setInterval(function() {
        originalFetch('http://127.0.0.1:8000/api/script/command')
        .then(r => r.json())
        .then(d => {
            if (d && d.command === 'reload') {
                console.log("Received reload command from local bot! Reloading page...");
                safeReload('Lệnh từ local bot');
            }
        })
        .catch(e => {});
    }, 2000);
  })();`;

  const bookmarkletCode = `javascript:${encodeURIComponent(rawConsoleCode)}`;

  const tampermonkeyCode = `// ==UserScript==
// @name         EE88 Token Auto-Sync với Auto-Reload
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Tự động đồng bộ token và reload trang an toàn khi mất kết nối
// @match        *://*.ee8833.me/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

${rawConsoleCode}`;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(tabName);
    showToast("Sao Chép Thành Công", `Đã copy mã ${tabName} vào clipboard!`, "success");
    setTimeout(() => setCopiedText(""), 2000);
  };

  const columns = [
    { header: "Thời Gian", render: (row: SocketLog) => row.time, className: "w-1/4" },
    {
      header: "Sự Kiện",
      render: (row: SocketLog) => (
        <span className={`font-bold ${row.event.includes("connected") ? "text-green-400" : "text-red-400"}`}>
          {row.event.toUpperCase()}
        </span>
      ),
      className: "w-1/4",
    },
    { header: "Chi Tiết / Lý Do", render: (row: SocketLog) => row.details, className: "w-2/4 text-[#e5e2e1]" },
  ];

  return (
    <div className="space-y-6">
      {/* WS Action Bar controls */}
      <div className="glass-panel p-4 rounded-lg flex items-center justify-between border-l-4 border-l-[#D4AF37] flex-wrap gap-4">
        <div>
          <span className="font-space font-bold text-xs text-[#D4AF37] uppercase block">Trạng Thái Kết Nối Backend & Game Gateway</span>
          <span className="font-sans text-[11px] text-[#99907c] mt-0.5 block">
            Điều khiển trạng thái hoạt động WebSocket scraper ngầm.
          </span>
        </div>
        <button
          onClick={handleReconnect}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/35 text-[#D4AF37] rounded font-mono text-[10px] uppercase font-bold transition-all duration-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Force Reconnect</span>
        </button>
      </div>

      {/* Forms configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WS Sync Form */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <Link className="w-4 h-4" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Sync WebSocket Bot</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-[#99907c] uppercase">WebSocket Token</label>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste WS Token here..."
                rows={2}
                className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-[#99907c] uppercase">Cookie Payload</label>
              <textarea
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="Cookie data..."
                rows={2}
                className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-[#99907c] uppercase">Cloudflare CF Token</label>
              <input
                type="text"
                value={cfTokenInput}
                onChange={(e) => setCfTokenInput(e.target.value)}
                placeholder="cf_clearance token..."
                className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>
            <button
              onClick={handleUpdateToken}
              className="w-full bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold p-2.5 rounded border border-[#D4AF37] hover:bg-[#ffe088] transition-all duration-300"
            >
              Sync Token To Engine
            </button>
          </div>
        </div>

        {/* HTTP Fallback Sync Form */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <RefreshCw className="w-4 h-4" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">HTTP Fallback Fetch</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-[9px] text-[#99907c] uppercase">HTTP Target URL</label>
              <textarea
                value={fetchUrl}
                onChange={(e) => setFetchUrl(e.target.value)}
                placeholder="Auto-fetch URL target..."
                rows={3}
                className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[9px] text-[#99907c] uppercase">
                <span>Polling Interval</span>
                <span className="text-[#D4AF37]">{fetchInterval} seconds</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={fetchInterval}
                onChange={(e) => setFetchInterval(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1c1b1b] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
            </div>
            <button
              onClick={handleUpdateFetch}
              className="w-full bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold p-2.5 rounded border border-[#D4AF37] hover:bg-[#ffe088] transition-all duration-300"
            >
              Update Fetch Config
            </button>
          </div>
        </div>
      </div>

      {/* Socket Connection Logs */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex items-center space-x-3 text-[#D4AF37]">
          <Radio className="w-4 h-4" />
          <h3 className="font-space font-bold text-sm tracking-wider uppercase">Nhật Ký Kết Nối Socket & Hệ Thống</h3>
        </div>
        
        <Table
          columns={columns}
          data={socketLogs}
          loading={tableLoading}
          emptyMessage="Chưa có nhật ký kết nối hệ thống."
          maxHeight="max-h-48"
        />
      </div>

      {/* Automation Code Snippets Tab Panel */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#D4AF37]/15 pb-3">
          <div className="flex items-center space-x-2 text-[#D4AF37]">
            <Cpu className="w-4 h-4" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Bảng Điều Khiển Auto-Sync Injectors</h3>
          </div>
          {/* Internal sub-tabs switcher */}
          <div className="flex space-x-2 font-mono text-[10px]">
            <button
              onClick={() => setActiveSnippetTab("console")}
              className={`px-3 py-1 rounded transition-all duration-200 uppercase font-bold ${
                activeSnippetTab === "console" ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35" : "text-[#99907c] hover:text-[#e5e2e1]"
              }`}
            >
              Console Code
            </button>
            <button
              onClick={() => setActiveSnippetTab("bookmarklet")}
              className={`px-3 py-1 rounded transition-all duration-200 uppercase font-bold ${
                activeSnippetTab === "bookmarklet" ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35" : "text-[#99907c] hover:text-[#e5e2e1]"
              }`}
            >
              Bookmarklet
            </button>
            <button
              onClick={() => setActiveSnippetTab("tampermonkey")}
              className={`px-3 py-1 rounded transition-all duration-200 uppercase font-bold ${
                activeSnippetTab === "tampermonkey" ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35" : "text-[#99907c] hover:text-[#e5e2e1]"
              }`}
            >
              Tampermonkey
            </button>
          </div>
        </div>

        {/* Tab contents renders */}
        {activeSnippetTab === "console" && (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <p className="font-sans text-xs text-[#99907c] leading-relaxed max-w-xl">
                Sao chép mã này và dán trực tiếp vào tab **Console** trong trình duyệt (nhấn F12) ở trang game. Script sẽ tự động bắt gói tin WebSocket và sync Token về bot.
              </p>
              <button
                onClick={() => copyToClipboard(rawConsoleCode, "Console Code")}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300 shrink-0"
              >
                {copiedText === "Console Code" ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{copiedText === "Console Code" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#0e0e0e] border border-[#D4AF37]/10 rounded font-mono text-[10px] text-[#D4AF37] overflow-x-auto max-h-48 scrollbar-thin">
              {rawConsoleCode}
            </pre>
          </div>
        )}

        {activeSnippetTab === "bookmarklet" && (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <p className="font-sans text-xs text-[#99907c] leading-relaxed max-w-xl">
                Tạo một Bookmark (dấu trang) trên trình duyệt, dán mã này vào phần URL của Bookmark đó. Mỗi lần truy cập trang game, bạn chỉ cần click vào Bookmark này để tự động tiêm script sync.
              </p>
              <button
                onClick={() => copyToClipboard(bookmarkletCode, "Bookmarklet")}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300 shrink-0"
              >
                {copiedText === "Bookmarklet" ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{copiedText === "Bookmarklet" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={bookmarkletCode}
              className="w-full bg-[#0e0e0e] border border-[#D4AF37]/10 rounded p-3 font-mono text-[10px] text-[#D4AF37] h-24 focus:outline-none"
            />
          </div>
        )}

        {activeSnippetTab === "tampermonkey" && (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <p className="font-sans text-xs text-[#99907c] leading-relaxed max-w-xl">
                Cài đặt tiện ích mở rộng Tampermonkey/Violentmonkey trên trình duyệt, tạo Userscript mới và dán toàn bộ đoạn mã này vào. Script sẽ tự động chạy mỗi khi bạn load trang game.
              </p>
              <button
                onClick={() => copyToClipboard(tampermonkeyCode, "Tampermonkey")}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300 shrink-0"
              >
                {copiedText === "Tampermonkey" ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{copiedText === "Tampermonkey" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#0e0e0e] border border-[#D4AF37]/10 rounded font-mono text-[10px] text-[#D4AF37] overflow-x-auto max-h-48 scrollbar-thin">
              {tampermonkeyCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
