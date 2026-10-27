"use client";

/**
 * useLocalStorage — Unified localStorage hook với migration từ key cũ
 * Đảm bảo không mất favorites, history, progress từ hai project cũ
 */

import { useState, useEffect, useCallback } from "react";
import type { WatchHistoryItem, FavoriteItem, WatchProgress, UserPreferences } from "@/lib/types";

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

// Keys cũ từ hai project trước — dùng để migrate
const LEGACY_KEYS = {
  // Từ rapphimchill-main-main
  HISTORY_V1: "recentlyWatched",
  FAVORITES_V1: "watchlist",
  PROGRESS_V1_PREFIX: "lastEpisodeTime_",
  // Từ phimanh-pro2-main
  HISTORY_V2: "watchHistory",
  FAVORITES_V2: "favorites",
} as const;

// ============================================================
// SAFE STORAGE HELPERS
// ============================================================

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
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

// ============================================================
// DATA MIGRATION
// ============================================================

function migrateHistoryFromLegacy(): WatchHistoryItem[] {
  const already = safeGetItem(STORAGE_KEYS.HISTORY);
  if (already) return safeParseJSON<WatchHistoryItem[]>(already, []);

  let merged: WatchHistoryItem[] = [];

  // Từ rapphimchill-main-main (recentlyWatched)
  const v1Data = safeParseJSON<any[]>(safeGetItem(LEGACY_KEYS.HISTORY_V1), []);
  const v1Items: WatchHistoryItem[] = v1Data.map((item: any) => ({
    slug: item.slug || "",
    name: item.name || "",
    thumb_url: item.thumb_url || item.thumbUrl || "",
    currentTime: item.currentTime || 0,
    duration: item.duration || 0,
    episodeName: item.episodeName || item.episode_name,
    episodeSlug: item.episodeSlug || item.episode_slug,
    watchedAt: item.watchedAt || item.timestamp || Date.now(),
  })).filter(i => i.slug);

  // Từ phimanh-pro2-main (watchHistory)
  const v2Data = safeParseJSON<any[]>(safeGetItem(LEGACY_KEYS.HISTORY_V2), []);
  const v2Items: WatchHistoryItem[] = v2Data.map((item: any) => ({
    slug: item.slug || "",
    name: item.name || "",
    thumb_url: item.thumb_url || item.thumbUrl || "",
    currentTime: item.currentTime || 0,
    duration: item.duration || 0,
    episodeName: item.episodeName || item.episode_name,
    episodeSlug: item.episodeSlug || item.episode_slug,
    watchedAt: item.watchedAt || item.timestamp || Date.now(),
  })).filter(i => i.slug);

  // Merge: v2 + v1, dedup by slug, sort by time desc
  const slugSet = new Set<string>();
  for (const item of [...v2Items, ...v1Items]) {
    if (!slugSet.has(item.slug)) {
      slugSet.add(item.slug);
      merged.push(item);
    }
  }
  merged.sort((a, b) => b.watchedAt - a.watchedAt);
  merged = merged.slice(0, 50);

  if (merged.length > 0) {
    safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
  }

  return merged;
}

function migrateFavoritesFromLegacy(): FavoriteItem[] {
  const already = safeGetItem(STORAGE_KEYS.FAVORITES);
  if (already) return safeParseJSON<FavoriteItem[]>(already, []);

  let merged: FavoriteItem[] = [];

  // Từ rapphimchill-main-main (watchlist)
  const v1Data = safeParseJSON<any[]>(safeGetItem(LEGACY_KEYS.FAVORITES_V1), []);
  const v1Items: FavoriteItem[] = v1Data.map((item: any) => ({
    slug: item.slug || "",
    name: item.name || "",
    thumb_url: item.thumb_url || item.thumbUrl || "",
    year: item.year,
    quality: item.quality,
    episode_current: item.episode_current,
    addedAt: item.addedAt || item.timestamp || Date.now(),
  })).filter(i => i.slug);

  // Từ phimanh-pro2-main (favorites)
  const v2Data = safeParseJSON<any[]>(safeGetItem(LEGACY_KEYS.FAVORITES_V2), []);
  const v2Items: FavoriteItem[] = v2Data.map((item: any) => ({
    slug: item.slug || "",
    name: item.name || "",
    thumb_url: item.thumb_url || item.thumbUrl || "",
    year: item.year,
    quality: item.quality,
    episode_current: item.episode_current,
    addedAt: item.addedAt || item.timestamp || Date.now(),
  })).filter(i => i.slug);

  const slugSet = new Set<string>();
  for (const item of [...v1Items, ...v2Items]) {
    if (!slugSet.has(item.slug)) {
      slugSet.add(item.slug);
      merged.push(item);
    }
  }
  merged.sort((a, b) => b.addedAt - a.addedAt);

  if (merged.length > 0) {
    safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(merged));
  }

  return merged;
}

