"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MovieRatingProps {
  slug: string;
  movieName?: string;
}

const SCORE_LABELS: Record<number, string> = {
  1: "Dở tệ (1/10)",
  2: "Quá kém (2/10)",
  3: "Dưới trung bình (3/10)",
  4: "Tạm được (4/10)",
  5: "Trung bình (5/10)",
  6: "Khá ổn (6/10)",
  7: "Hay (7/10)",
  8: "Rất hay (8/10)",
  9: "Tuyệt vời (9/10)",
  10: "Kiệt tác điện ảnh (10/10)",
};

export default function MovieRating({ slug, movieName }: MovieRatingProps) {
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // Read stored user rating for this movie
    try {
      const saved = localStorage.getItem(`hiphim_rating_${slug}`);
      if (saved) {
        setUserScore(Number(saved));
      }
    } catch {}

    // Fetch from API
    fetch(`/api/rating?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rating) {
          setAverageScore(data.rating.averageScore);
          setTotalVotes(data.rating.totalVotes);
        }
      })
      .catch((err) => console.error("Error loading rating:", err));
  }, [slug]);

  const handleRate = async (score: number) => {
    if (!slug || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setUserScore(score);
      try {
        localStorage.setItem(`hiphim_rating_${slug}`, String(score));
      } catch {}

      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, score }),
      });

      const data = await res.json();
      if (data.success && data.rating) {
        setAverageScore(data.rating.averageScore);
        setTotalVotes(data.rating.totalVotes);
        toast.success(`Đã ghi nhận bạn chấm ${score}/10 sao cho phim!`);
      } else {
        toast.error("Không thể lưu đánh giá.");
      }
    } catch {
      toast.error("Lỗi kết nối khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayScore = averageScore !== null ? averageScore.toFixed(1) : "...";
  const activeHover = hoverScore !== null ? hoverScore : userScore;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
      {/* Left: Score overview */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center shrink-0">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-xs font-black text-amber-400 font-mono mt-0.5">
            {displayScore}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-white">Đánh giá khán giả</span>
            <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-mono">
              {totalVotes.toLocaleString()} lượt
            </span>
          </div>
          <p className="text-[11px] text-white/60 mt-0.5">
            {activeHover ? SCORE_LABELS[activeHover] || `${activeHover}/10 sao` : "Bấm vào sao để chấm điểm phim này"}
          </p>
        </div>
      </div>

      {/* Right: Star selector (1-10) */}
      <div className="flex items-center gap-1 sm:gap-1.5 self-start sm:self-auto">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((starVal) => {
          const isFilled = activeHover !== null && starVal <= activeHover;
          return (
            <button
              key={starVal}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRate(starVal)}
              onMouseEnter={() => setHoverScore(starVal)}
              onMouseLeave={() => setHoverScore(null)}
              className="p-1 rounded-md hover:bg-white/10 transition-all cursor-pointer group active:scale-90"
              title={`Chấm ${starVal}/10 sao`}
            >
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-150 ${
                  isFilled
                    ? "fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    : "text-white/20 group-hover:text-white/50"
                }`}
              />
            </button>
          );
        })}

        {isSubmitting && <Loader2 className="w-3.5 h-3.5 text-brand-green animate-spin ml-1" />}
      </div>
    </div>
  );
}
