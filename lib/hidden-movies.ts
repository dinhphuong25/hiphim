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
    return HIDDEN_MOVIE_SLUGS.includes(clean);
  } catch {
    const raw = String(slug).toLowerCase().trim();
    return HIDDEN_MOVIE_SLUGS.includes(raw);
  }
}

// Helper function để kiểm tra phim có bị ẩn không
export function isMovieHidden(movie: any): boolean {
  const slug = movie?.slug || "";
  return isSlugHidden(slug);
}

export function filterHiddenMovies<T extends { slug?: string }>(movies: T[]): T[] {
  if (!movies || !Array.isArray(movies)) return [];
  return movies.filter((movie) => !isSlugHidden(movie?.slug));
}
