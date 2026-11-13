"use client";

/**
 * useLocalStorage — Unified Watch History & Favorites state management
 * Real-time in-memory singleton cache synchronized with localStorage & UserAuthContext
 */

import { useState, useEffect, useCallback } from "react";
import type { WatchHistoryItem, FavoriteItem, WatchProgress, UserPreferences } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/image-helper";

// ============================================================
// KEY CONSTANTS
// ============================================================

export const STORAGE_KEYS = {
  HISTORY: "rpc_history",
  FAVORITES: "rpc_favorites",
  PROGRESS: "rpc_progress",
  PREFERENCES: "rpc_preferences",
  THEME: "rpc_theme",
} as const;

const LEGACY_KEYS = [
  "recentlyWatched",
  "watchlist",
  "watchHistory",
  "favorites",
] as const;

// ============================================================
// SAFE STORAGE HELPERS
// ============================================================

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined") return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch {}
}

function safeParseJSON<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function sanitizeHistoryList(rawList: any[]): WatchHistoryItem[] {
  if (!Array.isArray(rawList)) return [];
  const map = new Map<string, WatchHistoryItem>();

  for (const raw of rawList) {
    const slug = (raw?.slug || raw?.movieSlug || "").trim();
    if (!slug) continue;

    const existing = map.get(slug);
    const incomingTime = Number(raw.watchedAt || raw.timestamp || 0);
    const existingTime = existing ? Number(existing.watchedAt || 0) : 0;

    const normalized: WatchHistoryItem = {
      slug,
      name: raw.name || existing?.name || slug,
      origin_name: raw.origin_name || existing?.origin_name || "",
      thumb_url: normalizeImageUrl(raw.thumb_url || raw.thumbUrl || existing?.thumb_url || ""),
      poster_url: normalizeImageUrl(raw.poster_url || raw.posterUrl || existing?.poster_url || ""),
      year: typeof raw.year === "string" ? parseInt(raw.year, 10) || existing?.year : (raw.year ?? existing?.year),
      quality: raw.quality || existing?.quality || "FHD",
      episode_current: raw.episode_current || existing?.episode_current,
      episodeIndex: typeof raw.episodeIndex === "number" ? raw.episodeIndex : existing?.episodeIndex,
      episodeName: raw.episodeName || raw.episode_name || existing?.episodeName,
      episodeSlug: raw.episodeSlug || raw.episode_slug || existing?.episodeSlug,
      serverIndex: typeof raw.serverIndex === "number" ? raw.serverIndex : (existing?.serverIndex ?? 0),
      currentTime:
        Number(raw.currentTime) > 0
          ? Number(raw.currentTime)
          : (existing && (raw.episodeIndex === undefined || raw.episodeIndex === existing.episodeIndex)
              ? Number(existing.currentTime) || 0
              : 0),
      duration:
        Number(raw.duration) > 0
          ? Number(raw.duration)
          : (existing && (raw.episodeIndex === undefined || raw.episodeIndex === existing.episodeIndex)
              ? Number(existing.duration) || 0
              : 0),
      watchedAt: Math.max(incomingTime, existingTime) || Date.now(),
      tmdb: raw.tmdb?.vote_average ? raw.tmdb : existing?.tmdb,
      imdb: (raw.imdb?.rating || raw.imdb?.vote_average)
        ? { rating: Number(raw.imdb.rating || raw.imdb.vote_average) }
        : existing?.imdb,
    };

    if (!existing || incomingTime >= existingTime) {
      map.set(slug, normalized);
    } else {
      map.set(slug, {
        ...normalized,
        ...existing,
        origin_name: existing.origin_name || normalized.origin_name,
        poster_url: existing.poster_url || normalized.poster_url,
        thumb_url: existing.thumb_url || normalized.thumb_url,
        currentTime: Number(existing.currentTime) > 0 ? existing.currentTime : normalized.currentTime,
        duration: Number(existing.duration) > 0 ? existing.duration : normalized.duration,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0))
    .slice(0, 50);
}

function sanitizeFavoritesList(rawList: any[]): FavoriteItem[] {
  if (!Array.isArray(rawList)) return [];
  const map = new Map<string, FavoriteItem>();

  for (const raw of rawList) {
    const slug = (raw?.slug || raw?.movie?.slug || "").trim();
    if (!slug) continue;

    const existing = map.get(slug);
    const addedAt = Number(raw.addedAt || raw.timestamp || existing?.addedAt || Date.now());

    const normalized: FavoriteItem = {
      slug,
      name: raw.name || raw?.movie?.name || existing?.name || slug,
      origin_name: raw.origin_name || raw?.movie?.origin_name || existing?.origin_name || "",
      thumb_url: normalizeImageUrl(
        raw.thumb_url || raw.thumbUrl || raw?.movie?.thumb_url || existing?.thumb_url || ""
      ),
      poster_url: normalizeImageUrl(
        raw.poster_url || raw.posterUrl || raw?.movie?.poster_url || existing?.poster_url || ""
      ),
      year:
        typeof raw.year === "string"
          ? parseInt(raw.year, 10) || existing?.year
          : (raw.year ?? existing?.year),
      quality: raw.quality || existing?.quality || "FHD",
      episode_current: raw.episode_current || existing?.episode_current,
      addedAt,
      tmdb: raw.tmdb?.vote_average ? raw.tmdb : existing?.tmdb,
      imdb: (raw.imdb?.rating || raw.imdb?.vote_average)
        ? { rating: Number(raw.imdb.rating || raw.imdb.vote_average) }
        : existing?.imdb,
    };

    map.set(slug, normalized);
  }

  return Array.from(map.values())
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .slice(0, 200);
}

// ============================================================
// IN-MEMORY SINGLETON CACHES (Zero-cost lookups & zero lag)
// ============================================================

let globalHistoryCache: WatchHistoryItem[] | null = null;
const historyListeners = new Set<(items: WatchHistoryItem[]) => void>();

function getGlobalHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  if (globalHistoryCache !== null) return globalHistoryCache;
  const raw = safeParseJSON<any[]>(safeGetItem(STORAGE_KEYS.HISTORY), []);
  globalHistoryCache = sanitizeHistoryList(raw);
  return globalHistoryCache;
}

function setGlobalHistory(updated: WatchHistoryItem[]) {
  const sanitized = sanitizeHistoryList(updated);
  globalHistoryCache = sanitized;
  safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(sanitized));
  historyListeners.forEach((l) => l(sanitized));
}

