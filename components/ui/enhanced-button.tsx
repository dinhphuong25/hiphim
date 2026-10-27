"use client";

import * as React from "react";
import { forwardRef } from "react";

export interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  variant?: "contained" | "outlined" | "text";
}

const sizeClasses = {
  small: "px-3 py-1.5 text-xs min-h-[32px] rounded-lg",
  medium: "px-5 py-2.5 text-sm min-h-[40px] rounded-xl",
  large: "px-6 py-3 text-base min-h-[48px] rounded-2xl",
};

const variantClasses = {
  contained:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:-translate-y-px",
  outlined:
    "border-2 border-primary text-primary hover:bg-primary/10 hover:-translate-y-px",
  text: "text-white/70 hover:text-white hover:bg-white/10 rounded-lg",
};

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      children,
      loading = false,
      disabled,
      icon,
      iconPosition = "start",
      size = "medium",
      variant = "text",
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "relative inline-flex items-center justify-center font-semibold",
          "transition-all duration-200 active:scale-95 cursor-pointer",
          "disabled:opacity-60 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          sizeClasses[size],
          variantClasses[variant],
          className,
        ].join(" ")}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin w-4 h-4 mr-2 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === "start" && (
          <span className={`inline-flex items-center ${children ? "mr-2" : ""}`}>
            {icon}
          </span>
        )}
        {children}
        {!loading && icon && iconPosition === "end" && (
          <span className={`inline-flex items-center ${children ? "ml-2" : ""}`}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export default EnhancedButton;