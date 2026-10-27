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

  if (loading) {
    return (
      <div className="w-9 sm:w-28 h-9 sm:h-10 rounded-full bg-white/5 animate-pulse shrink-0" />
    );
  }

  // Not logged in -> Show Login button
  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("login")}
        className="pointer-events-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 h-9 sm:h-10 rounded-full bg-[#111714]/80 backdrop-blur-md hover:bg-white/[0.08] border border-white/10 hover:border-brand-green/40 hover:shadow-[0_0_20px_rgba(32,214,107,0.2)] text-white/80 hover:text-white transition-all duration-300 text-xs font-medium group active:scale-95 shrink-0"
        aria-label="Đăng nhập tài khoản"
      >
        <User className="w-4 h-4 text-brand-green group-hover:scale-110 transition-transform shrink-0" strokeWidth={1.85} />
        <span className="font-semibold text-white/90 group-hover:text-white">Đăng Nhập</span>
      </button>
    );
  }

  // Logged in -> Show User Avatar & Dropdown Menu
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();
  const isSuperAdmin = user.role === "superadmin" || user.role === "admin" || user.email.toLowerCase() === "kimdinhphuong205@gmail.com";

  return (
    <div className="relative shrink-0 pointer-events-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 pl-1.5 pr-2 sm:pr-3 rounded-full bg-[#111714]/90 backdrop-blur-md border border-white/15 hover:border-brand-green/60 text-white transition-all duration-300 group active:scale-95",
          isSuperAdmin && "border-amber-400/50 hover:border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.2)]",
          isOpen && "border-brand-green shadow-[0_0_20px_rgba(32,214,107,0.3)]"
        )}
        aria-label="Menu tài khoản"
      >
        {/* Circular Avatar */}
        <div className={cn(
          "w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0 relative",
          isSuperAdmin
            ? "bg-gradient-to-tr from-amber-400 via-emerald-400 to-brand-green text-black shadow-[0_0_12px_rgba(251,191,36,0.5)] ring-1.5 sm:ring-2 ring-amber-400/50"
            : "bg-gradient-to-tr from-brand-green to-emerald-300 text-black shadow-[0_0_10px_rgba(32,214,107,0.4)]"
        )}>
          {initial}
          {isSuperAdmin && (
            <span className="sm:hidden absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 text-black flex items-center justify-center ring-1 ring-[#111714]">
              <Crown className="w-2 h-2 fill-current" />
            </span>
          )}
        </div>

        {/* User Display Name */}
        <span className="hidden sm:inline-block max-w-[90px] md:max-w-[120px] truncate text-xs font-semibold text-white/90 group-hover:text-white">
          {user.name || user.email.split("@")[0]}
        </span>

        {/* Super Admin Pill Badge */}
        {isSuperAdmin && (
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400/25 to-amber-500/15 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.25)]">
            <Crown className="w-3 h-3 text-amber-300" />
            Admin
          </span>
        )}

        <ChevronDown
          className={cn(
            "w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/50 group-hover:text-brand-green transition-transform duration-200",
            isOpen && "rotate-180 text-brand-green"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-[330px] rounded-3xl bg-[#0c120e]/95 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(32,214,107,0.12)] p-3 z-[100] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none">
          
          {/* Top User Info Card */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-2.5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-11 h-11 rounded-2xl font-black text-base flex items-center justify-center shrink-0 shadow-lg relative",
                isSuperAdmin
                  ? "bg-gradient-to-tr from-amber-400 via-emerald-400 to-brand-green text-black ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  : "bg-gradient-to-tr from-brand-green to-emerald-400 text-black ring-2 ring-brand-green/40 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              )}>
                {initial}
                {isSuperAdmin && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-black ring-2 ring-[#0c120f]">
                    <Crown className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  {user.name}
                  {isSuperAdmin ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  )}
                </p>
                <p className="text-xs text-white/50 truncate font-mono">{user.email}</p>
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

          {/* Personal Menu Items */}
          <div className="space-y-1">
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Cá Nhân & Tiện Ích
            </div>

            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-white/50 group-hover:text-red-400 transition-colors" />
                <span>Phim Yêu Thích</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono">
                Đồng bộ
              </span>
            </Link>

            <Link
              href="/recently"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-white/50 group-hover:text-brand-green transition-colors" />
                <span>Lịch Sử Xem</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono">
                Đồng bộ
              </span>
            </Link>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className={cn("w-4 h-4 text-white/50 group-hover:text-brand-green transition-colors", isSyncing && "animate-spin text-brand-green")} />
                <span>Đồng Bộ Ngay</span>
              </div>
              <span className="text-[10px] text-brand-green font-mono">
                {isSyncing ? "Đang lưu..." : "Sẵn sàng"}
              </span>
            </button>
          </div>

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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
