"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { recordCatalogUrl } from "@/lib/navigation-history";

interface NavigationTabContextType {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  navigateToTab: (tab: string, e?: React.SyntheticEvent) => void;
}

const NavigationTabContext = createContext<NavigationTabContextType | undefined>(undefined);

function getTabFromPath(path: string): string | null {
  if (!path || path === "/") return "/";
  if (path.startsWith("/recently")) return "/recently";
  if (path.startsWith("/favorites")) return "/favorites";
  if (path.startsWith("/tai-app")) return "/tai-app";
  return null;
}

export function NavigationTabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string | null>(() => getTabFromPath(pathname));
  const hasEverMountedHomeRef = useRef(pathname === "/");

  if (pathname === "/") {
    hasEverMountedHomeRef.current = true;
  }

  // Sync with Next.js pathname changes (e.g. user navigates to /phim/[slug] or /watch)
  useEffect(() => {
    const matched = getTabFromPath(pathname);
    setActiveTab(matched);
    if (pathname === "/") {
      hasEverMountedHomeRef.current = true;
    }

    if (typeof window !== "undefined") {
      const p = pathname || window.location.pathname;
      const f = window.location.pathname + window.location.search;
      if (!p.startsWith("/phim/") && !p.startsWith("/watch")) {
        recordCatalogUrl(f);
      }
    }
  }, [pathname]);

  // Handle browser popstate (Back/Forward buttons) for instant tab switching
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const tab = getTabFromPath(currentPath);
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToTab = useCallback(
    (targetTab: string, e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      // Optimistic 0ms UI tab highlight
      setActiveTab(targetTab);

      // Perform real Next.js client-side SPA routing (instant 0ms)
      router.push(targetTab);
    },
    [router]
  );

  const value = useMemo(() => ({ activeTab, setActiveTab, navigateToTab }), [activeTab, navigateToTab]);

  return (
    <NavigationTabContext.Provider value={value}>
      {children}
    </NavigationTabContext.Provider>
  );
}

export function useNavigationTab() {
  const ctx = useContext(NavigationTabContext);
  if (!ctx) {
    throw new Error("useNavigationTab must be used within a NavigationTabProvider");
  }
  return ctx;
}
