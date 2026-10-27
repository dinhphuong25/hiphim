import { useEffect } from "react";

export function usePerformanceMonitoring() {
  useEffect(() => {
    // Only run on client side and in production
    if (typeof window === "undefined" || process.env.NODE_ENV !== "production") {
      return;
    }

    // Monitor Core Web Vitals
    if ("web-vital" in window) {
      const vitals = (window as any)["web-vital"];

      // Largest Contentful Paint
      vitals.getLCP?.((metric: any) => {
        console.log(`LCP: ${metric.value}ms`);
        if (metric.value > 2500) {
          console.warn("⚠️ LCP exceeds 2.5s threshold");
        }
      });

      // First Input Delay
      vitals.getFID?.((metric: any) => {
        console.log(`FID: ${metric.value}ms`);
        if (metric.value > 100) {
          console.warn("⚠️ FID exceeds 100ms threshold");
        }
      });

      // Cumulative Layout Shift
      vitals.getCLS?.((metric: any) => {
        console.log(`CLS: ${metric.value}`);
        if (metric.value > 0.1) {
          console.warn("⚠️ CLS exceeds 0.1 threshold");
        }
      });
    }

    // Monitor resource timing
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log(
            `Navigation: ${navEntry.responseEnd - navEntry.fetchStart}ms`
          );
        }
      }
    });

    try {
      perfObserver.observe({ entryTypes: ["navigation", "resource"] });

      return () => perfObserver.disconnect();
    } catch (error) {
      console.error("Performance observer error:", error);
    }
  }, []);
}

export function useMemoryMonitoring() {
  useEffect(() => {
    if (typeof window === "undefined" || !("memory" in performance)) {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize / 1048576;
      const jsHeapSizeLimit = memory.jsHeapSizeLimit / 1048576;

      if (usedJSHeapSize > jsHeapSizeLimit * 0.9) {
        console.warn(
          `⚠️ Memory usage is high: ${usedJSHeapSize.toFixed(2)}MB / ${jsHeapSizeLimit.toFixed(
            2
          )}MB`
        );
      }
    };

    const interval = setInterval(checkMemory, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []);
}
