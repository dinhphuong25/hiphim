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
      EXTENSION_ATTRS.forEach((attr) => {
        document.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
      });
    };

    // Run immediately and a few times during initial hydration window
    cleanup();
    const timers = [50, 200, 500].map((d) => setTimeout(cleanup, d));

    return () => timers.forEach(clearTimeout);
  }, []);

  return null;
}