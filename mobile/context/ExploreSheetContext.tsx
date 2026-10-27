import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type ExploreSubView = "main" | "categories" | "countries" | "years";

interface ExploreSheetContextType {
  isOpen: boolean;
  activeView: ExploreSubView;
  openExplore: (view?: ExploreSubView) => void;
  closeExplore: () => void;
  setActiveView: (view: ExploreSubView) => void;
}

const ExploreSheetContext = createContext<ExploreSheetContextType>({
  isOpen: false,
  activeView: "main",
  openExplore: () => {},
  closeExplore: () => {},
  setActiveView: () => {},
});

export function ExploreSheetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ExploreSubView>("main");

  const openExplore = useCallback((view: ExploreSubView = "main") => {
    setActiveView(view);
    setIsOpen(true);
  }, []);

  const closeExplore = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeView,
      openExplore,
      closeExplore,
      setActiveView,
    }),
    [isOpen, activeView, openExplore, closeExplore]
  );

  return (
    <ExploreSheetContext.Provider value={value}>
      {children}
    </ExploreSheetContext.Provider>
  );
}

export function useExploreSheet() {
  const context = useContext(ExploreSheetContext);
  if (!context) {
    throw new Error("useExploreSheet must be used within an ExploreSheetProvider");
  }
  return context;
}
