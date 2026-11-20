/**
 * Cloudflare Edge Cache & KV Adapter (3-Tier Sub-100ms Architecture)
 * - Tier 1 (L1): Isolate In-Memory RAM Cache (~0.1ms) with Stale-While-Revalidate
 * - Tier 2 (L2): Cloudflare Workers Cache API `caches.default` (~2-8ms across all isolates at Edge PoP)
 * - Tier 3 (L3): Cloudflare KV (if bound) + `ctx.waitUntil` non-blocking background revalidation
 */

export interface KVNamespaceLike {
  get(key: string, type?: "text" | "json" | "arrayBuffer"): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface EdgeCacheEnvelope<T> {
  v: T;
  exp: number;
  stale: number;
}

const memoryFallback = new Map<string, { value: any; expiresAt: number; staleUntil: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const MAX_MEM_ENTRIES = 600;

async function getCloudflareExecutionContext(): Promise<{ env?: any; ctx?: { waitUntil?: (p: Promise<any>) => void } } | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    return await getCloudflareContext({ async: true });
  } catch {
    return null;
  }
}

export function runInBackground(promise: Promise<any>): void {
  getCloudflareExecutionContext()
    .then((cf) => {
      if (cf?.ctx && typeof cf.ctx.waitUntil === "function") {
        cf.ctx.waitUntil(promise.catch(() => {}));
      }
    })
    .catch(() => {});
}

function getEdgeCacheStorage(): any | null {
  try {
    const cachesObj = (globalThis as any)?.caches;
    if (cachesObj?.default && typeof cachesObj.default.match === "function") {
      return cachesObj.default;
    }
  } catch {}
  return null;
}

function buildEdgeCacheUrl(key: string): string {
  return `https://edge-cache.hiphim.one/v2/${encodeURIComponent(key)}`;
}

async function getKVBinding(): Promise<KVNamespaceLike | null> {
  try {
    const cf = await getCloudflareExecutionContext();
    const kv = ((cf?.env as Record<string, unknown>)?.HIPHIM_KV ||
      (cf?.env as Record<string, unknown>)?.KV) as KVNamespaceLike | undefined;
    if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
      return kv;
    }
  } catch {}
  return null;
}

function setMemoryEntry<T>(key: string, value: T, expiresAt: number, staleUntil: number): void {
  if (memoryFallback.size >= MAX_MEM_ENTRIES && !memoryFallback.has(key)) {
    const firstKey = memoryFallback.keys().next().value;
    if (firstKey) memoryFallback.delete(firstKey);
  }
  memoryFallback.set(key, { value, expiresAt, staleUntil });
}

async function readFromEdgeCacheApi<T>(key: string): Promise<EdgeCacheEnvelope<T> | null> {
  const edgeCache = getEdgeCacheStorage();
  if (!edgeCache) return null;
  try {
    const req = new Request(buildEdgeCacheUrl(key), { method: "GET" });
    const res = await edgeCache.match(req);
    if (!res || !res.ok) return null;
    const parsed = (await res.json()) as EdgeCacheEnvelope<T>;
    if (parsed && parsed.v !== undefined && typeof parsed.exp === "number") {
      return parsed;
    }
  } catch {}
  return null;
}

