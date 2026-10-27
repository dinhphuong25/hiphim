# Performance Optimization Guide

## ✅ Current Optimizations

### 1. **Build & Bundling**
- ✓ Next.js 16 with Turbopack (faster builds)
- ✓ SWC minification enabled
- ✓ Tree shaking for: `@mui/material`, `@mui/icons-material`, `lucide-react`
- ✓ Experimental features: `staticGenerationRetryCount`, `isrMemoryCacheSize`, `webpackBuildWorker`
- ✓ ISR caching optimized to 52MB

### 2. **Image Optimization**
- ✓ Multiple device sizes: 320px, 420px, 768px, 1024px, 1200px
- ✓ Multiple image formats: AVIF, WebP (fallback to original)
- ✓ Quality levels: 50, 75, 85, 90, 95
- ✓ Remote image optimization from multiple CDNs
- ✓ 1-hour minimum cache TTL

### 3. **Caching Strategy**
- ✓ Server-side caching with `unstable_cache`:
  - Categories: 24 hours
  - Countries: 24 hours
  - Featured movie: 1 hour
  - New updates: 2 minutes
- ✓ Client-side API cache with LRU eviction
- ✓ Request deduplication (prevents thundering herd)
- ✓ Automatic cache cleanup for expired entries

### 4. **HTTP Headers & Security**
- ✓ Cache-Control headers optimized for different asset types
- ✓ Brotli compression support
- ✓ Security headers: X-Frame-Options, X-Content-Type-Options, CSP, HSTS
- ✓ Performance headers: Accept-CH for client hints

### 5. **Middleware**
- ✓ Security: Blocks bot traffic, prevents path traversal
- ✓ Performance: Compression headers, cache directives
- ✓ Request timing tracking

### 6. **Monitoring**
- ✓ Core Web Vitals tracking (LCP, INP, CLS)
- ✓ Memory monitoring
- ✓ Performance analytics integration with GTM
- ✓ Real User Monitoring (RUM) via Vercel

### 7. **Font Optimization**
- ✓ Inter font with `display: swap`
- ✓ Preload enabled
- ✓ Latin + Latin Extended subsets

### 8. **Dynamic Imports**
- ✓ Footer: lazy loaded
- ✓ Search panel: lazy loaded
- ✓ Sidebar: lazy loaded

---

## 🚀 Implementation Checklist

### High Priority (Implement immediately)
- [ ] Run Lighthouse audit to establish baseline
  ```bash
  npm run test:lighthouse
  ```
- [ ] Monitor bundle size
  ```bash
  npm run build:analyze
  ```
- [ ] Check Core Web Vitals on production
  - Visit `/` and check console for metric values

### Medium Priority (Within 1-2 weeks)
- [ ] Add lazy loading to all images with `loading="lazy"`
- [ ] Implement React.memo for expensive components:
  - `movie-card-variants.tsx`
  - `movie-minimal.tsx`
  - `pagination.tsx`
- [ ] Optimize movie-list rendering with virtualization
- [ ] Implement route prefetching for common navigations

### Low Priority (Nice-to-have)
- [ ] Add service worker for offline support
- [ ] Implement Progressive Image Loading (blur-up effect)
- [ ] Add CSS-in-JS optimization for CSS output
- [ ] Consider replacing MUI with lighter alternative for specific components

---

## 📊 Performance Targets

### Core Web Vitals (2025 Standards)

| Metric | Target | Current Status |
|--------|--------|-----------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ? (Run audit) |
| **INP** (Interaction to Next Paint) | < 200ms | ? (Run audit) |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ? (Run audit) |

### Bundle Size Targets

| Bundle | Target Size |
|--------|-------------|
| Next.js core | < 50KB |
| React ecosystem | < 100KB |
| App code | < 200KB |
| MUI + Icons | < 300KB (ok for heavy UI) |
| **Total** | < 500KB gzipped |

---

## 🔧 New Utilities Added

