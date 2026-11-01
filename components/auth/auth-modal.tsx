"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  Film,
} from "lucide-react";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import TurnstileWidget from "./turnstile-widget";

// Curated high-res poster collage for the left cinematic panel
const COLLAGE_POSTERS = [
  "https://phimimg.com/uploads/movies/20260915/yeu-nham-canh-sat-thanh-tra-theer-yeu-dau-poster.webp",
  "https://phimimg.com/upload/vod/20240810-1/a2432eb5cae8eb2a2b4ea746ef31416e.jpg",
  "https://phimimg.com/uploads/movies/20261021/van-co-cua-co-ay-poster.webp",
  "https://phimimg.com/upload/vod/20241028-1/33727a6c4cec6ab127dbb0092bc99c9e.jpg",
  "https://phimimg.com/uploads/movies/20260830/yeu-het-long-chang-fanboy-poster.webp",
  "https://phimimg.com/uploads/movies/20260818/than-tai-dau-chiem-long-poster.webp",
  "https://phimimg.com/uploads/movies/20261024/ngu-cung-soi-poster.webp",
  "https://phimimg.com/uploads/movies/20260919/lang-nghe-thanh-am-poster.webp",
  "https://phimimg.com/uploads/movies/20261031/hoa-dang-khoi-poster.webp",
];

