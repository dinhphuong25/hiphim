export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta?: any }>;
  run<T = unknown>(): Promise<{ success: boolean; meta?: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<{ results: T[]; success: boolean }>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

const D1_INIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS hiphim_users (
  email TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_hiphim_users_id ON hiphim_users (id);
CREATE INDEX IF NOT EXISTS idx_hiphim_users_updated ON hiphim_users (updated_at DESC);

CREATE TABLE IF NOT EXISTS hiphim_pending_registrations (
  email TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hiphim_pending_expires ON hiphim_pending_registrations (expires_at);

CREATE TABLE IF NOT EXISTS hiphim_ratings (
  slug TEXT PRIMARY KEY,
  total_score REAL NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  data TEXT
);
CREATE INDEX IF NOT EXISTS idx_hiphim_ratings_updated ON hiphim_ratings (updated_at DESC);

CREATE TABLE IF NOT EXISTS hiphim_reports (
  id TEXT PRIMARY KEY,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  episode_name TEXT,
  server_name TEXT,
  issue_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  user_id TEXT,
  user_email TEXT,
  user_name TEXT,
  resolved_at INTEGER,
  data TEXT
);
CREATE INDEX IF NOT EXISTS idx_hiphim_reports_created ON hiphim_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hiphim_reports_status ON hiphim_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hiphim_reports_slug ON hiphim_reports (movie_slug);

CREATE TABLE IF NOT EXISTS hiphim_system_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  created_at INTEGER NOT NULL,
  author TEXT,
  data TEXT
);

CREATE TABLE IF NOT EXISTS hiphim_site_config (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER
);
`;

let _d1TablesEnsured = false;

/**
 * Ensures D1 tables and indices are created when explicitly requested.
 */
export async function ensureD1Tables(db: D1Database): Promise<void> {
  if (_d1TablesEnsured) return;
  _d1TablesEnsured = true;
  try {
    if (typeof db.exec === "function") {
      await db.exec(D1_INIT_SCHEMA);
    }
  } catch (err) {
    console.warn("[D1] Auto-schema execution warning:", err);
  }
}

/**
 * Dynamically resolves the Cloudflare D1 database instance when running on Cloudflare Workers.
 * Does NOT run DDL schema initialization on every cold start to preserve Worker CPU limits.
 */
export async function getD1Database(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const db = (context?.env as Record<string, unknown>)?.HIPHIM_DB as D1Database | undefined;
    if (db && typeof db.prepare === "function") {
      return db;
    }
    return null;
  } catch {
    return null;
  }
}
