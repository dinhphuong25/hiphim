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
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import BrandLogo from "@/components/ui/brand-logo";
import TurnstileWidget from "./turnstile-widget";

// 12 Curated high-res verified posters from blockbuster cinema & popular films (All verified 200 OK)
const COLLAGE_POSTERS = [
  "https://phimimg.com/uploads/movies/20260827/nguoi-nhen-khoi-dau-moi-poster.webp", // Người Nhện
  "https://phimimg.com/uploads/movies/20260829/doraemon-nobita-va-lau-dai-duoi-day-bien-phien-ban-moi-poster.webp", // Doraemon
  "https://phimimg.com/uploads/movies/20261028/shaun-the-sheep-quai-la-ghe-nha-poster.webp", // Shaun The Sheep
  "https://phimimg.com/uploads/movies/20261026/quy-bat-hon-poster.webp", // Quỷ Bắt Hồn
  "https://phimimg.com/uploads/movies/20261030/duoi-day-ho-poster.webp", // Dưới Đáy Hồ
  "https://phimimg.com/uploads/movies/20260919/hope-vung-tu-dia-poster.webp", // Hope
  "https://phimimg.com/uploads/movies/20261021/van-co-cua-co-ay-poster.webp", // Ván Cờ Của Cô Ấy
  "https://phimimg.com/uploads/movies/20260830/yeu-het-long-chang-fanboy-poster.webp", // Fanboy
  "https://phimimg.com/uploads/movies/20260915/yeu-nham-canh-sat-thanh-tra-theer-yeu-dau-poster.webp", // Thanh tra Theer
  "https://phimimg.com/uploads/movies/20261024/ngu-cung-soi-poster.webp", // Ngủ Cùng Sói
  "https://phimimg.com/uploads/movies/20260818/than-tai-dau-chiem-long-poster.webp", // Thần Tài
  "https://phimimg.com/uploads/movies/20261031/hoa-dang-khoi-poster.webp", // Hoa Đăng Khởi
];

