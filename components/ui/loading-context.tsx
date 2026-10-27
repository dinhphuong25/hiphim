"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== "undefined") {
      window.__globalLoading = true;
    }
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    if (typeof window !== "undefined") {
      window.__globalLoading = false;
    }
  }, []);

  const value = useMemo(
    () => ({ isLoading, showLoading, hideLoading }),
    [isLoading, showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}