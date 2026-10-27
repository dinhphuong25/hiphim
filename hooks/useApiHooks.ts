"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { apiCache } from "@/lib/api-cache";

interface NewUpdatesData {
    movies: any[];
    heroMovie: any | null;
    topicsWithMovies: any[];
}

const API_BASE = "https://phimapi.com";
const REFRESH_INTERVAL = 60000; // 60s auto-refresh for real-time freshness
const CACHE_TTL = 60000; // 1 minute client-side cache

// Route all fetches through /api/phim proxy for server-side caching
function proxyUrl(url: string): string {
    if (typeof window === "undefined") return url; // SSR: direct fetch
    return `/api/phim?url=${encodeURIComponent(url)}`;
}

async function proxyFetch(url: string, timeoutMs = 5000): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(proxyUrl(url), { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return await res.json();
    } catch (err) {
        clearTimeout(timer);
        // Direct fetch fallback if proxy times out or fails
        try {
            const directRes = await fetch(url);
            if (directRes.ok) return await directRes.json();
        } catch {}
        throw err;
    }
}

// Phim luôn được ghim làm phim nổi bật trên trang chủ
const FEATURED_MOVIE_SLUG = "avatar-lua-va-tro-tan";

// Fetch thông tin phim được ghim để làm hero
async function fetchFeaturedMovie(): Promise<any | null> {
    const cacheKey = `featured-${FEATURED_MOVIE_SLUG}`;
    return apiCache.fetchWithCache(cacheKey, async () => {
        try {
            const data = await proxyFetch(`${API_BASE}/phim/${FEATURED_MOVIE_SLUG}`);
            return data.movie || null;
        } catch {
            return null;
        }
    }, 300000);
}

async function fetchNewUpdates(): Promise<any[]> {
    const cacheKey = "new-updates-deep";
    return apiCache.fetchWithCache(cacheKey, async () => {
        // Deep multi-page parallel fetch (Page 1 + Page 2)
        const [res1, res2] = await Promise.allSettled([
            proxyFetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=30`),
            proxyFetch(`${API_BASE}/danh-sach/phim-moi-cap-nhat-v2?page=2&limit=30`),
        ]);

        const items1 = res1.status === "fulfilled" && Array.isArray(res1.value?.items) ? res1.value.items : [];
        const items2 = res2.status === "fulfilled" && Array.isArray(res2.value?.items) ? res2.value.items : [];
        const rawItems = [...items1, ...items2];

        const cdnDomain = "https://phimimg.com";
        const seen = new Set<string>();
        const normalized: any[] = [];

        for (const item of rawItems) {
            if (item?.slug && !seen.has(item.slug)) {
                seen.add(item.slug);
                normalized.push({
                    ...item,
                    thumb_url: item.thumb_url?.startsWith("http") ? item.thumb_url : `${cdnDomain}/${item.thumb_url?.replace(/^\//, "")}`,
                    poster_url: item.poster_url?.startsWith("http") ? item.poster_url : `${cdnDomain}/${item.poster_url?.replace(/^\//, "")}`,
                });
            }
        }

        return normalized.slice(0, 48);
    }, CACHE_TTL);
}

async function fetchTopicMovies(slug: string, limit: number = 12): Promise<any[]> {
    const cacheKey = `topic-${slug}-${limit}`;
    return apiCache.fetchWithCache(cacheKey, async () => {
        const data = await proxyFetch(`${API_BASE}/v1/api/danh-sach/${slug}?page=1&limit=${limit}`);
        const cdnDomain = data.data?.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";
        const items = data.data?.items || [];
        return items.map((item: any) => ({
            ...item,
            thumb_url: item.thumb_url?.startsWith("http") ? item.thumb_url : `${cdnDomain}/${item.thumb_url}`,
            poster_url: item.poster_url?.startsWith("http") ? item.poster_url : `${cdnDomain}/${item.poster_url}`,
        }));
    }, 120000);
}

export function useNewUpdates(initialMovies: any[] = [], initialHeroMovie: any = null) {
    const [movies, setMovies] = useState<any[]>(() => initialMovies || []);
    const [heroMovie, setHeroMovie] = useState<any | null>(() => initialHeroMovie || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(() => new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        // Prevent duplicate fetches
        if (fetchInProgress.current && !isRefresh) return;
        fetchInProgress.current = true;

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            }

            // Fetch cả phim featured và phim mới cập nhật song song
            const [featuredMovie, newMovies] = await Promise.all([
                fetchFeaturedMovie(),
                fetchNewUpdates()
            ]);

            if (isMounted.current) {
                if (Array.isArray(newMovies) && newMovies.length > 0) {
                    setMovies(newMovies);
                }
                if (featuredMovie || (newMovies && newMovies[0])) {
                    setHeroMovie(featuredMovie || newMovies[0]);
                }
                setLastUpdated(new Date());
                setError(null);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
            }
        } finally {
            fetchInProgress.current = false;
            if (isMounted.current) {
                setLoading(false);
                setIsRefreshing(false);
            }
        }
    }, []);

    const refresh = useCallback(() => {
        // Clear cache before refreshing
        apiCache.delete("new-updates-deep");
        apiCache.delete("new-updates-v2");
        fetchData(true);
    }, [fetchData]);

    // Initial fetch only if initialMovies was empty
    useEffect(() => {
        isMounted.current = true;
        if (!initialMovies || initialMovies.length === 0) {
            fetchData();
        }

        return () => {
            isMounted.current = false;
        };
    }, [fetchData, initialMovies?.length]);

    // Auto-refresh every 60s (1 minute) to continuously fetch newly added episodes / movies
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible" && !fetchInProgress.current) {
                apiCache.delete("new-updates-deep");
                apiCache.delete("new-updates-v2");
                fetchData(true);
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchData]);

    // Refresh on visibility change
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible" && lastUpdated) {
                const elapsed = Date.now() - lastUpdated.getTime();
                if (elapsed > REFRESH_INTERVAL && !fetchInProgress.current) {
                    apiCache.delete("new-updates-deep");
                    apiCache.delete("new-updates-v2");
                    fetchData(true);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [lastUpdated, fetchData]);

    return useMemo(() => ({
        movies,
        heroMovie,
        loading,
        error,
        refresh,
        lastUpdated,
        isRefreshing,
    }), [movies, heroMovie, loading, error, refresh, lastUpdated, isRefreshing]);
}

