"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, X, Film } from "lucide-react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { getMovieImageCandidates } from "@/lib/image-helper";

function ContinueWatchingImage({ item }: { item: any }) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);
  const candidates = useMemo(() => getMovieImageCandidates(item, "backdrop"), [item]);
  const src = !hasError && candidates.length > 0 ? candidates[candidateIdx] : null;

  if (!src) {
    return (
      <div className="w-full h-full bg-[#0c1310] flex items-center justify-center">
        <Film className="w-8 h-8 text-brand-green/60" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={item.name}
      fill
      unoptimized
      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
      onError={() => {
        if (candidateIdx + 1 < candidates.length) setCandidateIdx((i) => i + 1);
        else setHasError(true);
      }}
    />
  );
}

export default function ContinueWatching() {
  const { user } = useUserAuth();
  const { items, removeItem } = useContinueWatching();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clean up any legacy unauthenticated continue_watching_list
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("continue_watching_list");
      } catch {}
    }
  }, []);

  // Only render when authenticated and there are continue watching items
  if (!mounted || !user || items.length === 0) return null;

  return (
    <div className="w-full relative z-10 mt-1 sm:mt-8 mb-3 sm:mb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 rounded-full bg-brand-green inline-block"></span>
        Tiếp tục xem
      </h2>
      
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {items.map((item) => {
            if (!item || !item.slug) return null;
            const percent = item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
            
            return (
              <div 
                key={item.slug} 
                className="snap-start shrink-0 w-[260px] sm:w-[300px] relative group overflow-hidden rounded-xl bg-cinema-surface border border-white/5 transition-transform hover:scale-105 duration-300"
              >
                <Link href={`/watch?slug=${item.slug}${typeof item.episodeIndex === "number" ? `&ep=${item.episodeIndex + 1}` : ""}&t=${item.currentTime}`} className="block">
                  <div className="relative w-full aspect-video">
                    <ContinueWatchingImage item={item} />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    
                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center text-black shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 ml-1 fill-black" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/20">
                    <div className="h-full bg-brand-green" style={{ width: `${Math.min(percent, 100)}%` }} />
                  </div>
                  
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-brand-green transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-cinema-text-dim mt-1">
                      {item.episodeName || `Tập ${item.episodeIndex + 1}`}
                    </p>
                  </div>
                </Link>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem(item.slug);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black transition-all z-10 backdrop-blur-md"
                  aria-label="Remove from continue watching"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
