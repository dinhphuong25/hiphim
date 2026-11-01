import { vercelSql, getVercelSql } from "@/lib/vercel-db";
import { getD1Database } from "@/lib/d1-db";

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  contactTelegram?: string;
  contactEmail?: string;
  announcement: {
    enabled: boolean;
    text: string;
    link?: string;
    type: "info" | "warning" | "success";
  };
  featuredSlugs: string[];
  autoPinNewMovies?: boolean;
  autoPinLimit?: number;
  maintenance: {
    enabled: boolean;
    reason: string;
    estimatedEndTime?: string;
  };
  player: {
    defaultMode: "m3u8" | "embed";
    autoplay: boolean;
    defaultVolume: number;
  };
  customFooterText?: string;
  ads?: {
    enabled?: boolean;
    targetUrl?: string;
    popupImage?: string;
    bottomBannerImage?: string;
    showPopup?: boolean;
    showBottomBanner?: boolean;
    tvcEnabled?: boolean;
    tvcVideoUrl?: string;
    tvcSkipAfterSeconds?: number;
    adShieldEnabled?: boolean;
    adShieldMode?: "auto" | "always";
    adDisclaimerEnabled?: boolean;
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: "Hi Phim",
  siteDescription: "Hi Phim - Nền tảng xem phim trực tuyến hàng đầu với hơn 50.000+ tựa phim điện ảnh, phim bộ, anime vietsub chất lượng cao.",
  contactTelegram: "https://t.me/hiphim_support",
  contactEmail: "contact@hiphim.one",
  announcement: {
    enabled: false,
    text: "Chào mừng bạn đến với Hi Phim! Chúc bạn có những phút giây xem phim thư giãn tuyệt vời.",
    link: "",
    type: "info",
  },
  featuredSlugs: [
    "nguoi-nhen-khoi-dau-moi",
    "godzilla-x-kong-de-che-moi",
    "deadpool-va-wolverine",
    "quat-mo-trung-ma",
    "arcane-lien-minh-huyen-thoai-phan-2",
    "nu-hoang-nuoc-mat",
    "avatar-lua-va-tro-tan",
  ],
  autoPinNewMovies: true,
  autoPinLimit: 5,
  maintenance: {
    enabled: false,
    reason: "Hệ thống đang được nâng cấp định kỳ để cải thiện trải nghiệm xem phim.",
    estimatedEndTime: "",
  },
  player: {
    defaultMode: "m3u8",
    autoplay: true,
    defaultVolume: 1,
  },
  customFooterText: "Hi Phim — Nền tảng xem phim miễn phí.",
  ads: {
    enabled: false,
    targetUrl: "",
    popupImage: "",
    bottomBannerImage: "",
    showPopup: false,
    showBottomBanner: false,
    tvcEnabled: false,
    tvcVideoUrl: "",
    tvcSkipAfterSeconds: 5,
    adShieldEnabled: false,
    adShieldMode: "auto",
    adDisclaimerEnabled: true,
  },
};

declare global {
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG__: SiteConfig | undefined;
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG_TS__: number | undefined;
  // eslint-disable-next-line no-var
  var __HIPHIM_SITE_CONFIG_PROMISE__: Promise<SiteConfig> | undefined;
}

const CONFIG_MEMORY_TTL = 120_000; // 2 minutes memory cache per Worker isolate

function isLegacyGamblingAdConfig(ads: any): boolean {
  if (!ads || typeof ads !== "object") return false;
  const target = String(ads.targetUrl || "");
  const tvc = String(ads.tvcVideoUrl || "");
  const popup = String(ads.popupImage || "");
  const banner = String(ads.bottomBannerImage || "");
  return (
    target.includes("154.82.109.157") ||
    tvc.includes("333xbet") ||
    tvc.includes("video9922") ||
    popup === "/ads/popup.jpg" ||
    banner === "/ads/banner-bottom.gif"
  );
}

function mergeWithDefaults(parsed: any): SiteConfig {
  if (!parsed || typeof parsed !== "object") return DEFAULT_SITE_CONFIG;
  const rawAds = parsed.ads || {};
  const sanitizedAds = isLegacyGamblingAdConfig(rawAds)
    ? {
        ...DEFAULT_SITE_CONFIG.ads,
        adShieldEnabled: Boolean(rawAds.adShieldEnabled),
        adShieldMode: rawAds.adShieldMode || "auto",
        adDisclaimerEnabled: rawAds.adDisclaimerEnabled !== false,
      }
    : {
        ...DEFAULT_SITE_CONFIG.ads,
        ...rawAds,
        adDisclaimerEnabled: rawAds.adDisclaimerEnabled !== false,
      };

  return {
    ...DEFAULT_SITE_CONFIG,
    ...parsed,
    announcement: {
      ...DEFAULT_SITE_CONFIG.announcement,
      ...(parsed.announcement || {}),
    },
    maintenance: {
      ...DEFAULT_SITE_CONFIG.maintenance,
      ...(parsed.maintenance || {}),
    },
    player: {
      ...DEFAULT_SITE_CONFIG.player,
      ...(parsed.player || {}),
    },
    ads: sanitizedAds,
  };
}

/**
 * Pure synchronous in-memory read for SSR layouts (0ms CPU, no fs or unawaited DB promises).
 */
export function getSiteConfig(): SiteConfig {
  if (globalThis.__HIPHIM_SITE_CONFIG__) {
    return globalThis.__HIPHIM_SITE_CONFIG__;
  }
  globalThis.__HIPHIM_SITE_CONFIG__ = DEFAULT_SITE_CONFIG;
  return DEFAULT_SITE_CONFIG;
}

