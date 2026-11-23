import React from "react";
import Link from "next/link";
import { ShieldAlert, Home, Film } from "lucide-react";

interface VietnamMovieBlockedScreenProps {
  slug?: string;
  movie?: any;
  movieName?: string;
}

export default function VietnamMovieBlockedScreen({}: VietnamMovieBlockedScreenProps) {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4 py-10 sm:py-16">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0B120E]/[0.96] border border-amber-500/30 p-6 sm:p-9 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.15)] flex flex-col items-center text-center overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Shield Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(245,158,11,0.25)] mb-4 relative z-10 text-amber-400">
          <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* Badge Label */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-4 relative z-10">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Bản Quyền Điện Ảnh Việt Nam
        </div>

        {/* Content Paragraph */}
        <p className="text-sm text-white/80 leading-relaxed font-normal max-w-md mb-6 relative z-10">
          Hi Phim không phát sóng phim Việt Nam nhằm tôn trọng và bảo vệ bản quyền điện ảnh nước nhà. Quý khán giả vui lòng theo dõi qua các kênh chính thống hoặc rạp chiếu phim.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto relative z-10">
          <Link
            href="/"
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-brand-green to-[#10B981] hover:brightness-110 active:scale-[0.98] text-[#050807] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(32,214,107,0.3)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Về Trang Chủ</span>
          </Link>
          <Link
            href="/?typeList=phim-chieu-rap"
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/85 hover:text-white border border-white/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Film className="w-4 h-4" />
            <span>Khám Phá Phim Khác</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
