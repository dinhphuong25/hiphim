import type { Movie, MovieListItem, MovieEpisode, Pagination } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hiphim.one";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const REFERER = APP_URL;

import { normalizeImageUrl } from "@/lib/image-helper";

function normalizeCdnUrl(url: string | undefined, cdnDomain: string): string {
  return normalizeImageUrl(url, cdnDomain);
}

function normalizeItems(items: any[], cdnDomain: string): any[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    thumb_url: normalizeCdnUrl(item.thumb_url, cdnDomain),
    poster_url: normalizeCdnUrl(item.poster_url, cdnDomain),
  }));
}

function normalizeSearchKey(str: string | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function mapNguonCToMovieListItem(item: any): MovieListItem {
  const year = item.created ? new Date(item.created).getFullYear() : (item.year || 2026);
  const isSeries = item.total_episodes && item.total_episodes > 1;
  return {
    _id: item.id || item.slug,
    name: item.name || "",
    slug: item.slug,
    origin_name: item.original_name || item.name || "",
    type: (isSeries ? "series" : "single") as any,
    // NguonC stores widescreen backdrop in poster_url and portrait poster in thumb_url
    thumb_url: normalizeImageUrl(item.poster_url || item.thumb_url),
    poster_url: normalizeImageUrl(item.thumb_url || item.poster_url),
    year: isNaN(year) ? 2026 : year,
    quality: item.quality || "HD",
    lang: item.language || "Vietsub",
    episode_current: item.current_episode || "Full",
    category: [],
    country: [],
    modified: item.modified ? { time: item.modified } : undefined,
  };
}

export default class PhimApi {
  private apiUrl = "https://phimapi.com";
  private defaultCdnDomain = "https://phimimg.com";

  private fetchHeaders() {
    return {
      Referer: REFERER,
      "User-Agent": USER_AGENT,
    };
  }

  async get(slug: string): Promise<{ movie: Movie; server: MovieEpisode[] }> {
    const url = `${this.apiUrl}/phim/${slug}`;
    try {
      const response = await fetch(url, {
        headers: this.fetchHeaders(),
        next: { revalidate: 1800, tags: ["movies", `movie-${slug}`] },
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (!data?.status || !data?.movie?.slug) {
        throw new Error("Movie not found in primary API");
      }

      // Normalize movie image URLs
      const cdnDomain = this.defaultCdnDomain;
      const movie = {
        ...data.movie,
        thumb_url: normalizeCdnUrl(data.movie?.thumb_url, cdnDomain),
        poster_url: normalizeCdnUrl(data.movie?.poster_url, cdnDomain),
      };

      let allServers: MovieEpisode[] = data.episodes || [];
      if (!allServers || allServers.length === 0) {
        try {
          const searchTerm = movie.origin_name || movie.name;
          if (searchTerm) {
            const nguoncSearchUrl = `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(searchTerm)}`;
            const nSearchRes = await fetch(nguoncSearchUrl, {
              headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
              signal: AbortSignal.timeout(2000),
              next: { revalidate: 1800 },
            });
            if (nSearchRes.ok) {
              const nSearchData = await nSearchRes.json();
              const matchedItem = nSearchData.items?.[0];
              if (matchedItem && matchedItem.slug) {
                const nFilmRes = await fetch(`https://phim.nguonc.com/api/film/${matchedItem.slug}`, {
                  headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
                  signal: AbortSignal.timeout(2000),
                  next: { revalidate: 1800 },
                });
                if (nFilmRes.ok) {
                  const nFilmData = await nFilmRes.json();
                  const nEpisodes = nFilmData.movie?.episodes || [];
                  if (nEpisodes.length > 0) {
                    const nguoncServers: MovieEpisode[] = nEpisodes.map((s: any, idx: number) => ({
                      server_name: s.server_name ? `Dự Phòng (${s.server_name})` : `Dự Phòng ${idx > 0 ? idx + 1 : ""}`.trim(),
                      server_data: (s.items || []).map((it: any) => ({
                        name: it.name?.startsWith("Tập") ? it.name : `Tập ${it.name}`,
                        slug: it.slug,
                        filename: it.name,
                        link_embed: it.embed,
                        link_m3u8: "",
                      })),
                    }));
                    allServers = nguoncServers;
                  }
                }
              }
            }
          }
        } catch (backupErr) {
          // Non-blocking fallback
        }
      }

      return {
        movie,
        server: allServers,
      };
    } catch (primaryErr) {
      // Automatic Multi-Source Fallback to NguonC if primary source fails or times out
      try {
        const fallbackUrl = `https://phim.nguonc.com/api/film/${slug}`;
        const fbRes = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
          next: { revalidate: 1800, tags: ["movies", `movie-${slug}`] },
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const fbMovie = fbData.movie;
          if (fbMovie && fbMovie.slug) {
            const mappedMovie = {
              name: fbMovie.name,
              slug: fbMovie.slug,
              origin_name: fbMovie.original_name,
              // NguonC stores widescreen backdrop in poster_url and portrait poster in thumb_url
              thumb_url: fbMovie.poster_url || fbMovie.thumb_url,
              poster_url: fbMovie.thumb_url || fbMovie.poster_url,
              year: fbMovie.created ? new Date(fbMovie.created).getFullYear() : 2026,
              episode_current: fbMovie.current_episode,
              quality: fbMovie.quality || "HD",
              lang: fbMovie.language || "Vietsub",
            };
            const mappedServer: MovieEpisode[] = (fbMovie.episodes || []).map((s: any) => ({
              server_name: s.server_name || "Dự Phòng (NguonC)",
              server_data: (s.items || []).map((it: any) => ({
                name: it.name?.startsWith("Tập") ? it.name : `Tập ${it.name}`,
                slug: it.slug,
                filename: it.name,
                link_embed: it.embed,
                link_m3u8: "",
              })),
            }));
            return {
              movie: mappedMovie as any,
              server: mappedServer,
            };
          }
        }
      } catch {
        // Fallback error ignored, throw primary error
      }
      throw primaryErr;
    }
  }

  listTopics(): Array<{ name: string; slug: string }> {
    return [
      { name: "Phim Chiếu Rạp", slug: "phim-chieu-rap" },
      { name: "Phim Bộ", slug: "phim-bo" },
      { name: "Phim Lẻ", slug: "phim-le" },
      { name: "Phim Hoạt Hình", slug: "hoat-hinh" },
    ];
  }

  async listCategories(): Promise<any[]> {
    const url = `${this.apiUrl}/the-loai`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 86400 }, // Cache 24 giờ
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data?.items)) return data.data.items;
    return [];
  }

  async listCountries(): Promise<any[]> {
    const url = `${this.apiUrl}/quoc-gia`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 86400 }, // Cache 24 giờ
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data?.items)) return data.data.items;
    return [];
  }

  async getList(
    isCategory: boolean | null | undefined,
    slug: string | null | undefined,
    index: number = 1
  ): Promise<[MovieListItem[], Pagination]> {
    if (isCategory === true && slug) return this.byCategory(slug, index);
    if (isCategory === false && slug) return this.byTopic(slug, index);
    return this.newAdding(index);
  }

  async newAdding(index: number = 1, limit: number = 24): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/danh-sach/phim-moi-cap-nhat?page=${index}&limit=${limit}`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 60, tags: ["new-updates", "movies"] }, // Cache 60s để luôn cập nhật tập mới
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    const items = data?.data?.items || data?.items || [];
    const pagination = data?.data?.params?.pagination || data?.pagination;
    return [normalizeItems(items, cdnDomain), pagination];
  }

  async newAddingMultiPage(pages: number = 2, limitPerPage: number = 24): Promise<[MovieListItem[], Pagination]> {
    const fetchPage = (page: number) =>
      this.newAdding(page, limitPerPage).catch(() => [[], null] as [MovieListItem[], any]);

    const results = await Promise.all(
      Array.from({ length: pages }, (_, i) => fetchPage(i + 1))
    );

    const mergedItems: MovieListItem[] = [];
    const seenSlugs = new Set<string>();

    for (const [items] of results) {
      for (const item of items) {
        if (item?.slug && !seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          mergedItems.push(item);
        }
      }
    }

    const firstPagination = results[0]?.[1] || {
      currentPage: 1,
      totalPage: pages,
      totalItems: mergedItems.length,
      itemsPerPage: limitPerPage * pages,
    };

    return [mergedItems, firstPagination];
  }

  async search(query: string, index: number = 1): Promise<[MovieListItem[], Pagination | null]> {
    const trimmed = query?.trim() || "";
    if (!trimmed) return [[], null];

    const kkUrl = `${this.apiUrl}/v1/api/tim-kiem?keyword=${encodeURIComponent(trimmed)}&limit=20&page=${index}`;
    const nguoncUrl = `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(trimmed)}&page=${index}`;

    // Execute in parallel with 4-second timeout to prevent any slow provider from blocking user
    const [kkResult, nguoncResult] = await Promise.allSettled([
      fetch(kkUrl, {
        headers: this.fetchHeaders(),
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 1800 },
      }).then(async (res) => {
        if (!res.ok) throw new Error(`KKPhim search error: ${res.status}`);
        return res.json();
      }),
      fetch(nguoncUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 1800 },
      }).then(async (res) => {
        if (!res.ok) throw new Error(`NguonC search error: ${res.status}`);
        return res.json();
      }),
    ]);

    let kkItems: MovieListItem[] = [];
    let kkPagination: Pagination | null = null;
    if (kkResult.status === "fulfilled" && kkResult.value?.data?.items) {
      const data = kkResult.value;
      const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
      kkItems = normalizeItems(data?.data?.items || [], cdnDomain);
      kkPagination = data?.data?.params?.pagination || null;
    }

    let nguoncItems: MovieListItem[] = [];
    let nguoncPagination: Pagination | null = null;
    if (
      nguoncResult.status === "fulfilled" &&
      nguoncResult.value?.status === "success" &&
      Array.isArray(nguoncResult.value?.items)
    ) {
      const data = nguoncResult.value;
      nguoncItems = data.items.map(mapNguonCToMovieListItem);
      if (data.paginate) {
        nguoncPagination = {
          totalItems: data.paginate.total_items || nguoncItems.length,
          totalItemsPerPage: data.paginate.items_per_page || 10,
          currentPage: data.paginate.current_page || index,
          totalPages: data.paginate.total_page || 1,
        };
      }
    }

    // Merge & Deduplicate by slug and normalized title
    const merged: MovieListItem[] = [];
    const seenSlugs = new Set<string>();
    const seenTitles = new Set<string>();

    for (const item of kkItems) {
      if (item.slug && !seenSlugs.has(item.slug)) {
        seenSlugs.add(item.slug);
        const normTitle = normalizeSearchKey(item.name);
        if (normTitle) seenTitles.add(normTitle);
        merged.push(item);
      }
    }

    for (const item of nguoncItems) {
      if (!item.slug || seenSlugs.has(item.slug)) continue;
      const normTitle = normalizeSearchKey(item.name);
      if (normTitle && seenTitles.has(normTitle)) continue;

      seenSlugs.add(item.slug);
      if (normTitle) seenTitles.add(normTitle);
      merged.push(item);
    }

    // Calculate unified pagination
    const totalItems = (kkPagination?.totalItems || 0) + (nguoncPagination?.totalItems || 0);
    const totalPages = Math.max(kkPagination?.totalPages || 1, nguoncPagination?.totalPages || 1, 1);
    const mergedPagination: Pagination = {
      currentPage: index,
      totalItems: totalItems > 0 ? totalItems : merged.length,
      totalItemsPerPage: 20,
      totalPages: totalPages,
    };

    return [merged, mergedPagination];
  }

  async byCategory(slug: string, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/the-loai/${slug}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async byCountry(slug: string, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/quoc-gia/${slug}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async byTopic(slug: string, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/danh-sach/${slug}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async byYear(year: string | number, index: number = 1): Promise<[MovieListItem[], Pagination]> {
    const url = `${this.apiUrl}/v1/api/nam-phat-hanh/${year}?page=${index}&limit=20`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }

  async getTopicItems(slug: string, limit: number = 6): Promise<MovieListItem[]> {
    const url = `${this.apiUrl}/v1/api/danh-sach/${slug}?page=1&limit=${limit}`;
    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return normalizeItems((data?.data?.items || []).slice(0, limit), cdnDomain);
  }

  async getFilteredList(params: {
    typeList?: string;
    page?: number;
    sortField?: string;
    sortType?: string;
    sortLang?: string;
    category?: string;
    country?: string;
    year?: number | string;
    limit?: number;
  }): Promise<[MovieListItem[], Pagination]> {
    const {
      typeList = "phim-bo",
      page = 1,
      sortField = "modified.time",
      sortType = "desc",
      sortLang,
      category,
      country,
      year,
      limit = 20,
    } = params;

    let url = `${this.apiUrl}/v1/api/danh-sach/${typeList}?page=${page}&sort_field=${sortField}&sort_type=${sortType}&limit=${limit}`;
    if (sortLang) url += `&sort_lang=${sortLang}`;
    if (category) url += `&category=${category}`;
    if (country) url += `&country=${country}`;
    if (year) url += `&year=${year}`;

    const response = await fetch(url, {
      headers: this.fetchHeaders(),
      next: { revalidate: 900 }, // Cache 15 phút
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    const cdnDomain = data?.data?.APP_DOMAIN_CDN_IMAGE || this.defaultCdnDomain;
    return [normalizeItems(data?.data?.items || [], cdnDomain), data?.data?.params?.pagination];
  }
}