export function hydrateGlobalHistory(items: any[]) {
  const sanitized = sanitizeHistoryList(items);
  globalHistoryCache = sanitized;
  if (sanitized.length === 0) {
    safeRemoveItem(STORAGE_KEYS.HISTORY);
    LEGACY_KEYS.forEach((k) => safeRemoveItem(k));
  } else {
    safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(sanitized));
  }
  historyListeners.forEach((l) => l(sanitized));
}

let globalFavoritesCache: FavoriteItem[] | null = null;
let globalFavoriteSlugs = new Set<string>();
const favoriteListeners = new Set<(items: FavoriteItem[]) => void>();

function getGlobalFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  if (globalFavoritesCache !== null) return globalFavoritesCache;
  const raw = safeParseJSON<any[]>(safeGetItem(STORAGE_KEYS.FAVORITES), []);
  globalFavoritesCache = sanitizeFavoritesList(raw);
  globalFavoriteSlugs = new Set(globalFavoritesCache.map((f) => f.slug));
  return globalFavoritesCache;
}

function setGlobalFavorites(updated: FavoriteItem[]) {
  const sanitized = sanitizeFavoritesList(updated);
  globalFavoritesCache = sanitized;
  globalFavoriteSlugs = new Set(sanitized.map((f) => f.slug));
  safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(sanitized));
  favoriteListeners.forEach((l) => l(sanitized));
}

export function hydrateGlobalFavorites(items: any[]) {
  const sanitized = sanitizeFavoritesList(items);
  globalFavoritesCache = sanitized;
  globalFavoriteSlugs = new Set(sanitized.map((f) => f.slug));
  if (sanitized.length === 0) {
    safeRemoveItem(STORAGE_KEYS.FAVORITES);
    LEGACY_KEYS.forEach((k) => safeRemoveItem(k));
  } else {
    safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(sanitized));
  }
  favoriteListeners.forEach((l) => l(sanitized));
}

