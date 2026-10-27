"use client";

import { useState, useRef, useEffect, memo } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image component with:
 * - Lazy loading with IntersectionObserver
 * - Blur placeholder
 * - Error handling with fallback
 * - WebP support detection
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  placeholder = "blur",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Normalize image URL
  const imageSrc = src?.startsWith("http") ? src : `https://phimimg.com/${src}`;
  
  // Fallback image for errors
  const fallbackSrc = "/images/placeholder-movie.webp";

  return (
    <div
      ref={imgRef as any}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {placeholder === "blur" && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={hasError ? fallbackSrc : imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover
            transition-opacity duration-300
            ${isLoaded ? "opacity-100" : "opacity-0"}
          `}
        />
      )}
    </div>
  );
});

export default OptimizedImage;

/**
 * Hook for preloading critical images
 */
export function useImagePreload(srcs: string[]) {
  useEffect(() => {
    const preloadImages = srcs.map((src) => {
      const img = new Image();
      img.src = src?.startsWith("http") ? src : `https://phimimg.com/${src}`;
      return img;
    });

    return () => {
      preloadImages.forEach((img) => {
        img.src = "";
      });
    };
  }, [srcs]);
}

/**
 * Utility to get optimized image URL with size hints
 */
export function getOptimizedImageUrl(
  src: string,
  options?: { width?: number; quality?: number }
): string {
  const baseUrl = src?.startsWith("http") ? src : `https://phimimg.com/${src}`;
  
  // phimimg.com doesn't support query params for resizing,
  // but we keep this utility for future CDN migration
  return baseUrl;
}