const FALLBACK_POSTER = "https://phimimg.com/uploads/movies/20260827/nguoi-nhen-khoi-dau-moi-poster.webp";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* 2-Column Split Cinematic Modal Container */}
      <div className="relative w-full max-w-[880px] bg-[#0A0E0C] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(32,214,107,0.12)] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 min-h-[500px] md:min-h-[550px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CINEMATIC POSTER COLLAGE & HI PHIM BRAND    */}
        {/* ======================================================== */}
        <div className="relative hidden md:flex md:col-span-5 flex-col justify-between p-7 sm:p-8 overflow-hidden select-none bg-[#070B09] border-r border-white/[0.08]">
          
          {/* Ambient Emerald Aura Glows */}
          <div className="absolute -left-16 -top-16 w-60 h-60 rounded-full bg-brand-green/20 blur-[100px] pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 w-60 h-60 rounded-full bg-emerald-500/15 blur-[90px] pointer-events-none" />

          {/* Poster Collage Background (3 Staggered Columns of Verified Posters) */}
          <div className="absolute inset-0 grid grid-cols-3 gap-2.5 p-3 opacity-30 scale-105 pointer-events-none transform -rotate-1">
            {/* Column 1 */}
            <div className="flex flex-col gap-2.5 -translate-y-4">
              {COLLAGE_POSTERS.slice(0, 4).map((src, i) => (
                <div key={i} className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#101714] shadow-lg border border-white/10">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="140px"
                    unoptimized
                    className="object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_POSTER;
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Column 2 (Offset for dynamic visual interest) */}
            <div className="flex flex-col gap-2.5 translate-y-3">
              {COLLAGE_POSTERS.slice(4, 8).map((src, i) => (
                <div key={i} className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#101714] shadow-lg border border-white/10">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="140px"
                    unoptimized
                    className="object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_POSTER;
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-2.5 -translate-y-6">
              {COLLAGE_POSTERS.slice(8, 12).map((src, i) => (
                <div key={i} className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#101714] shadow-lg border border-white/10">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="140px"
                    unoptimized
                    className="object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_POSTER;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Vignette & Gradient Overlays for readable content */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C] via-[#0A0E0C]/85 to-[#070B09]/50 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0E0C] to-transparent pointer-events-none" />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-brand-green" />
              Rạp Chiếu Riêng Của Bạn
            </span>
          </div>

          {/* Bottom Card: Official Web Brand Logo & Features List */}
          <div className="relative z-10 flex flex-col gap-4 bg-[#0A0E0C]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
            {/* Official Website Brand Logo (Matches Header & Sidebar exactly) */}
            <div className="flex items-center">
              <BrandLogo size="lg" showSlogan slogan="Điện ảnh không giới hạn" />
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Tạo tài khoản để đồng bộ tủ phim, nhớ tập đang xem dở và nhận thông báo khi có tập phim mới.
            </p>

            {/* Premium feature checklist */}
            <div className="space-y-2 pt-1 border-t border-white/10 text-[11.5px] font-medium text-white/80">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Xem phim chuẩn Full HD & 4K siêu tốc</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Tự động lưu lịch sử & phút giây xem dở</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Đồng bộ mượt mà Điện thoại, Máy tính & TV</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: MODERN SLEEK AUTH FORM                     */}
        {/* ======================================================== */}
        <div className="md:col-span-7 flex flex-col justify-center p-6 sm:p-8 md:p-10 relative bg-[#0A0E0C]">
          
          {/* Close Button (Desktop) */}
          <button
            onClick={closeAuthModal}
            className="hidden md:flex absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white active:scale-95 transition-all z-20 cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mobile Header (Brand Logo + Close Button) */}
          <div className="md:hidden flex items-center justify-between mb-5 select-none">
            <BrandLogo size="md" showSlogan={false} />
            <button
              onClick={closeAuthModal}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switch Tabs (Đăng nhập / Đăng ký) */}
          {authModalMode !== "otp" && (
            <div className="grid grid-cols-2 p-1 bg-white/[0.04] border border-white/10 rounded-xl mb-6 select-none">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  openAuthModal("login");
                }}
                className={cn(
                  "py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer text-center",
                  authModalMode === "login"
                    ? "bg-brand-green text-black shadow-[0_2px_12px_rgba(32,214,107,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  openAuthModal("register");
                }}
                className={cn(
                  "py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer text-center",
                  authModalMode === "register"
                    ? "bg-brand-green text-black shadow-[0_2px_12px_rgba(32,214,107,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                Đăng ký mới
              </button>
            </div>
          )}

          {/* Title Header */}
          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {authModalMode === "login" && "Chào mừng trở lại"}
              {authModalMode === "register" && "Tạo tài khoản Hi Phim"}
              {authModalMode === "otp" && "Xác thực mã OTP"}
            </h2>

            {authModalMode === "login" && (
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Nhập thông tin đăng nhập để tiếp tục xem phim yêu thích
              </p>
            )}

            {authModalMode === "register" && (
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Đăng ký hoàn toàn miễn phí chỉ trong vài giây
              </p>
            )}

            {authModalMode === "otp" && (
              <p className="text-xs sm:text-sm text-white/60 mt-1">
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
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  required
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ Email"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  aria-label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full h-12 pl-10 pr-11 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-white/50 hover:text-brand-green transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button (Prominent Emerald Action Button) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-green to-[#25d366] hover:brightness-110 active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <span>Đăng nhập ngay</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-2 select-none">
                <div className="w-full border-t border-white/10" />
                <span className="absolute px-3 bg-[#0A0E0C] text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  Hoặc tiếp tục với
                </span>
              </div>

              {/* Google Social Login Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 hover:border-white/25 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                >
                  <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 group-hover:scale-105 transition-transform" />
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
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  required
                  aria-label="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Họ và tên của bạn"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  required
                  aria-label="Email Google (@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Địa chỉ Gmail (ví dụ: ten_ban@gmail.com)"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  aria-label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                  className="w-full h-12 pl-10 pr-11 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded-md"
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
                className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-green to-[#25d366] hover:brightness-110 active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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

              {/* Divider */}
              <div className="relative flex items-center justify-center py-1.5 select-none">
                <div className="w-full border-t border-white/10" />
                <span className="absolute px-3 bg-[#0A0E0C] text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  Hoặc
                </span>
              </div>

              {/* Google Social Option */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 hover:border-white/25 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                >
                  <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 group-hover:scale-105 transition-transform" />
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
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-green to-[#25d366] hover:brightness-110 active:scale-[0.99] text-black font-extrabold text-sm sm:text-base shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer"
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
