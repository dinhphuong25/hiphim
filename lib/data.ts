import { unstable_cache } from "next/cache";
import PhimApi from "@/libs/phimapi.com";
import { getSiteConfig } from "@/lib/site-config";
import { filterHiddenMovies } from "@/lib/hidden-movies";

export const TRENDING_FEATURED_SLUGS = [
  "nguoi-nhen-khoi-dau-moi",
  "godzilla-x-kong-de-che-moi",
  "deadpool-va-wolverine",
  "quat-mo-trung-ma",
  "arcane-lien-minh-huyen-thoai-phan-2",
  "nu-hoang-nuoc-mat",
  "avatar-lua-va-tro-tan",
];

const api = new PhimApi();

interface MemCacheEntry<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
}

const workerMemCache = new Map<string, MemCacheEntry<any>>();
const workerInFlight = new Map<string, Promise<any>>();

async function withMemCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  isEmpty?: (val: T) => boolean
): Promise<T> {
  const now = Date.now();
  const cached = workerMemCache.get(key);

  if (cached && now < cached.expiresAt) {
    return cached.value;
  }

  const refreshPromise = () => {
    let inflight = workerInFlight.get(key);
    if (!inflight) {
      inflight = fetcher()
        .then((res) => {
          const empty = isEmpty ? isEmpty(res) : Array.isArray(res) && res.length === 0;
          if (!empty) {
            if (workerMemCache.size > 200) {
              const firstKey = workerMemCache.keys().next().value;
              if (firstKey) workerMemCache.delete(firstKey);
            }
            workerMemCache.set(key, {
              value: res,
              expiresAt: Date.now() + ttlMs,
              staleUntil: Date.now() + ttlMs * 6,
            });
          }
          return res;
        })
        .finally(() => {
          workerInFlight.delete(key);
        });
      workerInFlight.set(key, inflight);
    }
    return inflight;
  };

  if (cached && now < cached.staleUntil) {
    refreshPromise().catch(() => {});
    return cached.value;
  }

  try {
    return await refreshPromise();
  } catch (err) {
    if (cached) return cached.value;
    throw err;
  }
}

function slimCardMovie(m: any): any {
  if (!m || typeof m !== "object") return m;
  return {
    _id: m._id || m.slug,
    slug: m.slug,
    name: m.name,
    origin_name: m.origin_name,
    thumb_url: m.thumb_url,
    poster_url: m.poster_url,
    year: m.year,
    quality: m.quality,
    lang: m.lang,
    time: m.time,
    episode_current: m.episode_current,
    episode_total: m.episode_total,
    type: m.type,
    sub_docquyen: m.sub_docquyen,
    chieurap: m.chieurap,
    imdb: m.imdb ? { rating: m.imdb.rating, vote_average: m.imdb.vote_average } : undefined,
    tmdb: m.tmdb ? { vote_average: m.tmdb.vote_average, type: m.tmdb.type } : undefined,
    category: Array.isArray(m.category)
      ? m.category.slice(0, 4).map((c: any) => ({ name: c?.name, slug: c?.slug }))
      : undefined,
    country: Array.isArray(m.country)
      ? m.country.slice(0, 2).map((c: any) => ({ name: c?.name, slug: c?.slug }))
      : undefined,
  };
}

function slimHeroMovie(m: any): any {
  if (!m || typeof m !== "object") return m;
  const base = slimCardMovie(m);
  const rawContent = typeof m.content === "string" ? m.content.replace(/<[^>]*>/g, "").trim() : "";
  return {
    ...base,
    content: rawContent.length > 420 ? `${rawContent.slice(0, 420)}...` : rawContent,
    actor: Array.isArray(m.actor) ? m.actor.filter(Boolean).slice(0, 5) : undefined,
    director: Array.isArray(m.director) ? m.director.filter(Boolean).slice(0, 2) : undefined,
  };
}

/** Categories cached 24h */
export const getCachedCategories = () =>
  withMemCache("categories", 86400_000, () => api.listCategories());

/** Countries cached 24h */
export const getCachedCountries = () =>
  withMemCache("countries", 86400_000, () => api.listCountries());

