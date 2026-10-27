import React from "react";

/**
 * Lightweight, crash-proof Observe service.
 * Eliminates native 'ExpoAppMetrics' / 'ExpoObserve' dependencies
 * so that the app runs smoothly in Expo Go, local development, and production builds.
 */
export const Observe = {
  configure: (_config?: any) => {
    // No-op to prevent Expo Go crashes
  },
  reportError: (err: any) => {
    if (__DEV__) {
      console.log("[Observe Error]", err);
    }
  },
};

export const ObserveRoot = {
  wrap: <T extends React.ComponentType<any>>(Component: T): T => Component,
};

export function useObserve() {
  return {
    markInteractive: () => {
      // Clean no-op in Expo Go
    },
  };
}
