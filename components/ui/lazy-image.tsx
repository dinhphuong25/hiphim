"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  width?: number;
  height?: number;
}

const defaultBlurDataURL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 24'%3E%3Crect fill='%23222' width='16' height='24'/%3E%3C/svg%3E";

export default function LazyImage({
  src,
  alt,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = "blur",
  blurDataURL = defaultBlurDataURL,
  width,
  height,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {placeholder === "blur" && !isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-white/5 animate-pulse",
            isLoaded && "opacity-0"
          )}
          aria-hidden="true"
        />
      )}

      {/* Image container */}
      <div
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          sizes={sizes}
          quality={quality}
          priority={priority}
          unoptimized={true}
          placeholder={placeholder === "blur" ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setError(true);
            setIsLoaded(true);
          }}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
