import { isVietnameseSlug, isVietnameseMovie, isClientAdmin } from "@/lib/vietnam-copyright";

// Danh sách các phim bị ẩn / gỡ bỏ theo yêu cầu bản quyền (DMCA)
// Để ẩn một phim, thêm slug của phim vào danh sách này
// Để bỏ ẩn, xóa slug khỏi danh sách

export const HIDDEN_MOVIE_SLUGS: string[] = [
  "ma-xo", // DMCA Report ID: ac50a0dc8fa7a596 (CJ ENM / MediaStory LLC)
];

// Helper function để kiểm tra slug có bị ẩn không (hỗ trợ normalize, decode URL, và quyền Admin)
export function isSlugHidden(slug?: string | null, options?: { isAdmin?: boolean }): boolean {
  if (!slug) return false;
  try {
    const clean = decodeURIComponent(slug).toLowerCase().trim().replace(/^\/+|\/+$/g, "");
    if (HIDDEN_MOVIE_SLUGS.includes(clean)) return true;
    const adminMode = options?.isAdmin ?? isClientAdmin();
    if (!adminMode && isVietnameseSlug(clean)) return true;
    return false;
  } catch {
    const raw = String(slug).toLowerCase().trim();
    if (HIDDEN_MOVIE_SLUGS.includes(raw)) return true;
    const adminMode = options?.isAdmin ?? isClientAdmin();
    if (!adminMode && isVietnameseSlug(raw)) return true;
    return false;
  }
}

// Helper function để kiểm tra phim có bị ẩn không (kèm kiểm tra phim Việt Nam và quyền Admin)
export function isMovieHidden(movie: any, options?: { isAdmin?: boolean }): boolean {
  if (!movie) return false;
  const slug = typeof movie === "string" ? movie : movie?.slug || "";
  if (isSlugHidden(slug, options)) return true;
  const adminMode = options?.isAdmin ?? isClientAdmin();
  if (!adminMode && isVietnameseMovie(movie)) return true;
  return false;
}

export function filterHiddenMovies<T extends { slug?: string }>(movies: T[], options?: { isAdmin?: boolean }): T[] {
  if (!movies || !Array.isArray(movies)) return [];
  return movies.filter((movie) => !isMovieHidden(movie, options));
}
