"use client";

import dynamic from "next/dynamic";
import { Suspense, ComponentType, ReactNode } from "react";

/**
 * Loading skeleton for lazy loaded components
 */
export function ComponentSkeleton({ className = "h-32" }: { className?: string }) {
  return (
    <div className={`bg-gray-800 animate-pulse rounded-lg ${className}`} />
  );
}

/**
 * Grid skeleton for movie cards
 */
export function MovieGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[2/3] bg-gray-800 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Section skeleton
 */
export function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-7 bg-gray-700 rounded-full" />
        <div className="h-6 w-32 bg-gray-800 animate-pulse rounded" />
      </div>
      <MovieGridSkeleton count={6} />
    </div>
  );
}

/**
 * Create a dynamically imported component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: ReactNode = <ComponentSkeleton />
) {
  const LazyComponent = dynamic(importFn, {
    loading: () => <>{fallback}</>,
    ssr: true,
  });

  return LazyComponent;
}

// Lazy loaded heavy components
export const LazySidebar = dynamic(
  () => import("@/components/sidebar"),
  {
    loading: () => <ComponentSkeleton className="h-screen w-64" />,
    ssr: false,
  }
);

export const LazyRecentlyWatched = dynamic(
  () => import("@/components/recently-watched"),
  {
    loading: () => <SectionSkeleton />,
    ssr: false, // Depends on localStorage
  }
);

export const LazyTopicSection = dynamic(
  () => import("@/components/topic-section"),
  {
    loading: () => <SectionSkeleton />,
    ssr: true,
  }
);

/**
 * Wrapper for Suspense with fallback
 */
export function SuspenseWrapper({
  children,
  fallback = <ComponentSkeleton />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * Prefetch component on hover/focus for faster navigation
 */
export function PrefetchLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const prefetch = () => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  };

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </a>
  );
}
