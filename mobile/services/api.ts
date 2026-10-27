export interface MovieItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  quality?: string;
  lang?: string;
  episode_current?: string;
  time?: string;
  category?: { id?: string; name: string; slug: string }[];
  country?: { id?: string; name: string; slug: string }[];
}

export interface EpisodeData {
  server_name: string;
  server_data: {
    name: string;
    slug: string;
    filename: string;
    link_embed: string;
    link_m3u8: string;
  }[];
}

export interface MovieDetail extends MovieItem {
  content: string;
  type: string;
  status: string;
  trailer_url?: string;
  episode_total: string;
  actor?: string[];
  director?: string[];
  view?: number;
  episodes: EpisodeData[];
}

const BASE_URL = "https://phimapi.com";
const CDN_URL = "https://phimimg.com";
const NGUONC_URL = "https://phim.nguonc.com/api";

function formatImageUrl(path: string | undefined): string {
  if (!path) return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${CDN_URL}/${path.replace(/^\/+/, "")}`;
}

function normalizeSearchKey(str: string | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Fetch danh sách phim mới cập nhật (V1 API endpoint chuẩn của web, có fallback)
 */
export async function fetchNewReleases(page = 1, limit = 24): Promise<{ items: MovieItem[]; totalPages: number }> {
  try {
    const v1Url = `${BASE_URL}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`;
    const res = await fetch(v1Url, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
    });
    if (res.ok) {
      const json = await res.json();
      const rawItems = json.data?.items || json.items || [];
      const items: MovieItem[] = rawItems.map((m: any) => ({
        ...m,
        thumb_url: formatImageUrl(m.thumb_url),
        poster_url: formatImageUrl(m.poster_url || m.thumb_url),
      }));
      const pagination = json.data?.params?.pagination || json.pagination;
      return {
        items,
        totalPages: pagination?.totalPages || pagination?.total_page || 1,
      };
    }
  } catch (err) {
    console.warn("fetchNewReleases V1 failed, trying fallback:", err);
  }

  // Fallback to legacy endpoint
  try {
    const res = await fetch(`${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
    });
    if (!res.ok) throw new Error("Network error");
    const json = await res.json();
    const items = (json.items || []).map((m: any) => ({
      ...m,
      thumb_url: formatImageUrl(m.thumb_url),
      poster_url: formatImageUrl(m.poster_url || m.thumb_url),
    }));
    return {
      items,
      totalPages: json.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error("fetchNewReleases error:", error);
    return { items: [], totalPages: 1 };
  }
}

/**
 * Fetch danh sách phim theo định dạng: phim-bo, phim-le, phim-chieu-rap, hoat-hinh, phim-moi-cap-nhat
 */
