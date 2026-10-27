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
  initial?: any;
  animate?: any;
  exit?: any;
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

  return (
    <div key={pathname}>
      {children}
    </div>
  );
}
