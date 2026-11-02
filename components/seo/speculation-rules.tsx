"use client";

import { useEffect } from "react";

/**
 * Speculation Rules API - Optimized for both Desktop & Mobile
 * Avoids heavy background prerendering of /phim/* and /watch* on mobile scroll,
 * while keeping conservative prefetching for instant navigation when the user taps/clicks.
 */
export default function SpeculationRules() {
  useEffect(() => {
    if (
      typeof HTMLScriptElement !== "undefined" &&
      HTMLScriptElement.supports &&
      HTMLScriptElement.supports("speculationrules")
    ) {
      const specScript = document.createElement("script");
      specScript.type = "speculationrules";

      const rules = {
        prefetch: [
          {
            source: "list",
            urls: ["/recently", "/favorites"],
            eagerness: "conservative",
          },
        ],
      };

      specScript.textContent = JSON.stringify(rules);
      document.head.appendChild(specScript);

      return () => {
        if (specScript.parentNode) {
          specScript.parentNode.removeChild(specScript);
        }
      };
    }
  }, []);

  return null;
}