export async function fetchListByType(
  type: string,
  page = 1,
  limit = 24
): Promise<{ items: MovieItem[]; totalPages: number }> {
  if (type === "phim-moi-cap-nhat") {
    return fetchNewReleases(page, limit);
  }

  try {
    const res = await fetch(`${BASE_URL}/v1/api/danh-sach/${type}?page=${page}&limit=${limit}`, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const json = await res.json();
    const rawItems = json.data?.items || [];
    const items = rawItems.map((m: any) => ({
      ...m,
      thumb_url: formatImageUrl(m.thumb_url),
      poster_url: formatImageUrl(m.poster_url || m.thumb_url),
    }));
    return {
      items,
      totalPages: json.data?.params?.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error(`fetchListByType ${type} error:`, error);
    return { items: [], totalPages: 1 };
  }
}

/**
 * Fetch phim theo Thể Loại (Category slug)
 */
export async function fetchMoviesByCategory(
  categorySlug: string,
  page = 1,
  limit = 24
): Promise<{ items: MovieItem[]; totalPages: number }> {
  try {
    const res = await fetch(`${BASE_URL}/v1/api/the-loai/${categorySlug}?page=${page}&limit=${limit}`, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const json = await res.json();
    const rawItems = json.data?.items || [];
    const items = rawItems.map((m: any) => ({
      ...m,
      thumb_url: formatImageUrl(m.thumb_url),
      poster_url: formatImageUrl(m.poster_url || m.thumb_url),
    }));
    return {
      items,
      totalPages: json.data?.params?.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error(`fetchMoviesByCategory ${categorySlug} error:`, error);
    return { items: [], totalPages: 1 };
  }
}

/**
 * Fetch phim theo Quốc Gia (Country slug)
 */
export async function fetchMoviesByCountry(
  countrySlug: string,
  page = 1,
  limit = 24
): Promise<{ items: MovieItem[]; totalPages: number }> {
  try {
    const res = await fetch(`${BASE_URL}/v1/api/quoc-gia/${countrySlug}?page=${page}&limit=${limit}`, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const json = await res.json();
    const rawItems = json.data?.items || [];
    const items = rawItems.map((m: any) => ({
      ...m,
      thumb_url: formatImageUrl(m.thumb_url),
      poster_url: formatImageUrl(m.poster_url || m.thumb_url),
    }));
    return {
      items,
      totalPages: json.data?.params?.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error(`fetchMoviesByCountry ${countrySlug} error:`, error);
    return { items: [], totalPages: 1 };
  }
}

/**
 * Fetch phim theo Năm Phát Hành (Year)
 */
export async function fetchMoviesByYear(
  year: number | string,
  page = 1,
  limit = 24
): Promise<{ items: MovieItem[]; totalPages: number }> {
  try {
    const res = await fetch(`${BASE_URL}/v1/api/nam-phat-hanh/${year}?page=${page}&limit=${limit}`, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const json = await res.json();
    const rawItems = json.data?.items || [];
    const items = rawItems.map((m: any) => ({
      ...m,
      thumb_url: formatImageUrl(m.thumb_url),
      poster_url: formatImageUrl(m.poster_url || m.thumb_url),
    }));
    return {
      items,
      totalPages: json.data?.params?.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error(`fetchMoviesByYear ${year} error:`, error);
    return { items: [], totalPages: 1 };
  }
}

/**
 * Multi-Source Search (Tìm kiếm đa nguồn PhimApi + NguonC với merge & deduplicate chuẩn web)
 */
export async function searchMovies(keyword: string, limit = 24): Promise<MovieItem[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const kkUrl = `${BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const nguoncUrl = `${NGUONC_URL}/films/search?keyword=${encodeURIComponent(trimmed)}&page=1`;

  try {
    const [kkResult, nguoncResult] = await Promise.allSettled([
      fetch(kkUrl, {
        headers: { "User-Agent": "HiPhim-App/2.0" },
        signal: AbortSignal.timeout(4500),
      }).then(async (r) => (r.ok ? r.json() : null)),
      fetch(nguoncUrl, {
        headers: { "User-Agent": "HiPhim-App/2.0", Accept: "application/json" },
        signal: AbortSignal.timeout(4500),
      }).then(async (r) => (r.ok ? r.json() : null)),
    ]);

    const items: MovieItem[] = [];
    const seenSlugs = new Set<string>();
    const seenTitles = new Set<string>();

    // 1. Parse primary PhimApi items
    if (kkResult.status === "fulfilled" && kkResult.value?.data?.items) {
      for (const m of kkResult.value.data.items) {
        if (m?.slug && !seenSlugs.has(m.slug)) {
          seenSlugs.add(m.slug);
          const norm = normalizeSearchKey(m.name);
          if (norm) seenTitles.add(norm);
          items.push({
            ...m,
            thumb_url: formatImageUrl(m.thumb_url),
            poster_url: formatImageUrl(m.poster_url || m.thumb_url),
          });
        }
      }
    }

    // 2. Parse fallback NguonC items
    if (nguoncResult.status === "fulfilled" && Array.isArray(nguoncResult.value?.items)) {
      for (const m of nguoncResult.value.items) {
        if (!m?.slug || seenSlugs.has(m.slug)) continue;
        const norm = normalizeSearchKey(m.name);
        if (norm && seenTitles.has(norm)) continue;

        seenSlugs.add(m.slug);
        if (norm) seenTitles.add(norm);

        const year = m.created ? new Date(m.created).getFullYear() : (m.year || 2026);
        items.push({
          _id: m.id || m.slug,
          name: m.name || "",
          slug: m.slug,
          origin_name: m.original_name || m.name || "",
          thumb_url: formatImageUrl(m.thumb_url),
          poster_url: formatImageUrl(m.poster_url || m.thumb_url),
          year: isNaN(year) ? 2026 : year,
          quality: m.quality || "HD",
          lang: m.language || "Vietsub",
          episode_current: m.current_episode || "Full",
        });
      }
    }

    return items;
  } catch (error) {
    console.error("searchMovies error:", error);
    return [];
  }
}

/**
 * Fetch chi tiết phim (hỗ trợ tự động Fallback sang NguonC nếu PhimApi không có hoặc lỗi)
 */
export async function fetchMovieDetail(slug: string): Promise<MovieDetail | null> {
  // 1. Thử nguồn chính PhimApi
  try {
    const res = await fetch(`${BASE_URL}/phim/${slug}`, {
      headers: { "User-Agent": "HiPhim-App/2.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status && json.movie) {
        const m = json.movie;
        const eps = Array.isArray(json.episodes) ? json.episodes : [];
        if (eps.length > 0) {
          return {
            ...m,
            thumb_url: formatImageUrl(m.thumb_url),
            poster_url: formatImageUrl(m.poster_url || m.thumb_url),
            episodes: eps,
          };
        }
      }
    }
  } catch (primaryErr) {
    console.warn(`Primary API detail failed for ${slug}, trying NguonC fallback...`);
  }

  // 2. Tự động Fallback sang NguonC nếu nguồn chính không có
  try {
    const fbRes = await fetch(`${NGUONC_URL}/film/${slug}`, {
      headers: { "User-Agent": "HiPhim-App/2.0", Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (fbRes.ok) {
      const fbData = await fbRes.json();
      const fbMovie = fbData?.movie;
      if (fbMovie && fbMovie.slug) {
        const year = fbMovie.created ? new Date(fbMovie.created).getFullYear() : 2026;
        const mappedEpisodes: EpisodeData[] = (fbMovie.episodes || []).map((s: any) => ({
          server_name: s.server_name || "Dự Phòng (NguonC)",
          server_data: (s.items || []).map((it: any) => ({
            name: it.name?.startsWith("Tập") ? it.name : `Tập ${it.name}`,
            slug: it.slug,
            filename: it.name,
            link_embed: it.embed || "",
            link_m3u8: it.m3u8 || it.embed || "",
          })),
        }));

        return {
          _id: fbMovie.id || fbMovie.slug,
          name: fbMovie.name,
          slug: fbMovie.slug,
          origin_name: fbMovie.original_name || fbMovie.name,
          content: fbMovie.description || "",
          thumb_url: formatImageUrl(fbMovie.thumb_url),
          poster_url: formatImageUrl(fbMovie.poster_url || fbMovie.thumb_url),
          year: isNaN(year) ? 2026 : year,
          type: fbMovie.total_episodes > 1 ? "series" : "single",
          status: "completed",
          episode_total: String(fbMovie.total_episodes || "1"),
          episode_current: fbMovie.current_episode || "Full",
          quality: fbMovie.quality || "HD",
          lang: fbMovie.language || "Vietsub",
          episodes: mappedEpisodes,
        };
      }
    }
  } catch (fbErr) {
    console.error("NguonC fallback detail error:", fbErr);
  }

  return null;
}

/**
 * 26 THỂ LOẠI CHÍNH THỨC ĐỒNG BỘ 100% VỚI WEBSITE HI PHIM
 */
export const CATEGORIES_LIST = [
  { slug: "hanh-dong", name: "Hành Động", group: "action" },
  { slug: "co-trang", name: "Cổ Trang", group: "romance" },
  { slug: "tinh-cam", name: "Tình Cảm", group: "romance" },
  { slug: "kinh-di", name: "Kinh Dị", group: "popular" },
  { slug: "hai-huoc", name: "Hài Hước", group: "popular" },
  { slug: "vien-tuong", name: "Viễn Tưởng", group: "action" },
  { slug: "tam-ly", name: "Tâm Lý", group: "romance" },
  { slug: "vo-thuat", name: "Võ Thuật", group: "action" },
  { slug: "hinh-su", name: "Hình Sự", group: "action" },
  { slug: "phieu-luu", name: "Phiêu Lưu", group: "action" },
  { slug: "gia-dinh", name: "Gia Đình", group: "romance" },
  { slug: "chien-tranh", name: "Chiến Tranh", group: "action" },
  { slug: "bi-an", name: "Bí Ẩn", group: "popular" },
  { slug: "hoc-duong", name: "Học Đường", group: "romance" },
  { slug: "chinh-kich", name: "Chính Kịch", group: "romance" },
  { slug: "tai-lieu", name: "Tài Liệu", group: "other" },
  { slug: "khoa-hoc", name: "Khoa Học", group: "other" },
  { slug: "am-nhac", name: "Âm Nhạc", group: "other" },
  { slug: "than-thoai", name: "Thần Thoại", group: "action" },
  { slug: "the-thao", name: "Thể Thao", group: "other" },
  { slug: "kinh-dien", name: "Kinh Điển", group: "other" },
  { slug: "lich-su", name: "Lịch Sử", group: "other" },
  { slug: "mien-tay", name: "Miền Tây", group: "other" },
  { slug: "phim-18", name: "Phim 18+", group: "other" },
  { slug: "phim-ngan", name: "Phim Ngắn", group: "other" },
  { slug: "tre-em", name: "Trẻ Em", group: "other" },
];

/**
 * 37 QUỐC GIA ĐIỆN ẢNH ĐỒNG BỘ 100% VỚI WEBSITE HI PHIM (KÈM ISO ALPHA-2 CODE CHO FLAGCDN)
 */
export const COUNTRIES_LIST = [
  { slug: "trung-quoc", name: "Trung Quốc", code: "CN", region: "asia", popular: true },
  { slug: "han-quoc", name: "Hàn Quốc", code: "KR", region: "asia", popular: true },
  { slug: "au-my", name: "Âu Mỹ", code: "US", region: "west", popular: true },
  { slug: "nhat-ban", name: "Nhật Bản", code: "JP", region: "asia", popular: true },
  { slug: "thai-lan", name: "Thái Lan", code: "TH", region: "asia", popular: true },
  { slug: "viet-nam", name: "Việt Nam", code: "VN", region: "asia", popular: true },
  { slug: "hong-kong", name: "Hồng Kông", code: "HK", region: "asia", popular: true },
  { slug: "an-do", name: "Ấn Độ", code: "IN", region: "asia", popular: true },
  { slug: "dai-loan", name: "Đài Loan", code: "TW", region: "asia", popular: true },
  { slug: "anh", name: "Anh", code: "GB", region: "west", popular: true },
  { slug: "phap", name: "Pháp", code: "FR", region: "west", popular: true },
  { slug: "duc", name: "Đức", code: "DE", region: "west", popular: true },
  { slug: "y", name: "Ý", code: "IT", region: "west", popular: false },
  { slug: "tay-ban-nha", name: "Tây Ban Nha", code: "ES", region: "west", popular: false },
  { slug: "nga", name: "Nga", code: "RU", region: "west", popular: false },
  { slug: "canada", name: "Canada", code: "CA", region: "west", popular: false },
  { slug: "uc", name: "Úc", code: "AU", region: "west", popular: false },
  { slug: "ha-lan", name: "Hà Lan", code: "NL", region: "west", popular: false },
  { slug: "bi", name: "Bỉ", code: "BE", region: "west", popular: false },
  { slug: "thuy-dien", name: "Thụy Điển", code: "SE", region: "west", popular: false },
  { slug: "thuy-si", name: "Thụy Sĩ", code: "CH", region: "west", popular: false },
  { slug: "na-uy", name: "Na Uy", code: "NO", region: "west", popular: false },
  { slug: "dan-mach", name: "Đan Mạch", code: "DK", region: "west", popular: false },
  { slug: "ba-lan", name: "Ba Lan", code: "PL", region: "west", popular: false },
  { slug: "bo-dao-nha", name: "Bồ Đào Nha", code: "PT", region: "west", popular: false },
  { slug: "brazil", name: "Brazil", code: "BR", region: "west", popular: false },
  { slug: "mexico", name: "Mexico", code: "MX", region: "west", popular: false },
  { slug: "philippines", name: "Philippines", code: "PH", region: "asia", popular: false },
  { slug: "malaysia", name: "Malaysia", code: "MY", region: "asia", popular: false },
  { slug: "indonesia", name: "Indonesia", code: "ID", region: "asia", popular: false },
  { slug: "tho-nhi-ky", name: "Thổ Nhĩ Kỳ", code: "TR", region: "asia", popular: false },
  { slug: "chau-phi", name: "Châu Phi", code: "ZA", region: "west", popular: false },
  { slug: "nam-phi", name: "Nam Phi", code: "ZA", region: "west", popular: false },
  { slug: "uae", name: "UAE", code: "AE", region: "asia", popular: false },
  { slug: "a-rap-xe-ut", name: "Ả Rập Xê Út", code: "SA", region: "asia", popular: false },
  { slug: "ukraina", name: "Ukraina", code: "UA", region: "west", popular: false },
  { slug: "quoc-gia-khac", name: "Quốc Gia Khác", code: "WW", region: "west", popular: false },
];

/**
 * CÁC ĐỊNH DẠNG / CHỦ ĐỀ CHÍNH TRÊN HI PHIM
 */
export const FORMATS_LIST = [
  { slug: "phim-bo", name: "Phim Bộ" },
  { slug: "phim-le", name: "Phim Lẻ" },
  { slug: "phim-chieu-rap", name: "Chiếu Rạp" },
  { slug: "hoat-hinh", name: "Hoạt Hình" },
  { slug: "phim-moi-cap-nhat", name: "Mới Cập Nhật" },
];
