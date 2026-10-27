"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-10 h-10",
  };

  const iconSizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-white/5 hover:bg-white/10 border border-white/10",
        "text-white/70 hover:text-white",
        "transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      {theme === "dark" ? (
        <Sun className={iconSizeClasses[size]} />
      ) : (
        <Moon className={iconSizeClasses[size]} />
      )}
    </button>
  );
}
