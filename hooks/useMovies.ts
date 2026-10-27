"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheItem<any>>();
const CACHE_TTL = 60000; // 60 seconds

interface UseMoviesOptions {
    refreshInterval?: number; // in milliseconds
    enabled?: boolean;
    cacheKey?: string;
}

interface UseMoviesReturn<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    lastUpdated: Date | null;
    isRefreshing: boolean;
}

export function useMovies<T>(
    fetchFn: () => Promise<T>,
    options: UseMoviesOptions = {}
): UseMoviesReturn<T> {
    const {
        refreshInterval = 60000, // Default: 60 seconds
        enabled = true,
        cacheKey,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!enabled) return;

        // Check cache first
        if (cacheKey && !isRefresh) {
            const cached = cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                setData(cached.data);
                setLoading(false);
                setLastUpdated(new Date(cached.timestamp));
                return;
            }
        }

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const result = await fetchFn();

            if (isMounted.current) {
                setData(result);
                setLastUpdated(new Date());

                // Update cache
                if (cacheKey) {
                    cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now(),
                    });
                }
            }
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error("Failed to fetch data"));
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [enabled, cacheKey, fetchFn]);

    const refresh = useCallback(async () => {
        await fetchData(true);
    }, [fetchData]);

    // Initial fetch
    useEffect(() => {
        isMounted.current = true;
        fetchData();

        return () => {
            isMounted.current = false;
        };
    }, [fetchData]);

    // Auto-refresh interval
    useEffect(() => {
        if (!enabled || refreshInterval <= 0) return;

        intervalRef.current = setInterval(() => {
            // Only refresh if document is visible
            if (document.visibilityState === "visible") {
                fetchData(true);
            }
        }, refreshInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, refreshInterval, fetchData]);

    // Visibility change handler - refresh when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && lastUpdated) {
                const timeSinceUpdate = Date.now() - lastUpdated.getTime();
                // Refresh if more than the interval has passed
                if (timeSinceUpdate > refreshInterval) {
                    fetchData(true);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [lastUpdated, refreshInterval, fetchData]);

    return {
        data,
        loading,
        error,
        refresh,
        lastUpdated,
        isRefreshing,
    };
}

// Hook for auto-refresh countdown
export function useAutoRefreshCountdown(
    intervalMs: number,
    onRefresh: () => void
) {
    const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
        Math.floor(intervalMs / 1000)
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsUntilRefresh((prev) => {
                if (prev <= 1) {
                    onRefresh();
                    return Math.floor(intervalMs / 1000);
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [intervalMs, onRefresh]);

    return secondsUntilRefresh;
}

// Clear cache utility
export function clearMoviesCache() {
    cache.clear();
}

// Clear specific cache key
export function invalidateCache(key: string) {
    cache.delete(key);
}