/**
 * Reads the authoritative site configuration from Cloudflare D1 or Neon PostgreSQL
 * inside async API route handlers (/api/announcement, /api/admin/config).
 */
export async function getSiteConfigAsync(forceRefresh = false): Promise<SiteConfig> {
  const now = Date.now();
  if (
    !forceRefresh &&
    globalThis.__HIPHIM_SITE_CONFIG__ &&
    globalThis.__HIPHIM_SITE_CONFIG_TS__ &&
    now - globalThis.__HIPHIM_SITE_CONFIG_TS__ < CONFIG_MEMORY_TTL
  ) {
    return globalThis.__HIPHIM_SITE_CONFIG__;
  }

  if (!forceRefresh && globalThis.__HIPHIM_SITE_CONFIG_PROMISE__) {
    return globalThis.__HIPHIM_SITE_CONFIG_PROMISE__;
  }

  const loadPromise = (async (): Promise<SiteConfig> => {
    // 1. Try Cloudflare D1 (fast native binding)
    try {
      const d1 = await getD1Database();
      if (d1) {
        const row = await d1
          .prepare("SELECT data FROM hiphim_site_config WHERE key = 'main' LIMIT 1")
          .first<{ data: string }>();
        if (row?.data) {
          const parsed = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          const merged = mergeWithDefaults(parsed);
          globalThis.__HIPHIM_SITE_CONFIG__ = merged;
          globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
          return merged;
        }
        // D1 is bound and healthy; cache current state without hitting external Postgres
        const fallbackD1 = globalThis.__HIPHIM_SITE_CONFIG__ || DEFAULT_SITE_CONFIG;
        globalThis.__HIPHIM_SITE_CONFIG__ = fallbackD1;
        globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
        return fallbackD1;
      }
    } catch {}

    // 2. Fallback to Neon PostgreSQL only if D1 is unavailable and Postgres URL is configured
    const sql = getVercelSql();
    if (sql) {
      try {
        const rows = await sql`
          SELECT data FROM hiphim_site_config WHERE key = 'main' LIMIT 1
        `;
        if (rows && rows.length > 0 && rows[0]?.data) {
          const raw = rows[0].data;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const merged = mergeWithDefaults(parsed);
          globalThis.__HIPHIM_SITE_CONFIG__ = merged;
          globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
          return merged;
        }
      } catch {}
    }

    const fallback = globalThis.__HIPHIM_SITE_CONFIG__ || DEFAULT_SITE_CONFIG;
    globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
    return fallback;
  })();

  globalThis.__HIPHIM_SITE_CONFIG_PROMISE__ = loadPromise;
  try {
    return await loadPromise;
  } finally {
    globalThis.__HIPHIM_SITE_CONFIG_PROMISE__ = undefined;
  }
}

/**
 * Updates the site configuration and persists it to D1 and PostgreSQL.
 */
export async function saveSiteConfigAsync(newConfig: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getSiteConfigAsync(true).catch(() => getSiteConfig());
  const updated: SiteConfig = {
    ...current,
    ...newConfig,
    announcement: {
      ...current.announcement,
      ...(newConfig.announcement || {}),
    },
    maintenance: {
      ...current.maintenance,
      ...(newConfig.maintenance || {}),
    },
    player: {
      ...current.player,
      ...(newConfig.player || {}),
    },
    ads: {
      ...DEFAULT_SITE_CONFIG.ads,
      ...(current.ads || {}),
      ...(newConfig.ads || {}),
    },
  };

  globalThis.__HIPHIM_SITE_CONFIG__ = updated;
  globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();

  const dbWrites: Promise<any>[] = [];

  dbWrites.push(
    getD1Database()
      .then(async (d1) => {
        if (d1) {
          await d1
            .prepare(
              "CREATE TABLE IF NOT EXISTS hiphim_site_config (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER)"
            )
            .run()
            .catch(() => {});
          return d1
            .prepare("INSERT OR REPLACE INTO hiphim_site_config (key, data, updated_at) VALUES ('main', ?, ?)")
            .bind(JSON.stringify(updated), Date.now())
            .run();
        }
      })
      .catch((err) => console.warn("[D1] Could not persist site config to D1:", err))
  );

  const sql = getVercelSql();
  if (sql) {
    dbWrites.push(
      Promise.resolve()
        .then(() =>
          sql`
            INSERT INTO hiphim_site_config (key, data)
            VALUES ('main', ${JSON.stringify(updated)}::jsonb)
            ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data
          `
        )
        .catch((dbErr: any) => console.warn("[DB] Could not persist site config to PostgreSQL:", dbErr))
    );
  }

  await Promise.allSettled(dbWrites);
  return updated;
}

export function saveSiteConfig(newConfig: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated: SiteConfig = {
    ...current,
    ...newConfig,
    announcement: {
      ...current.announcement,
      ...(newConfig.announcement || {}),
    },
    maintenance: {
      ...current.maintenance,
      ...(newConfig.maintenance || {}),
    },
    player: {
      ...current.player,
      ...(newConfig.player || {}),
    },
    ads: {
      ...DEFAULT_SITE_CONFIG.ads,
      ...(current.ads || {}),
      ...(newConfig.ads || {}),
    },
  };

  globalThis.__HIPHIM_SITE_CONFIG__ = updated;
  globalThis.__HIPHIM_SITE_CONFIG_TS__ = Date.now();
  saveSiteConfigAsync(newConfig).catch(() => {});
  return updated;
}
