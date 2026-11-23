import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Film, Home, ArrowLeft, CheckCircle2 } from "lucide-react";
import { normalizeImageUrl } from "@/lib/image-helper";

interface VietnamMovieBlockedScreenProps {
  slug: string;
  movie?: any;
  movieName?: string;
}

export default function VietnamMovieBlockedScreen({
  slug,
  movie,
  movieName,
}: VietnamMovieBlockedScreenProps) {
  const displayName = movieName || movie?.name || "Tác phẩm điện ảnh Việt Nam";
  const poster = movie?.poster_url || movie?.thumb_url;
  const posterUrl = poster ? normalizeImageUrl(poster) : null;

  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0B120E]/[0.96] border border-amber-500/35 p-6 sm:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.15)] flex flex-col items-center text-center overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Shield Icon Badge */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-red-600/25 via-amber-500/20 to-red-600/10 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-5 relative z-10">
          <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 stroke-[2.2]" />
        </div>

        {/* Badge Label */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-3 relative z-10">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Bản Quyền Điện Ảnh Việt Nam
        </div>

        {/* Heading */}
        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight relative z-10 mb-2">
          Không Chiếu Phim Việt Nam
        </h1>

        {/* Target Movie Highlight */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/90 text-sm sm:text-base font-bold my-2 relative z-10 max-w-full">
          <Film className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{displayName}</span>
        </div>

        {/* Content Paragraph */}
        <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-normal max-w-lg mt-2 mb-6 relative z-10">
          Nhằm tuân thủ nghiêm ngặt Luật Sở hữu trí tuệ và tôn trọng bản quyền của các nhà làm phim nước nhà, <strong className="text-amber-300 font-semibold">Hi Phim cam kết KHÔNG phát sóng và không lưu trữ bất kỳ tác phẩm điện ảnh hay phim bộ nào của Việt Nam</strong>.
        </p>

        {/* Supported Platforms Notice */}
        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 mb-6 text-left relative z-10 space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-white/50">
            Kính mời quý khán giả theo dõi qua các kênh chính thức:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>Các cụm rạp chiếu phim toàn quốc</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>Galaxy Play, FPT Play</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>VieON, TV360</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>Netflix & Bản quyền số</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto relative z-10">
          <Link
            href="/"
            className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-gradient-to-r from-brand-green to-[#10B981] hover:brightness-110 active:scale-[0.98] text-[#050807] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(32,214,107,0.3)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Về Trang Chủ</span>
          </Link>
          <Link
            href="/?typeList=phim-chieu-rap"
            className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/85 hover:text-white border border-white/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Film className="w-4 h-4" />
            <span>Phim Chiếu Rạp Quốc Tế</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
