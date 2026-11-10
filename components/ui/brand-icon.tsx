"use client";

import { memo, useId } from "react";
import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function BrandIconComponent({ className, size = "md" }: BrandIconProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

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

  const emeraldGradId = `hp-emerald-${uid}`;
  const orbitGradId = `hp-orbit-${uid}`;
  const arcTopGradId = `hp-arc-${uid}`;
  const discGradId = `hp-disc-${uid}`;
  const playGradId = `hp-play-${uid}`;

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

      {/* Inline Vector SVG Logo — 0 network requests, never breaks */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width="100%"
        height="100%"
        aria-label="Hi Phim"
        role="img"
        className="w-full h-full relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
      >
        <defs>
          <linearGradient id={emeraldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" />
            <stop offset="50%" stopColor="#20D66B" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id={orbitGradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#20D66B" />
            <stop offset="70%" stopColor="#00F5A0" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id={arcTopGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#20D66B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#20D66B" />
          </linearGradient>

          <radialGradient id={discGradId} cx="40%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#0f2618" />
            <stop offset="70%" stopColor="#07150d" />
            <stop offset="100%" stopColor="#030805" />
          </radialGradient>

          <linearGradient id={playGradId} x1="20%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F0FDF4" />
            <stop offset="100%" stopColor="#A7F3D0" />
          </linearGradient>
        </defs>

        <path
          d="M 5 11 C 3 17 5 24 11 27.5 C 16.5 30.5 24 28.5 27.5 23.5"
          stroke={`url(#${orbitGradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        <path
          d="M 10 4.5 C 16 3 23 4.5 27 9"
          stroke={`url(#${arcTopGradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="12 3"
          fill="none"
        />

        <circle cx="27.5" cy="23.5" r="1.4" fill="#00F5A0" />

        <circle
          cx="16"
          cy="16"
          r="10.5"
          fill={`url(#${discGradId})`}
          stroke={`url(#${emeraldGradId})`}
          strokeWidth="1.2"
        />

        <circle
          cx="16"
          cy="16"
          r="8"
          stroke="#20D66B"
          strokeWidth="0.6"
          strokeOpacity="0.35"
          strokeDasharray="2 2.5"
          fill="none"
        />

        <path
          d="M 13.8 12.2 C 13.8 11.5 14.6 11.1 15.2 11.4 L 19.8 15.2 C 20.3 15.6 20.3 16.4 19.8 16.8 L 15.2 20.6 C 14.6 20.9 13.8 20.5 13.8 19.8 Z"
          fill={`url(#${playGradId})`}
        />
      </svg>
    </div>
  );
}

export default memo(BrandIconComponent);
