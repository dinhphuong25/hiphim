"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { recordCatalogUrl } from "@/lib/navigation-history";

interface NavigationTabContextType {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  navigateToTab: (tab: string) => void;
}

const NavigationTabContext = createContext<NavigationTabContextType | undefined>(undefined);

function getTabFromPath(path: string): string | null {
  if (!path || path === "/") return "/";
  if (path === "/recently") return "/recently";
  if (path === "/favorites") return "/favorites";
  return null;
}

export function NavigationTabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string | null>(() => getTabFromPath(pathname));

  // Sync with Next.js pathname changes (e.g. user navigates to /phim/[slug] or /watch)
  useEffect(() => {
    const matched = getTabFromPath(pathname);
    setActiveTab(matched);

    if (typeof window !== "undefined") {
      const p = pathname || window.location.pathname;
      const f = window.location.pathname + window.location.search;
      if (!p.startsWith("/phim/") && !p.startsWith("/watch")) {
        recordCatalogUrl(f);
      }
    }
  }, [pathname]);

  const navigateToTab = useCallback(
    (targetTab: string) => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      // Optimistic 0ms UI tab highlight
      setActiveTab(targetTab);

      // Perform real Next.js routing
      if (pathname !== targetTab || (targetTab === "/" && typeof window !== "undefined" && window.location.search)) {
        router.push(targetTab);
      }
    },
    [pathname, router]
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
