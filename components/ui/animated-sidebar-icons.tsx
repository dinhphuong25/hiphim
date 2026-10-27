"use client";

import React, { memo } from "react";
import {
  Home,
  Clapperboard,
  Tv,
  Film,
  Cat,
  RefreshCw,
  Flame,
  Layers,
  Globe,
  Calendar,
  History,
  Heart,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnimatedSidebarIconProps {
  className?: string;
  size?: number;
  isHovered?: boolean;
  isActive?: boolean;
}

/**
 * 1. Home Icon (Trang Chủ) - Đơn sắc, tinh tế, thích ứng màu theo trạng thái menu
 */
export const AnimatedHomeIcon = memo(function AnimatedHomeIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Home
        className={cn(
          "w-full h-full transition-colors duration-150",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 2. Clapperboard Icon (Chiếu Rạp)
 */
export const AnimatedClapperboardIcon = memo(function AnimatedClapperboardIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Clapperboard
        className={cn(
          "w-full h-full transition-transform duration-200 group-hover:-rotate-3",
          isHovered && "-rotate-3",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 3. Tv Icon (Phim Bộ)
 */
export const AnimatedTvIcon = memo(function AnimatedTvIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Tv
        className={cn(
          "w-full h-full transition-colors duration-150",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 4. Film Icon (Phim Lẻ)
 */
export const AnimatedFilmIcon = memo(function AnimatedFilmIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Film
        className={cn(
          "w-full h-full transition-transform duration-300 group-hover:rotate-6",
          isHovered && "rotate-6",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 5. Cat Icon (Hoạt Hình / Anime)
 */
export const AnimatedCatIcon = memo(function AnimatedCatIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Cat
        className={cn(
          "w-full h-full transition-transform duration-200 group-hover:-rotate-6",
          isHovered && "-rotate-6",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 6. Refresh Icon (Mới Cập Nhật)
 */
export const AnimatedRefreshIcon = memo(function AnimatedRefreshIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <RefreshCw
        className={cn(
          "w-full h-full transition-transform duration-500 group-hover:rotate-180",
          isHovered && "rotate-180"
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 6b. Flame Icon (Hot / Thịnh Hành)
 */
export const AnimatedFlameIcon = memo(function AnimatedFlameIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Flame
        className={cn(
          "w-full h-full transition-colors duration-150",
          isActive ? "fill-current" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 7. Layers Icon (Thể Loại)
 */
export const AnimatedLayersIcon = memo(function AnimatedLayersIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Layers
        className={cn(
          "w-full h-full transition-transform duration-200 group-hover:-translate-y-0.5",
          isHovered && "-translate-y-0.5",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 8. Globe Icon (Quốc Gia)
 */
export const AnimatedGlobeIcon = memo(function AnimatedGlobeIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Globe
        className={cn(
          "w-full h-full transition-transform duration-500 group-hover:rotate-45",
          isHovered && "rotate-45"
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 9. Calendar Icon (Năm Phát Hành)
 */
export const AnimatedCalendarIcon = memo(function AnimatedCalendarIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Calendar
        className={cn(
          "w-full h-full transition-colors duration-150",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 10. History Icon (Lịch Sử Xem)
 */
export const AnimatedHistoryIcon = memo(function AnimatedHistoryIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <History
        className={cn(
          "w-full h-full transition-transform duration-500 group-hover:-rotate-45",
          isHovered && "-rotate-45"
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 11. Heart Icon (Phim Yêu Thích)
 */
export const AnimatedHeartIcon = memo(function AnimatedHeartIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Heart
        className={cn(
          "w-full h-full transition-all duration-200",
          isActive ? "fill-current" : "group-hover:fill-current/20",
          (isHovered && !isActive) && "fill-current/20"
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * 12. Smartphone Icon (Tải App Mobile)
 */
export const AnimatedSmartphoneIcon = memo(function AnimatedSmartphoneIcon({
  className,
  size,
  isHovered = false,
  isActive = false,
}: AnimatedSidebarIconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
        isHovered && "scale-105",
        className
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Smartphone
        className={cn(
          "w-full h-full transition-colors duration-150 anim-phone",
          isActive ? "fill-current/15" : ""
        )}
        strokeWidth={1.85}
      />
    </div>
  );
});

/**
 * Tương thích linh hoạt cho cả Sidebar Desktop và Mobile Menu Sheet
 */
export type SidebarIconType =
  | "home"
  | "clapperboard"
  | "tv"
  | "film"
  | "cat"
  | "flame"
  | "refresh"
  | "layers"
  | "globe"
  | "calendar"
  | "history"
  | "heart"
  | "smartphone";

interface SidebarAnimatedIconComponentProps extends AnimatedSidebarIconProps {
  type: SidebarIconType;
}

export function SidebarAnimatedIcon({
  type,
  className,
  size,
  isHovered = false,
  isActive = false,
}: SidebarAnimatedIconComponentProps) {
  switch (type) {
    case "home":
      return <AnimatedHomeIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "clapperboard":
      return <AnimatedClapperboardIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "tv":
      return <AnimatedTvIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "film":
      return <AnimatedFilmIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "cat":
      return <AnimatedCatIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "flame":
      return <AnimatedFlameIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "refresh":
      return <AnimatedRefreshIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "layers":
      return <AnimatedLayersIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "globe":
      return <AnimatedGlobeIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "calendar":
      return <AnimatedCalendarIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "history":
      return <AnimatedHistoryIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "heart":
      return <AnimatedHeartIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    case "smartphone":
      return <AnimatedSmartphoneIcon className={className} size={size} isHovered={isHovered} isActive={isActive} />;
    default:
      return null;
  }
}
