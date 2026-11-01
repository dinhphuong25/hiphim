/**
 * Navigation History Manager for Hi Phim
 * 
 * Tracks the user's browsing origins (home, categories, search, history, favorites)
 * and ensures that the "Quay lại" (Back) button on movie detail pages (/phim/[slug])
 * ALWAYS returns the user to the catalog/browsing page from which they clicked the movie,
 * and NEVER bounces them into the video player (/watch).
 */

const LAST_CATALOG_KEY = "hiphim_last_catalog_url";
const MOVIE_REFERRER_PREFIX = "hiphim_movie_ref_";
const GLOBAL_LAST_REFERRER_KEY = "hiphim_last_movie_referrer";

/**
 * Validates that a target URL is safe to navigate to as a back target.
 * Must NOT be empty, must NOT start with /watch, and must NOT be the same as the current movie.
 */
function isSafeBackUrl(url: string | null | undefined, currentSlug?: string): url is string {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (!clean || clean === "#") return false;

  // Never allow /watch as a back destination for movie details
  if (clean.startsWith("/watch") || clean.startsWith("watch") || clean.includes("/watch?")) {
    return false;
  }

  // Do not navigate back to the exact same movie detail page
  if (currentSlug && (clean === `/phim/${currentSlug}` || clean.startsWith(`/phim/${currentSlug}?`))) {
    return false;
  }

  return true;
}

/**
 * Record a catalog/browsing page URL.
 * Only call this for pages that are NOT /phim/* and NOT /watch*.
 */
export function recordCatalogUrl(url?: string): void {
  if (typeof window === "undefined") return;
  try {
    const rawUrl = url || (window.location.pathname + window.location.search);
    if (!rawUrl) return;

    const path = rawUrl.split("?")[0];
    if (path.startsWith("/phim/") || path.startsWith("/watch")) {
      return;
    }

    sessionStorage.setItem(LAST_CATALOG_KEY, rawUrl);
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Record the referring page when navigating into a movie.
 */
export function recordMovieReferrer(slug: string, referrerUrl?: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    const rawRef = referrerUrl || (window.location.pathname + window.location.search);
    if (!isSafeBackUrl(rawRef, slug)) return;

    sessionStorage.setItem(MOVIE_REFERRER_PREFIX + slug, rawRef);
    sessionStorage.setItem(GLOBAL_LAST_REFERRER_KEY, rawRef);
  } catch {
    // Ignore storage quota or disabled errors
  }
}

/**
 * Get the page from which the user clicked into this movie.
 * Guaranteed to NEVER return a /watch URL!
 */
export function getMovieReferrer(slug?: string): string {
  if (typeof window === "undefined") return "/";

  try {
    // 1. Specific movie referrer (where this exact movie was clicked)
    if (slug) {
      const specific = sessionStorage.getItem(MOVIE_REFERRER_PREFIX + slug);
      if (isSafeBackUrl(specific, slug)) {
        return specific;
      }
    }

    // 2. Global last recorded movie referrer
    const globalRef = sessionStorage.getItem(GLOBAL_LAST_REFERRER_KEY);
    if (isSafeBackUrl(globalRef, slug)) {
      return globalRef;
    }

    // 3. Last visited catalog/browsing page (e.g. /?category=hoat-hinh, /recently, /favorites, /)
    const lastCatalog = sessionStorage.getItem(LAST_CATALOG_KEY);
    if (isSafeBackUrl(lastCatalog, slug)) {
      return lastCatalog;
    }
  } catch {
    // Ignore storage errors
  }

  // 4. Safe browser document.referrer check
  if (typeof document !== "undefined" && document.referrer) {
    try {
      const parsed = new URL(document.referrer);
      if (parsed.host === window.location.host) {
        const pathAndQuery = parsed.pathname + parsed.search;
        if (isSafeBackUrl(pathAndQuery, slug)) {
          return pathAndQuery;
        }
      }
    } catch {}
  }

  // 5. Ultimate fallback to Home page
  return "/";
}
