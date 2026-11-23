"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ShieldAlert, X, Film, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

function VietnamCopyrightModalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [targetMovieName, setTargetMovieName] = useState<string | null>(null);

  // Mở modal khi có Custom Event
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.movieName) {
        setTargetMovieName(detail.movieName);
      } else {
        setTargetMovieName(null);
      }
      setIsOpen(true);
    };

    window.addEventListener("open-vietnam-copyright-modal", handleOpen);
    return () => window.removeEventListener("open-vietnam-copyright-modal", handleOpen);
  }, []);

  // Tự động mở khi URL có country=viet-nam
  useEffect(() => {
    const country = searchParams?.get("country");
    if (country === "viet-nam") {
      setIsOpen(true);
    }
  }, [searchParams]);

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
    // Nếu đang ở URL ?country=viet-nam, xóa query parameter để tránh loop
    if (searchParams?.get("country") === "viet-nam") {
      router.replace(pathname || "/", { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const handleExploreInternational = useCallback(() => {
    setIsOpen(false);
    if (searchParams?.get("country") === "viet-nam") {
      router.push("/", { scroll: false });
    }
  }, [searchParams, router]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vn-copyright-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-[540px] rounded-3xl bg-[#0B120E] border border-amber-500/30 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.12)] text-left flex flex-col gap-4.5 sm:gap-5 overflow-hidden animate-in zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* Vietnamese Flag / Shield Badge */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-600/25 via-amber-500/20 to-red-600/10 border border-amber-500/35 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <ShieldAlert className="w-6 h-6 text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10.5px] font-extrabold uppercase tracking-wider text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Bản Quyền Điện Ảnh Việt Nam
              </div>
              <h2
                id="vn-copyright-title"
                className="text-lg sm:text-xl font-black text-white tracking-tight mt-1"
              >
                Không Chiếu Phim Việt Nam
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Movie Notice (if triggered by a specific movie) */}
        {targetMovieName && (
          <div className="relative z-10 px-3.5 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/25 text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Film className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">
              Tác phẩm: <strong className="text-white">&quot;{targetMovieName}&quot;</strong>
            </span>
          </div>
        )}

        {/* Core Message */}
        <div className="relative z-10 space-y-3 text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
          <p className="text-white/95 font-medium">
            Nhằm tôn trọng và tuân thủ nghiêm ngặt Luật Sở hữu trí tuệ cũng như bảo vệ thành quả sáng tạo của các nhà làm phim nước nhà, <strong className="text-amber-300">Hi Phim cam kết KHÔNG phát sóng và không lưu trữ bất kỳ tác phẩm điện ảnh hay phim bộ nào của Việt Nam</strong>.
          </p>

          <p className="text-white/70">
            Kính mong quý khán giả yêu điện ảnh hãy chung tay ủng hộ các đoàn làm phim, đạo diễn và diễn viên Việt Nam bằng cách theo dõi phim qua:
          </p>

          {/* Recommended Platforms */}
          <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-xs font-semibold text-white/90">Rạp chiếu phim toàn quốc</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-xs font-semibold text-white/90">Galaxy Play, FPT Play</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-xs font-semibold text-white/90">VieON, TV360</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span className="text-xs font-semibold text-white/90">Netflix & Bản quyền số</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExploreInternational}
            className="w-full sm:flex-1 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-brand-green to-[#10B981] hover:brightness-110 active:scale-[0.98] text-[#050807] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(32,214,107,0.3)] transition-all cursor-pointer"
          >
            <span>Khám Phá Phim Quốc Tế</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto h-11 sm:h-12 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white border border-white/10 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Đã Hiểu
          </button>
        </div>
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
