# Comprehensive Optimization Plan (comprehensive-optimization.md)

## Goal
Execute a complete, 4-pillar architectural optimization for `https://hiphim.one` covering Frontend Core Web Vitals, Cloudflare Edge CDN Caching, D1 Database indexing/queries, and SEO/OG performance.

## Pillars & Task Breakdown

### Pillar 1: Frontend & Core Web Vitals (Performance 90+)
- [ ] **Task 1.1: Defer GTM & Analytics Loading Until Interaction**
  - Files: `components/ui/GTM.tsx`, `components/seo/enhanced-gtm.tsx`
  - Ensure zero JavaScript execution during critical LCP window; only initialize scripts upon user interaction or long idle.
- [ ] **Task 1.2: Font & Resource Hints Optimization**
  - Files: `app/layout.tsx`, `next.config.ts`
  - Clean preconnect/dns-prefetch headers, ensure fonts and critical images are prioritized without blocking.
- [ ] **Task 1.3: Webpack Chunk Splitting & Turbopack Optimization**
  - File: `next.config.ts`
  - Optimize cache groups and bundle splitting for `hls.js`, `framer-motion`, `@radix-ui`.

### Pillar 2: Edge CDN Caching & Cloudflare Worker Invocations Reduction
- [ ] **Task 2.1: Enforce Cloudflare Edge Cache Headers for Static & Catalog Pages**
  - File: `next.config.ts`
  - Apply `Cloudflare-CDN-Cache-Control` (`s-maxage=1800, stale-while-revalidate=86400`) on catalog and ranking pages.
- [ ] **Task 2.2: API Route Edge Caching**
  - Files: `app/api/announcement/route.ts`, `app/api/rating/route.ts`, `app/api/system/maintenance/route.ts`
  - Maximize edge caching to handle traffic spikes with zero Worker cost.

### Pillar 3: Database D1 Indexing & Query Optimization
- [ ] **Task 3.1: Audit & Add D1 Schema Indexes**
  - Files: `lib/db.ts` or D1 migration/schema files
  - Add `CREATE INDEX IF NOT EXISTS` for user_id, movie_slug, status columns.
- [ ] **Task 3.2: Query Response Deduplication & Throttling**
  - Ensure client API calls use shared deduplication promises.

### Pillar 4: SEO, OpenGraph & Social Sharing Optimization
- [ ] **Task 4.1: Edge Caching for Dynamic OG Images**
  - File: `app/api/og/route.tsx`
  - Apply 7-day edge cache headers (`s-maxage=604800, stale-while-revalidate=2592000`) on `/api/og`.
- [ ] **Task 4.2: Structured Data JSON-LD & Sitemap Optimization**
  - Files: `components/seo/structured-data.tsx`, `app/sitemap.ts`
  - Ensure fast, clean JSON-LD rendering without client overhead.

### Pillar 5: Verification & Production Deployment
- [ ] **Task 5.1: Build locally with `npx opennextjs-cloudflare build` (0 errors).**
- [ ] **Task 5.2: Deploy to Cloudflare Workers (`npm run deploy:cf`).**
- [ ] **Task 5.3: Verify `https://hiphim.one` live status, headers, and endpoints.**
