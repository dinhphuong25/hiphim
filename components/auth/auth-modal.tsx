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

// Curated high-res verified posters for the 3-column cinematic collage (RoPhim Style)
const COLLAGE_COL1 = [
  "https://i0.wp.com/phimimg.com/uploads/movies/20260827/nguoi-nhen-khoi-dau-moi-poster.webp?w=320&strip=all", // Người Nhện
  "https://i0.wp.com/phimimg.com/uploads/movies/20261026/quy-bat-hon-poster.webp?w=320&strip=all", // Quỷ Bắt Hồn
  "https://i0.wp.com/phimimg.com/uploads/movies/20260830/yeu-het-long-chang-fanboy-poster.webp?w=320&strip=all", // Fanboy
  "https://i0.wp.com/phimimg.com/uploads/movies/20261028/shaun-the-sheep-quai-la-ghe-nha-poster.webp?w=320&strip=all", // Shaun The Sheep
];

const COLLAGE_COL2 = [
  "https://i0.wp.com/phimimg.com/uploads/movies/20260723/nu-hoang-nuoc-mat-poster.webp?w=320&strip=all", // Nữ Hoàng Nước Mắt
  "https://i0.wp.com/phimimg.com/uploads/movies/20261030/duoi-day-ho-poster.webp?w=320&strip=all", // Dưới Đáy Hồ
  "https://i0.wp.com/phimimg.com/uploads/movies/20261021/van-co-cua-co-ay-poster.webp?w=320&strip=all", // Ván Cờ Của Cô Ấy
  "https://i0.wp.com/phimimg.com/uploads/movies/20260919/hope-vung-tu-dia-poster.webp?w=320&strip=all", // Hope
];

