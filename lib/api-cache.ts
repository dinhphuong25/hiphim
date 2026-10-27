/**
 * Simple in-memory cache with TTL support for API requests
 * Optimized with LRU eviction and memory management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTTL = 60000; // 1 minute default
  private maxSize = 100; // Max cache entries
  private maxMemoryMB = 50; // Max memory in MB

  /**
   * Get cached data if valid, otherwise return null
   * Updates access statistics for LRU
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access stats for LRU eviction
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data as T;
  }

  /**
   * Set cache with optional TTL
   * Automatically evicts old entries if size exceeds limit
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    
    // Evict LRU entries if size exceeds limit
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 1,
      lastAccessed: now,
    });
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score = accessCount / age (lower = older, less accessed)
      const age = Date.now() - entry.lastAccessed;
      const score = entry.accessCount / (age / 1000 + 1);
      
      if (score < minScore) {
        minScore = score;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries and return count
   */
  clearExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Deduplicate concurrent requests - if same request is in-flight, reuse it
   * Prevents thundering herd problem
   */
  async dedupeRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new request promise
    const request = fetcher()
      .catch((error) => {
        // Clean up on error so retries can happen
        this.pendingRequests.delete(key);
        throw error;
      })
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Fetch with cache - returns cached data if valid, otherwise fetches and caches
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Dedupe and fetch
    const data = await this.dedupeRequest(key, fetcher);
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }
}

// Singleton instance
export const apiCache = new ApiCache();

/**
 * Debounce function for search and other inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for scroll and resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
