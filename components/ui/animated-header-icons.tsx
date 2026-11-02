"use client";

import { memo } from "react";
import { User, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnimatedHeaderIconProps {
  className?: string;
  size?: number;
}

/**
 * 1. Kính Lúp Tìm Kiếm (Search Icon) - Hiện đại, đơn sắc, tinh tế đồng bộ rạp phim
 */
export const AnimatedSearchIcon = memo(function AnimatedSearchIcon({
  className,
  size = 18,
}: AnimatedHeaderIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <Search
        style={{ width: size, height: size }}
        className="text-brand-green stroke-[2.2] transition-transform duration-200 group-hover:scale-110 shrink-0"
      />
    </div>
  );
});

export interface AnimatedHeaderBellProps extends AnimatedHeaderIconProps {
  hasUnread?: boolean;
  isOpen?: boolean;
}

/**
 * 2. Chuông Thông Báo (Notification Bell Icon) - Hiện đại, đơn sắc, tinh tế đồng bộ rạp phim
 */
export const AnimatedHeaderBellIcon = memo(function AnimatedHeaderBellIcon({
  className,
  size = 18,
  hasUnread = false,
  isOpen = false,
}: AnimatedHeaderBellProps) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0 select-none", className)}>
      <Bell
        style={{ width: size, height: size }}
        className={cn(
          "stroke-[2.2] transition-all duration-200 group-hover:scale-110 shrink-0",
          isOpen
            ? "text-brand-green fill-brand-green/20"
            : hasUnread
            ? "text-brand-green drop-shadow-[0_0_8px_rgba(32,214,107,0.6)]"
            : "text-brand-green/90 group-hover:text-brand-green"
        )}
      />
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
