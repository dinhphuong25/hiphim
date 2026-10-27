"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";

interface EmbedPlayerProps {
  videoUrl: string;
  onEnded?: () => void;
  onSwitchToM3u8?: () => void;
  onReportError?: () => void;
  movieName?: string;
  episodeName?: string;
  hasAlternativeServer?: boolean;
  onSwitchServer?: () => void;
}

const EmbedPlayer = ({
  videoUrl,
  onEnded,
  onSwitchToM3u8,
  onReportError,
  movieName,
  episodeName,
  hasAlternativeServer,
  onSwitchServer,
}: EmbedPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [videoUrl, iframeKey]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleReload = useCallback(() => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  }, []);

  return (
    <div 
      className="relative bg-black w-full h-full group select-none overflow-hidden rounded-2xl border border-white/5 shadow-2xl"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Top gradient overlay for controls */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

      {/* Top Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 bg-black/60 hover:bg-black/90 backdrop-blur-md text-white rounded-full transition-all border border-white/10 active:scale-95 cursor-pointer shadow-lg"
          title="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>

        {/* Quick Actions (Reload, Report) */}
        <div className="flex items-center gap-2">

          <button
            onClick={handleReload}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white/80 hover:text-white border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
            title="Tải lại trình phát"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onReportError && (
            <button
              onClick={onReportError}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-amber-400 hover:text-amber-300 border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Báo lỗi video"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Iframe */}
      <iframe
        key={iframeKey}
        src={videoUrl}
        className="w-full h-full absolute inset-0 rounded-2xl border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        title="Video Player"
        onLoad={() => setIsLoading(false)}
      />

      {/* Loading Indicator */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/90 z-20 transition-opacity duration-500 pointer-events-none ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
          <p className="text-white text-xs sm:text-sm font-semibold tracking-wide animate-pulse">
            Đang kết nối Máy chủ Dự phòng...
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbedPlayer;
