"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isClientAdmin } from "@/lib/vietnam-copyright";
import { useUserAuth } from "@/context/user-auth-context";

function VietnamCopyrightModalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useUserAuth();
  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "superadmin")) || isClientAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [targetMovieName, setTargetMovieName] = useState<string | null>(null);

  // Mở modal khi có Custom Event
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setTargetMovieName(detail?.movieName || null);
      setIsOpen(true);
    };

    window.addEventListener("open-vietnam-copyright-modal", handleOpen);
    return () => window.removeEventListener("open-vietnam-copyright-modal", handleOpen);
  }, []);

  // Tự động mở khi URL có country=viet-nam (chỉ áp dụng cho người dùng thông thường, không mở cho Admin)
  useEffect(() => {
    if (isAdmin) return;
    const country = searchParams?.get("country");
    if (country === "viet-nam") {
      setIsOpen(true);
    }
  }, [searchParams, isAdmin]);

  // Đóng khi nhấn phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (searchParams?.get("country") === "viet-nam") {
      router.replace(pathname || "/", { scroll: false });
    }
  }, [searchParams, router, pathname]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vn-copyright-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-[390px] rounded-2xl bg-[#0f1412] border border-amber-500/25 p-5 sm:p-6 text-center flex flex-col items-center gap-3.5 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button X */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Shield Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mt-1 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <ShieldAlert className="w-6 h-6 stroke-[2]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2
            id="vn-copyright-title"
            className="text-base sm:text-lg font-bold text-white tracking-tight"
          >
            Không Chiếu Phim Việt Nam
          </h2>
          {targetMovieName && (
            <p className="text-xs text-amber-300/90 font-medium truncate max-w-[300px]">
              &quot;{targetMovieName}&quot;
            </p>
          )}
        </div>

        {/* Concise Description */}
        <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed px-1">
          Hi Phim không phát sóng phim Việt Nam nhằm tôn trọng bản quyền điện ảnh nước nhà. Quý khán giả vui lòng theo dõi qua các nền tảng có bản quyền hoặc rạp chiếu phim.
        </p>

        {/* Single Confirm Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full mt-1 h-10 rounded-xl bg-brand-green hover:brightness-110 active:scale-[0.98] text-[#050807] font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-[0_4px_16px_rgba(32,214,107,0.25)]"
        >
          Đã Hiểu
        </button>
      </div>
    </div>
  );
}

export default function VietnamCopyrightModal() {
  return (
    <Suspense fallback={null}>
      <VietnamCopyrightModalContent />
    </Suspense>
  );
}
