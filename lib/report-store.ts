import fs from "fs";
import path from "path";
import { ensureVercelDatabase, vercelSql } from "@/lib/vercel-db";
import seedReports from "./seed-reports.json";

export interface MovieReport {
  id: string;
  movieSlug: string;
  movieName: string;
  episodeName?: string;
  serverName?: string;
  issueType: string;
  description?: string;
  status: "pending" | "resolved";
  createdAt: number;
  ip?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  resolvedAt?: number;
}

const REPORTS_FILE_PATH = path.join(process.cwd(), "data", "reports.json");

function ensureFileExists() {
  const dir = path.dirname(REPORTS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_FILE_PATH)) {
    fs.writeFileSync(REPORTS_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
  }
}

function readReportsFromFile(): MovieReport[] {
  try {
    ensureFileExists();
    const data = fs.readFileSync(REPORTS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading reports file:", error);
    return [];
  }
}

function writeReportsToFile(reports: MovieReport[]): void {
  try {
    ensureFileExists();
    fs.writeFileSync(REPORTS_FILE_PATH, JSON.stringify(reports, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing reports file:", error);
  }
}

async function ensureReportsTable() {
  if (!(await ensureVercelDatabase()) || !vercelSql) return false;
  try {
    await vercelSql`
      CREATE TABLE IF NOT EXISTS hiphim_reports (
        id TEXT PRIMARY KEY,
        movie_slug TEXT NOT NULL,
        movie_name TEXT NOT NULL,
        episode_name TEXT,
        server_name TEXT,
        issue_type TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at BIGINT NOT NULL,
        user_id TEXT,
        user_email TEXT,
        user_name TEXT,
        resolved_at BIGINT,
        data JSONB
      )
    `;

    // Ensure columns exist on older tables
    try {
      await vercelSql`ALTER TABLE hiphim_reports ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await vercelSql`ALTER TABLE hiphim_reports ADD COLUMN IF NOT EXISTS user_email TEXT`;
      await vercelSql`ALTER TABLE hiphim_reports ADD COLUMN IF NOT EXISTS user_name TEXT`;
      await vercelSql`ALTER TABLE hiphim_reports ADD COLUMN IF NOT EXISTS resolved_at BIGINT`;
    } catch {
      // Ignore if columns already exist or alter is not permitted
    }

    // Tự động khôi phục toàn bộ 15 báo lỗi phim nếu bảng trống
    try {
      const cnt = await vercelSql`SELECT count(*) as count FROM hiphim_reports`;
      if (Number(cnt[0]?.count || 0) === 0 && Array.isArray(seedReports) && seedReports.length > 0) {
        for (const r of seedReports as any[]) {
          await vercelSql`
            INSERT INTO hiphim_reports (
              id, movie_slug, movie_name, episode_name, server_name,
              issue_type, description, status, created_at,
              user_id, user_email, user_name, resolved_at, data
            ) VALUES (
              ${r.id}, ${r.movie_slug}, ${r.movie_name}, ${r.episode_name || ""}, ${r.server_name || ""},
              ${r.issue_type}, ${r.description || ""}, ${r.status || "pending"}, ${Number(r.created_at) || Date.now()},
              ${r.user_id || null}, ${r.user_email || null}, ${r.user_name || null}, ${r.resolved_at ? Number(r.resolved_at) : null}, ${JSON.stringify(r.data || r)}::jsonb
            ) ON CONFLICT (id) DO NOTHING
          `;
        }
      }
    } catch (seedErr) {
      console.warn("Could not seed reports:", seedErr);
    }

    return true;
  } catch (err) {
    console.error("Error ensuring reports table:", err);
    return false;
  }
}

export async function createReport(
  reportData: Omit<MovieReport, "id" | "status" | "createdAt">
): Promise<MovieReport> {
  const newReport: MovieReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...reportData,
    status: "pending",
    createdAt: Date.now(),
  };

  const hasDb = await ensureReportsTable();
  if (hasDb && vercelSql) {
    try {
      await vercelSql`
        INSERT INTO hiphim_reports (
          id, movie_slug, movie_name, episode_name, server_name, issue_type, description, status, created_at, user_id, user_email, user_name, data
        ) VALUES (
          ${newReport.id},
          ${newReport.movieSlug},
          ${newReport.movieName},
          ${newReport.episodeName || ""},
          ${newReport.serverName || ""},
          ${newReport.issueType},
          ${newReport.description || ""},
          ${newReport.status},
          ${newReport.createdAt},
          ${newReport.userId || null},
          ${newReport.userEmail || null},
          ${newReport.userName || null},
          ${JSON.stringify(newReport)}::jsonb
        )
      `;
    } catch (err) {
      console.error("Failed to insert report into DB, falling back to file:", err);
    }
  }

  // Always write to file as fallback/sync
  const reports = readReportsFromFile();
  reports.unshift(newReport);
  // Cap at 1000 reports to avoid unlimited growth
  writeReportsToFile(reports.slice(0, 1000));

  return newReport;
}

export async function getReports(limit = 100): Promise<MovieReport[]> {
  const hasDb = await ensureReportsTable();
  if (hasDb && vercelSql) {
    try {
      const rows = await vercelSql`
        SELECT data FROM hiphim_reports ORDER BY created_at DESC LIMIT ${limit}
      `;
      if (rows && rows.length > 0) {
        return rows.map((r: any) => r.data as MovieReport);
      }
    } catch (err) {
      console.error("Failed to fetch reports from DB, falling back to file:", err);
    }
  }

  return readReportsFromFile().slice(0, limit);
}

export async function getUserReports(userEmail: string, userId?: string, limit = 50): Promise<MovieReport[]> {
  const normalizedEmail = (userEmail || "").trim().toLowerCase();
  const allReports = await getReports(500);
  
  return allReports
    .filter((r) => {
      const emailMatch = r.userEmail && r.userEmail.trim().toLowerCase() === normalizedEmail;
      const idMatch = userId && r.userId === userId;
      return emailMatch || idMatch;
    })
    .slice(0, limit);
}

export async function getPendingReportsCount(): Promise<number> {
  const hasDb = await ensureReportsTable();
  if (hasDb && vercelSql) {
    try {
      const rows = await vercelSql`
        SELECT COUNT(*)::int as count FROM hiphim_reports WHERE status = 'pending'
      `;
      if (rows && rows.length > 0) {
        return Number(rows[0].count) || 0;
      }
    } catch (err) {
      console.error("Failed to count pending reports from DB, falling back to file:", err);
    }
  }

  return readReportsFromFile().filter((r) => r.status === "pending").length;
}

export async function updateReportStatus(id: string, status: "pending" | "resolved"): Promise<boolean> {
  const resolvedAt = status === "resolved" ? Date.now() : null;

  const hasDb = await ensureReportsTable();
  if (hasDb && vercelSql) {
    try {
      if (resolvedAt) {
        await vercelSql`
          UPDATE hiphim_reports 
          SET status = ${status},
              resolved_at = ${resolvedAt},
              data = jsonb_set(
                jsonb_set(data, '{status}', to_jsonb(${status}::text)),
                '{resolvedAt}', to_jsonb(${resolvedAt}::bigint)
              )
          WHERE id = ${id}
        `;
      } else {
        await vercelSql`
          UPDATE hiphim_reports 
          SET status = ${status}, 
              resolved_at = NULL,
              data = jsonb_set(data, '{status}', to_jsonb(${status}::text)) - 'resolvedAt'
          WHERE id = ${id}
        `;
      }
    } catch (err) {
      console.error("Failed to update report status in DB:", err);
    }
  }

  const reports = readReportsFromFile();
  const target = reports.find((r) => r.id === id);
  if (target) {
    target.status = status;
    if (resolvedAt) {
      target.resolvedAt = resolvedAt;
    } else {
      delete target.resolvedAt;
    }
    writeReportsToFile(reports);
    return true;
  }
  return false;
}

export async function deleteReport(id: string): Promise<boolean> {
  const hasDb = await ensureReportsTable();
  if (hasDb && vercelSql) {
    try {
      await vercelSql`DELETE FROM hiphim_reports WHERE id = ${id}`;
    } catch (err) {
      console.error("Failed to delete report from DB:", err);
    }
  }

  const reports = readReportsFromFile();
  const filtered = reports.filter((r) => r.id !== id);
  if (filtered.length !== reports.length) {
    writeReportsToFile(filtered);
    return true;
  }
  return false;
}
