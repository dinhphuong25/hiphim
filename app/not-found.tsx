"use client";

import Link from "next/link";
import { Film, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-black overflow-hidden relative selection:bg-primary/30">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] mix-blend-screen opacity-30" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto">
        {/* Film reel floating icon */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-zinc-900/80 border border-white/10 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
            <Film className="w-10 h-10 text-primary opacity-80" strokeWidth={1.5} />
          </div>
          {/* Glitch lines */}
          <div className="absolute top-1/2 -left-4 w-32 h-0.5 bg-primary/50 -rotate-45 blur-sm opacity-50" />
        </div>

        {/* 404 Title */}
        <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/10 select-none mb-4">
          404
        </h1>
        
        {/* Error message */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
          Lạc lối giữa rạp phim
        </h2>
        <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Cuốn phim bạn đang tìm kiếm có thể đã bị xóa, thay đổi tên, hoặc tạm thời không thể phát sóng. Xin vui lòng chọn bộ phim khác.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link href="/" passHref className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-full shadow-[0_0_40px_-10px_rgba(255,165,0,0.5)] transition-all duration-300"
            >
              <Home className="w-5 h-5 mr-2" />
              Về Trang Chủ
            </Button>
          </Link>
          
          <Link href="/search" passHref className="w-full sm:w-auto">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border-white/10 font-medium px-8 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <Search className="w-5 h-5 mr-2" />
              Tìm Phim Mới
            </Button>
          </Link>
        </div>

        {/* Back Link */}
        <button 
          onClick={() => window.history.back()}
          className="mt-12 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Quay lại trang trước</span>
        </button>
      </div>
    </div>
  );
}