async function writeToEdgeCacheApi<T>(
  key: string,
  value: T,
  expiresAt: number,
  staleUntil: number
): Promise<void> {
  const edgeCache = getEdgeCacheStorage();
  if (!edgeCache) return;
  try {
    const now = Date.now();
    const freshSec = Math.max(10, Math.floor((expiresAt - now) / 1000));
    const staleSec = Math.max(freshSec, Math.floor((staleUntil - now) / 1000));
    const envelope: EdgeCacheEnvelope<T> = { v: value, exp: expiresAt, stale: staleUntil };
    const req = new Request(buildEdgeCacheUrl(key), { method: "GET" });
    const res = new Response(JSON.stringify(envelope), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=${ staleSec }, s-maxage=${ staleSec }, stale-while-revalidate=${ staleSec }`,
      },
    });
    await edgeCache.put(req, res);
  } catch {}
}

/**
 * 3-Tier Edge Cache Helper with Stale-While-Revalidate (< 10ms response time at Edge)
 * 1. L1 Isolate Memory Cache (~0.1ms)
 * 2. L2 Cloudflare Edge Cache API `caches.default` (~2-8ms across isolates)
 * 3. Background refresh via Cloudflare `ctx.waitUntil` so users never wait on slow upstream APIs
 */
export async function withEdgeCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  isEmpty?: (val: T) => boolean,
  staleMultiplier: number = 12
): Promise<T> {
  const now = Date.now();
  const mem = memoryFallback.get(key);

  // 1. L1 Memory Fresh Hit (~0.1ms)
  if (mem && now < mem.expiresAt) {
    return mem.value as T;
  }

  const triggerRefresh = (): Promise<T> => {
    let inflight = inFlightRequests.get(key);
    if (!inflight) {
      inflight = fetcher()
        .then((res) => {
          const empty = isEmpty ? isEmpty(res) : Array.isArray(res) && res.length === 0;
          if (!empty && res !== null && res !== undefined) {
            const curNow = Date.now();
            const exp = curNow + ttlMs;
            const stale = curNow + Math.max(ttlMs * staleMultiplier, 3600_000);
            setMemoryEntry(key, res, exp, stale);
            runInBackground(writeToEdgeCacheApi(key, res, exp, stale));
          }
          return res;
        })
        .finally(() => {
          inFlightRequests.delete(key);
        });
      inFlightRequests.set(key, inflight);
    }
    return inflight as Promise<T>;
  };

  // 2. L1 Memory Stale-While-Revalidate Hit (~0.1ms response, non-blocking background refresh)
  if (mem && now < mem.staleUntil) {
    runInBackground(triggerRefresh());
    return mem.value as T;
  }

  // 3. L2 Cloudflare PoP Edge Cache API (`caches.default`, ~2-8ms on cold isolate start)
  const edgeHit = await readFromEdgeCacheApi<T>(key);
  if (edgeHit && now < edgeHit.stale) {
    setMemoryEntry(key, edgeHit.v, edgeHit.exp, edgeHit.stale);
    if (now < edgeHit.exp) {
      return edgeHit.v;
    }
    // Stale in L2: return immediately (< 8ms) and revalidate in background!
    runInBackground(triggerRefresh());
    return edgeHit.v;
  }

  // 4. Cold Miss: Fetch upstream with deduplication and fallback to any expired data on error
  try {
    return await triggerRefresh();
  } catch (err) {
    if (mem) return mem.value as T;
    if (edgeHit) return edgeHit.v;
    throw err;
  }
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const now = Date.now();
  const cached = memoryFallback.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const edgeHit = await readFromEdgeCacheApi<T>(key);
  if (edgeHit && edgeHit.exp > now) {
    setMemoryEntry(key, edgeHit.v, edgeHit.exp, edgeHit.stale);
    return edgeHit.v;
  }

  const kv = await getKVBinding();
  if (kv) {
    try {
      const data = await kv.get(key, "json");
      if (data !== null && data !== undefined) {
        return data as T;
      }
    } catch (err) {
      console.warn("[KV CACHE] Error reading key:", key, err);
    }
  }

  return null;
}

export async function kvSet<T = unknown>(
  key: string,
  value: T,
  ttlSeconds: number = 1800
): Promise<boolean> {
  const now = Date.now();
  const ttlMs = ttlSeconds * 1000;
  const exp = now + ttlMs;
  const stale = now + Math.max(ttlMs * 6, 3600_000);

  setMemoryEntry(key, value, exp, stale);
  runInBackground(writeToEdgeCacheApi(key, value, exp, stale));

  const kv = await getKVBinding();
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttlSeconds) });
      return true;
    } catch (err) {
      console.warn("[KV CACHE] Error saving key:", key, err);
    }
  }

  return true;
}

export async function kvDelete(key: string): Promise<boolean> {
  memoryFallback.delete(key);
  const edgeCache = getEdgeCacheStorage();
  if (edgeCache) {
    try {
      await edgeCache.delete(new Request(buildEdgeCacheUrl(key), { method: "GET" }));
    } catch {}
  }
  const kv = await getKVBinding();
  if (kv) {
    try {
      await kv.delete(key);
    } catch {}
  }
  return true;
}