const COLLAGE_COL3 = [
  "https://i0.wp.com/phimimg.com/uploads/movies/20260829/doraemon-nobita-va-lau-dai-duoi-day-bien-phien-ban-moi-poster.webp?w=320&strip=all", // Doraemon
  "https://i0.wp.com/phimimg.com/uploads/movies/20260827/nguoi-nhen-khoi-dau-moi-poster.webp?w=320&strip=all", // Người Nhện
  "https://i0.wp.com/phimimg.com/uploads/movies/20261026/quy-bat-hon-poster.webp?w=320&strip=all", // Quỷ Bắt Hồn
  "https://i0.wp.com/phimimg.com/uploads/movies/20260723/nu-hoang-nuoc-mat-poster.webp?w=320&strip=all", // Nữ Hoàng Nước Mắt
];

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
    syncWithServer,
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

  // OTP Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Forgot password flow states
  const [authView, setAuthView] = useState<"standard" | "forgot_email" | "forgot_otp">("standard");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(60);
  const [canResendForgotOtp, setCanResendForgotOtp] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const forgotOtpInputRef = useRef<HTMLInputElement>(null);

  // Reset states when opened or mode changed
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage("");
      setDevCodeBanner(null);
      setShowPassword(false);
      setShowNewPassword(false);
      setAuthView("standard");
      if (authModalMode === "otp") {
        setOtp("");
        setCountdown(60);
        setCanResend(false);
        setTimeout(() => otpInputRef.current?.focus(), 150);
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  // Standard register OTP timer countdown
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

  // Forgot Password OTP timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAuthModalOpen && authView === "forgot_otp" && forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => {
          if (prev <= 1) {
            setCanResendForgotOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAuthModalOpen, authView, forgotCountdown]);

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

  const handleForgotPassword = () => {
    setErrorMessage("");
    setDevCodeBanner(null);
    setForgotEmail(email.trim());
    setForgotOtp("");
    setNewPassword("");
    setAuthView("forgot_email");
  };

  const handleSendForgotOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com")) {
      setErrorMessage("Hệ thống chỉ chấp nhận địa chỉ email có đuôi @gmail.com");
      return;
    }
    const localPart = cleanEmail.replace("@gmail.com", "").trim();
    if (!localPart || localPart.length < 3) {
      setErrorMessage("Địa chỉ Gmail không hợp lệ (tên tài khoản quá ngắn)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        toast.success("Mã xác thực 6 số đã được gửi tới Gmail của bạn!");
        setForgotCountdown(60);
        setCanResendForgotOtp(false);
        setForgotOtp("");
        if (data.devMode && data.devCode) {
          setDevCodeBanner(data.devCode);
          setForgotOtp(data.devCode);
        }
        setAuthView("forgot_otp");
        setTimeout(() => forgotOtpInputRef.current?.focus(), 150);
      } else {
        setErrorMessage(data.error || "Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.");
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    }
  };

  const handleResendForgotOtp = async () => {
    if (!canResendForgotOtp || isSubmitting) return;
    await handleSendForgotOtp();
  };

  const handleVerifyResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (forgotOtp.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã OTP");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: forgotOtp.trim(),
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        toast.success("Đặt lại mật khẩu thành công! Đang tự động đăng nhập...");
        await syncWithServer();
        closeAuthModal();
        // Reset states
        setAuthView("standard");
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
      } else {
        setErrorMessage(data.error || "Mã OTP không chính xác hoặc đã hết hạn.");
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      {/* 2-Column Split Cinematic Modal Container (RoPhim Style) */}
      <div className="relative w-full max-w-[780px] bg-[#0A0E0C] border border-white/10 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(32,214,107,0.1)] overflow-hidden z-10 grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CINEMATIC POSTER COLLAGE (ROPHIM STYLE)     */}
        {/* ======================================================== */}
        <div className="relative hidden md:flex md:col-span-5 flex-col justify-end p-7 sm:p-8 overflow-hidden select-none bg-[#070B09] border-r border-white/[0.08]">
          
          {/* 3 Staggered Tilted Columns Poster Collage */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -inset-10 grid grid-cols-3 gap-2.5 -rotate-6 scale-110 opacity-45">
              {/* Column 1 */}
              <div className="flex flex-col gap-2.5 -translate-y-8">
                {COLLAGE_COL1.map((src, i) => (
                  <div key={i} className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#101714] shadow-xl">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="eager" />
                  </div>
                ))}
              </div>

              {/* Column 2 (Offset down) */}
              <div className="flex flex-col gap-2.5 translate-y-3">
                {COLLAGE_COL2.map((src, i) => (
                  <div key={i} className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#101714] shadow-xl">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="eager" />
                  </div>
                ))}
              </div>

              {/* Column 3 (Offset up) */}
              <div className="flex flex-col gap-2.5 -translate-y-12">
                {COLLAGE_COL3.map((src, i) => (
                  <div key={i} className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#101714] shadow-xl">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="eager" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cinematic Moody Vignette & Fade Gradients matching RoPhim */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C] via-[#0A0E0C]/65 to-[#0A0E0C]/35" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0E0C] to-transparent" />
            
            {/* Subtle Brand Green Ambient Glow */}
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-brand-green/15 blur-[100px] pointer-events-none" />
          </div>

          {/* Bottom Branding: Only clean Brand Logo & Slogan (NO card, NO box, NO rạp chiếu riêng!) */}
          <div className="relative z-10">
            <BrandLogo size="lg" showSlogan slogan="Điện ảnh không giới hạn" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: MODERN SLEEK AUTH FORM                     */}
        {/* ======================================================== */}
        <div className="md:col-span-7 flex flex-col justify-center p-7 sm:p-8 md:p-9 relative bg-[#0A0E0C]">
          
          {/* Close Button (Desktop) */}
          <button
            onClick={closeAuthModal}
            className="hidden md:flex absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white active:scale-95 transition-all z-20 cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mobile Header (Brand Logo + Close Button) */}
          <div className="md:hidden flex items-center justify-between mb-5 select-none">
            <BrandLogo size="md" showSlogan={false} />
            <button
              onClick={closeAuthModal}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title Header (RoPhim Style: Title + direct inline link to switch mode) */}
          <div className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {authView === "forgot_email" && "Quên mật khẩu"}
              {authView === "forgot_otp" && "Đặt lại mật khẩu"}
              {authView === "standard" && (
                <>
                  {authModalMode === "login" && "Đăng nhập"}
                  {authModalMode === "register" && "Đăng ký tài khoản"}
                  {authModalMode === "otp" && "Xác thực mã OTP"}
                </>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-white/50 mt-1.5">
              {authView === "forgot_email" && (
                <>
                  Nhập địa chỉ Gmail để nhận mã xác thực đặt lại mật khẩu.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setAuthView("standard");
                    }}
                    className="text-brand-green hover:underline font-bold cursor-pointer"
                  >
                    Quay lại
                  </button>
                </>
              )}

              {authView === "forgot_otp" && (
                <>
                  Mã xác thực 6 số đã được gửi tới{" "}
                  <strong className="text-brand-green underline">{forgotEmail}</strong>
                </>
              )}

              {authView === "standard" && (
                <>
                  {authModalMode === "login" && (
                    <>
                      Nếu bạn chưa có tài khoản,{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          openAuthModal("register");
                        }}
                        className="text-brand-green hover:underline font-bold cursor-pointer"
                      >
                        đăng ký ngay
                      </button>
                    </>
                  )}

                  {authModalMode === "register" && (
                    <>
                      Nếu bạn đã có tài khoản,{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          openAuthModal("login");
                        }}
                        className="text-brand-green hover:underline font-bold cursor-pointer"
                      >
                        đăng nhập ngay
                      </button>
                    </>
                  )}

                  {authModalMode === "otp" && (
                    <>
                      Mã xác thực 6 số đã được gửi tới{" "}
                      <strong className="text-brand-green underline">{pendingEmail || email}</strong>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm text-center font-medium animate-in fade-in duration-200">
              <p>{errorMessage}</p>
              {authView === "forgot_email" && errorMessage.includes("chưa được đăng ký") && (
                <button
                  type="button"
                  onClick={() => {
                    const targetEmail = forgotEmail.trim();
                    setErrorMessage("");
                    setEmail(targetEmail);
                    setAuthView("standard");
                    openAuthModal("register");
                  }}
                  className="mt-1.5 text-xs text-brand-green hover:underline font-bold inline-block cursor-pointer"
                >
                  👉 Bạn muốn tạo tài khoản mới với email này? Đăng ký ngay
                </button>
              )}
            </div>
          )}

          {/* Dev Mode OTP helper banner */}
          {devCodeBanner && (
            <div className="mb-3.5 p-3 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs sm:text-sm text-center font-medium">
              💡 <strong>[Dev Mode]</strong> Mã OTP của bạn là:{" "}
              <span className="font-mono font-bold tracking-widest text-sm sm:text-base underline">{devCodeBanner}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. LOGIN MODE                                            */}
          {/* ======================================================== */}
          {authView === "standard" && authModalMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  required
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
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
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Button (RoPhim Style: Big solid action button) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>

              {/* Centered Forgot Password Link (Like RoPhim) */}
              <div className="text-center pt-1.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-white/50 hover:text-brand-green transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. REGISTER MODE                                         */}
          {/* ======================================================== */}
          {authView === "standard" && authModalMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
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
                  className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
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
                  className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
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
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <span>Đăng ký tài khoản</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. OTP VERIFICATION MODE                                 */}
          {/* ======================================================== */}
          {authView === "standard" && authModalMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6 Digit OTP Segmented Boxes */}
              <div className="relative max-w-[320px] mx-auto py-1">
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
                <div className="flex items-center justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otp[index] || "";
                    const isCurrent = otp.length === index;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "w-10 sm:w-11 h-11 sm:h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl transition-all border-2 select-none",
                          digit
                            ? "bg-brand-green/10 border-brand-green text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.3)]"
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
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-green to-[#25d366] hover:brightness-110 active:scale-[0.99] text-black font-extrabold text-sm sm:text-base shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer"
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
              <div className="text-center pt-1">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isSubmitting}
                    className="text-xs sm:text-sm text-brand-green hover:underline font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
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
                  className="mt-3 text-xs text-white/40 hover:text-white/70 block mx-auto transition-colors cursor-pointer"
                >
                  ← Đổi địa chỉ email khác
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 4. FORGOT PASSWORD - STEP 1: ENTER EMAIL                 */}
          {/* ======================================================== */}
          {authView === "forgot_email" && (
            <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  aria-label="Địa chỉ Gmail (@gmail.com)"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Địa chỉ Gmail (ví dụ: ten_ban@gmail.com)"
                  className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !forgotEmail}
                className="w-full h-11 sm:h-12 rounded-xl bg-brand-green hover:bg-[#1bb85c] active:scale-[0.99] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <span>Gửi mã xác thực OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setAuthView("standard");
                  }}
                  className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 5. FORGOT PASSWORD - STEP 2: VERIFY OTP & NEW PASSWORD    */}
          {/* ======================================================== */}
          {authView === "forgot_otp" && (
            <form onSubmit={handleVerifyResetPassword} className="space-y-4">
              {/* 6 Digit OTP Segmented Boxes */}
              <div className="relative max-w-[320px] mx-auto py-1">
                <input
                  ref={forgotOtpInputRef}
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  autoFocus
                  aria-label="Mã xác thực OTP 6 số"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 font-mono"
                />
                <div className="flex items-center justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = forgotOtp[index] || "";
                    const isCurrent = forgotOtp.length === index;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "w-10 sm:w-11 h-11 sm:h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl transition-all border-2 select-none",
                          digit
                            ? "bg-brand-green/10 border-brand-green text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.3)]"
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

              {/* New Password Input with toggle */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  aria-label="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-xl bg-[#121815] border border-white/10 hover:border-white/20 text-white text-xs sm:text-sm placeholder:text-white/35 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded-md"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || forgotOtp.length < 6 || newPassword.length < 6}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-green to-[#25d366] hover:brightness-110 active:scale-[0.99] text-black font-extrabold text-sm sm:text-base shadow-[0_0_24px_rgba(32,214,107,0.35)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đặt lại mật khẩu & Đăng nhập</span>
                  </>
                )}
              </button>

              {/* Countdown & Resend Button */}
              <div className="text-center pt-1">
                {canResendForgotOtp ? (
                  <button
                    type="button"
                    onClick={handleResendForgotOtp}
                    disabled={isSubmitting}
                    className="text-xs sm:text-sm text-brand-green hover:underline font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã OTP mới
                  </button>
                ) : (
                  <p className="text-xs text-white/40">
                    Gửi lại mã sau: <span className="text-brand-green font-mono font-bold">{forgotCountdown}s</span>
                  </p>
                )}

                <div className="flex items-center justify-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setAuthView("forgot_email");
                    }}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                  >
                    ← Đổi email khác
                  </button>
                  <span className="text-white/20">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setAuthView("standard");
                    }}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                  >
                    Hủy & Đăng nhập
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
