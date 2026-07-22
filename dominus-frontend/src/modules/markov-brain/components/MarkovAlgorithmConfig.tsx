"use client";

import React, { useEffect, useState } from "react";
import { Sliders, FlaskConical, Terminal, AlertTriangle, Save, Play, Plus, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "../../core/components/ui/Toast";
import { ConfirmModal } from "../../core/components/ui/Modal";

interface PresetItem {
  name: string;
  is_active: boolean;
}

export default function MarkovAlgorithmConfig() {
  const { showToast } = useToast();

  const [lotteryId, setLotteryId] = useState("48");
  const [lotteryCode, setLotteryCode] = useState("mb75g");

  // Presets list and selected preset
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [selectedPresetName, setSelectedPresetName] = useState("standard");
  const [newPresetNameInput, setNewPresetNameInput] = useState("");

  // Detailed 2-column algorithm configs
  const [parityConfig, setParityConfig] = useState<any>({});
  const [sizeConfig, setSizeConfig] = useState<any>({});

  // Mock draw fields
  const [mockIssue, setMockIssue] = useState("");
  const [num1, setNum1] = useState("1");
  const [num2, setNum2] = useState("2");
  const [num3, setNum3] = useState("3");
  const [num4, setNum4] = useState("4");
  const [num5, setNum5] = useState("5");

  // Confirm delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadPresetsAndConfig = async (forceSyncActive = false) => {
    try {
      const presetsRes = await fetch("http://localhost:8000/api/config/presets");
      let activePresetName = "";
      if (presetsRes.ok) {
        const presetsData = await presetsRes.json();
        const list = presetsData.presets || [];
        setPresets(list);
        const active = list.find((p: any) => p.is_active);
        if (active) {
          activePresetName = active.name;
        }
      }

      if (forceSyncActive && activePresetName) {
        setSelectedPresetName(activePresetName);
        const res = await fetch(`http://localhost:8000/api/config/presets/${activePresetName}`);
        if (res.ok) {
          const data = await res.json();
          setParityConfig(data.parity_config || {});
          setSizeConfig(data.size_config || {});
          return;
        }
      }

      const configRes = await fetch("http://localhost:8000/api/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        if (forceSyncActive || !selectedPresetName || selectedPresetName === activePresetName) {
          setParityConfig(configData.parity_config || {});
          setSizeConfig(configData.size_config || {});
        }
      }
    } catch (err) {
      console.warn("Failed to load configs from Markov API:", err);
    }
  };

  useEffect(() => {
    loadPresetsAndConfig(true);
  }, []);

  const handlePresetSelectChanged = async (presetName: string) => {
    setSelectedPresetName(presetName);
    if (!presetName) return;
    try {
      const res = await fetch(`http://localhost:8000/api/config/presets/${presetName}`);
      if (res.ok) {
        const data = await res.json();
        setParityConfig(data.parity_config || {});
        setSizeConfig(data.size_config || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreset = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/config/save-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset_name: selectedPresetName,
          parity_config: parityConfig,
          size_config: sizeConfig,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        showToast("Lưu CSDL Thành Công", `Đã lưu cấu hình preset '${selectedPresetName}' vĩnh viễn vào Postgres!`, "success");
        loadPresetsAndConfig(true);
        // Trigger quick statistics sidebar update instantly
        window.dispatchEvent(new Event("markovConfigChanged"));
      } else {
        showToast("Lỗi Lưu Trữ", data.detail || data.message || "Không thể lưu preset.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Không thể gửi dữ liệu cấu hình tới server.", "error");
    }
  };

  const handleActivatePreset = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/config/presets/${selectedPresetName}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        showToast("Kích Hoạt Thành Công", `Đã kích hoạt preset '${selectedPresetName}' làm cấu hình chạy chính!`, "success");
        loadPresetsAndConfig(true);
        // Trigger quick statistics sidebar update instantly
        window.dispatchEvent(new Event("markovConfigChanged"));
      } else {
        showToast("Lỗi Kích Hoạt", "Không thể kích hoạt bộ tham số.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Gửi yêu cầu kích hoạt thất bại.", "error");
    }
  };

  const handleCreateNewPreset = () => {
    if (!newPresetNameInput) {
      showToast("Cảnh Báo", "Vui lòng nhập tên preset mới!", "warning");
      return;
    }
    setSelectedPresetName(newPresetNameInput);
    setPresets([...presets, { name: newPresetNameInput, is_active: false }]);
    setNewPresetNameInput("");
    showToast("Đã Tạo Nháp", `Preset nháp '${newPresetNameInput}' đã được tạo. Hãy điền tham số và bấm Lưu CSDL!`, "info");
  };

  const handleConfirmDeletePreset = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/config/presets/${selectedPresetName}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Xóa Thành Công", `Đã xóa vĩnh viễn preset '${selectedPresetName}' khỏi CSDL!`, "success");
        setSelectedPresetName("standard");
        loadPresetsAndConfig(true);
        window.dispatchEvent(new Event("markovConfigChanged"));
      } else {
        showToast("Lỗi", "Không thể xóa preset này.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Gửi yêu cầu xóa thất bại.", "error");
    }
  };

  const handleUpdateLottery = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/config-lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lottery_id: parseInt(lotteryId),
          lottery_code: lotteryCode,
        }),
      });
      if (res.ok) {
        showToast("Cập Nhật Thành Công", `Đã chuyển đổi mục tiêu lottery sang ${lotteryCode.toUpperCase()}!`, "success");
        window.dispatchEvent(new Event("markovConfigChanged"));
      } else {
        showToast("Lỗi", "Không thể thay đổi target lottery.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Có lỗi xảy ra khi cập nhật lottery.", "error");
    }
  };

  const handleSendMockDraw = async () => {
    if (!mockIssue) {
      showToast("Cảnh Báo", "Vui lòng nhập mã kỳ quay giả lập!", "warning");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/mock-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue: mockIssue,
          numbers: [parseInt(num1), parseInt(num2), parseInt(num3), parseInt(num4), parseInt(num5)],
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setMockIssue("");
        showToast("Inject Thành Công", `Đã tiêm kết quả quay thưởng giả lập cho kỳ ${mockIssue}!`, "success");
      } else {
        showToast("Thất Bại", data.message || "Failed to inject draw results.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Gửi mock draw thất bại.", "error");
    }
  };

  const handleTriggerReloadScript = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/script/reload", {
        method: "POST",
      });
      if (res.ok) {
        showToast("Trigger Reload", "Đã gửi lệnh yêu cầu tải lại trang game qua hàng đợi robot!", "success");
      } else {
        showToast("Lỗi", "Không thể gửi lệnh reload game.", "error");
      }
    } catch (err) {
      showToast("Lỗi Kết Nối", "Gửi lệnh reload game thất bại.", "error");
    }
  };

  const handleParityFieldChange = (field: string, val: any) => {
    setParityConfig({ ...parityConfig, [field]: val });
  };

  const handleSizeFieldChange = (field: string, val: any) => {
    setSizeConfig({ ...sizeConfig, [field]: val });
  };

  const parameterInputs = [
    { field: "buy_threshold_min", label: "Ngưỡng mua tối thiểu (min)", type: "number", step: "0.01" },
    { field: "buy_threshold_max", label: "Ngưỡng mua tối đa (max)", type: "number", step: "0.01" },
    { field: "reversal_threshold", label: "Đảo chiều cực đoan (reversal)", type: "number", step: "0.01" },
    { field: "n_sliding_min", label: "Cửa sổ sliding trượt (min)", type: "integer" },
    { field: "n_sliding_max", label: "Cửa sổ sliding trượt (max)", type: "integer" },
    { field: "ar_window_min", label: "Cửa sổ Alternation AR (min)", type: "integer" },
    { field: "ar_window_max", label: "Cửa sổ Alternation AR (max)", type: "integer" },
    { field: "ar_threshold_min", label: "Ngưỡng Alternation AR (min)", type: "number", step: "0.01" },
    { field: "ar_threshold_max", label: "Ngưỡng Alternation AR (max)", type: "number", step: "0.01" },
    { field: "cooling_off_loss_limit", label: "Tạm dừng sau chuỗi thua (cooling)", type: "integer" },
    { field: "win_streak_pause_limit", label: "Tạm dừng sau chuỗi thắng (pause)", type: "integer" },
    { field: "streak_safety_trap_min", label: "Ngưỡng bệt bẫy bệt tối thiểu", type: "integer" },
    { field: "streak_safety_trap_multiplier", label: "Hệ số bệt bẫy bệt nhân", type: "integer" },
    { field: "min_probability_threshold", label: "Xác suất cược tối thiểu (min)", type: "number", step: "0.01" },
  ];

  return (
    <div className="space-y-6">
      {/* Unified Presets CRUD Toolbar */}
      <div className="glass-panel p-5 rounded-lg border-l-4 border-l-[#D4AF37] space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="font-space font-bold text-sm text-[#D4AF37] uppercase tracking-wider">Quản Lý Bộ Tham Số Thuật Toán & CSDL</h3>
            <p className="font-sans text-[10px] text-[#99907c] mt-0.5">Tùy chỉnh cấu hình presets lưu vĩnh viễn vào Database Postgres.</p>
          </div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-2">
            <select
              value={selectedPresetName}
              onChange={(e) => handlePresetSelectChanged(e.target.value)}
              className="bg-[#0e0e0e] border border-[#D4AF37]/35 rounded px-2.5 py-1 text-xs text-[#e5e2e1] font-mono focus:outline-none"
            >
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.is_active ? "[ACTIVE]" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={handleSavePreset}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/35 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu CSDL</span>
            </button>

            <button
              onClick={handleActivatePreset}
              className="flex items-center space-x-1.5 px-3 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Kích Hoạt</span>
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded font-mono text-[9px] uppercase tracking-wider transition-all duration-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>

            <button
              onClick={() => loadPresetsAndConfig(true)}
              className="p-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] rounded transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Create new preset block */}
        <div className="flex space-x-2 border-t border-[#D4AF37]/10 pt-3">
          <input
            type="text"
            placeholder="Preset Name..."
            value={newPresetNameInput}
            onChange={(e) => setNewPresetNameInput(e.target.value)}
            className="bg-[#0e0e0e]/80 border border-[#D4AF37]/20 rounded px-2.5 py-1 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/60 focus:outline-none flex-1 max-w-xs"
          />
          <button
            onClick={handleCreateNewPreset}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded font-mono text-[9px] uppercase tracking-wider hover:bg-[#D4AF37]/20 transition-all duration-300"
          >
            <Plus className="w-3 h-3" />
            <span>Tạo Mới Preset</span>
          </button>
        </div>
      </div>

      {/* 2-Column Form Fields parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parity Parameters */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h4 className="font-space font-bold text-xs text-[#D4AF37] uppercase tracking-wider border-b border-[#D4AF37]/15 pb-2.5">
            Tham Số Kèo Chẵn / Lẻ (PARITY)
          </h4>
          <div className="space-y-3">
            {parameterInputs.map((input) => (
              <div key={input.field} className="flex justify-between items-center space-x-4">
                <label className="font-sans text-[11px] text-[#99907c]">{input.label}</label>
                <input
                  type="number"
                  step={input.step || "1"}
                  value={parityConfig[input.field] !== undefined ? parityConfig[input.field] : ""}
                  onChange={(e) =>
                    handleParityFieldChange(
                      input.field,
                      input.type === "integer" ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0
                    )
                  }
                  className="bg-[#0e0e0e]/80 border border-[#D4AF37]/20 rounded px-2.5 py-1 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/60 focus:outline-none w-28 text-right font-bold"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Size Parameters */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h4 className="font-space font-bold text-xs text-amber-500 uppercase tracking-wider border-b border-amber-500/15 pb-2.5">
            Tham Số Kèo TáI / XỈU (SIZE)
          </h4>
          <div className="space-y-3">
            {parameterInputs.map((input) => (
              <div key={input.field} className="flex justify-between items-center space-x-4">
                <label className="font-sans text-[11px] text-[#99907c]">{input.label}</label>
                <input
                  type="number"
                  step={input.step || "1"}
                  value={sizeConfig[input.field] !== undefined ? sizeConfig[input.field] : ""}
                  onChange={(e) =>
                    handleSizeFieldChange(
                      input.field,
                      input.type === "integer" ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0
                    )
                  }
                  className="bg-[#0e0e0e]/80 border border-[#D4AF37]/20 rounded px-2.5 py-1 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/60 focus:outline-none w-28 text-right font-bold"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preset & Lottery ID Config */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <Sliders className="w-4 h-4" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Algorithm Target</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[9px] text-[#99907c] uppercase">Lottery ID</label>
                <input
                  type="text"
                  value={lotteryId}
                  onChange={(e) => setLotteryId(e.target.value)}
                  placeholder="48..."
                  className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[9px] text-[#99907c] uppercase">Lottery Code</label>
                <input
                  type="text"
                  value={lotteryCode}
                  onChange={(e) => setLotteryCode(e.target.value)}
                  placeholder="mb75g..."
                  className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateLottery}
              className="w-full bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold p-2.5 rounded border border-[#D4AF37] hover:bg-[#ffe088] transition-all duration-300"
            >
              Apply Code Target
            </button>
          </div>
        </div>

        {/* Script Console */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <div className="flex items-center space-x-3 text-[#D4AF37]">
            <Terminal className="w-4 h-4" />
            <h3 className="font-space font-bold text-sm tracking-wider uppercase">Robot Script Console</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-[#0e0e0e]/50 border border-yellow-500/10 rounded flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="font-sans text-[10px] text-[#99907c] leading-relaxed">
                Gửi lệnh yêu cầu tải lại trang game cho Robot. Lệnh sẽ được Tampermonkey ở trình duyệt đích tiêu thụ sau tối đa 2 giây.
              </p>
            </div>
            <button
              onClick={handleTriggerReloadScript}
              className="w-full bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold p-3 rounded border border-[#D4AF37] hover:bg-[#ffe088] transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Gửi Lệnh Reload Game</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mock Draw Results Injector */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <div className="flex items-center space-x-3 text-[#D4AF37]">
          <FlaskConical className="w-4 h-4" />
          <h3 className="font-space font-bold text-sm tracking-wider uppercase">Mock Draw Sandbox</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-1 md:col-span-2">
            <label className="font-mono text-[9px] text-[#99907c] uppercase">Mock Issue</label>
            <input
              type="text"
              value={mockIssue}
              onChange={(e) => setMockIssue(e.target.value)}
              placeholder="e.g. 202607220101"
              className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
          {[num1, num2, num3, num4, num5].map((val, idx) => {
            const setFns = [setNum1, setNum2, setNum3, setNum4, setNum5];
            return (
              <div key={idx} className="space-y-1">
                <label className="font-mono text-[9px] text-[#99907c] uppercase">Num {idx + 1}</label>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={val}
                  onChange={(e) => setFns[idx](e.target.value)}
                  className="w-full bg-[#0e0e0e]/85 border border-[#D4AF37]/20 rounded p-2 text-xs text-[#e5e2e1] font-mono focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            );
          })}
        </div>
        <button
          onClick={handleSendMockDraw}
          className="w-full bg-[#f2ca50] text-[#3c2f00] font-mono text-[10px] uppercase font-bold p-2.5 rounded border border-[#D4AF37] hover:bg-[#ffe088] transition-all duration-300"
        >
          Inject Draw Result To Database
        </button>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDeletePreset}
        title="Xóa Cấu Hình Preset"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn preset cấu hình '${selectedPresetName}' khỏi CSDL Postgres? Hành động này không thể khôi phục.`}
        confirmLabel="Xóa Ngay"
        cancelLabel="Hủy Bỏ"
      />
    </div>
  );
}