// ============================================================
// IN-MEMORY SINGLETON CACHES (Zero-cost lookups & zero lag)
// ============================================================

let globalHistoryCache: WatchHistoryItem[] | null = null;
const historyListeners = new Set<(items: WatchHistoryItem[]) => void>();

function getGlobalHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  if (globalHistoryCache !== null) return globalHistoryCache;
  globalHistoryCache = migrateHistoryFromLegacy();
  return globalHistoryCache;
}

function setGlobalHistory(updated: WatchHistoryItem[]) {
  globalHistoryCache = updated;
  safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  historyListeners.forEach(l => l(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
}

let globalFavoritesCache: FavoriteItem[] | null = null;
let globalFavoriteSlugs = new Set<string>();
const favoriteListeners = new Set<(items: FavoriteItem[]) => void>();

function getGlobalFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  if (globalFavoritesCache !== null) return globalFavoritesCache;
  globalFavoritesCache = migrateFavoritesFromLegacy();
  globalFavoriteSlugs = new Set(globalFavoritesCache.map(f => f.slug));
  return globalFavoritesCache;
}

function setGlobalFavorites(updated: FavoriteItem[]) {
  globalFavoritesCache = updated;
  globalFavoriteSlugs = new Set(updated.map(f => f.slug));
  safeSetItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  favoriteListeners.forEach(l => l(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
}

// Single cross-tab synchronization listener
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key || e.key === STORAGE_KEYS.FAVORITES) {
      const stored = safeParseJSON<FavoriteItem[]>(safeGetItem(STORAGE_KEYS.FAVORITES), []);
      globalFavoritesCache = stored;
      globalFavoriteSlugs = new Set(stored.map(f => f.slug));
      favoriteListeners.forEach(l => l(stored));
    }
    if (!e.key || e.key === STORAGE_KEYS.HISTORY) {
      const stored = safeParseJSON<WatchHistoryItem[]>(safeGetItem(STORAGE_KEYS.HISTORY), []);
      globalHistoryCache = stored;
      historyListeners.forEach(l => l(stored));
    }
  });
}

