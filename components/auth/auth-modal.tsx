"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Mail, Lock, User, KeyRound, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    pendingEmail,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    verifyOtp,
    resendOtp,
  } = useUserAuth();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [devCodeBanner, setDevCodeBanner] = useState<string | null>(null);

  // OTP Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset states when opened or mode changed
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage("");
      setDevCodeBanner(null);
      if (authModalMode === "otp") {
        setOtp("");
        setCountdown(60);
        setCanResend(false);
        setTimeout(() => otpInputRef.current?.focus(), 150);
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthModalOpen && authModalMode === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAuthModalOpen, authModalMode, countdown]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || "Đăng nhập thất bại");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com")) {
      setErrorMessage("Hệ thống chỉ chấp nhận địa chỉ email có đuôi @gmail.com");
      return;
    }
    const localPart = cleanEmail.replace("@gmail.com", "").trim();
    if (!localPart || localPart.length < 3) {
      setErrorMessage("Địa chỉ Gmail không hợp lệ (tên tài khoản quá ngắn)");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage("Vui lòng nhập họ tên của bạn");
      return;
    }

    setIsSubmitting(true);
    const res = await register(cleanEmail, password, cleanName);
    setIsSubmitting(false);
    if (res.success) {
      if (res.devMode && res.devCode) {
        setDevCodeBanner(res.devCode);
        setOtp(res.devCode); // Pre-fill in dev mode for quick testing
      }
    } else {
      setErrorMessage(res.error || "Đăng ký thất bại");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (otp.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã OTP");
      return;
    }
    setIsSubmitting(true);
    const res = await verifyOtp(pendingEmail || email, otp);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || "Xác thực mã OTP thất bại");
    }
  };

  const handleResend = async () => {
    if (!canResend || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const res = await resendOtp(pendingEmail || email);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("Đã gửi lại mã OTP mới!");
      setCountdown(60);
      setCanResend(false);
      if (res.devMode && res.devCode) {
        setDevCodeBanner(res.devCode);
        setOtp(res.devCode);
      }
    } else {
      setErrorMessage(res.error || "Không thể gửi lại mã OTP");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#0e1310] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(32,214,107,0.15)] overflow-hidden z-10 transition-all">
        
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-green to-transparent opacity-80" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-20"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="inline-flex items-center justify-center gap-1 mb-2">
            <span className="text-2xl font-black text-white tracking-wide">Hi</span>
            <span className="text-2xl font-black text-brand-green tracking-wide">Phim</span>
            <span className="text-xs font-black text-brand-green self-start -mt-0.5">®</span>
          </div>

          {authModalMode === "otp" ? (
            <div>
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-green" /> Nhập Mã Xác Thực OTP
              </h3>
            </div>
          ) : (
            <p className="text-xs text-white/60">
              {authModalMode === "login"
                ? "Đăng nhập để đồng bộ tủ phim yêu thích & lịch sử xem"
                : "Tạo tài khoản miễn phí chỉ trong vài giây"}
            </p>
          )}
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 pt-2">
          {/* Error message banner */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium animate-in fade-in duration-200">
              {errorMessage}
            </div>
          )}

          {/* Dev Mode OTP helper banner */}
          {devCodeBanner && (
            <div className="mb-4 p-2.5 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs text-center font-medium">
              💡 <strong>[Dev Mode]</strong> Mã OTP của bạn là: <span className="font-mono font-bold tracking-widest text-sm underline">{devCodeBanner}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {authModalMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/70">Email</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="email"
                    required
                    aria-label="Địa chỉ email đăng nhập"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-green/80 focus:ring-1 focus:ring-brand-green/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/70">Mật khẩu</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="password"
                    required
                    aria-label="Mật khẩu đăng nhập"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-green/80 focus:ring-1 focus:ring-brand-green/50 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.98] text-black font-bold text-xs sm:text-[13px] tracking-wide shadow-[0_0_20px_rgba(32,214,107,0.3)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-white/50">
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      openAuthModal("register");
                    }}
                    className="text-brand-green hover:underline font-semibold"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. REGISTER MODE */}
          {authModalMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/70">Họ tên / Tên hiển thị</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    required
                    aria-label="Họ và tên của bạn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Họ và tên của bạn"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-green/80 focus:ring-1 focus:ring-brand-green/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-white/70">Email Google (Gmail)</label>
                  <span className="text-[10px] text-brand-green font-mono font-semibold">Chỉ nhận đuôi @gmail.com</span>
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="email"
                    required
                    aria-label="Email Google đăng ký"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten_ban@gmail.com"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-green/80 focus:ring-1 focus:ring-brand-green/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/70">Mật khẩu (tối thiểu 6 ký tự)</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    aria-label="Mật khẩu đăng ký"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-green/80 focus:ring-1 focus:ring-brand-green/50 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 mt-2 flex items-center justify-center gap-2 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.98] text-black font-bold text-xs sm:text-[13px] tracking-wide shadow-[0_0_20px_rgba(32,214,107,0.3)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Gửi Mã Xác Thực OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-white/50">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      openAuthModal("login");
                    }}
                    className="text-brand-green hover:underline font-semibold"
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. OTP VERIFICATION MODE */}
          {authModalMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-semibold text-white/80">Nhập 6 số mã OTP</label>
                <div className="relative max-w-[260px] mx-auto">
                  <input
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    autoFocus
                    aria-label="Mã xác thực OTP 6 số"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full h-12 text-center text-2xl font-mono font-black tracking-[10px] rounded-xl bg-white/[0.06] border-2 border-brand-green/40 focus:border-brand-green text-brand-green focus:outline-none focus:shadow-[0_0_20px_rgba(32,214,107,0.3)] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.98] text-black font-bold text-sm shadow-[0_0_20px_rgba(32,214,107,0.3)] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kích Hoạt Tài Khoản</span>
                  </>
                )}
              </button>

              {/* Countdown & Resend Button */}
              <div className="text-center pt-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSubmitting}
                    className="text-xs text-brand-green hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã OTP
                  </button>
                ) : (
                  <p className="text-xs text-white/40">
                    Gửi lại mã sau: <span className="text-brand-green font-mono font-bold">{countdown}s</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="mt-3 text-[11px] text-white/40 hover:text-white/70 block mx-auto transition-colors"
                >
                  ← Đổi địa chỉ email khác
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
