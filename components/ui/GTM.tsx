"use client";

import { useEffect } from "react";

export default function GTM() {
  useEffect(() => {
    let loaded = false;

    const loadGTM = () => {
      if (loaded) return;
      loaded = true;

      // Remove listeners
      window.removeEventListener("scroll", loadGTM);
      window.removeEventListener("pointerdown", loadGTM);
      window.removeEventListener("touchstart", loadGTM);
      window.removeEventListener("keydown", loadGTM);

      (function (w: any, d: any, s: string, l: string, i: string) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        const f = d.getElementsByTagName(s)[0];
        const j = d.createElement(s);
        const dl = l !== "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode?.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "GTM-WP2MWVB8");
    };

    // Trigger on user interaction
    window.addEventListener("scroll", loadGTM, { passive: true, once: true });
    window.addEventListener("pointerdown", loadGTM, { passive: true, once: true });
    window.addEventListener("touchstart", loadGTM, { passive: true, once: true });
    window.addEventListener("keydown", loadGTM, { passive: true, once: true });

    // Fallback timer if no user interaction after page idle
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadGTM(), { timeout: 2000 });
      } else {
        loadGTM();
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", loadGTM);
      window.removeEventListener("pointerdown", loadGTM);
      window.removeEventListener("touchstart", loadGTM);
      window.removeEventListener("keydown", loadGTM);
    };
  }, []);

  return null;
}
