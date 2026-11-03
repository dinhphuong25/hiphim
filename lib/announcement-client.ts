"use client";

let cachedData: any = null;
let cachedAt = 0;
let inFlightPromise: Promise<any> | null = null;
const CLIENT_ANNOUNCEMENT_TTL = 600_000; // 10 minutes client-side deduplication (eliminates worker request spam)

export async function fetchAnnouncementShared(forceRefresh = false): Promise<any> {
  if (typeof window === "undefined") return null;

  const now = Date.now();
  if (!forceRefresh && cachedData && now - cachedAt < CLIENT_ANNOUNCEMENT_TTL) {
    return cachedData;
  }

  if (!forceRefresh && inFlightPromise) {
    return inFlightPromise;
  }

  const reqPromise = fetch("/api/announcement", {
    cache: forceRefresh ? "no-store" : "default",
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cachedData = data;
      cachedAt = Date.now();
      return data;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  inFlightPromise = reqPromise;
  return reqPromise;
}
