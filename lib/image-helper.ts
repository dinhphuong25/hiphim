export const STATIC_BLUR_DATA_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23111714'/%3E%3C/svg%3E";

export const PLACEHOLDER_POSTER = "/placeholder.svg";

/**
 * Normalizes any movie image path into a full, valid HTTPS URL.
 * Prevents invalid concatenations like https://phimimg.com/danviet.vn/...
 */
export function normalizeImageUrl(
  rawUrl?: string | null,
  cdnDomain = "https://phimimg.com"
): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const firstSegment = trimmed.split("/")[0];
  if (
    !trimmed.startsWith("upload") &&
    !trimmed.startsWith("/upload") &&
    firstSegment &&
    firstSegment.includes(".") &&
    !firstSegment.endsWith(".webp") &&
    !firstSegment.endsWith(".jpg") &&
    !firstSegment.endsWith(".png")
  ) {
    return `https://${trimmed}`;
  }

  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${cdnDomain}/${cleanPath}`;
}

export type ImageVariantType = "poster" | "backdrop" | "thumb" | "card-wide";

/**
 * Converts a normalized image URL into an ultra-fast, modern WebP/AVIF CDN edge URL.
 * Uses Automattic Edge Photon (i0.wp.com) which strips EXIF metadata and resizes
 * to exact viewport requirements, reducing payload by 90-98%.
 */
export function getOptimizedImageUrl(
  url: string,
  type: ImageVariantType = "poster"
): string {
  if (!url || typeof url !== "string") return "";
  if (url.includes("phimimg.com/")) {
    const clean = url.replace(/^https?:\/\//i, "");
    let params = "strip=all";
    if (type === "poster") {
      params += "&w=340&quality=75";
    } else if (type === "thumb") {
      params += "&w=240&quality=70";
    } else if (type === "card-wide") {
      params += "&w=480&quality=75";
    } else {
      params += "&w=1440&quality=82";
    }
    return `https://i0.wp.com/${clean}?${params}`;
  }
  return url;
}

/**
 * Returns prioritized list of candidate URLs for a movie image.
 * - poster: portrait 2:3 vertical poster
 * - backdrop: widescreen 16:9 hero backdrop (1440px)
 * - card-wide: horizontal 16:9 card thumbnail (480px)
 * - thumb: small 240px carousel thumbnail
 */
export function getMovieImageCandidates(
  movie?: { thumb_url?: string | null; poster_url?: string | null } | null,
  type: ImageVariantType = "poster"
): string[] {
  if (!movie) return [];

  const isPoster = type === "poster";

  const pStr = (movie.poster_url || "").toLowerCase();
  const tStr = (movie.thumb_url || "").toLowerCase();

  let primaryRaw = isPoster ? movie.poster_url : movie.thumb_url;
  let secondaryRaw = isPoster ? movie.thumb_url : movie.poster_url;

  if (isPoster) {
    if (tStr.includes("poster") && !pStr.includes("poster")) {
      primaryRaw = movie.thumb_url;
      secondaryRaw = movie.poster_url;
    }
  } else {
    if (pStr.includes("thumb") && !tStr.includes("thumb")) {
      primaryRaw = movie.poster_url;
      secondaryRaw = movie.thumb_url;
    }
  }

  const rawCandidates = [primaryRaw, secondaryRaw];
  const candidates: string[] = [];

  for (const raw of rawCandidates) {
    const normalized = normalizeImageUrl(raw);
    if (normalized) {
      if (normalized.includes("danviet.vn") || normalized.includes("i.ex-cdn.com")) {
        continue;
      }

      const optimized = getOptimizedImageUrl(normalized, type);
      if (optimized && optimized !== normalized && !candidates.includes(optimized)) {
        candidates.push(optimized);
      }

      if (!candidates.includes(normalized)) {
        candidates.push(normalized);
      }

      if (normalized.includes("phimimg.com/")) {
        const mirror = normalized.replace("phimimg.com", "img.phimapi.com");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      } else if (normalized.includes("img.phimapi.com/")) {
        const mirror = normalized.replace("img.phimapi.com", "phimimg.com");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      }
      if (normalized.includes("img.ophim1.com/")) {
        const mirror = normalized.replace("img.ophim1.com", "img.ophim.live");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      } else if (normalized.includes("img.ophim.live/")) {
        const mirror = normalized.replace("img.ophim.live", "img.ophim1.com");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      }
    }
  }

  for (const raw of rawCandidates) {
    const normalized = normalizeImageUrl(raw);
    if (
      normalized &&
      !candidates.includes(normalized) &&
      (normalized.includes("danviet.vn") || normalized.includes("i.ex-cdn.com"))
    ) {
      candidates.push(normalized);
    }
  }

  return candidates;
}
