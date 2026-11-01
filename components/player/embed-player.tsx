"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  AlertTriangle,
  Play,
  Maximize,
  Minimize,
  SkipForward,
  Zap,
  Loader2,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmbedPlayerProps {
  videoUrl: string;
  poster?: string;
  onEnded?: () => void;
  onSwitchToM3u8?: () => void;
  onReportError?: () => void;
  movieName?: string;
  episodeName?: string;
  serverName?: string;
  hasAlternativeServer?: boolean;
  onSwitchServer?: () => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const EmbedPlayer = ({
  videoUrl,
  poster,
  onEnded,
  onSwitchToM3u8,
  onReportError,
  movieName,
  episodeName,
  serverName = "Máy chủ VIP",
  hasAlternativeServer,
  onSwitchServer,
  hasNextEpisode,
  onNextEpisode,
  onFullscreenChange,
}: EmbedPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Reset loading state whenever the video URL or reload key changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setShowControls(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, [videoUrl, iframeKey]);

  // Handle auto-hiding controls after inactivity
  const showControlsHandler = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3200);
  }, []);

  useEffect(() => {
    showControlsHandler();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [showControlsHandler]);

  // Fullscreen container handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      onFullscreenChange?.(active);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  // Keyboard shortcut for fullscreen (F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

  const handleReload = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  }, []);

  const cleanServerLabel = serverName
    .replace(/^Dự Phòng\s*\((.*)\)$/i, "$1")
    .replace(/^Dự Phòng$/i, "VIP")
    .trim() || "VIP";

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsHandler}
      onTouchStart={showControlsHandler}
      className={cn(
        "relative bg-black w-full h-full aspect-video select-none overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 group",
        isFullscreen && "rounded-none border-0 aspect-auto"
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Ambient Cinema Backdrop Glow matching Hi Phim default player */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-green/10 via-transparent to-brand-green/10 rounded-2xl blur-xl opacity-30 pointer-events-none" />

      {/* Main Video Iframe */}
      <iframe
        key={iframeKey}
        src={videoUrl}
        className="w-full h-full absolute inset-0 rounded-2xl border-0 z-10"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        title="Hi Phim VIP Video Player"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />

      {/* Top Header Bar with Cinema VIP Badge & Hi Phim Watermark */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 sm:px-5 pt-3 sm:pt-4 pb-8 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none select-none",
          showControls && !isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Left Cluster: VIP Badge & Film Details */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b130e]/85 backdrop-blur-md text-brand-green border border-brand-green/35 text-[11px] font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(32,214,107,0.25)]">
            <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-brand-green" />
            <span>MÁY CHỦ {cleanServerLabel}</span>
          </div>

          {movieName && (
            <span className="text-white/80 text-xs font-bold line-clamp-1 hidden md:inline-block drop-shadow-md">
              {movieName} {episodeName ? `• ${episodeName}` : ""}
            </span>
          )}
        </div>

        {/* Right Cluster: Brand Watermark & Quick Actions */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Watermark HIPHIM. */}
          <div className="text-[11px] sm:text-xs font-black tracking-widest text-white/50 uppercase font-mono mr-1 drop-shadow-md">
            HIPHIM<span className="text-brand-green">.</span>
          </div>

          {/* Quick Reload Button */}
          <button
            onClick={handleReload}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 hover:text-brand-green backdrop-blur-md text-white/80 border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
            title="Tải lại luồng phát VIP"
            aria-label="Tải lại luồng phát"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Error Report Button */}
          {onReportError && (
            <button
              onClick={onReportError}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-amber-400 hover:text-amber-300 border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Báo lỗi video"
              aria-label="Báo lỗi video"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Cinema Control & Status Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 sm:px-5 pb-3 sm:pb-4 pt-8 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 pointer-events-none select-none",
          showControls && !isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Left Cluster: Live Server Indicator + Switch Server Button */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 text-xs bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            <span className="font-extrabold text-brand-green text-[11px] sm:text-xs tracking-wider uppercase">
              VIP PRO
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/90 font-mono font-bold text-[11px] sm:text-xs">
              1080p FHD
            </span>
          </div>

          {/* Switch to Default HLS server if alternative exists */}
          {hasAlternativeServer && onSwitchToM3u8 && (
            <button
              type="button"
              onClick={onSwitchToM3u8}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-brand-green/20 text-white/90 hover:text-brand-green text-[11px] font-bold border border-white/15 hover:border-brand-green/35 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Đổi sang Máy chủ Mặc định (HLS Siêu Nhanh)"
            >
              <Play className="w-3 h-3 fill-current text-brand-green" />
              <span>Đổi sang Mặc định</span>
            </button>
          )}
        </div>

        {/* Right Cluster: Next Episode + Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {hasNextEpisode && onNextEpisode && (
            <button
              type="button"
              onClick={onNextEpisode}
              className="text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10"
              title="Tập tiếp theo"
              aria-label="Tập tiếp theo"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10"
            title={isFullscreen ? "Thu nhỏ (F)" : "Toàn màn hình (F)"}
            aria-label="Toàn màn hình"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* Loading Screen Overlay - Exact match with Hi Phim Cinema VideoPlayer */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-[#070a08] z-20 transition-opacity duration-500 pointer-events-none select-none",
          isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Poster backdrop blur */}
        {poster && (
          <img
            src={poster}
            alt={movieName || "Movie Poster"}
            className="w-full h-full object-cover filter blur-md scale-105 opacity-25 pointer-events-none absolute inset-0"
          />
        )}

        {/* Top Watermark during loading */}
        <div className="absolute top-3.5 right-4 z-20 text-[11px] sm:text-xs font-black tracking-widest text-white/50 uppercase font-mono">
          HIPHIM<span className="text-brand-green">.</span>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm">
          <Loader2 className="w-11 h-11 sm:w-12 sm:h-12 text-brand-green animate-spin mb-4" />
          <h3 className="text-white font-extrabold text-sm sm:text-base tracking-wide mb-1">
            Đang kết nối Máy chủ VIP...
          </h3>
          <p className="text-white/60 text-xs leading-relaxed animate-pulse">
            Đang tối ưu luồng phát Full HD chất lượng cao
          </p>
        </div>
      </div>

      {/* Error Fallback Overlay */}
      {hasError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#070908]/95 px-6 text-center backdrop-blur-md animate-in fade-in select-none">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm sm:text-base mb-1.5">
            Không thể tải luồng phát Máy chủ VIP
          </h3>
          <p className="text-white/70 text-xs sm:text-sm mb-5 max-w-sm leading-relaxed">
            Nguồn phát dự phòng tạm thời gián đoạn. Bạn có thể thử kết nối lại hoặc chuyển về Máy chủ Mặc định.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onSwitchToM3u8 && (
              <Button
                onClick={onSwitchToM3u8}
                size="sm"
                className="bg-brand-green hover:bg-brand-green/90 text-black font-extrabold rounded-xl h-9 px-4 cursor-pointer shadow-[0_0_15px_rgba(32,214,107,0.4)]"
              >
                <Play className="w-3.5 h-3.5 fill-current mr-1.5" />
                Đổi sang Máy chủ Mặc định
              </Button>
            )}

            <Button
              onClick={handleReload}
              variant="outline"
              size="sm"
              className="text-white border-white/20 bg-white/5 hover:bg-white/10 font-bold rounded-xl h-9 px-4 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Thử lại kết nối
            </Button>

            {onReportError && (
              <Button
                onClick={onReportError}
                size="sm"
                variant="ghost"
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-bold rounded-xl cursor-pointer h-9 px-3 border border-amber-400/20"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                Báo lỗi
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbedPlayer;