// Cross-tab synchronization listener (only responds to real cross-tab StorageEvents with a specific key)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEYS.FAVORITES) {
      const stored = sanitizeFavoritesList(safeParseJSON<any[]>(e.newValue, []));
      globalFavoritesCache = stored;
      globalFavoriteSlugs = new Set(stored.map((f) => f.slug));
      favoriteListeners.forEach((l) => l(stored));
    } else if (e.key === STORAGE_KEYS.HISTORY) {
      const stored = sanitizeHistoryList(safeParseJSON<any[]>(e.newValue, []));
      globalHistoryCache = stored;
      historyListeners.forEach((l) => l(stored));
    }
  });
}

// ============================================================
// WATCH HISTORY HOOK
// ============================================================

export function addToHistoryStandalone(item: Omit<WatchHistoryItem, "watchedAt">): WatchHistoryItem[] {
  if (!item?.slug) return getGlobalHistory();
  const current = getGlobalHistory();
  const existing = current.find((h) => h.slug === item.slug);

  const isSameEpisode =
    existing &&
    (item.episodeIndex === undefined ||
      existing.episodeIndex === undefined ||
      item.episodeIndex === existing.episodeIndex);

  const resolvedCurrentTime =
    item.currentTime && item.currentTime > 0
      ? item.currentTime
      : isSameEpisode
      ? existing?.currentTime || 0
      : 0;

  const resolvedDuration =
    item.duration && item.duration > 0
      ? item.duration
      : isSameEpisode
      ? existing?.duration || 0
      : 0;

  const mergedItem: WatchHistoryItem = {
    ...existing,
    ...item,
    thumb_url: normalizeImageUrl(item.thumb_url || existing?.thumb_url || ""),
    poster_url: normalizeImageUrl(item.poster_url || existing?.poster_url || ""),
    origin_name: item.origin_name || existing?.origin_name || "",
    episodeIndex: item.episodeIndex !== undefined ? item.episodeIndex : existing?.episodeIndex,
    episodeName: item.episodeName || existing?.episodeName,
    episodeSlug: item.episodeSlug || existing?.episodeSlug,
    serverIndex: item.serverIndex !== undefined ? item.serverIndex : (existing?.serverIndex ?? 0),
    currentTime: resolvedCurrentTime,
    duration: resolvedDuration,
    watchedAt: Date.now(),
  };

  const filtered = current.filter((h) => h.slug !== item.slug);
  const updated = [mergedItem, ...filtered].slice(0, 50);
  setGlobalHistory(updated);
  return globalHistoryCache || updated;
}

