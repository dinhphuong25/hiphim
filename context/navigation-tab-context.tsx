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

      // If already on the same tab
      if (activeTab === targetTab) {
        if (targetTab === "/" && typeof window !== "undefined" && window.location.search) {
          window.history.pushState(null, "", "/");
          router.push("/");
        }
        return;
      }

      // 1. Optimistic 0ms UI tab highlight
      setActiveTab(targetTab);

      // 2. If navigating from standalone pages (/phim/[slug], /watch, /admin)
      if (pathname.startsWith("/phim/") || pathname.startsWith("/watch") || pathname.startsWith("/admin")) {
        router.push(targetTab);
        return;
      }

      // 3. For instant tabs (/, /recently, /favorites), perform 0ms local state switch via AppShell
      const isKnownInstantTab = targetTab === "/" || targetTab === "/recently" || targetTab === "/favorites";
      if (isKnownInstantTab) {
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", targetTab);
        }

        // If target is home and search query params need clearing, route to /
        if (targetTab === "/" && (!hasEverMountedHomeRef.current || (typeof window !== "undefined" && window.location.search))) {
          router.push("/");
        }
      } else {
        // Fallback for other routes
        router.push(targetTab);
      }
    },
    [activeTab, pathname, router]
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