/** Multiple Featured movies cached 30m with full detailed metadata */
export const getCachedFeaturedMovies = async () => {
  let slugs = TRENDING_FEATURED_SLUGS;
  let autoPin = true;
  let autoPinLimit = 5;

  try {
    const config = getSiteConfig();
    if (config.featuredSlugs && config.featuredSlugs.length > 0) {
      slugs = config.featuredSlugs;
    }
    if (typeof config.autoPinNewMovies === "boolean") {
      autoPin = config.autoPinNewMovies;
    }
    if (typeof config.autoPinLimit === "number") {
      autoPinLimit = config.autoPinLimit;
    }
  } catch {}

  const memKey = `featured-v9:${slugs.join(",")}:${autoPin}:${autoPinLimit}`;
  return withMemCache(memKey, 1800_000, async () => {
    try {
      let extraSlugs: string[] = [];
      if (autoPin) {
        try {
          const newMovies = await getCachedNewUpdates();
          if (Array.isArray(newMovies) && newMovies.length > 0) {
            extraSlugs = newMovies
              .map((m: any) => m?.slug)
              .filter((s: string) => Boolean(s) && !slugs.includes(s))
              .slice(0, autoPinLimit);
          }
        } catch {}
      }

      const combinedSlugs = Array.from(new Set([...slugs, ...extraSlugs])).slice(0, 8);
      const spiderPos = combinedSlugs.indexOf("nguoi-nhen-khoi-dau-moi");
      if (spiderPos > 0) {
        combinedSlugs.splice(spiderPos, 1);
        combinedSlugs.unshift("nguoi-nhen-khoi-dau-moi");
      } else if (spiderPos === -1) {
        combinedSlugs.unshift("nguoi-nhen-khoi-dau-moi");
      }

      const results = await Promise.allSettled(
        combinedSlugs.map((slug) => api.get(slug))
      );
      const movies = results
        .filter((r): r is PromiseFulfilledResult<{ movie: any; server: any[] }> => r.status === "fulfilled" && Boolean(r.value?.movie))
        .map((r) => r.value.movie);

      const spiderIdx = movies.findIndex((m: any) => m?.slug === "nguoi-nhen-khoi-dau-moi");
      if (spiderIdx > 0) {
        const [spider] = movies.splice(spiderIdx, 1);
        movies.unshift(spider);
      }

      return movies.length > 0 ? filterHiddenMovies(movies).map(slimHeroMovie) : [];
    } catch {
      return [];
    }
  });
};

/** Single featured movie fallback */
export const getCachedFeaturedMovie = async () => {
  const movies = await getCachedFeaturedMovies();
  return movies[0] || null;
};

/** New updates cached 60 seconds for instant fresh movies - Multi-page deep fetch */
export const getCachedNewUpdates = () =>
  withMemCache("new-updates-v6", 60_000, async () => {
    try {
      const [movies] = await api.newAddingMultiPage(2, 24);
      return filterHiddenMovies((movies as any[]) ?? []).slice(0, 24).map(slimCardMovie);
    } catch {
      return [];
    }
  });

/** Topic movies cached 1h */
export const getCachedTopicMovies = (slug: string, limit: number = 12) =>
  withMemCache(`topic-movies-v2:${slug}:${limit}`, 3600_000, async () => {
    try {
      const items = await api.getTopicItems(slug, limit);
      return filterHiddenMovies(items || []).map(slimCardMovie);
    } catch {
      return [];
    }
  });

export type RankingPeriod = "day" | "week" | "month" | "views" | "rating";

export interface RankingMovieItem {
  _id: string;
  name: string;
  slug: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  quality?: string;
  time?: string;
  episode_current?: string;
  lang?: string;
  category?: Array<{ id?: string; name: string; slug: string }>;
  country?: Array<{ id?: string; name: string; slug: string }>;
  tmdb?: {
    id?: string;
    type?: string;
    vote_average?: number;
    vote_count?: number;
  };
  imdb?: {
    id?: string;
    vote_average?: number;
    vote_count?: number;
  };
  view?: number;
  type?: string;
}

export interface AllRankingsData {
  day: RankingMovieItem[];
  week: RankingMovieItem[];
  month: RankingMovieItem[];
  views: RankingMovieItem[];
  rating: RankingMovieItem[];
}

