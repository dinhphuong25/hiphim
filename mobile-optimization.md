# Mobile Optimization Plan (mobile-optimization.md)

## Goal
Comprehensive performance optimization for mobile web users on `https://hiphim.one`: eliminate UI freezing, scroll stuttering, main-thread contention, and memory crashes.

## Tasks Breakdown

- [ ] **Task 1: Hero Section Re-render Elimination**
  - File: `components/hero-section.tsx`
  - Remove 100ms `setInterval` state updater (`setProgress`).
  - Replace progress bar with CSS-based GPU transition and a simple one-shot timer per slide.
  - Verify zero unnecessary re-renders while scrolling.

- [ ] **Task 2: Bypass Heavy DOM Scanners on Mobile**
  - File: `components/ui/security-guard.tsx`
  - Disable `MutationObserver` on whole document subtree and 1.2s `setInterval` querySelectorAll on mobile devices (where desktop downloader extensions like IDM/CocCoc do not exist).
  - Verify no periodic DOM thrashing on mobile browsers.

- [ ] **Task 3: Prevent Prefetch Storm on Mobile Touch**
  - File: `lib/instant-movie-store.ts`
  - Remove immediate `touchstart`/`scroll` multi-tab prefetching on mobile.
  - Defer warming up tabs only to `requestIdleCallback` or when specifically requested, saving 4G data and main-thread JSON parsing.

- [ ] **Task 4: Optimize Video Player HLS Buffering for Mobile**
  - File: `components/player/video-player.tsx`
  - Reduce mobile buffer to safe thresholds (`backBufferLength: 5`, `maxBufferLength: 15`, `maxMaxBufferLength: 25`, `maxBufferSize: 30MB`).
  - Prevent Safari/Chrome memory limits from crashing or freezing the player tab.

- [ ] **Task 5: Offscreen Content Visibility & Layout Optimization**
  - File: `components/movie-section.tsx`, `components/home-client.tsx`
  - Ensure offscreen movie lists and carousels use `content-visibility: auto; contain-intrinsic-size: auto 380px;`.
  - Add smooth touch scrolling with `-webkit-overflow-scrolling: touch` and `touch-action: manipulation`.

- [ ] **Task 6: Build Verification & Deployment**
  - Run `npx opennextjs-cloudflare build` locally (must succeed with 0 errors).
  - Deploy directly to Cloudflare Workers using authenticated API token (`npm run deploy:cf`).
  - Verify live site `https://hiphim.one` responds with 200 OK and no errors.
