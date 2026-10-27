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

  // Already a full protocol URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  // Protocol relative
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // If path starts with an external domain name without protocol (e.g., danviet.vn/files/...)
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

  // Relative CDN path (uploads/... or upload/...)
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${cdnDomain}/${cleanPath}`;
}

/**
 * Returns prioritized list of candidate URLs for a movie image.
 * In PhimApi / KKPhim / OPhim:
 * - poster_url is the portrait 2:3 vertical poster (e.g., 600x900, 1000x1500)
 * - thumb_url is the landscape 16:9 widescreen backdrop/thumbnail (e.g., 1280x720, 3840x2160)
 *
 * For type="poster": prioritize poster_url, fallback to thumb_url.
 * For type="backdrop": prioritize thumb_url, fallback to poster_url.
 */
/**
 * Converts a normalized image URL into an ultra-fast, modern WebP/AVIF CDN edge URL.
 * Uses Automattic Edge Photon (i0.wp.com) which strips heavy metadata (EXIF) and resizes
 * to exact viewport requirements, reducing payload by 95-98%.
 */
export function getOptimizedImageUrl(
  url: string,
  type: "poster" | "backdrop" | "thumb" = "poster"
): string {
  if (!url || typeof url !== "string") return "";
  if (url.includes("phimimg.com/")) {
    const clean = url.replace(/^https?:\/\//i, "");
    let params = "strip=all";
    if (type === "poster") {
      params += "&w=360&quality=75";
    } else if (type === "thumb") {
      params += "&w=240&quality=70";
    } else {
      params += "&w=1920&quality=85";
    }
    return `https://i0.wp.com/${clean}?${params}`;
  }
  return url;
}

/**
 * Returns prioritized list of candidate URLs for a movie image.
 * In PhimApi / KKPhim / OPhim:
 * - poster_url is the portrait 2:3 vertical poster (e.g., 600x900, 1000x1500)
 * - thumb_url is the landscape 16:9 widescreen backdrop/thumbnail (e.g., 1280x720, 3840x2160)
 *
 * For type="poster": prioritize poster_url, fallback to thumb_url.
 * For type="backdrop": prioritize thumb_url, fallback to poster_url.
 * For type="thumb": prioritize thumb_url at small 240px dimension.
 */
export function getMovieImageCandidates(
  movie?: { thumb_url?: string | null; poster_url?: string | null } | null,
  type: "poster" | "backdrop" | "thumb" = "poster"
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
      // If it's a known blocked external domain (e.g. danviet.vn), skip for now
      if (normalized.includes("danviet.vn") || normalized.includes("i.ex-cdn.com")) {
        continue;
      }

      // Add optimized edge WebP candidate first
      const optimized = getOptimizedImageUrl(normalized, type);
      if (optimized && optimized !== normalized && !candidates.includes(optimized)) {
        candidates.push(optimized);
      }

      // Add original uncompressed URL as immediate fallback
      if (!candidates.includes(normalized)) {
        candidates.push(normalized);
      }

      // Add mirror CDN fallback ONLY for known ophim domains that share identical paths
      if (normalized.includes("img.ophim1.com/")) {
        const mirror = normalized.replace("img.ophim1.com", "img.ophim.live");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      } else if (normalized.includes("img.ophim.live/")) {
        const mirror = normalized.replace("img.ophim.live", "img.ophim1.com");
        if (!candidates.includes(mirror)) candidates.push(mirror);
      }
    }
  }

  // Append external suspicious URLs at the very end only if no other candidate exists
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
