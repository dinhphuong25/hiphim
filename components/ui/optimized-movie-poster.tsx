"use client";

import LazyImage from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";

interface OptimizedMoviePosterProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export default function OptimizedMoviePoster({
  src,
  alt,
  className,
  priority = false,
  width = 200,
  height = 300,
}: OptimizedMoviePosterProps) {
  // Use GCDN or cloudinary for image optimization if available
  const optimizedSrc =
    src && src.includes("gcdn.vn")
      ? `${src}?width=${width}&height=${height}&fit=crop&quality=80`
      : src;

  return (
    <LazyImage
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={80}
      placeholder="blur"
      className={cn("rounded-lg overflow-hidden", className)}
      sizes={`(max-width: 640px) 100px, (max-width: 768px) 150px, ${width}px`}
    />
  );
}
