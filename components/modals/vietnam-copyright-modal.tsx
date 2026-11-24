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
          "relative w-full max-w-[480px] rounded-3xl bg-[#0e1411] border border-amber-500/30 p-6 sm:p-8 text-center flex flex-col items-center gap-4 sm:gap-5 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(245,158,11,0.12)] animate-in zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button X */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer z-10"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shield Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mt-1 shadow-[0_0_24px_rgba(245,158,11,0.2)] shrink-0 relative z-10">
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h2
          id="vn-copyright-title"
          className="text-lg sm:text-xl font-black text-white tracking-tight relative z-10"
        >
          Thông Báo Bản Quyền
        </h2>

        {/* Concise Description */}
        <p className="text-sm sm:text-[15px] text-white/80 leading-relaxed px-1 sm:px-3 relative z-10">
          Hi Phim không phát sóng phim Việt Nam nhằm tôn trọng bản quyền điện ảnh nước nhà. Quý khán giả vui lòng theo dõi qua các nền tảng có bản quyền hoặc rạp chiếu phim.
        </p>

        {/* Single Confirm Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full mt-1 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-brand-green to-[#10B981] hover:brightness-110 active:scale-[0.98] text-[#050807] font-black text-sm sm:text-[15px] transition-all cursor-pointer shadow-[0_6px_20px_rgba(32,214,107,0.3)] relative z-10"
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
