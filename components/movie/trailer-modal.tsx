"use client";

import { useState } from "react";
import { Video, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrailerModalProps {
  movieName: string;
  trailerUrl?: string;
  compact?: boolean;
  className?: string;
}

function getYoutubeEmbedUrl(trailerUrl: string | undefined, movieName: string): string {
  if (trailerUrl) {
    // Handle standard YouTube URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trailerUrl.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
    // If it's already an embed URL
    if (trailerUrl.includes("youtube.com/embed/")) {
      return trailerUrl.includes("?") ? `${trailerUrl}&autoplay=1` : `${trailerUrl}?autoplay=1`;
    }
  }
  // Fallback embed query
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movieName + " official trailer")}&autoplay=1`;
}

export default function TrailerButtonWithModal({ movieName, trailerUrl, compact, className }: TrailerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const embedUrl = getYoutubeEmbedUrl(trailerUrl, movieName);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className={cn(
          "flex items-center justify-center gap-2 transition-all border border-white/15 hover:border-brand-green/40 active:scale-95 cursor-pointer font-bold text-white bg-white/10 hover:bg-white/20",
          compact
            ? "h-10 sm:h-11 px-3 sm:px-6 text-xs sm:text-sm rounded-xl select-none"
            : "w-full sm:w-auto px-6 py-3.5 text-sm sm:text-base rounded-xl backdrop-blur-md shadow-sm",
          className
        )}
      >
        <Video className={cn(compact ? "w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 shrink-0" : "w-5 h-5", "text-brand-green")} />
        <span className="whitespace-nowrap">{compact ? "Trailer" : "Xem Trailer"}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#12151a] border border-brand-green/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_20px_rgba(32,214,107,0.15)] flex flex-col transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  Trailer: {movieName}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Đóng popup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={embedUrl}
                title={`Trailer ${movieName}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
