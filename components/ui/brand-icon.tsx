"use client";

import { memo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function BrandIconComponent({ className, size = "md" }: BrandIconProps) {
  const pixelSize = {
    sm: 24,
    md: 30,
    lg: 40,
    xl: 56,
  }[size];

  const sizeMap = {
    sm: "w-6 h-6 min-w-6 min-h-6",
    md: "w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] min-w-[28px] min-h-[28px] sm:min-w-[30px] sm:min-h-[30px]",
    lg: "w-[38px] h-[38px] sm:w-10 sm:h-10 min-w-[38px] min-h-[38px] sm:min-w-10 sm:min-h-10",
    xl: "w-14 h-14 min-w-14 min-h-14",
  };

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none aspect-square group-hover:scale-105 transition-transform duration-300",
        sizeMap[size],
        className
      )}
    >
      {/* Subtle ambient emerald aura glow on hover */}
      <div className="absolute inset-0 rounded-full bg-brand-green/25 blur-[4px] opacity-60 group-hover:opacity-100 group-hover:bg-brand-green/45 transition-all duration-300 pointer-events-none" />

      {/* Official Hi Phim Favicon Logo Image */}
      <Image
        src="/favicon.png"
        alt="Hi Phim"
        width={pixelSize * 2}
        height={pixelSize * 2}
        className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        priority
        unoptimized
      />
    </div>
  );
}

export default memo(BrandIconComponent);
