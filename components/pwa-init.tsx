"use client";

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((r) => r.unregister());
        });
        if ('caches' in window) {
          caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
        }
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
      };

      if (document.readyState === 'complete') {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(registerSW, { timeout: 3000 });
        } else {
          setTimeout(registerSW, 1500);
        }
      } else {
        window.addEventListener('load', () => {
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(registerSW, { timeout: 3000 });
          } else {
            setTimeout(registerSW, 1500);
          }
        }, { once: true });
      }
    }
  }, []);

  return null;
}

export function PerformanceMonitor() {
  useEffect(() => {
    const initVitals = () => {
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        const report = (metric: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Vitals] ${metric.name}:`, Math.round(metric.value), 'ms');
          }
          if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push({
              event: 'web_vitals',
              metric_name: metric.name,
              metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            });
          }
        };
        onCLS(report);
        onINP(report);
        onFCP(report);
        onLCP(report);
        onTTFB(report);
      }).catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initVitals, { timeout: 4000 });
    } else {
      setTimeout(initVitals, 2000);
    }
  }, []);

  return null;
}