export function updateHistoryProgressStandalone(
  slug: string,
  progress: {
    name?: string;
    origin_name?: string;
    poster_url?: string;
    thumb_url?: string;
    quality?: string;
    year?: number | string;
    tmdb?: { vote_average?: number };
    imdb?: { rating?: number };
    episodeIndex?: number;
    episodeName?: string;
    episodeSlug?: string;
    serverIndex?: number;
    currentTime: number;
    duration?: number;
  }
): WatchHistoryItem[] {
  if (!slug) return getGlobalHistory();
  const current = getGlobalHistory();
  const existing = current.find((h) => h.slug === slug);

  if (!existing && !progress.name) {
    return current;
  }

  const isSameEpisode =
    existing &&
    (progress.episodeIndex === undefined ||
      existing.episodeIndex === undefined ||
      progress.episodeIndex === existing.episodeIndex);

  const resolvedDuration =
    progress.duration && progress.duration > 0
      ? progress.duration
      : isSameEpisode
      ? existing?.duration || 0
      : 0;

  const updatedItem: WatchHistoryItem = {
    ...(existing || {
      slug,
      name: progress.name || slug,
      thumb_url: "",
      currentTime: 0,
      duration: 0,
      watchedAt: Date.now(),
    }),
    ...progress,
    name: progress.name || existing?.name || slug,
    origin_name: progress.origin_name || existing?.origin_name || "",
    thumb_url: normalizeImageUrl(progress.thumb_url || existing?.thumb_url || ""),
    poster_url: normalizeImageUrl(progress.poster_url || existing?.poster_url || ""),
    year:
      typeof progress.year === "string"
        ? parseInt(progress.year, 10) || existing?.year
        : (progress.year ?? existing?.year),
    episode_current: progress.episodeName || existing?.episode_current,
    currentTime:
      progress.currentTime > 0
        ? progress.currentTime
        : isSameEpisode
        ? existing?.currentTime || 0
        : 0,
    duration: resolvedDuration,
    watchedAt: Date.now(),
  };

  const filtered = current.filter((h) => h.slug !== slug);
  const updated = [updatedItem, ...filtered].slice(0, 50);
  setGlobalHistory(updated);
  return globalHistoryCache || updated;
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => getGlobalHistory());
  const [hydrated, setHydrated] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    setHistory(getGlobalHistory());
    setHydrated(true);

    const listener = (newHistory: WatchHistoryItem[]) => {
      setHistory(newHistory);
    };
    historyListeners.add(listener);
    return () => {
      historyListeners.delete(listener);
    };
  }, []);

  const addToHistory = useCallback(addToHistoryStandalone, []);
  const updateHistoryProgress = useCallback(updateHistoryProgressStandalone, []);

  const removeFromHistory = useCallback((slug: string): WatchHistoryItem[] => {
    const current = getGlobalHistory();
    const updated = current.filter((h) => h.slug !== slug);
    setGlobalHistory(updated);
    return globalHistoryCache || updated;
  }, []);

  const clearHistory = useCallback(() => {
    hydrateGlobalHistory([]);
  }, []);

  const batchUpdateHistory = useCallback((patches: (Partial<WatchHistoryItem> & { slug: string })[]) => {
    const current = getGlobalHistory();
    let changed = false;
    const updated = current.map((item) => {
      const patch = patches.find((p) => p.slug === item.slug);
      if (!patch) return item;
      changed = true;
      return {
        ...item,
        ...patch,
        // Never let metadata enrichment overwrite the user's active watched episode or progress
        episodeName: item.episodeName || patch.episodeName,
        episodeIndex: item.episodeIndex !== undefined ? item.episodeIndex : patch.episodeIndex,
        currentTime: item.currentTime > 0 ? item.currentTime : (patch.currentTime || 0),
        duration: item.duration > 0 ? item.duration : (patch.duration || 0),
        watchedAt: item.watchedAt,
      };
    });
    if (changed) {
      setGlobalHistory(updated);
    }
  }, []);

  return {
    history,
    addToHistory,
    updateHistoryProgress,
    removeFromHistory,
    clearHistory,
    batchUpdateHistory,
    hydrated,
  };
}