/** All 5 Rankings cached for 15 minutes */
export const getCachedAllRankings = (): Promise<AllRankingsData> =>
  withMemCache(
    "all-rankings-v1",
    900_000,
    async (): Promise<AllRankingsData> => {
    try {
      const [
        [newItems],
        [boViews],
        [leViews],
        [chieuRap],
        featured,
      ] = await Promise.all([
        api.newAdding(1).catch(() => [[], null]),
        api.getFilteredList({ typeList: "phim-bo", sortField: "view", sortType: "desc", limit: 20 }).catch(() => [[], null]),
        api.getFilteredList({ typeList: "phim-le", sortField: "view", sortType: "desc", limit: 20 }).catch(() => [[], null]),
        api.getFilteredList({ typeList: "phim-chieu-rap", sortField: "modified.time", sortType: "desc", limit: 16 }).catch(() => [[], null]),
        getCachedFeaturedMovies().catch(() => []),
      ]);

      const safeNew = newItems || [];
      const safeBo = boViews || [];
      const safeLe = leViews || [];
      const safeRap = chieuRap || [];
      const safeFeat = featured || [];

      const dedupe = (items: any[]): RankingMovieItem[] => {
        const seen = new Set<string>();
        const res: RankingMovieItem[] = [];
        for (const item of items) {
          if (item?.slug && !seen.has(item.slug)) {
            seen.add(item.slug);
            res.push(item);
          }
        }
        return res;
      };

      // 1. Top Lượt Xem
      const viewsList = dedupe([...safeBo, ...safeLe, ...safeRap]);

      // 2. Top Đánh Giá: sorted by tmdb.vote_average desc
      const allForRating = dedupe([...viewsList, ...safeNew, ...safeFeat]);
      const ratingList = [...allForRating]
        .filter((m) => (m.tmdb?.vote_average || 0) >= 6.5 || (m.imdb?.vote_average || 0) >= 6.5)
        .sort((a, b) => {
          const scoreB = b.tmdb?.vote_average || b.imdb?.vote_average || 0;
          const scoreA = a.tmdb?.vote_average || a.imdb?.vote_average || 0;
          return scoreB - scoreA;
        });

      // 3. Top Phim Ngày: featured blockbusters + today's latest updates
      const dayList = dedupe([...safeFeat, ...safeNew, ...safeRap]);

      // 4. Top Phim Tuần: top series & movies with strong activity
      const weekList = dedupe([...safeRap, ...safeBo.slice(0, 10), ...safeLe.slice(0, 10), ...safeFeat]);

      // 5. Top Phim Tháng: popular cinema & major series
      const monthList = dedupe([...safeBo, ...safeRap, ...safeLe]);

      return {
        day: dayList.slice(0, 20),
        week: weekList.slice(0, 20),
        month: monthList.slice(0, 20),
        views: viewsList.slice(0, 20),
        rating: ratingList.slice(0, 20),
      };
      } catch (err) {
        console.error("Failed to fetch rankings:", err);
        return { day: [], week: [], month: [], views: [], rating: [] };
      }
    },
    (val) => !val || val.day.length === 0
  );

/** Filtered/Topic movies cached for 10 minutes - instant SSR */
export const getCachedFilteredMovies = async (params: {
  typeList?: string;
  category?: string;
  topic?: string;
  country?: string;
  year?: string | number;
  page?: number;
  sortField?: string;
  sortType?: string;
  sortLang?: string;
  limit?: number;
}) => {
  const {
    typeList,
    category,
    topic,
    country,
    year,
    page = 1,
    sortField = "modified.time",
    sortType = "desc",
    sortLang = "vietsub",
    limit = 20,
  } = params;

  const cacheKey = `filter_${typeList || ""}_${category || ""}_${topic || ""}_${country || ""}_${year || ""}_p${page}_sf${sortField}_st${sortType}_l${limit}`;

  return withMemCache(
    cacheKey,
    600_000,
    async () => {
      try {
        let rawItems: any[] = [];
        let rawPagination: any = null;
        if (typeList) {
          const [items, pagination] = await api.getFilteredList({
            typeList,
            page,
            sortField,
            sortType,
            sortLang,
            category,
            country,
            year,
            limit,
          });
          rawItems = items || [];
          rawPagination = pagination || null;
        } else if (category) {
          const [items, pagination] = await api.byCategory(category, page);
          rawItems = items || [];
          rawPagination = pagination || null;
        } else if (country) {
          const [items, pagination] = await api.byCountry(country, page);
          rawItems = items || [];
          rawPagination = pagination || null;
        } else if (year) {
          const [items, pagination] = await api.byYear(year, page);
          rawItems = items || [];
          rawPagination = pagination || null;
        } else if (topic) {
          const [items, pagination] = await api.byTopic(topic, page);
          rawItems = items || [];
          rawPagination = pagination || null;
        } else {
          const [items, pagination] = await api.newAdding(page);
          rawItems = items || [];
          rawPagination = pagination || null;
        }
        return { items: filterHiddenMovies(rawItems).map(slimCardMovie), pagination: rawPagination };
      } catch (err) {
        console.warn("Failed to fetch filtered movies in getCachedFilteredMovies:", err);
        return { items: [], pagination: null };
      }
    },
    (val) => !val || val.items.length === 0
  );
};

