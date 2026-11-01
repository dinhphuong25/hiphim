import fs from "fs";
import path from "path";
import { ensureVercelDatabase, vercelSql } from "@/lib/vercel-db";
import { getD1Database } from "@/lib/d1-db";
import seedNotifications from "./seed-notifications.json";

export interface SystemNotification {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "update";
  link?: string;
  createdAt: number;
  author?: string;
}

const NOTIFICATIONS_FILE_PATH = path.join(process.cwd(), "data", "system-notifications.json");

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "sys_update_v2026_release",
    title: "Bản cập nhật mới đã phát hành",
    content: "Bản cập nhật mới đã phát hành với giao diện mới và cải thiện server tốc độ cao, mượt mà hơn. Chúc mọi người xem phim vui vẻ. Thân chào!",
    type: "update",
    createdAt: 1793545700000,
    author: "Ban Quản Trị",
  },
  {
    id: "sys_feature_report_2026",
    title: "Tính năng Báo lỗi tập phim",
    content: "Nếu bạn gặp sự cố khi xem phim (video đứng hình, mất tiếng, lệch sub), hãy bấm nút 'Báo lỗi tập' để đội ngũ kỹ thuật khắc phục ngay nhé.",
    type: "info",
    createdAt: 1791495899231,
    author: "Ban Quản Trị",
  },
  {
    id: "sys_welcome_2026",
    title: "Chào mừng bạn ghé thăm!",
    content: "Chúc bạn có những giây phút xem phim thư giãn tuyệt vời với hơn 50.000+ tựa phim bom tấn và tập mới cập nhật liên tục hoàn toàn miễn phí.",
    type: "success",
    createdAt: 1791341099231,
    author: "Ban Quản Trị",
  },
];

function ensureFileExists() {
  const dir = path.dirname(NOTIFICATIONS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(NOTIFICATIONS_FILE_PATH)) {
    fs.writeFileSync(NOTIFICATIONS_FILE_PATH, JSON.stringify(DEFAULT_NOTIFICATIONS, null, 2), "utf-8");
  }
}

function readNotificationsFromFile(): SystemNotification[] {
  try {
    ensureFileExists();
    const data = fs.readFileSync(NOTIFICATIONS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : DEFAULT_NOTIFICATIONS;
  } catch (error) {
    console.error("Error reading system notifications file:", error);
    return DEFAULT_NOTIFICATIONS;
  }
}

function writeNotificationsToFile(notifications: SystemNotification[]): void {
  try {
    ensureFileExists();
    fs.writeFileSync(NOTIFICATIONS_FILE_PATH, JSON.stringify(notifications, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing system notifications file:", error);
  }
}

let notificationsTableEnsured = false;

async function ensureTable() {
  if (notificationsTableEnsured) return true;
  if (!(await ensureVercelDatabase()) || !vercelSql) return false;
  try {
    await vercelSql`
      CREATE TABLE IF NOT EXISTS hiphim_system_notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        link TEXT,
        created_at BIGINT NOT NULL,
        author TEXT,
        data JSONB
      )
    `;

    notificationsTableEnsured = true;
    return true;
  } catch (err) {
    console.error("Error ensuring system notifications table:", err);
    return false;
  }
}

export async function getSystemNotifications(limit = 30): Promise<SystemNotification[]> {
  const d1 = await getD1Database();
  if (d1) {
    try {
      const { results } = await d1
        .prepare("SELECT data FROM hiphim_system_notifications ORDER BY created_at DESC LIMIT ?")
        .bind(limit)
        .all<{ data: string }>();
      if (results && results.length > 0) {
        return results.map((r) => JSON.parse(r.data) as SystemNotification);
      }
    } catch (err) {
      console.warn("[D1] Failed to fetch system notifications from D1:", err);
    }
  }

  const hasDb = await ensureTable();
  if (hasDb && vercelSql) {
    try {
      const rows = await vercelSql`
        SELECT data FROM hiphim_system_notifications ORDER BY created_at DESC LIMIT ${limit}
      `;
      if (rows && rows.length > 0) {
        return rows.map((r: any) => r.data as SystemNotification);
      }
    } catch (err) {
      console.error("Failed to fetch system notifications from DB, fallback to file:", err);
    }
  }

  const fileData = readNotificationsFromFile();
  return fileData.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function createSystemNotification(
  input: Omit<SystemNotification, "id" | "createdAt">
): Promise<SystemNotification> {
  const newNotif: SystemNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...input,
    createdAt: Date.now(),
    author: input.author || "Ban Quản Trị",
  };

  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1
        .prepare(
          "INSERT INTO hiphim_system_notifications (id, title, content, type, link, created_at, author, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          newNotif.id,
          newNotif.title,
          newNotif.content,
          newNotif.type,
          newNotif.link || null,
          newNotif.createdAt,
          newNotif.author,
          JSON.stringify(newNotif)
        )
        .run();
    } catch (err) {
      console.warn("[D1] Failed to insert system notification into D1:", err);
    }
  }

  const hasDb = await ensureTable();
  if (hasDb && vercelSql) {
    try {
      await vercelSql`
        INSERT INTO hiphim_system_notifications (
          id, title, content, type, link, created_at, author, data
        ) VALUES (
          ${newNotif.id},
          ${newNotif.title},
          ${newNotif.content},
          ${newNotif.type},
          ${newNotif.link || null},
          ${newNotif.createdAt},
          ${newNotif.author},
          ${JSON.stringify(newNotif)}::jsonb
        )
      `;
    } catch (err) {
      console.error("Failed to insert system notification into DB:", err);
    }
  }

  const list = readNotificationsFromFile();
  list.unshift(newNotif);
  writeNotificationsToFile(list.slice(0, 100));

  return newNotif;
}

export async function deleteSystemNotification(id: string): Promise<boolean> {
  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1.prepare("DELETE FROM hiphim_system_notifications WHERE id = ?").bind(id).run();
    } catch (err) {
      console.warn("[D1] Failed to delete system notification from D1:", err);
    }
  }

  const hasDb = await ensureTable();
  if (hasDb && vercelSql) {
    try {
      await vercelSql`DELETE FROM hiphim_system_notifications WHERE id = ${id}`;
    } catch (err) {
      console.error("Failed to delete system notification from DB:", err);
    }
  }

  const list = readNotificationsFromFile();
  const filtered = list.filter((n) => n.id !== id);
  if (filtered.length !== list.length) {
    writeNotificationsToFile(filtered);
    return true;
  }
  return false;
}