export function useTopicsWithMovies(topics: any[], initialTopicsWithMovies: any[] = []) {
    const [topicsData, setTopicsData] = useState<any[]>(() => initialTopicsWithMovies || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);

    // Memoize topics string to prevent unnecessary re-fetches
    const topicsKey = useMemo(() => topics.map(t => t.slug).join(','), [topics]);

    const fetchData = useCallback(async () => {
        if (!topics || topics.length === 0 || fetchInProgress.current) {
            setLoading(false);
            return;
        }

        fetchInProgress.current = true;

        try {
            const results = await Promise.all(
                topics.map(async (topic) => {
                    try {
                        const movies = await fetchTopicMovies(topic.slug, 12);
                        return { ...topic, movies };
                    } catch {
                        return { ...topic, movies: [] };
                    }
                })
            );

            if (isMounted.current) {
                setTopicsData(results);
                setError(null);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
            }
        } finally {
            fetchInProgress.current = false;
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [topicsKey]);

    useEffect(() => {
        isMounted.current = true;
        if (!initialTopicsWithMovies || initialTopicsWithMovies.length === 0) {
            fetchData();
        }

        return () => {
            isMounted.current = false;
        };
    }, [fetchData, initialTopicsWithMovies?.length]);

    // Auto-refresh topics every 2 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible" && !fetchInProgress.current) {
                fetchData();
            }
        }, 120000);

        return () => clearInterval(interval);
    }, [fetchData]);

    return useMemo(() => ({ topicsData, loading, error }), [topicsData, loading, error]);
}

export function useSearchMovies(query: string, page: number = 1) {
    const [movies, setMovies] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async () => {
        if (!query) {
            setMovies([]);
            setLoading(false);
            return;
        }

        const cacheKey = `search-${query}-${page}`;

        try {
            setLoading(true);

            const data = await apiCache.fetchWithCache(cacheKey, async () => {
                const res = await fetch(
                    `${API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&limit=20&page=${page}`,
                    {
                        headers: {
                            Referer: "https://phimanh.netlify.app",
                            "User-Agent": "phimanh-bot/1.0",
                        },
                    }
                );

                if (!res.ok) throw new Error("Search failed");
                return res.json();
            }, 60000); // Cache search for 1 minute

            if (isMounted.current) {
                setMovies(data.data?.items || []);
                setPagination(data.data?.params?.pagination || null);
                setError(null);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
                setMovies([]);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [query, page]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();

        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    return useMemo(() => ({ movies, pagination, loading, error }), [movies, pagination, loading, error]);
}

export function useFilteredMovies(params: {
    typeList?: string;
    page?: number;
    sortField?: string;
    sortType?: string;
    category?: string;
    country?: string;
    year?: string;
    limit?: number;
}) {
    const [movies, setMovies] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);

    // Memoize params to prevent unnecessary re-fetches
    const paramsKey = useMemo(() => JSON.stringify(params), [params]);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (fetchInProgress.current && !isRefresh) return;
        fetchInProgress.current = true;

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }

            const {
                typeList = "phim-bo",
                page = 1,
                sortField = "modified.time",
                sortType = "desc",
                category,
                country,
                year,
                limit = 20,
            } = params;

            let url = `${API_BASE}/v1/api/danh-sach/${typeList}?page=${page}&sort_field=${sortField}&sort_type=${sortType}&limit=${limit}`;

            if (category) url += `&category=${category}`;
            if (country) url += `&country=${country}`;
            if (year) url += `&year=${year}`;

            const cacheKey = `filtered-${url}`;

            const data = await apiCache.fetchWithCache(cacheKey, async () => {
                const res = await fetch(url, {
                    headers: {
                        Referer: "https://phimanh.netlify.app",
                        "User-Agent": "phimanh-bot/1.0",
                    },
                });

                if (!res.ok) throw new Error("Failed to fetch filtered movies");
                return res.json();
            }, 60000); // Cache filtered results for 1 minute

            if (isMounted.current) {
                setMovies(data.data?.items || []);
                setPagination(data.data?.params?.pagination || null);
                setError(null);
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
            }
        } finally {
            fetchInProgress.current = false;
            if (isMounted.current) {
                setLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [paramsKey]);

    const refresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    useEffect(() => {
        isMounted.current = true;
        fetchData();

        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    // Auto-refresh every 2 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible" && !fetchInProgress.current) {
                fetchData(true);
            }
        }, 300000);

        return () => clearInterval(interval);
    }, [fetchData]);

    return useMemo(() => ({ 
        movies, pagination, loading, error, refresh, isRefreshing 
    }), [movies, pagination, loading, error, refresh, isRefreshing]);
}
