"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLoading } from "./loading-context";

declare global {
  interface Window {
    __globalLoading?: boolean;
  }
}

interface PageTransitionProps {
  children: React.ReactNode;
  duration?: number;
  initial?: { opacity: number; y?: number };
  animate?: { opacity: number; y?: number };
  exit?: { opacity: number; y?: number };
}

export default function PageTransition({
  children,
}: PageTransitionProps) {
  const pathname = usePathname();
  const { isLoading } = useLoading();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__globalLoading = false;
    }
  }, [pathname]);

  // Render children without conditional rendering to fix hydration
  // Simple wrapper for now - animations removed for stability
  return (
    <main key={pathname} className="min-h-screen">
      {children}
    </main>
  );
}
