"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [isMerged, setIsMerged] = useState(false);
  const [showSlogan, setShowSlogan] = useState(false);
  const [progress, setProgress] = useState(0);

  const dismiss = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setShow(false);
    }, 300);
  }, []);

  useEffect(() => {
    // Phase 1: Hiệu ứng trượt ghép logo và tên xuất hiện nhanh gọn
    const tMerge = setTimeout(() => {
      setIsMerged(true);
    }, 80);

    // Phase 2: Slogan xuất hiện ngay khi ghép xong
    const tSlogan = setTimeout(() => {
      setShowSlogan(true);
    }, 300);

    // Phase 3: Thanh loading chạy nhanh (~1 giây)
    const tProgress = setTimeout(() => {
      setProgress(100);
    }, 100);

    // Phase 4: Mờ dần và hoàn tất loading nhanh chóng (~1.1 giây)
    const tFade = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setShow(false);
      }, 300);
    }, 1100);

    return () => {
      clearTimeout(tMerge);
      clearTimeout(tSlogan);
      clearTimeout(tProgress);
      clearTimeout(tFade);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      onClick={dismiss}
      onTouchStart={dismiss}
      role="status"
      aria-label="Đang tải Hi Phim"
      className={cn(
        "fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black select-none cursor-pointer transition-opacity duration-300 ease-out overflow-hidden",
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center text-center px-6">
        {/* ======================================================== */}
        {/* HIỆU ỨNG GHÉP LOGO VÀ TÊN (CÂN ĐỐI, CHỮ NHỎ TINH TẾ)    */}
        {/* ======================================================== */}
        <div className="relative flex items-center justify-center gap-2.5 sm:gap-3 md:gap-3.5">
          {/* Biểu tượng Logo — Kích thước nhỏ gọn, trượt vào tâm */}
          <div
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu",
              isMerged
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 -translate-x-6 sm:-translate-x-8 scale-90"
            )}
          >
            <Image
              src="/favicon.png"
              alt="Hi Phim"
              width={48}
              height={48}
              className="w-full h-full object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
              priority
              unoptimized
            />
          </div>

          {/* Phần Tên: HI PHIM. — Cỡ chữ nhỏ gọn thanh lịch */}
          <div
            className={cn(
              "flex items-baseline tracking-tight font-[family-name:var(--font-oswald)] text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold uppercase select-none leading-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu",
              isMerged
                ? "opacity-100 translate-x-0 scale-100"
                : "opacity-0 translate-x-6 sm:translate-x-8 scale-95"
            )}
          >
            <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
              HI
            </span>
            <span className="ml-1.5 sm:ml-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-[#2cf580] to-emerald-400">
              PHIM
            </span>
            <span className="text-brand-green font-black ml-0.5 inline-block">
              .
            </span>
          </div>
        </div>

        {/* Slogan: Chữ nhỏ thanh mảnh, khoảng cách giãn chữ điện ảnh */}
        <p
          className={cn(
            "mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] font-medium text-white/45 tracking-[0.28em] sm:tracking-[0.35em] uppercase transition-all duration-400 ease-out transform-gpu select-none",
            showSlogan
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          )}
        >
          ĐIỆN ẢNH KHÔNG GIỚI HẠN
        </p>

        {/* Thanh Loading: Mỏng nhẹ, chạy nhanh gọn (~1s) */}
        <div className="mt-5 sm:mt-6 w-32 sm:w-40 h-[2px] rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-[1000ms] ease-out shadow-[0_0_8px_rgba(32,214,107,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
