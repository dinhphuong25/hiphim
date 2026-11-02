import { neon } from "@neondatabase/serverless";

export function getDatabaseUrl(): string {
  const primary = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL
  )?.trim();
  if (primary) return primary;

  // Tự động tìm bất kỳ biến môi trường nào chứa chuỗi postgresql://
  for (const [, val] of Object.entries(process.env)) {
    if (typeof val === "string" && val.trim().startsWith("postgresql://")) {
      return val.trim();
    }
  }

  return "";
}

let _cachedSql: any = null;
let _cachedUrl = "";

export function getVercelSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!_cachedSql || _cachedUrl !== url) {
    _cachedUrl = url;
    _cachedSql = neon(url);
  }
  return _cachedSql;
}

/**
 * Dynamic Proxy for vercelSql so that every SQL query dynamically evaluates neon(getDatabaseUrl())
 * without failing on Worker isolate cold starts or when DATABASE_URL is absent (D1-only mode).
 */
export const vercelSql: any = new Proxy(
  function () {},
  {
    apply(_target, thisArg, argArray) {
      const sql = getVercelSql();
      if (!sql) {
        return Promise.resolve([]);
      }
      return Reflect.apply(sql, thisArg, argArray);
    },
    get(_target, prop) {
      const sql = getVercelSql();
      if (!sql) {
        return undefined;
      }
      return Reflect.get(sql, prop);
    },
  }
);

let hasCreatedIndex = false;
let _dbAvailable: boolean | null = null;
let _lastCheckTime = 0;

/**
 * Super-fast check: returns true only if database connection is configured and responsive.
 * Gracefully falls back to local JSON storage if PostgreSQL is down or unauthenticated.
 */
export async function ensureVercelDatabase(): Promise<boolean> {
  const url = getDatabaseUrl();
  if (!url) return false;
  const sql = getVercelSql();
  if (!sql) return false;

  const now = Date.now();
  if (_dbAvailable !== null && now - _lastCheckTime < 30_000) {
    return _dbAvailable;
  }

  try {
    await sql`SELECT 1`;
    _dbAvailable = true;
    _lastCheckTime = now;
  } catch (err: any) {
    _dbAvailable = false;
    _lastCheckTime = now;
    console.warn("[Database] PostgreSQL connection failed, falling back to local file storage:", err?.message || err);
    return false;
  }

  if (!hasCreatedIndex) {
    hasCreatedIndex = true;
    (async () => {
      try {
        await sql`CREATE INDEX IF NOT EXISTS hiphim_users_id_idx ON hiphim_users (id)`;
      } catch {}
    })();
  }
  return true;
}
