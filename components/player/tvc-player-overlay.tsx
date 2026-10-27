"use client";

import React, { useState, useEffect, useRef } from "react";
import { VolumeX, ExternalLink, SkipForward } from "lucide-react";

interface TVCPlayerOverlayProps {
  tvcUrl?: string;
  targetUrl?: string;
  skipAfterSeconds?: number;
  onComplete: () => void;
}

export default function TVCPlayerOverlay({
  tvcUrl = "https://bf.333xbet.com/18881999/video9922.mp4",
  targetUrl = "https://154.82.109.157/2138063.html",
  skipAfterSeconds = 5,
  onComplete,
}: TVCPlayerOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(skipAfterSeconds);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isAutoplayMuted, setIsAutoplayMuted] = useState<boolean>(false);

  useEffect(() => {
    // Safety fallback: Nếu video không load được trong 5s, tự động vào phim chính
    const fallbackTimer = setTimeout(() => {
      if (!hasStarted) {
        onComplete();
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, [hasStarted, onComplete]);

  // Tự động phát video TVC có tiếng
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Thiết lập bật tiếng mặc định
    video.muted = false;
    video.volume = 1;

    const unmute = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
        setIsAutoplayMuted(false);
      }
    };

    const tryPlay = video.play();
    if (tryPlay !== undefined) {
      tryPlay
        .then(() => {
          setIsAutoplayMuted(false);
        })
        .catch(() => {
          // Trình duyệt (Chrome/Edge/Safari) chặn phát tiếng khi chưa có tương tác người dùng
          video.muted = true;
          setIsAutoplayMuted(true);
          video.play().catch(() => {
            onComplete();
          });

          // Lắng nghe tương tác đầu tiên ở bất kỳ đâu trên trang để bật tiếng ngay lập tức
          const handleFirstInteraction = () => {
            unmute();
            window.removeEventListener("click", handleFirstInteraction, true);
            window.removeEventListener("touchstart", handleFirstInteraction, true);
            window.removeEventListener("keydown", handleFirstInteraction, true);
          };

          window.addEventListener("click", handleFirstInteraction, true);
          window.addEventListener("touchstart", handleFirstInteraction, true);
          window.addEventListener("keydown", handleFirstInteraction, true);
        });
    }
  }, [onComplete]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!hasStarted && video.currentTime > 0) {
      setHasStarted(true);
    }

    setCurrentTime(video.currentTime);
    const remaining = Math.max(0, Math.ceil(skipAfterSeconds - video.currentTime));
    setCountdown(remaining);

    if (video.currentTime >= skipAfterSeconds && !canSkip) {
      setCanSkip(true);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration || 0);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  const handleOpenAd = () => {
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleVideoClick = () => {
    // Nếu đang bị tắt tiếng do chính sách trình duyệt, lần chạm đầu tiên sẽ bật tiếng
    if (videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      setIsAutoplayMuted(false);
      return;
    }
    handleOpenAd();
  };

  const handleUnmuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      setIsAutoplayMuted(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer"
      onClick={handleVideoClick}
    >
      {/* Video TVC */}
      <video
        ref={videoRef}
        src={tvcUrl}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onComplete}
        onError={onComplete}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Nút Bật Tiếng Nhỏ Gọn (Chỉ hiện khi trình duyệt chặn tự động phát âm thanh) */}
      {isAutoplayMuted && (
        <div className="absolute top-2.5 sm:top-3.5 left-3 sm:left-4 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleUnmuteClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-[11px] sm:text-xs font-semibold border border-white/25 shadow-lg backdrop-blur-md cursor-pointer active:scale-95 animate-pulse"
          >
            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            <span>Chạm để bật tiếng</span>
          </button>
        </div>
      )}

      {/* Nút Truy Cập ở góc trên bên phải */}
      {targetUrl && (
        <div className="absolute top-2.5 sm:top-3.5 right-3 sm:right-4 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAd();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/65 hover:bg-black/90 text-white/90 hover:text-white text-[11px] sm:text-xs font-medium border border-white/20 hover:border-white/40 transition-all shadow-sm backdrop-blur-md cursor-pointer active:scale-95"
          >
            <span>Truy cập</span>
            <ExternalLink className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      )}

      {/* Góc dưới bên phải: Nút Bỏ Qua Quảng Cáo Nhỏ Gọn, Tối Giản */}
      <div className="absolute bottom-2.5 sm:bottom-4 right-3 sm:right-4 z-20 pointer-events-auto">
        {canSkip ? (
          <button
            type="button"
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded bg-black/75 hover:bg-black/90 active:bg-black text-white text-[11px] sm:text-xs font-medium border border-white/25 hover:border-white/50 backdrop-blur-md shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>Bỏ qua quảng cáo</span>
            <SkipForward className="w-3.5 h-3.5 text-white" />
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/60 text-white/70 border border-white/15 text-[10px] sm:text-[11px] font-medium backdrop-blur-sm shadow-sm">
            <span>Bỏ qua sau</span>
            <span className="font-mono text-white font-semibold">{countdown}s</span>
          </div>
        )}
      </div>

      {/* Progress bar của TVC tối giản */}
      {duration > 0 && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/15 z-30">
          <div
            className="h-full bg-white/70 transition-all duration-100 ease-linear"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
