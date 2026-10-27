"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MovieRatingProps {
  slug: string;
  title?: string;
}

const LABELS = ["Tệ", "Tạm được", "Bình thường", "Tốt", "Xuất sắc!"];
const COLORS = [
  "text-red-400 border-red-400/40 bg-red-400/10",
  "text-orange-400 border-orange-400/40 bg-orange-400/10",
  "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "text-lime-400 border-lime-400/40 bg-lime-400/10",
  "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
];

export default function MovieRating({ slug, title = "Bạn thấy phim này thế nào?" }: MovieRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [animating, setAnimating] = useState(false);

  const ratingKey = `movie_rating_${slug}`;
  const ratingsKey = "movie_ratings_list";

  useEffect(() => {
    const saved = localStorage.getItem(ratingKey);
    if (saved) {
      setRating(parseInt(saved, 10));
      setHasRated(true);
    }
  }, [slug, ratingKey]);

  const handleRate = (value: number) => {
    if (hasRated && rating === value) return; // Toggle off
    setRating(value);
    setHasRated(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    localStorage.setItem(ratingKey, String(value));
    try {
      const list = JSON.parse(localStorage.getItem(ratingsKey) || "[]");
      const idx = list.findIndex((r: any) => r.slug === slug);
      const entry = { slug, rating: value, timestamp: new Date().toISOString() };
      if (idx >= 0) list[idx] = entry; else list.push(entry);
      localStorage.setItem(ratingsKey, JSON.stringify(list));
    } catch { /* ignore */ }
  };

  const active = hoverRating ?? rating ?? 0;
  const colorClass = active > 0 ? COLORS[active - 1] : "";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/25 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-[11px] text-white/40 mt-0.5">Đánh giá được lưu trên thiết bị này</p>
        </div>
      </div>

      {/* Stars */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
        {Array.from({ length: 5 }).map((_, i) => {
          const val = i + 1;
          const isFilled = active >= val;
          return (
            <button
              key={i}
              onClick={() => handleRate(val)}
              onMouseEnter={() => setHoverRating(val)}
              onMouseLeave={() => setHoverRating(null)}
              className={cn(
                "transition-all duration-200 focus:outline-none rounded-full p-1",
                isFilled ? "scale-110" : "scale-100 hover:scale-110",
                hasRated && rating === val ? "ring-1 ring-amber-400/30 bg-amber-400/10 rounded-full" : ""
              )}
              aria-label={`${val} sao — ${LABELS[i]}`}
            >
              <svg
                className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200",
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    : "fill-white/15 text-white/15 hover:fill-white/30"
                )}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Label */}
      {active > 0 && (
        <div className="flex justify-center">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-bold transition-all duration-300",
            colorClass
          )}>
            {active}/5 — {LABELS[active - 1]}
          </span>
        </div>
      )}

      {/* Thank you message */}
      {hasRated && (
        <p className={cn(
          "text-center text-xs text-white/40 mt-3 transition-all duration-500",
          animating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
        )}>
          {animating ? "" : "✓ Cảm ơn bạn đã đánh giá!"}
        </p>
      )}
    </div>
  );
}
