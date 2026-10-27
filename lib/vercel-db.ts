import { neon } from "@neondatabase/serverless";
import seedUsers from "./seed-data.json";

function getDatabaseUrl(): string | undefined {
  const primary = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL
  )?.trim();
  if (primary) return primary;

  // Tự động tìm bất kỳ biến môi trường nào chứa chuỗi postgresql://
  for (const [key, val] of Object.entries(process.env)) {
    if (typeof val === "string" && val.trim().startsWith("postgresql://")) {
      console.log(`[DB] Auto-detected PostgreSQL connection string in env variable: ${key}`);
      return val.trim();
    }
  }

  return undefined;
}

const databaseUrl = getDatabaseUrl();

export const vercelSql = databaseUrl ? neon(databaseUrl) : null;

let schemaPromise: Promise<void> | null = null;

export async function ensureVercelDatabase(): Promise<boolean> {
  if (!vercelSql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL hoặc POSTGRES_URL chưa được cấu hình trên Vercel.");
    }
    return false;
  }
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await vercelSql!`
        CREATE TABLE IF NOT EXISTS hiphim_users (
          email TEXT PRIMARY KEY,
          id TEXT NOT NULL UNIQUE,
          data JSONB NOT NULL
        )
      `;
      await vercelSql!`
        CREATE INDEX IF NOT EXISTS hiphim_users_id_idx ON hiphim_users (id)
      `;
      await vercelSql!`
        CREATE TABLE IF NOT EXISTS hiphim_pending_registrations (
          email TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          expires_at BIGINT NOT NULL
        )
      `;
      await vercelSql!`
        CREATE TABLE IF NOT EXISTS hiphim_site_config (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL
        )
      `;

      // Tự động seed tài khoản từ seed-data.json sang PostgreSQL
      try {
        if (Array.isArray(seedUsers)) {
          for (const user of seedUsers as any[]) {
            if (user?.email && user?.id) {
              await vercelSql!`
                INSERT INTO hiphim_users (email, id, data)
                VALUES (${user.email.toLowerCase()}, ${user.id}, ${JSON.stringify(user)}::jsonb)
                ON CONFLICT (email) DO NOTHING
              `;
            }
          }
        }
      } catch (seedErr) {
        console.warn("[DB] Could not seed default users from seed-data.json:", seedErr);
      }

      // Khôi phục cấu hình website vào bộ nhớ
      try {
        const cfgRows = await vercelSql!`SELECT data FROM hiphim_site_config WHERE key = 'main'`;
        if (cfgRows.length > 0 && cfgRows[0]?.data) {
          globalThis.__HIPHIM_SITE_CONFIG__ = cfgRows[0].data as any;
        }
      } catch (cfgErr) {
        // ignore
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return true;
}
