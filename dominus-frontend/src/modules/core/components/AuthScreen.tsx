"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, User, Mail, Lock, Camera, ArrowRight, LogOut, Check } from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Tab login mode: 'password' or 'face'
  const [loginMode, setLoginMode] = useState<"password" | "face">("password");
  
  // Face verification states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Sẵn sàng quét khuôn mặt...");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedEmbedding, setCapturedEmbedding] = useState<number[] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // FaceAPI status
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceapiLoaded, setFaceapiLoaded] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Dynamic script loader for face-api.js
  useEffect(() => {
    // Only load if not already loaded
    // @ts-ignore
    if (window.faceapi) {
      setFaceapiLoaded(true);
      loadModels();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.async = true;
    script.onload = () => {
      setFaceapiLoaded(true);
      loadModels();
    };
    script.onerror = () => {
      setScanStatus("Lỗi tải thư viện Face-API. Vui lòng kiểm tra mạng.");
      showToast("Không thể tải thư viện nhận diện khuôn mặt.", "error");
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      setScanStatus("Đang nạp mô hình trí tuệ nhân tạo (AI)...");
      // @ts-ignore
      const faceapi = window.faceapi;
      if (!faceapi) return;

      // Using jsdelivr github cdn for models weights
      const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/";
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      setModelsLoaded(true);
      setScanStatus("Mô hình AI đã sẵn sàng. Căn chỉnh khuôn mặt vào khung tròn.");
    } catch (err) {
      console.error("Failed to load models:", err);
      setScanStatus("Lỗi nạp mô hình AI. Vui lòng reload.");
      showToast("Lỗi nạp mô hình AI.", "error");
    }
  };

  // Generate deterministic face embedding for fallback if model fails to load
  const generateMockEmbedding = (name: string, addNoise = false): number[] => {
    const embedding: number[] = [];
    let seed = 0;
    for (let i = 0; i < name.length; i++) {
      seed += name.charCodeAt(i);
    }
    for (let i = 0; i < 128; i++) {
      let val = Math.sin(seed + i) * 0.15;
      if (addNoise) {
        val += (Math.random() - 0.5) * 0.03;
      }
      embedding.push(parseFloat(val.toFixed(6)));
    }
    return embedding;
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: "user" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setScanStatus("Lỗi kết nối Camera. Vui lòng cấp quyền webcam.");
      showToast("Lỗi kết nối Camera.", "error");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (loginMode === "face" && !isRegister) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [loginMode, isRegister]);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      showToast("Vui lòng điền đầy đủ thông tin.", "error");
      return;
    }

    try {
      if (isRegister) {
        // Register flow
        const res = await fetch("http://localhost:8001/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            email,
            password,
            face_embedding: generateMockEmbedding(username)
          })
        });
        if (res.ok) {
          showToast("Đăng ký thành công! Hãy đăng nhập.", "success");
          setIsRegister(false);
          setLoginMode("password");
        } else {
          const err = await res.json();
          showToast(err.detail || "Đăng ký thất bại.", "error");
        }
      } else {
        // Login flow
        const res = await fetch("http://localhost:8001/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username_or_email: username,
            password
          })
        });
        if (res.ok) {
          const data = await res.json();
          showToast("Đăng nhập thành công!", "success");
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 1000);
        } else {
          const err = await res.json();
          showToast(err.detail || "Sai thông tin đăng nhập.", "error");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      showToast("Lỗi kết nối máy chủ xác thực.", "error");
    }
  };

  const handleFaceScan = async () => {
    if (!username) {
      showToast("Vui lòng điền Username để xác định tài khoản quét.", "info");
      return;
    }
    
    // @ts-ignore
    const faceapi = window.faceapi;
    if (!faceapi || !modelsLoaded) {
      showToast("Mô hình AI chưa nạp xong. Vui lòng đợi.", "info");
      return;
    }

    if (!videoRef.current) {
      showToast("Không tìm thấy dữ liệu luồng Camera.", "error");
      return;
    }

    setIsScanning(true);
    setScanStatus("Đang phân tích cấu trúc sinh học khuôn mặt...");

    try {
      // 1. Detect face landmark and descriptor from the live video stream
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

      if (!detection) {
        setScanStatus("Không phát hiện thấy khuôn mặt. Vui lòng căn chỉnh lại trước camera.");
        showToast("Không tìm thấy khuôn mặt trong khung hình.", "error");
        setIsScanning(false);
        return;
      }

      // Convert Float32Array descriptor to standard numbers array
      const embedding = Array.from(detection.descriptor) as number[];
      setCapturedEmbedding(embedding);
      
      if (isRegister) {
        // Register face embedding
        const res = await fetch("http://localhost:8001/api/auth/register-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            face_embedding: embedding
          })
        });
        if (res.ok) {
          setScanStatus("Đã ghi nhận sinh trắc học khuôn mặt thành công!");
          showToast("Đã cập nhật khuôn mặt thành công!", "success");
        } else {
          const err = await res.json();
          setScanStatus("Lỗi ghi nhận: " + err.detail);
          showToast("Lỗi ghi nhận: " + err.detail, "error");
        }
      } else {
        // Login with face embedding
        const res = await fetch("http://localhost:8001/api/auth/login-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            face_embedding: embedding
          })
        });
        if (res.ok) {
          const data = await res.json();
          setScanStatus("Xác thực khuôn mặt thành công!");
          showToast("Xác thực khuôn mặt thành công!", "success");
          setTimeout(() => {
            onLoginSuccess(data.user);
          }, 1000);
        } else {
          const err = await res.json();
          setScanStatus("Xác thực thất bại: " + (err.detail || "Không khớp khuôn mặt"));
          showToast(err.detail || "Không khớp khuôn mặt", "error");
        }
      }
    } catch (err) {
      console.error("Face auth error:", err);
      setScanStatus("Lỗi kết nối máy chủ sinh trắc học.");
      showToast("Lỗi phân tích sinh trắc học khuôn mặt.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background decoration grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_70%)]" />
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px]" />

      {/* Main glass card */}
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-[#D4AF37]/20 bg-[#0e0e0e]/80 shadow-[0_0_50px_rgba(212,175,55,0.08)] relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/35 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <img src="/favicon-package/favicon-96x96.png" className="w-8 h-8 object-contain animate-pulse" alt="Logo" />
          </div>
          <h2 className="font-space font-bold text-xl tracking-wider text-[#D4AF37] uppercase mt-4">
            Dominus Global OS
          </h2>
          <p className="font-mono text-[9px] text-[#99907c] uppercase tracking-widest">
            Xác thực truy cập lớp điều hành AI
          </p>
        </div>

        {/* Tab Selector for Login/Register (Only when using standard password) */}
        {!isRegister && (
          <div className="flex border-b border-[#D4AF37]/15">
            <button
              onClick={() => setLoginMode("password")}
              className={`flex-1 py-2 font-mono text-xs uppercase font-bold transition-all duration-300 ${
                loginMode === "password" ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" : "text-[#99907c] hover:text-[#e5e2e1]"
              }`}
            >
              Mật khẩu
            </button>
            <button
              onClick={() => setLoginMode("face")}
              className={`flex-1 py-2 font-mono text-xs uppercase font-bold transition-all duration-300 ${
                loginMode === "face" ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" : "text-[#99907c] hover:text-[#e5e2e1]"
              }`}
            >
              Nhận diện khuôn mặt
            </button>
          </div>
        )}

        {/* Auth Forms */}
        {loginMode === "password" || isRegister ? (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#99907c] uppercase block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#99907c]" />
                <input
                  type="text"
                  required
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-[#D4AF37]/20 rounded-lg pl-10 pr-4 py-2 text-sm text-[#e5e2e1] focus:border-[#D4AF37]/60 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Email Input (only on register) */}
            {isRegister && (
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-[#99907c] uppercase block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#99907c]" />
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-[#D4AF37]/20 rounded-lg pl-10 pr-4 py-2 text-sm text-[#e5e2e1] focus:border-[#D4AF37]/60 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-[#99907c] uppercase block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#99907c]" />
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu của bạn..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-[#D4AF37]/20 rounded-lg pl-10 pr-4 py-2 text-sm text-[#e5e2e1] focus:border-[#D4AF37]/60 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#f2ca50] hover:bg-[#ffe088] text-[#3c2f00] font-mono text-xs uppercase font-bold py-3 rounded-lg border border-[#D4AF37] transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>{isRegister ? "Đăng ký Hệ Thống" : "Đăng nhập Cổng"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Toggle login/register */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setLoginMode("password");
                }}
                className="font-mono text-[10px] text-[#D4AF37] hover:underline uppercase"
              >
                {isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký mới"}
              </button>
            </div>
          </form>
        ) : (
          /* Face Recognition Verification Screen */
          <div className="space-y-4 flex flex-col items-center">
            {/* Username target for Face Auth */}
            <div className="w-full space-y-1">
              <label className="font-mono text-[10px] text-[#99907c] uppercase block">Nhập Username để nhận diện</label>
              <input
                type="text"
                placeholder="Username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0e0e0e] border border-[#D4AF37]/20 rounded-lg px-3 py-1.5 text-xs text-[#e5e2e1] focus:border-[#D4AF37]/60 focus:outline-none font-mono text-center"
              />
            </div>

            {/* Circular Radar Scan Camera Stream */}
            <div className="relative w-48 h-48 rounded-full border-2 border-[#D4AF37]/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.1)] bg-black">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <Camera className="w-12 h-12 text-[#99907c]/40" />
              )}

              {/* Green Radar Scanning Overlay */}
              {isScanning && (
                <>
                  <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
                  <div className="absolute left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                </>
              )}
            </div>

            {/* Status text */}
            <p className="font-mono text-[10px] text-[#99907c] text-center max-w-[280px]">
              {scanStatus}
            </p>

            {/* Scan button */}
            <button
              onClick={handleFaceScan}
              disabled={isScanning || !modelsLoaded}
              className={`w-full font-mono text-xs uppercase font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                isScanning || !modelsLoaded
                  ? "bg-[#D4AF37]/10 border border-[#D4AF37]/10 text-[#99907c] cursor-not-allowed"
                  : "bg-green-950/20 hover:bg-green-950/40 border border-green-500/40 hover:border-green-500/70 text-green-400"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>
                {isScanning 
                  ? "Đang quét sinh trắc..." 
                  : !modelsLoaded 
                  ? "Đang nạp AI..." 
                  : "Bấm để quét và đăng nhập"}
              </span>
            </button>

            {/* Back to password option */}
            <button
              onClick={() => setLoginMode("password")}
              className="font-mono text-[10px] text-[#99907c] hover:text-[#e5e2e1] uppercase pt-2"
            >
              Đăng nhập bằng Mật khẩu thông thường
            </button>
          </div>
        )}
      </div>

      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-500 transform translate-y-0 animate-slide-in flex items-center justify-between ${
              t.type === "success"
                ? "bg-green-950/80 border-green-500/50 text-green-200"
                : t.type === "error"
                ? "bg-red-950/80 border-red-500/50 text-red-200"
                : "bg-zinc-950/80 border-[#D4AF37]/50 text-[#D4AF37]"
            }`}
          >
            <div className="font-mono text-xs uppercase tracking-wide mr-4">
              {t.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-[10px] opacity-60 hover:opacity-100 font-bold font-mono"
            >
              [X]
            </button>
          </div>
        ))}
      </div>

      {/* Embedded CSS for animations */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
