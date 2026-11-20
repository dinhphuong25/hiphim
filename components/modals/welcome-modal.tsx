"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Play, Building2, UserCheck, Sparkles } from "lucide-react";

const WELCOME_STORAGE_KEY = "hiphim_welcome_modal_v1";

export default function WelcomeModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Không hiện ở trang admin hoặc bảo trì
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/maintenance")) {
      return;
    }

    try {
      const hasSeen = localStorage.getItem(WELCOME_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage access errors
    }
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 select-none"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-3xl bg-[#0B100E]/95 border border-brand-green/30 p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(32,214,107,0.18)] flex flex-col items-center text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-brand-green/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />

        {/* Nút đóng [X] */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng thông báo"
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Badge */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-green/15 border border-brand-green/35 text-brand-green flex items-center justify-center shadow-[0_0_24px_rgba(32,214,107,0.25)]">
            <Play className="w-7 h-7 fill-brand-green translate-x-0.5" />
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/30 text-brand-green text-[11px] font-extrabold tracking-wider uppercase mb-2">
          <Sparkles className="w-3 h-3" />
          Phiên bản chính thức
        </span>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Chào Mừng Đến Với Hi Phim
        </h3>

        {/* Intro */}
        <p className="text-white/70 text-[13px] leading-relaxed mt-2 font-normal">
          Nền tảng xem phim trực tuyến <span className="text-brand-green font-bold">hoàn toàn miễn phí</span>, tốc độ cao với kho phim phong phú chuẩn Full HD &amp; 4K.
        </p>

        {/* Thông tin đơn vị phát triển & Founder */}
        <div className="w-full mt-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2.5 text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-brand-green" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] text-white/50 font-semibold uppercase tracking-wider">
                Đơn vị phát triển
              </div>
              <div className="text-[13px] font-bold text-white truncate">
                Được thành lập và phát triển bởi <span className="text-brand-green font-black">Hi Tech</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-brand-green" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] text-white/50 font-semibold uppercase tracking-wider">
                Founder Hi Tech
              </div>
              <div className="text-[13px] font-bold text-white truncate">
                Kim Đình Phương
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full mt-5 py-3 px-5 rounded-2xl bg-brand-green hover:bg-[#1bc25f] text-[#07110B] font-black text-sm tracking-wide shadow-[0_0_24px_rgba(32,214,107,0.35)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          Khám Phá Phim Ngay
        </button>
      </div>
    </div>
  );
}
