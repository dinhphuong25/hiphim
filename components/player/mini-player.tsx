"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Maximize2, Volume2, VolumeX } from "lucide-react";

interface MiniPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  title?: string;
  onClose?: () => void;
}

/**
 * Mini floating player that appears when user scrolls the main player out of view.
 * Uses the native browser Picture-in-Picture API when available,
 * with a custom CSS fallback for browsers that don't support it.
 */
export default function MiniPlayer({ videoRef, title, onClose }: MiniPlayerProps) {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const [pipSupported] = useState(
    typeof document !== "undefined" && "pictureInPictureEnabled" in document
  );

  const triggerPiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !pipSupported) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP blocked by browser policy — ignore
    }
  }, [videoRef, pipSupported]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playerWrapper = video.closest("[data-player-wrapper]") as HTMLElement | null;
    if (!playerWrapper) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting && !document.pictureInPictureElement);
      },
      { threshold: 0.2 }
    );

    obs.observe(playerWrapper);
    return () => obs.disconnect();
  }, [videoRef]);

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-4 z-[200] flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 w-60 sm:w-72 animate-in slide-in-from-bottom-4 duration-300"
      style={{ background: "rgba(10,10,10,0.95)" }}
    >
      {/* Video clone / PiP prompt */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {pipSupported ? (
          <button
            onClick={triggerPiP}
            className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors group"
            aria-label="Kích hoạt Picture-in-Picture"
          >
            <Maximize2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="text-xs">Nhấn để bật PiP</span>
          </button>
        ) : (
          <span className="text-white/40 text-xs text-center px-4">
            Quay lại trang để xem tiếp
          </span>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {title && (
          <p className="text-xs text-white/80 font-medium truncate flex-1">{title}</p>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleMuteToggle}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            className="p-1.5 rounded-full hover:bg-red-600/80 text-white/60 hover:text-white transition-colors"
            aria-label="Đóng mini player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
