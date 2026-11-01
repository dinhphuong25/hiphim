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

/**
 * Super-fast check: returns true if database connection is configured.
 * Bảng dữ liệu đã được tạo sẵn trong Neon PostgreSQL nên không chạy lại DDL thừa.
 */
export async function ensureVercelDatabase(): Promise<boolean> {
  const sql = getVercelSql();
  if (!sql) return false;
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
