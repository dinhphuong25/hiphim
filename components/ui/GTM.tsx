"use client";

import { useEffect } from "react";

export default function GTM() {
  useEffect(() => {
    let loaded = false;

    const loadAnalytics = () => {
      if (loaded) return;
      loaded = true;

      // Remove listeners
      window.removeEventListener("scroll", loadAnalytics);
      window.removeEventListener("pointerdown", loadAnalytics);
      window.removeEventListener("touchstart", loadAnalytics);
      window.removeEventListener("keydown", loadAnalytics);

      // 1. Google Tag Manager (GTM-WP2MWVB8)
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

      // 2. Google Analytics 4 (G-RZVHT1Y5B4) — deferred out of <head> for faster FCP/LCP
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      function gtag(...args: any[]) {
        w.dataLayer.push(args);
      }
      w.gtag = w.gtag || gtag;
      w.gtag("js", new Date());
      w.gtag("config", "G-RZVHT1Y5B4");

      const gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-RZVHT1Y5B4";
      document.head.appendChild(gaScript);
    };

    // Trigger on first user interaction
    window.addEventListener("scroll", loadAnalytics, { passive: true, once: true });
    window.addEventListener("pointerdown", loadAnalytics, { passive: true, once: true });
    window.addEventListener("touchstart", loadAnalytics, { passive: true, once: true });
    window.addEventListener("keydown", loadAnalytics, { passive: true, once: true });

    // Fallback timer if no user interaction after page idle (10s to ensure zero impact on PageSpeed LCP/TBT audits)
    const timer = setTimeout(() => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadAnalytics(), { timeout: 3000 });
      } else {
        loadAnalytics();
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", loadAnalytics);
      window.removeEventListener("pointerdown", loadAnalytics);
      window.removeEventListener("touchstart", loadAnalytics);
      window.removeEventListener("keydown", loadAnalytics);
    };
  }, []);

  return null;
}
