"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import BrandIcon from "./brand-icon";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  slogan?: string;
  showSlogan?: boolean;
  showIcon?: boolean;
}

function BrandLogoComponent({
  className,
  size = "md",
  slogan = "Điện ảnh không giới hạn",
  showSlogan = false,
  showIcon = true,
}: BrandLogoProps) {
  const titleSizeClasses = {
    sm: "text-[13.5px] sm:text-[14.5px]",
    md: "text-[15px] sm:text-[16.5px]",
    lg: "text-[21px] sm:text-[23px]",
  }[size];

  const sloganSizeClasses = {
    sm: "text-[7.5px] sm:text-[8px] tracking-[0.01em]",
    md: "text-[8px] sm:text-[8.5px] tracking-[0.02em]",
    lg: "text-[10px] sm:text-[10.5px] tracking-[0.03em]",
  }[size];

  const gapClasses = {
    sm: "gap-1.5 sm:gap-2",
    md: "gap-2 sm:gap-2.5",
    lg: "gap-2.5 sm:gap-3",
  }[size];

  return (
    <div
      className={cn(
        "relative flex items-center select-none group transition-all duration-200 active:scale-[0.98] shrink-0",
        gapClasses,
        className
      )}
    >
      {/* Bespoke Cinema Emblem Icon */}
      {showIcon && (
        <BrandIcon size={size} className="shrink-0" />
      )}

      {/* Brand Identity Text Block (Wordmark + Slogan) */}
      <div className="flex flex-col justify-center min-w-0 z-10 text-left shrink-0">
        {/* Main Stylized Wordmark — Condensed Cinema Typography (Oswald) */}
        <div
          className={cn(
            "font-[family-name:var(--font-oswald)] font-bold uppercase tracking-tight leading-none flex items-baseline",
            showSlogan ? "translate-y-[1.5px]" : "translate-y-0",
            titleSizeClasses
          )}
        >
          {/* HI — Crisp Stark White */}
          <span className="text-white transition-colors group-hover:text-white">
            HI
          </span>

          {/* PHIM — Electric Emerald Gradient */}
          <span className="ml-0.5 sm:ml-1 text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-[#2cf580] to-emerald-400 transition-all duration-300">
            PHIM
          </span>

          {/* Signature Dot . — Crisp Neon Emerald Dot */}
          <span className="text-brand-green font-black ml-[1px] inline-block">
            .
          </span>
        </div>

        {/* Subtitle / Slogan — Snug right under top line with zero awkward gap */}
        {showSlogan && (
          <span
            className={cn(
              "font-medium text-white/55 group-hover:text-white/80 transition-colors leading-none mt-0 select-none truncate",
              sloganSizeClasses
            )}
          >
            {slogan}
          </span>
        )}
      </div>
    </div>
  );
}

const BrandLogo = memo(BrandLogoComponent);

export default BrandLogo;
export { BrandIcon };