// ============================================================
// WATCH HISTORY HOOK
// ============================================================

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

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, "watchedAt">): WatchHistoryItem[] => {
    const current = getGlobalHistory();
    const existing = current.find(h => h.slug === item.slug);

    // Merge: preserve existing playback progress if incoming item is just a basic shell
    const mergedItem: WatchHistoryItem = {
      ...existing,
      ...item,
      episodeIndex: item.episodeIndex !== undefined ? item.episodeIndex : existing?.episodeIndex,
      episodeName: item.episodeName || existing?.episodeName,
      episodeSlug: item.episodeSlug || existing?.episodeSlug,
      serverIndex: item.serverIndex !== undefined ? item.serverIndex : existing?.serverIndex,
      currentTime: (item.currentTime && item.currentTime > 0) ? item.currentTime : (existing?.currentTime || 0),
      duration: (item.duration && item.duration > 0) ? item.duration : (existing?.duration || 0),
      watchedAt: Date.now(),
    };

    const filtered = current.filter(h => h.slug !== item.slug);
    const updated = [mergedItem, ...filtered].slice(0, 50);
    setGlobalHistory(updated);
    return updated;
  }, []);

  const updateHistoryProgress = useCallback((
    slug: string,
    progress: {
      episodeIndex?: number;
      episodeName?: string;
      episodeSlug?: string;
      serverIndex?: number;
      currentTime: number;
      duration?: number;
    }
  ): WatchHistoryItem[] => {
    const current = getGlobalHistory();
    const existing = current.find(h => h.slug === slug);
    if (!existing) return current;

    const updatedItem: WatchHistoryItem = {
      ...existing,
      ...progress,
      episode_current: progress.episodeName || existing.episode_current,
      watchedAt: Date.now(),
    };

    const filtered = current.filter(h => h.slug !== slug);
    const updated = [updatedItem, ...filtered].slice(0, 50);
    setGlobalHistory(updated);
    return updated;
  }, []);

  const removeFromHistory = useCallback((slug: string): WatchHistoryItem[] => {
    const current = getGlobalHistory();
    const updated = current.filter(h => h.slug !== slug);
    setGlobalHistory(updated);
    return updated;
  }, []);

  const clearHistory = useCallback(() => {
    safeRemoveItem(STORAGE_KEYS.HISTORY);
    setGlobalHistory([]);
  }, []);

  const batchUpdateHistory = useCallback((patches: (Partial<WatchHistoryItem> & { slug: string })[]) => {
    const current = getGlobalHistory();
    let changed = false;
    const updated = current.map(item => {
      const patch = patches.find(p => p.slug === item.slug);
      if (!patch) return item;
      changed = true;
      return { ...item, ...patch };
    });
    if (changed) {
      setGlobalHistory(updated);
    }
  }, []);

  return { history, addToHistory, updateHistoryProgress, removeFromHistory, clearHistory, batchUpdateHistory, hydrated };
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
    const current = getGlobalFavorites();
    if (globalFavoriteSlugs.has(item.slug)) return current;
    const newItem: FavoriteItem = { ...item, addedAt: Date.now() };
    const updated = [newItem, ...current];
    setGlobalFavorites(updated);
    return updated;
  }, []);

  const removeFavorite = useCallback((slug: string): FavoriteItem[] => {
    const current = getGlobalFavorites();
    const updated = current.filter(f => f.slug !== slug);
    setGlobalFavorites(updated);
    return updated;
  }, []);

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">): FavoriteItem[] => {
    const current = getGlobalFavorites();
    const exists = globalFavoriteSlugs.has(item.slug);
    let updated: FavoriteItem[];
    if (exists) {
      updated = current.filter(f => f.slug !== item.slug);
    } else {
      updated = [{ ...item, addedAt: Date.now() }, ...current];
    }
    setGlobalFavorites(updated);
    return updated;
  }, []);

  const isFavorite = useCallback(
    (slug: string) => globalFavoriteSlugs.has(slug),
    []
  );

  const clearFavorites = useCallback(() => {
    safeRemoveItem(STORAGE_KEYS.FAVORITES);
    setGlobalFavorites([]);
  }, []);

  const batchUpdateFavorites = useCallback((patches: (Partial<FavoriteItem> & { slug: string })[]) => {
    const current = getGlobalFavorites();
    let changed = false;
    const updated = current.map(item => {
      const patch = patches.find(p => p.slug === item.slug);
      if (!patch) return item;
      changed = true;
      return { ...item, ...patch };
    });
    if (changed) {
      setGlobalFavorites(updated);
    }
  }, []);

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite, clearFavorites, batchUpdateFavorites, hydrated };
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
    // Kiểm tra key mới trước, rồi legacy key
    if (all[movieSlug]) return all[movieSlug];

    // Legacy format từ rapphimchill-main-main
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
    setPreferences(prev => {
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
  const [value, setValue] = useState<T>(() => {
    return defaultValue;
  });
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
      setValue(prev => {
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
  }, [key, defaultValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, set, remove, hydrated] as const;
}

// Helper: get favorites (for server-agnostic use)
export function getFavoriteMovies(): FavoriteItem[] {
  return safeParseJSON<FavoriteItem[]>(safeGetItem(STORAGE_KEYS.FAVORITES), []);
}

// Helper: get history (for server-agnostic use)
export function getWatchHistory(): WatchHistoryItem[] {
  return safeParseJSON<WatchHistoryItem[]>(safeGetItem(STORAGE_KEYS.HISTORY), []);
}
