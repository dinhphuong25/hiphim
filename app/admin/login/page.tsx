"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, Film, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // If already authenticated as Admin, enter dashboard immediately
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (
          data.authenticated &&
          (data.user?.role === "admin" ||
            data.user?.role === "superadmin" ||
            data.user?.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
        ) {
          window.location.href = "/admin";
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Vui lòng nhập tài khoản và mật khẩu!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Đăng nhập thành công! Đang chuyển hướng...");
        window.location.href = "/admin";
      } else {
        toast.error(data.error || "Tài khoản hoặc mật khẩu không chính xác!");
      }
    } catch {
      toast.error("Lỗi kết nối máy chủ! Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
          <p className="text-xs text-white/50 font-mono">Đang kiểm tra quyền quản trị...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-cinema-text flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-brand-green/15 via-emerald-600/10 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center text-black font-black text-2xl shadow-[0_0_25px_rgba(34,197,94,0.4)] group-hover:scale-105 transition-transform">
              H
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Hi <span className="text-brand-green">Phim</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-white/70">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
            CỔNG QUẢN TRỊ VIÊN HỆ THỐNG
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#111]/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <h2 className="text-xl font-extrabold text-white mb-1.5">Đăng Nhập</h2>
          <p className="text-xs text-white/50 mb-6">
            Khu vực hạn chế. Vui lòng xác thực quyền quản trị để tiếp tục.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">
                Email hoặc Tài khoản Super Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kimdinhphuong205@gmail.com"
                  required
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 rounded-xl font-black text-sm bg-brand-green hover:bg-brand-green-hover text-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-white/50 leading-relaxed">
              Cổng bảo mật cấp cao. Chỉ tài khoản Super Admin <span className="text-brand-green font-mono font-bold">kimdinhphuong205@gmail.com</span> mới có quyền đăng nhập và quản trị.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            ← Quay về trang chủ Hi Phim
          </Link>
        </div>
      </div>
    </div>
  );
}
