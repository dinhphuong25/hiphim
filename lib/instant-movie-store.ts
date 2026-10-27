"use client";

import { filterHiddenMovies } from "@/lib/hidden-movies";

interface CachedMovieList {
  items: any[];
  pagination: any;
  timestamp: number;
}

class InstantMovieStore {
  private cache: Map<string, CachedMovieList> = new Map();
  private inFlight: Map<string, Promise<any>> = new Map();
  private isPrefetchingAll = false;

  public buildKey(params: {
    typeList?: string | null;
    category?: string | null;
    topic?: string | null;
    country?: string | null;
    year?: string | number | null;
    page?: number | string;
    sortField?: string | null;
    sortType?: string | null;
  }): string {
    const p = String(params.page || 1);
    const tl = params.typeList || "";
    const cat = params.category || "";
    const top = params.topic || "";
    const ctry = params.country || "";
    const yr = params.year ? String(params.year) : "";
    const sf = params.sortField || "modified.time";
    const st = params.sortType || "desc";
    return `tl:${tl}|cat:${cat}|top:${top}|ctry:${ctry}|yr:${yr}|p:${p}|sf:${sf}|st:${st}`;
  }

  public get(key: string): { items: any[]; pagination: any } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    // 15 minutes TTL for client memory cache
    if (Date.now() - entry.timestamp > 900_000) {
      this.cache.delete(key);
      return null;
    }
    return { items: entry.items, pagination: entry.pagination };
  }

  public set(key: string, data: { items: any[]; pagination?: any }) {
    this.cache.set(key, {
      items: filterHiddenMovies(data.items || []),
      pagination: data.pagination || null,
      timestamp: Date.now(),
    });
  }

  /**
   * Prime the cache with existing data already on the page (e.g. from HomeClient)
   */
  public prime(mapping: Record<string, any[]>) {
    Object.entries(mapping).forEach(([slug, movies]) => {
      if (Array.isArray(movies) && movies.length > 0) {
        // Prime typeList
        const keyTypeList = this.buildKey({ typeList: slug, page: 1 });
        if (!this.cache.has(keyTypeList)) {
          this.set(keyTypeList, { items: movies });
        }
        // Prime topic
        const keyTopic = this.buildKey({ topic: slug, page: 1 });
        if (!this.cache.has(keyTopic)) {
          this.set(keyTopic, { items: movies });
        }
      }
    });
  }

  /**
   * Prefetch a specific filter or typeList into memory
   */
  public async prefetch(typeList: string, page: number = 1): Promise<void> {
    const key = this.buildKey({ typeList, page });
    if (this.cache.has(key) || this.inFlight.has(key)) return;

    const url = `/api/phim?url=${encodeURIComponent(
      `https://phimapi.com/v1/api/danh-sach/${typeList}?page=${page}&sort_field=modified.time&sort_type=desc&limit=20&sort_lang=vietsub`
    )}`;

    const fetchPromise = (async () => {
      try {
        const res = await fetch(url, { priority: "low" as any });
        if (!res.ok) return;
        const json = await res.json();
        const items = json?.data?.items || json?.items || [];
        const pagination = json?.data?.params?.pagination || json?.pagination || null;
        if (items.length > 0) {
          this.set(key, { items, pagination });
        }
      } catch (err) {
        console.warn("Prefetch error for", typeList, err);
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    await fetchPromise;
  }

  /**
   * Proactively warm up all top tabs in background on page load
   * Deferred until first user interaction or long idle so it does NOT compete with initial render
   */
  public warmUpMainTabs() {
    if (typeof window === "undefined" || this.isPrefetchingAll) return;

    let triggered = false;
    const triggerWarmUp = () => {
      if (triggered || this.isPrefetchingAll) return;
      triggered = true;
      this.isPrefetchingAll = true;

      // Clean up event listeners
      window.removeEventListener("scroll", triggerWarmUp);
      window.removeEventListener("pointerdown", triggerWarmUp);
      window.removeEventListener("touchstart", triggerWarmUp);
      window.removeEventListener("keydown", triggerWarmUp);

      const topTabs = ["phim-chieu-rap", "phim-bo", "phim-le", "hoat-hinh"];
      topTabs.forEach((tab, index) => {
        setTimeout(() => {
          this.prefetch(tab);
        }, index * 250);
      });
    };

    window.addEventListener("scroll", triggerWarmUp, { passive: true, once: true });
    window.addEventListener("pointerdown", triggerWarmUp, { passive: true, once: true });
    window.addEventListener("touchstart", triggerWarmUp, { passive: true, once: true });
    window.addEventListener("keydown", triggerWarmUp, { passive: true, once: true });

    // Fallback after 8 seconds idle (well after Lighthouse audit completes)
    setTimeout(() => {
      if (!triggered) {
        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(triggerWarmUp);
        } else {
          triggerWarmUp();
        }
      }
    }, 8000);
  }
}

export const instantMovieStore = new InstantMovieStore();
