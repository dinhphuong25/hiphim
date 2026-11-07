"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User,
  LogIn,
  Heart,
  History,
  LogOut,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Crown,
  Shield,
  Users,
  Film,
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnimatedUserIcon } from "@/components/ui/animated-header-icons";

export default function UserMenu() {
  const { user, loading, openAuthModal, logout, syncWithServer } = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithServer();
    setIsSyncing(false);
    toast.success("Đã đồng bộ phim yêu thích & lịch sử xem!");
  };

  if (loading && !user) {
    return (
      <div className="w-9 sm:w-28 h-9 sm:h-10 rounded-full bg-white/5 flex items-center justify-center gap-1.5 px-3 text-white/30 text-xs shrink-0 animate-pulse">
        <User className="w-4 h-4 opacity-40 shrink-0" />
        <span className="hidden sm:inline text-[11px] font-medium">Đang tải...</span>
      </div>
    );
  }

  // Not logged in -> Show Login button
  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("login")}
        className="pointer-events-auto flex items-center justify-center gap-2 px-3.5 sm:px-4 h-9 sm:h-9.5 rounded-xl bg-brand-green/15 hover:bg-brand-green/25 border border-brand-green/40 hover:border-brand-green/70 text-brand-green hover:text-white shadow-[0_0_15px_rgba(32,214,107,0.15)] text-[12.5px] font-bold group transition-all duration-200 active:scale-95 shrink-0 cursor-pointer"
        aria-label="Đăng nhập tài khoản"
      >
        <User className="w-4 h-4 text-brand-green group-hover:scale-110 transition-transform shrink-0" strokeWidth={2} />
        <span className="font-bold tracking-tight">Đăng Nhập</span>
      </button>
    );
  }

  // Logged in -> Show User Avatar & Dropdown Menu
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();
  const isSuperAdmin =
    user.role === "superadmin" ||
    user.role === "admin" ||
    user.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
  const isVip = user.role === "vip" || user.email?.toLowerCase() === "kimdinhphuong205@gmail.com";

  return (
    <div className="relative shrink-0 pointer-events-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 sm:gap-2.5 h-9 sm:h-9.5 pl-1.5 pr-2.5 sm:pr-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-brand-green/50 text-white transition-all duration-200 group active:scale-95 cursor-pointer",
          isSuperAdmin && "border-amber-400/40 hover:border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-amber-400/[0.05]",
          !isSuperAdmin && isVip && "border-amber-400/35 hover:border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.15)]",
          isOpen && "border-brand-green shadow-[0_0_20px_rgba(32,214,107,0.25)]"
        )}
        aria-label="Menu tài khoản"
      >
        {/* Circular Avatar */}
        <div className={cn(
          "w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg font-black text-xs sm:text-[13px] flex items-center justify-center shrink-0 relative",
          isSuperAdmin
            ? "bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_16px_rgba(251,191,36,0.7)] ring-1.5 ring-amber-300"
            : "bg-gradient-to-tr from-brand-green to-emerald-300 text-black shadow-[0_0_10px_rgba(32,214,107,0.4)]"
        )}>
          {initial}
          {isSuperAdmin && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-black flex items-center justify-center ring-1 ring-[#111714] shadow-[0_0_6px_rgba(251,191,36,0.9)]">
              <Crown className="w-2 h-2 fill-current" />
            </span>
          )}
          {!isSuperAdmin && isVip && (
            <span className="sm:hidden absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-black flex items-center justify-center ring-1 ring-[#111714]">
              <Crown className="w-2 h-2 fill-current" />
            </span>
          )}
        </div>

        {/* User Display Name */}
        <span className="hidden sm:inline-block max-w-[120px] md:max-w-[150px] lg:max-w-[180px] xl:max-w-[210px] truncate text-[13px] font-bold text-white/95 group-hover:text-white transition-colors">
          {user.name || user.email.split("@")[0]}
        </span>

        {/* Super Admin Ultra Badge / VIP Pill Badge */}
        {isSuperAdmin ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-1 ring-amber-200/90 tracking-wider">
            <Crown className="w-3.5 h-3.5 fill-black stroke-black shrink-0" />
            <span>Admin</span>
          </span>
        ) : isVip ? (
          <span className="hidden md:inline-flex items-center gap-1.5 text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400/25 to-yellow-500/15 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.2)] tracking-wide">
            <Crown className="w-3 h-3 text-amber-300" />
            VIP
          </span>
        ) : null}

        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-white/50 group-hover:text-brand-green transition-transform duration-200 ml-0.5",
            isOpen && "rotate-180 text-brand-green"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-[330px] rounded-3xl bg-[#0c120e]/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(32,214,107,0.12)] p-3 z-[100] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none">
          
          {/* Top User Info Card */}
          <div className={cn(
            "p-3.5 rounded-2xl border mb-2.5 shadow-inner",
            isSuperAdmin
              ? "bg-gradient-to-br from-amber-500/[0.12] via-yellow-500/[0.04] to-transparent border-amber-400/30 shadow-[0_0_25px_rgba(251,191,36,0.1)]"
              : "bg-white/[0.03] border-white/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0 shadow-lg relative",
                isSuperAdmin
                  ? "bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-black ring-2 ring-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.55)]"
                  : isVip
                  ? "bg-gradient-to-tr from-amber-400 to-yellow-500 text-black ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                  : "bg-gradient-to-tr from-brand-green to-emerald-400 text-black ring-2 ring-brand-green/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              )}>
                {initial}
                {isSuperAdmin && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 flex items-center justify-center text-black shadow-md ring-2 ring-[#0c120f]">
                    <Crown className="w-3 h-3 fill-black stroke-black" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{user.name}</span>
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0" title="Quản Trị Viên Tối Cao">
                      <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  ) : isVip ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  )}
                </p>
                <p className="text-[11px] text-white/50 truncate font-mono mt-0.5">{user.email}</p>
                
                {/* Ultra Luxury Badge */}
                {isSuperAdmin ? (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-600/25 border border-amber-400/60 shadow-[0_0_14px_rgba(251,191,36,0.3)]">
                    <Sparkles className="w-3 h-3 text-amber-300 shrink-0 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                      Quản Trị Viên Tối Cao
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                  </div>
                ) : isVip ? (
                  <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded-md">
                    <Sparkles className="w-2.5 h-2.5" />
                    Thành Viên VIP (Không Quảng Cáo)
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Super Admin Control Center Hub */}
          {isSuperAdmin && (
            <div className="mb-2.5 p-3 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-[#0e1712] to-black border border-emerald-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(34,197,94,0.12)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Bảng Điều Hành Quản Trị
                </span>
                <span className="text-[10px] font-mono text-white/40">v4.0 Pro</span>
              </div>

              {/* Master Button to Admin */}
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500/20 via-brand-green/25 to-emerald-500/20 hover:from-emerald-500/30 hover:to-brand-green/35 border border-emerald-500/40 hover:border-emerald-400/70 shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                      Mở Trang Quản Trị Hệ Thống
                    </p>
                    <p className="text-[10px] text-white/50 font-normal">Toàn bộ cài đặt, thành viên & website</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </Link>

              {/* 4 Quick Navigation Shortcuts */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <Link
                  href="/admin?tab=users"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 text-white/70 hover:text-white transition-all text-center group cursor-pointer"
                  title="Quản lý thành viên & cấm phim"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold">Thành Viên</span>
                </Link>

                <Link
                  href="/admin?tab=featured"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-500/30 border border-white/5 text-white/70 hover:text-white transition-all text-center group cursor-pointer"
                  title="Ghim phim đề xuất trang chủ"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold">Ghim Phim</span>
                </Link>

                <Link
                  href="/admin?tab=reports"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 hover:border-rose-500/30 border border-white/5 text-white/70 hover:text-white transition-all text-center group cursor-pointer"
                  title="Báo cáo lỗi tập phim từ người dùng"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold">Báo Lỗi</span>
                </Link>

                <Link
                  href="/admin?tab=settings"
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-white/[0.03] hover:bg-sky-500/10 hover:border-sky-500/30 border border-white/5 text-white/70 hover:text-white transition-all text-center group cursor-pointer"
                  title="Cấu hình hệ thống & SEO"
                >
                  <Settings className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-semibold">Cấu Hình</span>
                </Link>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 my-1.5" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={async () => {
              setIsOpen(false);
              await logout();
              if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
                window.location.href = "/";
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