// ============================================================
// FAVORITES HOOK
// ============================================================

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => getGlobalFavorites());
  const [hydrated, setHydrated] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    setFavorites(getGlobalFavorites());
    setHydrated(true);

    const listener = (newFavs: FavoriteItem[]) => {
      setFavorites(newFavs);
    };
    favoriteListeners.add(listener);
    return () => {
      favoriteListeners.delete(listener);
    };
  }, []);

  const addFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">): FavoriteItem[] => {
    if (!item?.slug) return getGlobalFavorites();
    const current = getGlobalFavorites();
    if (globalFavoriteSlugs.has(item.slug)) return current;
    const newItem: FavoriteItem = {
      ...item,
      thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url || ""),
      poster_url: normalizeImageUrl(item.poster_url || item.thumb_url || ""),
      addedAt: Date.now(),
    };
    const updated = [newItem, ...current];
    setGlobalFavorites(updated);
    return globalFavoritesCache || updated;
  }, []);

  const removeFavorite = useCallback((slug: string): FavoriteItem[] => {
    const current = getGlobalFavorites();
    const updated = current.filter((f) => f.slug !== slug);
    setGlobalFavorites(updated);
    return globalFavoritesCache || updated;
  }, []);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">): FavoriteItem[] => {
    if (!item?.slug) return getGlobalFavorites();
    const current = getGlobalFavorites();
    const exists = globalFavoriteSlugs.has(item.slug);
    let updated: FavoriteItem[];
    if (exists) {
      updated = current.filter((f) => f.slug !== item.slug);
    } else {
      updated = [
        {
          ...item,
          thumb_url: normalizeImageUrl(item.thumb_url || item.poster_url || ""),
          poster_url: normalizeImageUrl(item.poster_url || item.thumb_url || ""),
          addedAt: Date.now(),
        },
        ...current,
      ];
    }
    setGlobalFavorites(updated);
    return globalFavoritesCache || updated;
  }, []);

  const isFavorite = useCallback(
    (slug: string) => Boolean(slug && globalFavoriteSlugs.has(slug)),
    // Subscribe to `favorites` state so components re-render when favorites change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    hydrateGlobalFavorites([]);
  }, []);

  const batchUpdateFavorites = useCallback((patches: (Partial<FavoriteItem> & { slug: string })[]) => {
    const current = getGlobalFavorites();
    let changed = false;
    const updated = current.map((item) => {
      const patch = patches.find((p) => p.slug === item.slug);
      if (!patch) return item;
      changed = true;
      return {
        ...item,
        ...patch,
        addedAt: item.addedAt,
      };
    });
    if (changed) {
      setGlobalFavorites(updated);
    }
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    batchUpdateFavorites,
    hydrated,
  };
}

// ============================================================
// WATCH PROGRESS HOOK
// ============================================================

export function useWatchProgress(slug?: string) {
  const getProgress = useCallback((movieSlug: string): WatchProgress | null => {
    const all = safeParseJSON<Record<string, WatchProgress>>(
      safeGetItem(STORAGE_KEYS.PROGRESS),
      {}
    );
    if (all[movieSlug]) return all[movieSlug];

    const legacyTime = safeGetItem(`lastEpisodeTime_${movieSlug}`);
    const legacyEp = safeGetItem(`lastEpisode_${movieSlug}`);
    if (legacyTime) {
      return {
        slug: movieSlug,
        episodeSlug: legacyEp || "",
        serverIndex: 0,
        currentTime: parseFloat(legacyTime) || 0,
        duration: 0,
        updatedAt: Date.now(),
      };
    }
    return null;
  }, []);

  const saveProgress = useCallback((progress: WatchProgress) => {
    const all = safeParseJSON<Record<string, WatchProgress>>(
      safeGetItem(STORAGE_KEYS.PROGRESS),
      {}
    );
    all[progress.slug] = { ...progress, updatedAt: Date.now() };
    safeSetItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  }, []);

  const clearProgress = useCallback((movieSlug: string) => {
    const all = safeParseJSON<Record<string, WatchProgress>>(
      safeGetItem(STORAGE_KEYS.PROGRESS),
      {}
    );
    delete all[movieSlug];
    safeSetItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
  }, []);

  const currentProgress = slug ? getProgress(slug) : null;

  return { getProgress, saveProgress, clearProgress, currentProgress };
}

// ============================================================
// USER PREFERENCES HOOK
// ============================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  volume: 1,
  playbackRate: 1,
  quality: -1,
  autoplay: true,
  theme: "dark",
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = safeParseJSON<UserPreferences>(
      safeGetItem(STORAGE_KEYS.PREFERENCES),
      DEFAULT_PREFERENCES
    );
    setPreferences(stored);
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { preferences, updatePreferences };
}

// ============================================================
// GENERIC useLocalStorage HOOK
// ============================================================

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = safeGetItem(key);
    if (stored !== null) {
      setValue(safeParseJSON<T>(stored, defaultValue));
    }
    setHydrated(true);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof newValue === "function" ? (newValue as (p: T) => T)(prev) : newValue;
        safeSetItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key]
  );

  const remove = useCallback(() => {
    safeRemoveItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, set, remove, hydrated] as const;
}

export function getFavoriteMovies(): FavoriteItem[] {
  return getGlobalFavorites();
}

export function getWatchHistory(): WatchHistoryItem[] {
  return getGlobalHistory();
}
