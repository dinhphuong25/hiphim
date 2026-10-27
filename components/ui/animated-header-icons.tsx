"use client";

import { memo } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnimatedHeaderIconProps {
  className?: string;
  size?: number;
}

/**
 * 1. Kính Lúp Tìm Kiếm (Search Icon) - Phong cách Flaticon Lineal Color (GPU Accelerated)
 * Tròng kính lam ngọc phản quang, viền vàng kim loại, cán titan.
 * Chuyển động rà quét và sao lấp lánh chạy hoàn toàn trên GPU Compositor thread.
 */
export const AnimatedSearchIcon = memo(function AnimatedSearchIcon({
  className,
  size = 18,
}: AnimatedHeaderIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible anim-search will-change-transform"
      >
        <defs>
          {/* Gradient tròng kính lúp lam ngọc */}
          <linearGradient id="searchLensGrad" x1="4" y1="4" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#20d66b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
          </linearGradient>

          {/* Gradient vành kính vàng neon */}
          <linearGradient id="searchRimGrad" x1="3" y1="3" x2="17" y2="17" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#20d66b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Gradient cán kính lúp kim loại */}
          <linearGradient id="searchHandleGrad" x1="14" y1="14" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="40%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Tròng kính lúp với màu kính trong suốt huyền ảo */}
        <circle
          cx="10"
          cy="10"
          r="6.5"
          fill="url(#searchLensGrad)"
        />

        {/* Vành kính kim loại dày Lineal Color */}
        <circle
          cx="10"
          cy="10"
          r="6.5"
          stroke="url(#searchRimGrad)"
          strokeWidth="2"
        />

        {/* Vệt phản chiếu ánh sáng trắng trên mặt kính */}
        <path
          d="M6 7.5a4.5 4.5 0 0 1 4.5-4"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="anim-shine"
        />

        {/* Chốt nối cán kính lúp màu vàng kim */}
        <rect
          x="14.2"
          y="14.2"
          width="2.2"
          height="1.5"
          rx="0.5"
          transform="rotate(45 15.2 15)"
          fill="#facc15"
          stroke="#d97706"
          strokeWidth="0.5"
        />

        {/* Cán cầm kính lúp Lineal Color dày dặn */}
        <path
          d="m15.5 15.5 5 5"
          stroke="url(#searchHandleGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Lõi viền cán phản quang */}
        <path
          d="m16 16 3.8 3.8"
          stroke="#fde047"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Ngôi sao lấp lánh 4 cánh trên góc kính lúp GPU */}
        <g
          transform="translate(13.5, 4.5)"
          className="anim-sparkle"
          style={{ transformOrigin: "13.5px 4.5px" }}
        >
          <path
            d="M0 -3 C0 -1 1 0 3 0 C1 0 0 1 0 3 C0 1 -1 0 -3 0 C-1 0 0 -1 0 -3 Z"
            fill="#facc15"
          />
        </g>
      </svg>
    </div>
  );
});

export interface AnimatedHeaderBellProps extends AnimatedHeaderIconProps {
  hasUnread?: boolean;
  isOpen?: boolean;
}

/**
 * 2. Chuông Thông Báo (Notification Bell Icon) - Phong cách Flaticon Lineal Color (GPU Accelerated)
 * Quả chuông vàng 3D với nẹp ruby đỏ, chuông ngân và con lắc đung đưa mượt mà trên GPU.
 */
export const AnimatedHeaderBellIcon = memo(function AnimatedHeaderBellIcon({
  className,
  size = 20,
}: AnimatedHeaderBellProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="overflow-visible anim-bell will-change-transform"
      >
        <defs>
          {/* Gradient thân chuông vàng óng */}
          <linearGradient id="bellGoldGrad" x1="5" y1="4" x2="19" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Gradient nẹp chuông ruby đỏ */}
          <linearGradient id="bellRibbonGrad" x1="4" y1="15" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Sóng âm thanh 2 bên phát ra khi lắc chuông GPU */}
        <path
          d="M3 8a8 8 0 0 0 0 8"
          stroke="#facc15"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="anim-shine"
        />
        <path
          d="M21 8a8 8 0 0 1 0 8"
          stroke="#facc15"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="anim-shine"
        />

        {/* Quai treo chóp chuông tròn vàng kim */}
        <path
          d="M10 4a2 2 0 1 1 4 0"
          stroke="#ca8a04"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="3" r="1.5" fill="#facc15" />

        {/* Con lắc chuông bên dưới đung đưa nhịp nhàng GPU */}
        <g className="anim-bell-clapper">
          <circle cx="12" cy="19.5" r="2.2" fill="#d97706" stroke="#facc15" strokeWidth="1" />
        </g>

        {/* Thân chuông vàng Lineal Color nổi bật */}
        <path
          d="M18 16c-.8-1.5-1.5-3.5-1.5-6.5a4.5 4.5 0 0 0-9 0c0 3-.7 5-1.5 6.5C5.4 17.2 6.2 18 7.5 18h9c1.3 0 2.1-.8 1.5-2Z"
          fill="url(#bellGoldGrad)"
          stroke="#ca8a04"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Vành đai đáy chuông bo cong Lineal Color */}
        <path
          d="M5.5 17.5c1.5-.8 3.8-1 6.5-1s5 .2 6.5 1c.5.3.3.9-.2.9H6c-.5 0-.7-.6-.5-.9Z"
          fill="url(#bellRibbonGrad)"
          stroke="#be123c"
          strokeWidth="1"
        />

        {/* Vệt sáng bóng phản quang bên sườn chuông */}
        <path
          d="M9.5 7.5c-.8 1.5-1 3.5-.8 5"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="anim-shine"
        />
      </svg>
    </div>
  );
});

/**
 * 3. Icon Người Dùng (User Login / Profile Icon) - Hiện đại, đơn sắc, tinh tế đồng bộ rạp phim
 */
export const AnimatedUserIcon = memo(function AnimatedUserIcon({
  className,
  size = 18,
}: AnimatedHeaderIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <User
        style={{ width: size, height: size }}
        className="text-brand-green transition-transform duration-200 group-hover:scale-110"
        strokeWidth={1.85}
      />
    </div>
  );
});