// Official Multi-color Google "G" SVG
function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [devCodeBanner, setDevCodeBanner] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  // OTP Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset states when opened or mode changed
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage("");
      setDevCodeBanner(null);
      setTurnstileToken("");
      setShowPassword(false);
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
    const res = await register(cleanEmail, password, cleanName, turnstileToken);
    setIsSubmitting(false);
    if (res.success) {
      if (res.devMode && res.devCode) {
        setDevCodeBanner(res.devCode);
        setOtp(res.devCode);
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

  const handleGoogleLogin = () => {
    toast.info("Tính năng Đăng nhập bằng Google đang hoàn thiện. Vui lòng đăng nhập bằng Email/Mật khẩu!", {
      duration: 3500,
    });
  };

  const handleForgotPassword = () => {
    toast.info("Để lấy lại mật khẩu, vui lòng liên hệ Admin qua kênh Hỗ trợ hoặc Telegram!", {
      duration: 4000,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* 2-Column Split Cinematic Modal */}
      <div className="relative w-full max-w-[880px] bg-[#0C120F] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(32,214,107,0.12)] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 min-h-[500px] md:min-h-[540px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CINEMATIC POSTER COLLAGE & HI PHIM BRAND    */}
        {/* ======================================================== */}
        <div className="relative hidden md:flex md:col-span-5 flex-col justify-end p-7 sm:p-8 overflow-hidden select-none bg-[#080D0B] border-r border-white/[0.08]">
          {/* Poster Collage Background (3 Staggered Columns) */}
          <div className="absolute inset-0 grid grid-cols-3 gap-2.5 p-3 opacity-35 scale-105 pointer-events-none transform -rotate-1">
            {/* Column 1 */}
            <div className="flex flex-col gap-2.5 -translate-y-4">
              {COLLAGE_POSTERS.slice(0, 3).map((src, i) => (
                <div key={i} className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#101714] shadow-md border border-white/5">
                  <Image src={src} alt="Movie poster" fill sizes="140px" className="object-cover" />
                </div>
              ))}
            </div>

            {/* Column 2 (Offset for organic bento layout) */}
            <div className="flex flex-col gap-2.5 translate-y-3">
              {COLLAGE_POSTERS.slice(3, 6).map((src, i) => (
                <div key={i} className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#101714] shadow-md border border-white/5">
                  <Image src={src} alt="Movie poster" fill sizes="140px" className="object-cover" />
                </div>
              ))}
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-2.5 -translate-y-6">
              {COLLAGE_POSTERS.slice(6, 9).map((src, i) => (
                <div key={i} className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#101714] shadow-md border border-white/5">
                  <Image src={src} alt="Movie poster" fill sizes="140px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Vignette & Gradient Fade Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C120F] via-[#0C120F]/75 to-[#080D0B]/40 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0C120F] to-transparent pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-brand-green/10 blur-[90px] pointer-events-none" />

          {/* Left Hero Branding Block */}
          <div className="relative z-10 flex flex-col gap-3">
            {/* Logo Row */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#20D66B] via-[#2AE376] to-[#10B981] text-black flex items-center justify-center shadow-[0_0_20px_rgba(32,214,107,0.4)] shrink-0">
                <Play className="w-6 h-6 fill-black text-black ml-0.5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white tracking-wider font-[family-name:var(--font-oswald)]">HI</span>
                  <span className="text-2xl font-black text-brand-green tracking-wider font-[family-name:var(--font-oswald)]">PHIM</span>
                </div>
                <span className="text-[11px] font-semibold text-white/60 tracking-wider">Phim hay cả rổ</span>
              </div>
            </div>

            {/* Value Highlights */}
            <p className="text-xs text-white/70 leading-relaxed pt-1">
              Đăng nhập để đồng bộ lịch sử xem, lưu tủ phim yêu thích và nhận thông báo khi có tập mới nhất.
            </p>

            <div className="space-y-1.5 pt-1 text-[11px] font-medium text-white/50">
              <div className="flex items-center gap-2">
                <span className="text-brand-green">✓</span>
                <span>Xem phim Full HD không giật lag</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-green">✓</span>
                <span>Tự động nhớ phút giây đang xem dở</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-green">✓</span>
                <span>Đồng bộ mượt mà trên mọi thiết bị</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: MODERN SLEEK AUTH FORM                     */}
        {/* ======================================================== */}
        <div className="md:col-span-7 flex flex-col justify-center p-6 sm:p-8 md:p-10 relative bg-[#0C120F]">
          
          {/* Close Button (Top-Right) */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all z-20 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center gap-2.5 mb-5 select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#20D66B] to-[#10B981] text-black flex items-center justify-center shadow-[0_0_15px_rgba(32,214,107,0.4)] shrink-0">
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-white font-[family-name:var(--font-oswald)]">HI</span>
                <span className="text-lg font-black text-brand-green font-[family-name:var(--font-oswald)]">PHIM</span>
              </div>
              <span className="text-[10px] text-white/50 font-medium">Phim hay cả rổ</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {authModalMode === "login" && "Đăng nhập"}
              {authModalMode === "register" && "Đăng ký tài khoản"}
              {authModalMode === "otp" && "Xác thực OTP"}
            </h2>

            {authModalMode === "login" && (
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">
                Nếu bạn chưa có tài khoản,{" "}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    openAuthModal("register");
                  }}
                  className="text-brand-green hover:underline font-bold transition-colors cursor-pointer"
                >
                  đăng ký ngay
                </button>
              </p>
            )}

            {authModalMode === "register" && (
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">
                Nếu bạn đã có tài khoản,{" "}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    openAuthModal("login");
                  }}
                  className="text-brand-green hover:underline font-bold transition-colors cursor-pointer"
                >
                  đăng nhập ngay
                </button>
              </p>
            )}

            {authModalMode === "otp" && (
              <p className="text-xs sm:text-sm text-white/60 mt-1.5">
                Mã xác thực 6 số đã được gửi tới{" "}
                <strong className="text-brand-green underline">{pendingEmail || email}</strong>
              </p>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium animate-in fade-in duration-200">
              {errorMessage}
            </div>
          )}

          {/* Dev Mode OTP helper banner */}
          {devCodeBanner && (
            <div className="mb-4 p-3 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs text-center font-medium">
              💡 <strong>[Dev Mode]</strong> Mã OTP của bạn là:{" "}
              <span className="font-mono font-bold tracking-widest text-sm underline">{devCodeBanner}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. LOGIN MODE                                            */}
          {/* ======================================================== */}
          {authModalMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  required
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-11 sm:h-12 px-4 rounded-xl bg-[#141B18] border border-white/15 hover:border-white/25 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/40 transition-all"
                />
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  aria-label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full h-11 sm:h-12 pl-4 pr-11 rounded-xl bg-[#141B18] border border-white/15 hover:border-white/25 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Button (Prominent Emerald Action Button) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Google Social Login Button (Matching Image 2 Reference) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-11 sm:h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/15 hover:border-white/25 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
                >
                  <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Đăng nhập bằng Google</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. REGISTER MODE                                         */}
          {/* ======================================================== */}
          {authModalMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div className="relative">
                <input
                  type="text"
                  required
                  aria-label="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Họ và tên của bạn"
                  className="w-full h-11 sm:h-12 px-4 rounded-xl bg-[#141B18] border border-white/15 hover:border-white/25 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/40 transition-all"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  required
                  aria-label="Email Google (@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ Gmail (ví dụ: ten_ban@gmail.com)"
                  className="w-full h-11 sm:h-12 px-4 rounded-xl bg-[#141B18] border border-white/15 hover:border-white/25 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/40 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  aria-label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                  className="w-full h-11 sm:h-12 pl-4 pr-11 rounded-xl bg-[#141B18] border border-white/15 hover:border-white/25 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Cloudflare Turnstile */}
              <div>
                <TurnstileWidget
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <span>Tiếp Tục (Nhận Mã OTP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Google Social Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-11 sm:h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/15 hover:border-white/25 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
                >
                  <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Đăng ký nhanh bằng Google</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. OTP VERIFICATION MODE                                 */}
          {/* ======================================================== */}
          {authModalMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6 Digit OTP Segmented Boxes */}
              <div className="relative max-w-[340px] mx-auto py-2">
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 font-mono"
                />
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otp[index] || "";
                    const isCurrent = otp.length === index;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "w-10 sm:w-12 h-12 sm:h-14 rounded-xl flex items-center justify-center font-mono font-black text-2xl transition-all border-2 select-none",
                          digit
                            ? "bg-brand-green/10 border-brand-green text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.3)]"
                            : isCurrent
                            ? "bg-white/[0.08] border-brand-green/80 text-white animate-pulse"
                            : "bg-white/[0.03] border-white/10 text-white/20"
                        )}
                      >
                        {digit || "•"}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.99] text-black font-extrabold text-sm sm:text-base shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kích Hoạt Tài Khoản Ngay</span>
                  </>
                )}
              </button>

              {/* Countdown & Resend Button */}
              <div className="text-center pt-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSubmitting}
                    className="text-xs text-brand-green hover:underline font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã OTP mới
                  </button>
                ) : (
                  <p className="text-xs text-white/40">
                    Gửi lại mã sau: <span className="text-brand-green font-mono font-bold">{countdown}s</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="mt-3.5 text-xs text-white/40 hover:text-white/70 block mx-auto transition-colors cursor-pointer"
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
