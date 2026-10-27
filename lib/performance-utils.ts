/**
 * Performance Utilities
 * Helper functions for performance optimization
 */

/**
 * Measure function execution time
 */
export function measureExecutionTime<T>(
  fn: () => T,
  label: string
): T {
  if (typeof window === 'undefined') {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Perf] ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}

/**
 * Create a promise that resolves after specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallbackPolyfill(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback: Use setTimeout with a delay
  const timeout = options?.timeout || 1;
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, timeout),
    } as IdleDeadline);
  }, 1) as unknown as number;
}

/**
 * Cancel idle callback polyfill
 */
export function cancelIdleCallbackPolyfill(id: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Preload a resource with link preload
 */
export function preloadResource(
  href: string,
  type: 'script' | 'style' | 'font' | 'image' = 'script'
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
    case 'image':
      link.as = 'image';
      break;
  }

  document.head.appendChild(link);
}

/**
 * Prefetch a resource with link prefetch
 */
export function prefetchResource(href: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);
}

/**
 * Preconnect to a domain
 */
export function preconnect(url: string, crossOrigin = true): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Get Core Web Vitals data from PerformanceObserver
 */
export function getCoreWebVitals(): {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
} {
  const vitals = {
    lcp: null as number | null,
    fid: null as number | null,
    cls: null as number | null,
  };

  if (typeof window === 'undefined') return vitals;

  try {
    // LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.lcp = Math.round(lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // CLS
    const clsObserver = new PerformanceObserver((list) => {
      let cls = 0;
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          cls += (entry as PerformanceEntry & { value?: number }).value || 0;
        }
      }
      vitals.cls = Math.round(cls * 1000) / 1000;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('Web Vitals not available:', e);
  }

  return vitals;
}

/**
 * Detect if device is low-end (for performance adaptations)
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for low cores
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return true;

  // Check for low memory (if available)
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    if (memory <= 4) return true;
  }

  // Check for low-end mobile user agents
  const ua = navigator.userAgent.toLowerCase();
  const lowEndPatterns = ['iphone 6', 'iphone 7', 'galaxy s7', 'galaxy s8'];
  return lowEndPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Check if using slow network (2G, 3G)
 */
export function isSlowNetwork(): boolean {
  if (typeof navigator === 'undefined') return false;

  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;
    return effectiveType === '2g' || effectiveType === '3g';
  }

  return false;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches;
}

/**
 * Get device type (mobile, tablet, desktop)
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;

  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Safely access localStorage with error handling
 */
export function getFromLocalStorage<T = string>(
  key: string,
  defaultValue?: T
): T | string | null {
  if (typeof window === 'undefined') return defaultValue ?? null;

  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue ?? null;

    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (e) {
    console.warn(`Failed to get ${key} from localStorage:`, e);
    return defaultValue ?? null;
  }
}

/**
 * Safely set localStorage with error handling
 */
export function setToLocalStorage<T = any>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (e) {
    console.warn(`Failed to set ${key} in localStorage:`, e);
    return false;
  }
}

/**
 * Check if a feature is supported
 */
export const featureSupport = {
  intersection: typeof IntersectionObserver !== 'undefined',
  mutation: typeof MutationObserver !== 'undefined',
  performance: typeof performance !== 'undefined',
  serviceWorker:
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  notifications:
    typeof Notification !== 'undefined' && Notification.permission !== 'denied',
  vibration: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  clipboard: typeof navigator !== 'undefined' && 'clipboard' in navigator,
  geolocation:
    typeof navigator !== 'undefined' && 'geolocation' in navigator,
};