### `/lib/performance-utils.ts`
Provides helper functions for:
- Measuring execution time
- Request idle callback polyfill
- Resource preloading/prefetching
- Core Web Vitals detection
- Device capability detection
- LocalStorage safe access
- Feature detection

**Usage:**
```tsx
import { 
  measureExecutionTime, 
  getDeviceType, 
  isLowEndDevice,
  preloadResource,
  getCoreWebVitals 
} from '@/lib/performance-utils';

// Measure performance
const result = measureExecutionTime(
  () => expensiveOperation(),
  'Operation Name'
);

// Detect device type
const deviceType = getDeviceType(); // 'mobile' | 'tablet' | 'desktop'

// Adapt UI for low-end devices
if (isLowEndDevice()) {
  // Reduce animations, disable heavy features
}

// Get current web vitals
const vitals = getCoreWebVitals();
console.log(`LCP: ${vitals.lcp}ms`);
```

---

## ✨ Recent Optimizations

### 1. Enhanced API Cache (`/lib/api-cache.ts`)
- **LRU Eviction**: Automatically removes least-used cache entries
- **Access Tracking**: Monitors which entries are most valuable
- **Memory Efficient**: Configurable max size and memory limits
- **Error Handling**: Cleans up pending requests on failure
- **Statistics**: Built-in cache monitoring

### 2. Improved Middleware (`/middleware.ts`)
- **Compression Headers**: Advertise gzip/deflate/brotli support
- **Asset Caching**: Automatic cache headers for static assets
- **Performance Timing**: Track response times
- **Bot Blocking**: Enhanced security

### 3. Enhanced next.config.ts
- **Brotli Support**: Better than gzip for text assets
- **API Caching**: 5-minute cache + stale-while-revalidate
- **ISR Optimization**: 52MB cache for faster rebuilds
- **Worker Threads**: Parallel build optimization

---

## 🎯 Quick Wins to Implement

### 1. Add Image Lazy Loading (5 min)
```tsx
import Image from 'next/image';

<Image
  src={poster}
  alt="Movie poster"
  loading="lazy"
  placeholder="blur"
/>
```

### 2. Memoize Expensive Components (10 min each)
```tsx
import { memo } from 'react';

export default memo(function MovieCard({ movie }) {
  return <div>{movie.name}</div>;
}, (prev, next) => prev.movie.id === next.movie.id);
```

### 3. Use requestIdleCallback for Non-Critical Work (5 min)
```tsx
import { requestIdleCallbackPolyfill } from '@/lib/performance-utils';

useEffect(() => {
  const id = requestIdleCallbackPolyfill(() => {
    // Heavy analytics, logging, etc.
    trackUserBehavior();
  });

  return () => requestIdleCallbackPolyfill(id);
}, []);
```

### 4. Preload Critical Resources (5 min)
```tsx
import { preloadResource, preconnect } from '@/lib/performance-utils';

// In your layout or critical component
preconnect('https://phimapi.com');
preloadResource('/fonts/inter-var.woff2', 'font');
```

---

## 📈 Measuring Progress

### Run Lighthouse Periodically
```bash
npm run test:lighthouse
```

### Monitor Bundle Size
```bash
npm run build:analyze
```

### Check Real User Metrics
- Visit Vercel Analytics dashboard
- Check SpeedInsights reports
- Monitor GTM performance events

### Local Testing
```bash
npm run build
npm start
# Open DevTools → Lighthouse tab
```

---

## 🔗 References & Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/performance-optimization)
- [Web.dev Performance Guide](https://web.dev/performance)
- [Core Web Vitals](https://web.dev/vitals)
- [Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Font Optimization](https://nextjs.org/docs/basic-features/font-optimization)

---

## 📝 Notes

- All optimizations maintain **zero breaking changes**
- Performance improvements are **cumulative** - implement gradually
- **Monitor production metrics** - not all optimizations help every site
- **Test on real devices** - especially low-end phones
- **Measure before and after** - ensure changes actually help

---

**Last Updated**: April 18, 2026  
**Next Review**: After each major deployment
