"use client";

import { useEffect } from "react";

// Extension attributes that cause React hydration mismatches
const EXTENSION_ATTRS = [
  "bis_skin_checked",
  "cz-shortcut-listen",
  "data-gramm_editor",
  "data-gr-ext-installed",
  "data-darkreader-inline-bgcolor",
  "data-darkreader-inline-color",
  "data-bitwarden-watching",
  "grammarly-extension",
];

export default function HydrationFix() {
  useEffect(() => {
    const cleanup = () => {
      try {
        EXTENSION_ATTRS.forEach((attr) => {
          document.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
        });
      } catch {}
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(cleanup, { timeout: 2500 });
      return () => (window as any).cancelIdleCallback?.(id);
    } else {
      const timer = setTimeout(cleanup, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}