"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserAuth } from "@/context/user-auth-context";

export interface ContinueWatchingItem {
  slug: string;
  name: string;
  poster_url?: string;
  thumb_url?: string;
  serverIndex: number;
  episodeIndex: number;
  episodeName?: string;
  currentTime: number;
  duration: number;
  timestamp: number;
}

export function useContinueWatching() {
  const { user, updateServerData } = useUserAuth();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);

  // Load and merge continue watching items whenever user or user.history changes
  useEffect(() => {
    // If not logged in, continue watching is completely empty
    if (!user || !user.id) {
      setItems([]);
      return;
    }

    const userKey = `continue_watching_${user.id}`;
    let savedList: ContinueWatchingItem[] = [];

    try {
      const raw = localStorage.getItem(userKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) savedList = parsed;
      }
    } catch (e) {
      console.error("Error reading continue watching data:", e);
    }

    // Populate / merge from user.history for this specific account
    if (Array.isArray(user.history) && user.history.length > 0) {
      const historyItems: ContinueWatchingItem[] = user.history
        .filter((h: any) => {
          const time = Number(h.currentTime) || 0;
          const dur = Number(h.duration) || 0;
          // Must have been watched more than 5s and not completed (> dur - 15s)
          if (time < 5) return false;
          if (dur > 0 && time >= dur - 15) return false;
          return true;
        })
        .map((h: any) => ({
          slug: h.slug,
          name: h.name,
          poster_url: h.poster_url || "",
          thumb_url: h.thumb_url || "",
          serverIndex: Number(h.serverIndex) || 0,
          episodeIndex: Number(h.episodeIndex) || 0,
          episodeName: h.episodeName || (typeof h.episodeIndex === "number" ? `Tập ${h.episodeIndex + 1}` : undefined),
          currentTime: Number(h.currentTime) || 0,
          duration: Number(h.duration) || 0,
          timestamp: Number(h.watchedAt) || Date.now(),
        }));

      const existingMap = new Map(savedList.map((i) => [i.slug, i]));
      for (const hItem of historyItems) {
        if (!existingMap.has(hItem.slug)) {
          savedList.push(hItem);
          existingMap.set(hItem.slug, hItem);
        } else {
          // If history has more recent or positive progress, merge it
          const current = existingMap.get(hItem.slug)!;
          if (hItem.timestamp > current.timestamp || (current.currentTime <= 0 && hItem.currentTime > 0)) {
            current.currentTime = hItem.currentTime;
            current.duration = hItem.duration || current.duration;
            current.episodeIndex = hItem.episodeIndex;
            current.episodeName = hItem.episodeName || current.episodeName;
            current.timestamp = hItem.timestamp;
          }
        }
      }
    }

    // Sort by timestamp desc and limit to 15 items
    savedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const finalItems = savedList.slice(0, 15);
    setItems(finalItems);
    try {
      localStorage.setItem(userKey, JSON.stringify(finalItems));
    } catch {}

    // Listen for storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === userKey) {
        try {
          const stored = localStorage.getItem(userKey);
          if (stored) setItems(JSON.parse(stored));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user]);

  const updateProgress = useCallback((item: Omit<ContinueWatchingItem, "timestamp">) => {
    if (!user || !user.id) return;
    const userKey = `continue_watching_${user.id}`;

    setItems((prev) => {
      const filtered = prev.filter((i) => i.slug !== item.slug);

      // If watched more than 95% of duration or within last 15 seconds, consider done and remove
      if (item.duration > 0 && item.currentTime >= item.duration - 15) {
        try {
          localStorage.setItem(userKey, JSON.stringify(filtered));
          window.dispatchEvent(new Event("storage"));
        } catch {}
        return filtered;
      }

      // Only track if watched more than 5 seconds
      if (item.currentTime < 5) return prev;

      const newItem: ContinueWatchingItem = { ...item, timestamp: Date.now() };
      const updated = [newItem, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(userKey, JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch {}
      return updated;
    });
  }, [user]);

  const removeItem = useCallback((slug: string) => {
    if (!user || !user.id) return;
    const userKey = `continue_watching_${user.id}`;

    setItems((prev) => {
      const updated = prev.filter((i) => i.slug !== slug);
      try {
        localStorage.setItem(userKey, JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch {}
      return updated;
    });

    // Also update server data / history so it doesn't reappear on page reload
    if (Array.isArray(user.history)) {
      const updatedHistory = user.history.map((h: any) => {
        if (h.slug === slug) {
          return { ...h, currentTime: 0 };
        }
        return h;
      });
      updateServerData({ history: updatedHistory });
    }
  }, [user, updateServerData]);

  return {
    items,
    updateProgress,
    removeItem,
    isAuthenticated: !!user,
  };
}
