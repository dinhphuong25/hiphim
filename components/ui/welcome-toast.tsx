"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, Popcorn } from "lucide-react";

export default function WelcomeToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Để an toàn 100% vượt qua Splash loading, ta chờ hẳn 4 giây
    const showTimer = setTimeout(() => {
      setShow(true);
    }, 4000); 
    
    // Tự động tắt sau 12 giây 
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 12000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <div className="hidden"><Popcorn /></div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 sm:px-0 animate-in slide-in-from-top-10 fade-in duration-500">
      <div className="relative overflow-hidden bg-zinc-950/95 backdrop-blur-md border border-primary/30 shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)] rounded-full p-1.5 pr-10 flex items-center gap-3">
        {/* Left Icon Badge */}
        <div className="shrink-0 bg-primary/20 p-2 rounded-full flex items-center justify-center">
             <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col justify-center py-1">
          <p className="text-white text-sm font-medium leading-snug">
            Chào mừng đến với <span className="text-primary font-bold">Hi Phim</span>!
          </p>
          <p className="text-white/60 text-xs">
            Chúc bạn xem phim thật vui vẻ 🍿
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => setShow(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Progress Bar (Bottom edge) */}
        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-transparent rounded-full overflow-hidden">
            <div className="h-full bg-primary origin-left animate-progress-shrink" style={{ animationDuration: "8s", animationFillMode: "forwards", animationTimingFunction: "linear" }} />
        </div>
      </div>
    </div>
    </>
  );
}
