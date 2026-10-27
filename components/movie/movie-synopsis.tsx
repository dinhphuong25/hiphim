"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieSynopsisProps {
  content: string;
  variant?: "default" | "inline";
  className?: string;
}

export default function MovieSynopsis({
  content,
  variant = "default",
  className,
}: MovieSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || !content.trim()) return null;

  const isInline = variant === "inline";
  const isLong = content.length > 140;

  return (
    <div
      className={cn(
        isInline
          ? "pt-2 border-t border-white/10"
          : "mt-3 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-white/10",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-3 sm:w-1.5 sm:h-3.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(32,214,107,0.8)]" />
          <span className="text-xs font-extrabold text-white/95 uppercase tracking-wider">
            Nội dung phim
          </span>
        </div>

        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-brand-green hover:text-brand-green-hover transition-colors select-none active:scale-95 cursor-pointer"
            aria-label={isExpanded ? "Thu gọn nội dung" : "Xem thêm nội dung"}
          >
            <span>{isExpanded ? "Thu gọn" : "Xem thêm"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      <p
        className={cn(
          "text-white/80 text-xs sm:text-[13px] leading-relaxed font-normal text-justify transition-all duration-300",
          isInline
            ? isExpanded
              ? "max-h-32 overflow-y-auto pr-1.5 custom-scrollbar text-white/90"
              : "line-clamp-2 xl:line-clamp-3"
            : isExpanded
            ? ""
            : "line-clamp-2 xs:line-clamp-3"
        )}
      >
        {content}
      </p>
    </div>
  );
}
