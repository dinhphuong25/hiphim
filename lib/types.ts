/**
 * Centralized TypeScript types cho HI PHIM
 * Dựa trên PhimAPI response format
 */

// ============================================================
// CORE MOVIE TYPES
// ============================================================

export interface MovieCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MovieCountry {
  id: string;
  name: string;
  slug: string;
}

export interface MovieEpisodeData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface MovieEpisode {
  server_name: string;
  server_data: MovieEpisodeData[];
}

export interface ImdbRating {
  id: string;
  rating: number;
}

export interface TmdbRating {
  id: string;
  type: string;
  season: number;
  vote_average: number;
  vote_count: number;
}

export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content: string;
  type: "single" | "series" | "hoathinh" | "tvshows";
  status: string;
  thumb_url: string;
  poster_url: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url?: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: "HD" | "FHD" | "SD" | "CAM" | "4K" | string;
  lang: string;
  notify: string;
  showtimes: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: MovieCategory[];
  country: MovieCountry[];
  imdb?: ImdbRating;
  tmdb?: TmdbRating;
  modified?: { time: string };
}

export interface MovieListItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  type: Movie["type"];
  thumb_url: string;
  poster_url: string;
  year: number;
  quality: Movie["quality"];
  lang: string;
  episode_current: string;
  category: MovieCategory[];
  country: MovieCountry[];
  modified?: { time: string };
}

// ============================================================
// VIDEO QUALITY
// ============================================================

export interface VideoQualityLevel {
  height: number;
  level: number;
  bitrate?: number;
  codec?: string;
}

export type VideoQualityLabel =
  | "Auto"
  | "360p"
  | "480p"
  | "720p"
  | "1080p"
  | "1440p"
  | "2160p"
  | "4K";

export function getQualityLabel(height: number): VideoQualityLabel {
  if (height >= 2000) return "4K";
  if (height >= 1400) return "1440p";
  if (height >= 1000) return "1080p";
  if (height >= 700) return "720p";
  if (height >= 460) return "480p";
  return "360p";
}

// ============================================================
// PLAYER STATE
// ============================================================

export type PlayerMode = "hls" | "embed";

export interface PlayerState {
  mode: PlayerMode;
  videoUrl: string;
  embedUrl?: string;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  quality: number; // -1 = auto, >= 0 = level index
  isPlaying: boolean;
  isFullscreen: boolean;
}

// ============================================================
// WATCH HISTORY & FAVORITES
// ============================================================

export interface WatchHistoryItem {
  slug: string;
  name: string;
  origin_name?: string;
  thumb_url: string;
  poster_url?: string;
  year?: number;
  quality?: string;
  episode_current?: string;
  currentTime: number;
  duration: number;
  episodeIndex?: number;
  episodeName?: string;
  episodeSlug?: string;
  serverIndex?: number;
  tmdb?: { vote_average?: number };
  imdb?: { rating?: number };
  watchedAt: number; // timestamp
}

export interface FavoriteItem {
  slug: string;
  name: string;
  origin_name?: string;
  thumb_url: string;
  poster_url?: string;
  year?: number;
  quality?: string;
  episode_current?: string;
  tmdb?: { vote_average?: number };
  imdb?: { rating?: number };
  addedAt: number; // timestamp
}

export interface WatchProgress {
  slug: string;
  episodeSlug: string;
  serverIndex: number;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export interface UserPreferences {
  volume: number;
  playbackRate: number;
  quality: number;
  autoplay: boolean;
  theme: "dark" | "light";
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface Pagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  status: boolean;
  items: T[];
  params?: {
    pagination: Pagination;
  };
}

export interface ApiMovieDetailResponse {
  status: boolean;
  msg: string;
  movie: Movie;
  episodes: MovieEpisode[];
}

export interface ApiError {
  message: string;
  code?: number;
  type?: "network" | "api" | "not_found" | "timeout";
}

// ============================================================
// SEARCH
// ============================================================

export interface SearchResult {
  items: MovieListItem[];
  pagination: Pagination | null;
}

export interface SearchParams {
  query?: string;
  typeList?: string;
  category?: string;
  country?: string;
  year?: string;
  page?: number;
  sortField?: string;
  sortType?: "asc" | "desc";
  limit?: number;
}

// ============================================================
// PIP STORE
// ============================================================

export interface PipData {
  videoUrl: string;
  movieName: string;
  movieSlug: string;
  poster?: string;
  currentTime?: number;
}
