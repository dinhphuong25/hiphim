"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-black overflow-hidden relative">
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-30" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-zinc-900/80 border border-white/10 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm">
            <AlertCircle className="w-10 h-10 text-red-500 opacity-90" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Oops! Đã xảy ra sự cố
        </h1>
        
        <p className="text-zinc-400 text-base md:text-lg mb-4 max-w-lg mx-auto leading-relaxed">
          Đường truyền máy chiếu đang gặp chút rắc rối kỹ thuật. Đừng lo, bạn có thể thử khởi động lại trang hoặc quay về trang chủ.
        </p>

        {/* Error Code Digest */}
        {error?.digest && (
          <div className="bg-red-950/30 border border-red-500/20 p-3 rounded-lg mb-8 max-w-md mx-auto w-full text-center">
            <p className="text-red-400/90 font-mono text-xs">
              Mã lỗi hệ thống: <span className="font-bold">{error.digest}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Button 
            onClick={() => reset()}
            size="lg" 
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-8 rounded-full transition-all duration-300 border border-white/10 backdrop-blur-sm"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Tải lại trang
          </Button>
          
          <Link href="/" passHref className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 rounded-full shadow-[0_0_30px_-10px_rgba(255,165,0,0.5)] transition-all duration-300"
            >
              <Home className="w-5 h-5 mr-2" />
              Về Trang Chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
