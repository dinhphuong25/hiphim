import { isVietnameseSlug, isVietnameseMovie } from "@/lib/vietnam-copyright";

// Danh sách các phim bị ẩn / gỡ bỏ theo yêu cầu bản quyền (DMCA)
// Để ẩn một phim, thêm slug của phim vào danh sách này
// Để bỏ ẩn, xóa slug khỏi danh sách

export const HIDDEN_MOVIE_SLUGS: string[] = [
  "ma-xo", // DMCA Report ID: ac50a0dc8fa7a596 (CJ ENM / MediaStory LLC)
];

// Helper function để kiểm tra slug có bị ẩn không (hỗ trợ normalize, decode URL)
export function isSlugHidden(slug?: string | null): boolean {
  if (!slug) return false;
  try {
    const clean = decodeURIComponent(slug).toLowerCase().trim().replace(/^\/+|\/+$/g, "");
    if (HIDDEN_MOVIE_SLUGS.includes(clean)) return true;
    if (isVietnameseSlug(clean)) return true;
    return false;
  } catch {
    const raw = String(slug).toLowerCase().trim();
    return HIDDEN_MOVIE_SLUGS.includes(raw) || isVietnameseSlug(raw);
  }
}

// Helper function để kiểm tra phim có bị ẩn không (kèm kiểm tra phim Việt Nam)
export function isMovieHidden(movie: any): boolean {
  if (!movie) return false;
  const slug = typeof movie === "string" ? movie : movie?.slug || "";
  if (isSlugHidden(slug)) return true;
  if (isVietnameseMovie(movie)) return true;
  return false;
}

export function filterHiddenMovies<T extends { slug?: string }>(movies: T[]): T[] {
  if (!movies || !Array.isArray(movies)) return [];
  return movies.filter((movie) => !isMovieHidden(movie));
}
