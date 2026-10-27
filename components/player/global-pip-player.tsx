"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { pipStore, PipData } from "@/lib/pip-store";
import { X, Play, Pause, Maximize2, GripHorizontal } from "lucide-react";

export default function GlobalPipPlayer() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });
  const posRef = useRef({ x: 0, y: 0 });

  const [data, setData] = useState<PipData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  // Subscribe to pip store
  useEffect(() => {
    return pipStore.subscribe((d) => setData(d));
  }, []);

  // Set initial bottom-right position once mounted
  useEffect(() => {
    if (!initialized) {
      const x = window.innerWidth - 300;
      const y = window.innerHeight - 200;
      setPos({ x, y });
      posRef.current = { x, y };
      setInitialized(true);
    }
  }, [initialized]);

  // Load HLS when data changes
  useEffect(() => {
    const video = videoRef.current;
    if (!data || !video) return;

    // Cleanup previous instance
    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.src = "";

    let hls: any;

    async function load() {
      const HLS = (await import("hls.js")).default;
      if (!video) return;

      if (HLS.isSupported()) {
        hls = new HLS({
          enableWorker: false,
          maxBufferLength: 15,
          maxMaxBufferLength: 30,
        });
        hls.loadSource(data!.videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.once(HLS.Events.MANIFEST_PARSED, () => {
          video.currentTime = data!.currentTime;
          video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = data!.videoUrl;
        video.currentTime = data!.currentTime;
        video.play().catch(() => {});
      }
    }

    load();

    return () => {
      hls?.destroy();
      if (video) video.src = "";
    };
  }, [data]);

  // Sync play state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [data]);

  const handleClose = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (videoRef.current) videoRef.current.src = "";
    pipStore.set(null);
  }, []);

  const handleExpand = useCallback(() => {
    if (!data) return;
    const currentTime = videoRef.current?.currentTime ?? data.currentTime;
    handleClose();
    router.push(`/watch?slug=${data.movieSlug}&t=${Math.floor(currentTime)}`);
  }, [data, router, handleClose]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  // Drag handlers
  const startDrag = useCallback((clientX: number, clientY: number) => {
    dragRef.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      initX: posRef.current.x,
      initY: posRef.current.y,
    };
  }, []);

  const onDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current.dragging) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.min(window.innerWidth - 280, dragRef.current.initX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 180, dragRef.current.initY + dy));
    posRef.current = { x: newX, y: newY };
    setPos({ x: newX, y: newY });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onDrag(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => onDrag(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", endDrag);
    };
  }, [onDrag, endDrag]);

  if (!data || !initialized) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] rounded-xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10"
      style={{
        left: pos.x,
        top: pos.y,
        width: 280,
        background: "rgba(10,10,10,0.97)",
        backdropFilter: "blur(12px)",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing bg-white/[0.04] border-b border-white/[0.06]"
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <p className="text-[11px] font-semibold text-white/70 truncate">{data.movieName}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={handleExpand}
            className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Mở rộng"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-red-600/70 text-white/40 hover:text-white transition-colors"
            title="Đóng"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative w-full aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={data.poster}
          playsInline
        />
        {/* Play/Pause overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-full p-3"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white fill-white" />
            ) : (
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            )}
          </div>
        </button>
      </div>

      {/* Bottom bar */}
      <div className="px-3 py-2 flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleExpand}
          className="flex-1 text-left text-[10px] text-white/40 hover:text-primary transition-colors truncate"
        >
          Quay lại xem đầy đủ →
        </button>
      </div>
    </div>
  );
}
