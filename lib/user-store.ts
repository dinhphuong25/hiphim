import fs from "fs";
import path from "path";
import { ensureVercelDatabase, vercelSql } from "@/lib/vercel-db";
import { getD1Database } from "@/lib/d1-db";
import seedUsers from "./seed-data.json";

const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");
const PENDING_FILE_PATH = path.join(process.cwd(), "data", "pending-registrations.json");
const USERS_TABLE = "hiphim_users";
const PENDING_TABLE = "hiphim_pending_registrations";

export const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL ||
  (globalThis as any)?.__ENV__?.SUPER_ADMIN_EMAIL ||
  "admin@hiphim.one";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  role?: "user" | "vip" | "admin" | "superadmin";
  createdAt: string;
  lastActiveAt?: string;
  isLocked?: boolean;
  bannedUntil?: number; // timestamp in ms, or -1 for permanent
  banReason?: string;
  bannedAt?: string;
}

export interface User extends UserProfile {
  passwordHash: string;
  updatedAt: string;
  favorites: any[];
  history: any[];
}

export interface PendingRegistration {
  email: string;
  passwordHash: string;
  name: string;
  otp: string;
  expiresAt: number;
}

interface CachedUser {
  user: User;
  expires: number;
}
const userProfileCacheById = new Map<string, CachedUser>();
const userProfileCacheByEmail = new Map<string, CachedUser>();
const USER_CACHE_TTL = 30_000; // 30 seconds

export function invalidateUserProfileCache(idOrEmail?: string): void {
  if (!idOrEmail) {
    userProfileCacheById.clear();
    userProfileCacheByEmail.clear();
    return;
  }
  userProfileCacheById.delete(idOrEmail);
  userProfileCacheByEmail.delete(idOrEmail.toLowerCase());
}

async function readPersistentUserByEmail(email: string): Promise<User | null | undefined> {
  const normalized = email.toLowerCase();
  const cached = userProfileCacheByEmail.get(normalized);
  if (cached && cached.expires > Date.now()) {
    return cached.user;
  }

  // 1. Try Cloudflare D1 first (Sub-10ms Edge Database)
  const d1 = await getD1Database();
  if (d1) {
    try {
      const row = await d1
        .prepare("SELECT data FROM hiphim_users WHERE email = ?")
        .bind(normalized)
        .first<{ data: string }>();
      if (row?.data) {
        const user = JSON.parse(row.data) as User;
        if (normalized === "kimdinhphuong205@gmail.com" && user.role !== "superadmin") {
          user.role = "superadmin";
          d1.prepare("UPDATE hiphim_users SET data = ?, updated_at = ? WHERE email = ?")
            .bind(JSON.stringify(user), Date.now(), normalized)
            .run()
            .catch(() => {});
        }
        userProfileCacheByEmail.set(normalized, { user, expires: Date.now() + USER_CACHE_TTL });
        if (user.id) userProfileCacheById.set(user.id, { user, expires: Date.now() + USER_CACHE_TTL });
        return user;
      }
      // Import a legacy local account the first time it is requested on D1
      const localUser = readUsers().find((u) => u.email.toLowerCase() === normalized);
      if (localUser) {
        await d1
          .prepare("INSERT OR IGNORE INTO hiphim_users (email, id, data, updated_at) VALUES (?, ?, ?, ?)")
          .bind(localUser.email, localUser.id, JSON.stringify(localUser), Date.now())
          .run();
        userProfileCacheByEmail.set(normalized, { user: localUser, expires: Date.now() + USER_CACHE_TTL });
        if (localUser.id) userProfileCacheById.set(localUser.id, { user: localUser, expires: Date.now() + USER_CACHE_TTL });
        return localUser;
      }
      return null;
    } catch (err) {
      console.warn("[D1] Error reading user by email, falling back:", err);
    }
  }

  // 2. Fallback to PostgreSQL (Neon)
  if (await ensureVercelDatabase()) {
    try {
      const rows = await vercelSql!`SELECT data FROM hiphim_users WHERE email = ${normalized}`;
      const row = rows[0] as { data: User } | undefined;
      if (row) {
        const user = row.data;
        userProfileCacheByEmail.set(normalized, { user, expires: Date.now() + USER_CACHE_TTL });
        if (user.id) userProfileCacheById.set(user.id, { user, expires: Date.now() + USER_CACHE_TTL });
        return user;
      }
    } catch (err) {
      console.warn("[PostgreSQL] Error reading user by email, falling back:", err);
    }
  }

  // Import a legacy local account the first time it is requested.
  const localUser = readUsers().find((user) => user.email.toLowerCase() === normalized);
  if (localUser) {
    if (await ensureVercelDatabase()) {
      try {
        await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${localUser.email}, ${localUser.id}, ${JSON.stringify(localUser)}::jsonb) ON CONFLICT (email) DO NOTHING`;
      } catch {}
    }
    userProfileCacheByEmail.set(normalized, { user: localUser, expires: Date.now() + USER_CACHE_TTL });
    if (localUser.id) userProfileCacheById.set(localUser.id, { user: localUser, expires: Date.now() + USER_CACHE_TTL });
    return localUser;
  }
  return null;
}

async function readPersistentUserById(id: string): Promise<User | null | undefined> {
  const cached = userProfileCacheById.get(id);
  if (cached && cached.expires > Date.now()) {
    return cached.user;
  }

  // 1. Try Cloudflare D1 first
  const d1 = await getD1Database();
  if (d1) {
    try {
      const row = await d1
        .prepare("SELECT data FROM hiphim_users WHERE id = ?")
        .bind(id)
        .first<{ data: string }>();
      const user = row?.data ? (JSON.parse(row.data) as User) : null;
      if (user) {
        if (user.email.toLowerCase() === "kimdinhphuong205@gmail.com" && user.role !== "superadmin") {
          user.role = "superadmin";
          d1.prepare("UPDATE hiphim_users SET data = ?, updated_at = ? WHERE id = ?")
            .bind(JSON.stringify(user), Date.now(), id)
            .run()
            .catch(() => {});
        }
        userProfileCacheById.set(id, { user, expires: Date.now() + USER_CACHE_TTL });
        userProfileCacheByEmail.set(user.email.toLowerCase(), { user, expires: Date.now() + USER_CACHE_TTL });
        return user;
      }
      // Import a legacy local account the first time it is requested on D1 by id
      const localUser = readUsers().find((u) => u.id === id);
      if (localUser) {
        try {
          await d1
            .prepare("INSERT OR IGNORE INTO hiphim_users (email, id, data, updated_at) VALUES (?, ?, ?, ?)")
            .bind(localUser.email.toLowerCase(), localUser.id, JSON.stringify(localUser), Date.now())
            .run();
        } catch {}
        userProfileCacheById.set(id, { user: localUser, expires: Date.now() + USER_CACHE_TTL });
        userProfileCacheByEmail.set(localUser.email.toLowerCase(), { user: localUser, expires: Date.now() + USER_CACHE_TTL });
        return localUser;
      }
      return null;
    } catch (err) {
      console.warn("[D1] Error reading user by id, falling back:", err);
    }
  }

  // 2. Fallback to PostgreSQL
  if (await ensureVercelDatabase()) {
    try {
      const rows = await vercelSql!`SELECT data FROM hiphim_users WHERE id = ${id}`;
      const user = rows[0] ? (rows[0] as { data: User }).data : null;
      if (user) {
        userProfileCacheById.set(id, { user, expires: Date.now() + USER_CACHE_TTL });
        userProfileCacheByEmail.set(user.email.toLowerCase(), { user, expires: Date.now() + USER_CACHE_TTL });
        return user;
      }
    } catch (err) {
      console.warn("[Postgres] Error reading user by id:", err);
    }
  }

  // 3. Fallback to local / seed users
  const localUser = readUsers().find((u) => u.id === id);
  if (localUser) {
    userProfileCacheById.set(id, { user: localUser, expires: Date.now() + USER_CACHE_TTL });
    userProfileCacheByEmail.set(localUser.email.toLowerCase(), { user: localUser, expires: Date.now() + USER_CACHE_TTL });
    return localUser;
  }

  return null;
}

async function writePersistentUser(user: User): Promise<boolean> {
  invalidateUserProfileCache(user.id);
  invalidateUserProfileCache(user.email);
  invalidateAdminUsersCache();

  // 1. Try Cloudflare D1
  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1
        .prepare("INSERT OR REPLACE INTO hiphim_users (email, id, data, updated_at) VALUES (?, ?, ?, ?)")
        .bind(user.email.toLowerCase(), user.id, JSON.stringify(user), Date.now())
        .run();
      return true;
    } catch (err) {
      console.warn("[D1] Error writing user, falling back:", err);
    }
  }

  // 2. Fallback to PostgreSQL
  if (await ensureVercelDatabase()) {
    try {
      await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${user.email}, ${user.id}, ${JSON.stringify(user)}::jsonb)
        ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, data = EXCLUDED.data`;
      return true;
    } catch (err) {
      console.warn("[Postgres] Error writing user, falling back to local file:", err);
    }
  }

  // 3. Fallback to local users.json
  updateUser(user.id, {
    favorites: user.favorites,
    history: user.history,
    isLocked: user.isLocked,
    bannedUntil: user.bannedUntil,
    banReason: user.banReason,
    role: user.role,
    isVerified: user.isVerified,
  });
  return true;
}

export async function findUserByEmailPersistent(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const user = await readPersistentUserByEmail(normalized);
  return user || findUserByEmail(normalized) || null;
}

export async function findUserByIdPersistent(id: string): Promise<User | null> {
  const user = await readPersistentUserById(id);
  return user || findUserById(id) || null;
}

export async function savePendingRegistrationPersistent(
  email: string,
  passwordHash: string,
  name: string,
  otp: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const pending: PendingRegistration = {
    email: normalized,
    passwordHash,
    name: name.trim() || normalized.split("@")[0],
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1
        .prepare("INSERT OR REPLACE INTO hiphim_pending_registrations (email, data, expires_at) VALUES (?, ?, ?)")
        .bind(normalized, JSON.stringify(pending), pending.expiresAt)
        .run();
      return;
    } catch (err) {
      console.warn("[D1] Error saving pending registration, falling back:", err);
    }
  }

  if (await ensureVercelDatabase()) {
    try {
      await vercelSql!`INSERT INTO hiphim_pending_registrations (email, data, expires_at) VALUES (${normalized}, ${JSON.stringify(pending)}::jsonb, ${pending.expiresAt})
        ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`;
      return;
    } catch (err) {
      console.warn("[PostgreSQL] Error saving pending registration, falling back to JSON:", err);
    }
  }

  savePendingRegistration(normalized, passwordHash, name, otp);
}

export async function getPendingRegistrationPersistent(email: string): Promise<PendingRegistration | null> {
  const normalized = email.trim().toLowerCase();

  const d1 = await getD1Database();
  if (d1) {
    try {
      const row = await d1
        .prepare("SELECT data, expires_at FROM hiphim_pending_registrations WHERE email = ?")
        .bind(normalized)
        .first<{ data: string; expires_at: number }>();
      if (!row || Number(row.expires_at) <= Date.now()) return null;
      return JSON.parse(row.data) as PendingRegistration;
    } catch (err) {
      console.warn("[D1] Error getting pending registration, falling back:", err);
    }
  }

  if (await ensureVercelDatabase()) {
    try {
      const rows = await vercelSql!`SELECT data, expires_at FROM hiphim_pending_registrations WHERE email = ${normalized}`;
      const row = rows[0] as { data: PendingRegistration; expires_at: number } | undefined;
      if (row && Number(row.expires_at) > Date.now()) return row.data;
    } catch (err) {
      console.warn("[PostgreSQL] Error getting pending registration, falling back to JSON:", err);
    }
  }
  return getPendingRegistration(normalized);
}

export interface PasswordResetEntry {
  email: string;
  otp: string;
  expiresAt: number;
}

const memoryPasswordResetStore = new Map<string, PasswordResetEntry>();

export async function savePasswordResetOtpPersistent(email: string, otp: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const resetKey = `reset_${normalized}`;
  const entry: PasswordResetEntry = {
    email: normalized,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  memoryPasswordResetStore.set(normalized, entry);

  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1
        .prepare("INSERT OR REPLACE INTO hiphim_pending_registrations (email, data, expires_at) VALUES (?, ?, ?)")
        .bind(resetKey, JSON.stringify(entry), entry.expiresAt)
        .run();
      return;
    } catch (err) {
      console.warn("[D1] Error saving password reset OTP:", err);
    }
  }

  if (await ensureVercelDatabase()) {
    try {
      await vercelSql!`INSERT INTO hiphim_pending_registrations (email, data, expires_at) VALUES (${resetKey}, ${JSON.stringify(entry)}::jsonb, ${entry.expiresAt})
        ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`;
      return;
    } catch (err) {
      console.warn("[PostgreSQL] Error saving password reset OTP:", err);
    }
  }
}

export async function getPasswordResetOtpPersistent(email: string): Promise<PasswordResetEntry | null> {
  const normalized = email.trim().toLowerCase();
  const resetKey = `reset_${normalized}`;

  const d1 = await getD1Database();
  if (d1) {
    try {
      const row = await d1
        .prepare("SELECT data, expires_at FROM hiphim_pending_registrations WHERE email = ?")
        .bind(resetKey)
        .first<{ data: string; expires_at: number }>();
      if (row && Number(row.expires_at) > Date.now()) {
        return JSON.parse(row.data) as PasswordResetEntry;
      }
      return null;
    } catch (err) {
      console.warn("[D1] Error getting password reset OTP:", err);
    }
  }

  if (await ensureVercelDatabase()) {
    try {
      const rows = await vercelSql!`SELECT data, expires_at FROM hiphim_pending_registrations WHERE email = ${resetKey}`;
      const row = rows[0] as { data: PasswordResetEntry; expires_at: number } | undefined;
      if (row && Number(row.expires_at) > Date.now()) return row.data;
      return null;
    } catch (err) {
      console.warn("[PostgreSQL] Error getting password reset OTP:", err);
    }
  }

  const mem = memoryPasswordResetStore.get(normalized);
  if (mem && mem.expiresAt > Date.now()) return mem;
  return null;
}

export async function deletePasswordResetOtpPersistent(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const resetKey = `reset_${normalized}`;
  memoryPasswordResetStore.delete(normalized);

  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1.prepare("DELETE FROM hiphim_pending_registrations WHERE email = ?").bind(resetKey).run();
    } catch (err) {
      console.warn("[D1] Error deleting password reset OTP:", err);
    }
  }

  if (await ensureVercelDatabase()) {
    try {
      await vercelSql!`DELETE FROM hiphim_pending_registrations WHERE email = ${resetKey}`;
    } catch (err) {
      console.warn("[PostgreSQL] Error deleting password reset OTP:", err);
    }
  }
}

export async function verifyAndResetPasswordPersistent(
  email: string,
  otp: string,
  newPassword: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const resetEntry = await getPasswordResetOtpPersistent(normalized);

  if (!resetEntry) {
    return { success: false, error: "Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới." };
  }

  if (resetEntry.otp !== otp.trim()) {
    return { success: false, error: "Mã OTP không chính xác. Vui lòng kiểm tra lại." };
  }

  const user = await findUserByEmailPersistent(normalized);
  if (!user) {
    return { success: false, error: "Không tìm thấy tài khoản người dùng." };
  }

  const newHash = await hashPassword(newPassword);
  const updatedUser = await updateUserPersistent(user.id, {
    passwordHash: newHash,
    updatedAt: new Date().toISOString(),
  });

  if (!updatedUser) {
    return { success: false, error: "Lỗi cập nhật mật khẩu. Vui lòng thử lại sau." };
  }

  await deletePasswordResetOtpPersistent(normalized);
  invalidateUserProfileCache(user.id);
  invalidateUserProfileCache(user.email);

  return { success: true, user: updatedUser };
}

export async function verifyAndCreateUserPersistent(
  email: string,
  otp: string,
  pendingOverride?: PendingRegistration
): Promise<{ user?: User; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const d1 = await getD1Database();

  if (d1) {
    try {
      const pending = (await getPendingRegistrationPersistent(normalized)) || pendingOverride;
      if (!pending) {
        return { error: "Không tìm thấy yêu cầu đăng ký hoặc mã đã hết hạn. Vui lòng đăng ký lại." };
      }
      if (pending.otp !== otp.trim()) {
        return { error: "Mã xác thực OTP không chính xác. Vui lòng thử lại." };
      }

      // Check if user already exists
      const existing = await d1
        .prepare("SELECT id FROM hiphim_users WHERE email = ?")
        .bind(normalized)
        .first<{ id: string }>();
      if (existing) {
        return { error: "Email này đã được kích hoạt tài khoản trước đó. Vui lòng đăng nhập." };
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        email: normalized,
        name: pending.name,
        passwordHash: pending.passwordHash,
        avatar: "",
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorites: [],
        history: [],
      };

      await d1
        .prepare("INSERT INTO hiphim_users (email, id, data, updated_at) VALUES (?, ?, ?, ?)")
        .bind(newUser.email, newUser.id, JSON.stringify(newUser), Date.now())
        .run();
      await d1
        .prepare("DELETE FROM hiphim_pending_registrations WHERE email = ?")
        .bind(normalized)
        .run();

      invalidateUserProfileCache(newUser.id);
      invalidateUserProfileCache(newUser.email);
      invalidateAdminUsersCache();

      return { user: newUser };
    } catch (err) {
      console.warn("[D1] Error in verifyAndCreateUser, falling back:", err);
    }
  }

  // Fallback to PostgreSQL or file
  if (!(await ensureVercelDatabase())) return verifyAndCreateUser(normalized, otp, pendingOverride);
  const pending = (await getPendingRegistrationPersistent(normalized)) || pendingOverride;
  if (!pending) {
    return { error: "Không tìm thấy yêu cầu đăng ký hoặc mã đã hết hạn. Vui lòng đăng ký lại." };
  }
  if (pending.otp !== otp.trim()) {
    return { error: "Mã xác thực OTP không chính xác. Vui lòng thử lại." };
  }

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: normalized,
    name: pending.name,
    passwordHash: pending.passwordHash,
    avatar: "",
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorites: [],
    history: [],
  };

  if (await ensureVercelDatabase()) {
    try {
      await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${newUser.email}, ${newUser.id}, ${JSON.stringify(newUser)}::jsonb)`;
      await vercelSql!`DELETE FROM hiphim_pending_registrations WHERE email = ${normalized}`;
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === "23505") {
        return { error: "Email này đã được kích hoạt tài khoản trước đó. Vui lòng đăng nhập." };
      }
      console.warn("[PostgreSQL] Error writing new user to database, falling back to local file:", error);
    }
  }

  // Always save to local JSON file as persistent fallback
  try {
    const users = readUsers();
    if (!users.some((u) => u.email.toLowerCase() === normalized)) {
      users.push(newUser);
      writeUsers(users);
    }
    const pendingList = readPending();
    const index = pendingList.findIndex((p) => p.email.toLowerCase() === normalized);
    if (index >= 0) {
      pendingList.splice(index, 1);
      writePending(pendingList);
    }
  } catch (err) {
    console.warn("Failed saving user to local JSON:", err);
  }

  return { user: newUser };
}

export async function syncUserDataPersistent(
  userId: string,
  localFavorites?: any[],
  localHistory?: any[],
  mode: "merge" | "replace" = "merge"
): Promise<{ favorites: any[]; history: any[] }> {
  const user = await findUserByIdPersistent(userId);
  if (!user) return { favorites: localFavorites || [], history: localHistory || [] };

  const dedupeAndSortFavorites = (list: any[]) => {
    const favMap = new Map<string, any>();
    for (const fav of list) {
      const slug = (fav?.slug || fav?.movie?.slug || "").trim();
      if (!slug) continue;
      const existing = favMap.get(slug);
      const addedAt = Number(fav.addedAt || fav.timestamp || existing?.addedAt || Date.now());
      favMap.set(slug, {
        ...(existing || {}),
        ...fav,
        slug,
        addedAt,
      });
    }
    return Array.from(favMap.values())
      .sort((a, b) => (Number(b.addedAt) || 0) - (Number(a.addedAt) || 0))
      .slice(0, 200);
  };

  const dedupeAndSortHistory = (list: any[]) => {
    const historyMap = new Map<string, any>();
    for (const item of list) {
      const slug = (item?.slug || item?.movieSlug || "").trim();
      if (!slug) continue;
      const existing = historyMap.get(slug);
      const itemTime = Number(item.watchedAt || item.timestamp || 0);
      const existingTime = existing ? Number(existing.watchedAt || existing.timestamp || 0) : 0;
      const isSameEp =
        existing &&
        (item.episodeIndex === undefined ||
          existing.episodeIndex === undefined ||
          item.episodeIndex === existing.episodeIndex);

      if (!existing || itemTime >= existingTime) {
        historyMap.set(slug, {
          ...(existing || {}),
          ...item,
          slug,
          currentTime:
            Number(item.currentTime) > 0
              ? Number(item.currentTime)
              : isSameEp
              ? Number(existing?.currentTime) || 0
              : 0,
          duration:
            Number(item.duration) > 0
              ? Number(item.duration)
              : isSameEp
              ? Number(existing?.duration) || 0
              : 0,
          watchedAt: Math.max(itemTime, existingTime) || Date.now(),
        });
      } else {
        historyMap.set(slug, {
          ...item,
          ...existing,
          slug,
          currentTime:
            Number(existing.currentTime) > 0
              ? Number(existing.currentTime)
              : isSameEp
              ? Number(item.currentTime) || 0
              : 0,
          duration:
            Number(existing.duration) > 0
              ? Number(existing.duration)
              : isSameEp
              ? Number(item.duration) || 0
              : 0,
          watchedAt: Math.max(itemTime, existingTime) || Date.now(),
        });
      }
    }
    return Array.from(historyMap.values())
      .sort((a, b) => (Number(b.watchedAt || b.timestamp) || 0) - (Number(a.watchedAt || a.timestamp) || 0))
      .slice(0, 50);
  };

  let mergedFavorites = Array.isArray(user.favorites) ? user.favorites : [];
  let mergedHistory = Array.isArray(user.history) ? user.history : [];

  if (mode === "replace") {
    if (Array.isArray(localFavorites)) {
      mergedFavorites = dedupeAndSortFavorites(localFavorites);
    }
    if (Array.isArray(localHistory)) {
      mergedHistory = dedupeAndSortHistory(localHistory);
    }
  } else {
    if (Array.isArray(localFavorites)) {
      mergedFavorites = dedupeAndSortFavorites([...mergedFavorites, ...localFavorites]);
    }
    if (Array.isArray(localHistory)) {
      mergedHistory = dedupeAndSortHistory([...mergedHistory, ...localHistory]);
    }
  }

  const updated: User = {
    ...user,
    favorites: mergedFavorites,
    history: mergedHistory,
    updatedAt: new Date().toISOString(),
  };
  await writePersistentUser(updated);
  return { favorites: mergedFavorites, history: mergedHistory };
}

function ensureDirectory() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readUsers(): User[] {
  try {
    ensureDirectory();
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error("Error reading users.json:", err);
  }
  return (seedUsers as unknown as User[]) || [];
}

function writeUsers(users: User[]): void {
  try {
    ensureDirectory();
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users.json:", err);
  }
}

function readPending(): PendingRegistration[] {
  try {
    ensureDirectory();
    if (fs.existsSync(PENDING_FILE_PATH)) {
      const data = fs.readFileSync(PENDING_FILE_PATH, "utf-8");
      const list: PendingRegistration[] = JSON.parse(data) || [];
      // Clean expired
      return list.filter((p) => p.expiresAt > Date.now());
    }
  } catch (err) {
    console.error("Error reading pending-registrations.json:", err);
  }
  return [];
}

function writePending(list: PendingRegistration[]): void {
  try {
    ensureDirectory();
    fs.writeFileSync(PENDING_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing pending-registrations.json:", err);
  }
}

/**
 * PBKDF2 Password Hashing (Zero external dependency, 100% web crypto)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  const hashHex = Array.from(new Uint8Array(exported)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, expectedHash] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  const computedHash = Array.from(new Uint8Array(exported)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === expectedHash;
}

export function isSuperAdmin(emailOrUser: string | UserProfile | User | null | undefined): boolean {
  if (!emailOrUser) return false;
  if (typeof emailOrUser === "string") {
    const norm = emailOrUser.trim().toLowerCase();
    return norm === SUPER_ADMIN_EMAIL.toLowerCase() || norm === "kimdinhphuong205@gmail.com";
  }
  const email = emailOrUser.email ? emailOrUser.email.trim().toLowerCase() : "";
  if (email === SUPER_ADMIN_EMAIL.toLowerCase() || email === "kimdinhphuong205@gmail.com") {
    return true;
  }
  return emailOrUser.role === "superadmin";
}

export function findUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return null;
  if (isSuperAdmin(user.email)) {
    user.role = "superadmin";
  }
  return user;
}

export function findUserById(id: string): User | null {
  const users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  if (isSuperAdmin(user.email)) {
    user.role = "superadmin";
  }
  return user;
}

export interface CurrentWatchingInfo {
  slug: string;
  name: string;
  origin_name?: string;
  episodeName?: string;
  episodeIndex?: number;
  currentTime: number;
  duration: number;
  watchedAt: number;
}

export interface UserAdminDetail extends UserProfile {
  favoritesCount: number;
  historyCount: number;
  currentWatching?: CurrentWatchingInfo | null;
  favorites?: any[];
  history?: any[];
}

export function touchUserActivity(userId: string): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx].lastActiveAt = new Date().toISOString();
  writeUsers(users);
}

export function banUser(
  userId: string,
  durationHours: number | "permanent",
  reason: string
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (isSuperAdmin(user.email)) {
    return { success: false, error: "Không thể khóa tài khoản Super Admin!" };
  }

  const now = Date.now();
  const isPermanent = durationHours === "permanent";
  const bannedUntil = isPermanent ? -1 : now + Number(durationHours) * 60 * 60 * 1000;

  const updated = updateUser(userId, {
    isLocked: isPermanent,
    bannedUntil,
    banReason: reason.trim() || (isPermanent ? "Vi phạm quy định hệ thống" : "Tạm khóa quyền xem phim"),
    bannedAt: new Date().toISOString(),
  });

  return { success: true, user: updated || undefined };
}

export function unbanUser(userId: string): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  const updated = updateUser(userId, {
    isLocked: false,
    bannedUntil: 0,
    banReason: "",
    bannedAt: undefined,
  });

  return { success: true, user: updated || undefined };
}

export function deleteUser(userId: string): { success: boolean; error?: string } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (isSuperAdmin(user.email)) {
    return { success: false, error: "Không thể xóa tài khoản Super Admin!" };
  }

  const users = readUsers().filter((u) => u.id !== userId);
  writeUsers(users);
  return { success: true };
}

export function changeUserRole(
  userId: string,
  newRole: "user" | "admin" | "vip"
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (isSuperAdmin(user.email)) {
    return { success: false, error: "Không thể thay đổi vai trò của Super Admin tối cao!" };
  }

  const updated = updateUser(userId, { role: newRole });
  return { success: true, user: updated || undefined };
}

export function setUserVerified(
  userId: string,
  isVerified: boolean
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  const updated = updateUser(userId, { isVerified });
  return { success: true, user: updated || undefined };
}

export function clearUserWatching(
  userId: string
): { success: boolean; error?: string; user?: User } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  const updated = updateUser(userId, { history: [] });
  return { success: true, user: updated || undefined };
}

export async function adminResetPassword(
  userId: string,
  newPasswordPlain: string
): Promise<{ success: boolean; error?: string }> {
  const user = findUserById(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };

  if (newPasswordPlain.length < 6) {
    return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  const newHash = await hashPassword(newPasswordPlain);
  updateUser(userId, { passwordHash: newHash });
  return { success: true };
}

export function getAllUsersForAdmin(): UserAdminDetail[] {
  const users = readUsers();
  return users.map((u) => {
    const isSuper = isSuperAdmin(u.email);

    // Compute current watching (most recent history entry)
    let currentWatching: CurrentWatchingInfo | null = null;
    if (Array.isArray(u.history) && u.history.length > 0) {
      const sorted = [...u.history].sort((a, b) => (Number(b.watchedAt) || 0) - (Number(a.watchedAt) || 0));
      const latest = sorted[0];
      if (latest && latest.slug) {
        currentWatching = {
          slug: latest.slug,
          name: latest.name || latest.slug,
          origin_name: latest.origin_name,
          episodeName: latest.episodeName || (typeof latest.episodeIndex === "number" ? `Tập ${latest.episodeIndex + 1}` : latest.episode_current),
          episodeIndex: latest.episodeIndex,
          currentTime: Number(latest.currentTime) || 0,
          duration: Number(latest.duration) || 0,
          watchedAt: Number(latest.watchedAt) || 0,
        };
      }
    }

    // Check if temporary ban has expired
    let isLocked = Boolean(u.isLocked);
    let bannedUntil = u.bannedUntil;
    let banReason = u.banReason;
    if (bannedUntil && bannedUntil > 0 && bannedUntil <= Date.now()) {
      isLocked = false;
      bannedUntil = 0;
      banReason = "";
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar || "",
      isVerified: u.isVerified,
      role: isSuper ? "superadmin" : (u.role || "user"),
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt || u.updatedAt || u.createdAt,
      isLocked,
      bannedUntil,
      banReason,
      bannedAt: u.bannedAt,
      favoritesCount: (u.favorites || []).length,
      historyCount: (u.history || []).length,
      currentWatching,
      favorites: u.favorites || [],
      history: (u.history || []).slice(0, 50),
    };
  });
}

function toAdminUserDetail(user: User): UserAdminDetail {
  const isSuper = isSuperAdmin(user.email);
  const latest = Array.isArray(user.history)
    ? [...user.history].sort((a, b) => (Number(b.watchedAt) || 0) - (Number(a.watchedAt) || 0))[0]
    : undefined;
  const bannedUntil = user.bannedUntil && user.bannedUntil > 0 && user.bannedUntil <= Date.now()
    ? 0
    : user.bannedUntil;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || "",
    isVerified: user.isVerified,
    role: isSuper ? "superadmin" : (user.role || "user"),
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt || user.updatedAt || user.createdAt,
    isLocked: bannedUntil === 0 ? false : Boolean(user.isLocked),
    bannedUntil,
    banReason: bannedUntil === 0 ? "" : user.banReason,
    bannedAt: user.bannedAt,
    favoritesCount: (user.favorites || []).length,
    historyCount: (user.history || []).length,
    currentWatching: latest?.slug
      ? {
          slug: latest.slug,
          name: latest.name || latest.slug,
          origin_name: latest.origin_name,
          episodeName: latest.episodeName || (typeof latest.episodeIndex === "number" ? `Tập ${latest.episodeIndex + 1}` : latest.episode_current),
          episodeIndex: latest.episodeIndex,
          currentTime: Number(latest.currentTime) || 0,
          duration: Number(latest.duration) || 0,
          watchedAt: Number(latest.watchedAt) || 0,
        }
      : null,
    favorites: user.favorites || [],
    history: (user.history || []).slice(0, 50),
  };
}

async function getPersistentUserForAdmin(userId: string): Promise<User | null> {
  const user = await readPersistentUserById(userId);
  return user || findUserById(userId) || null;
}

let adminUsersCache: { data: UserAdminDetail[]; timestamp: number } | null = null;
const ADMIN_USERS_CACHE_TTL = 15000; // 15 seconds fast in-memory cache

export function invalidateAdminUsersCache(): void {
  adminUsersCache = null;
}

async function updatePersistentUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return null;
  const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
  if (!(await writePersistentUser(updated))) {
    return updateUser(userId, updates);
  }
  invalidateAdminUsersCache();
  return updated;
}

export async function updateUserPersistent(userId: string, updates: Partial<User>): Promise<User | null> {
  return updatePersistentUser(userId, updates);
}

export async function getAllUsersForAdminPersistent(forceFresh = false): Promise<UserAdminDetail[]> {
  if (!forceFresh && adminUsersCache && Date.now() - adminUsersCache.timestamp < ADMIN_USERS_CACHE_TTL) {
    return adminUsersCache.data;
  }

  // 1. Try Cloudflare D1
  const d1 = await getD1Database();
  if (d1) {
    try {
      const { results } = await d1
        .prepare("SELECT data FROM hiphim_users ORDER BY updated_at DESC")
        .all<{ data: string }>();
      const list = (results || []).map((row) => toAdminUserDetail(JSON.parse(row.data) as User));
      const existingEmails = new Set(list.map((u) => u.email.toLowerCase()));
      const seedUsers = getAllUsersForAdmin().filter((u) => !existingEmails.has(u.email.toLowerCase()));
      const combined = [...list, ...seedUsers];
      adminUsersCache = { data: combined, timestamp: Date.now() };
      return combined;
    } catch (err) {
      console.warn("[D1] Error fetching all users for admin, falling back:", err);
    }
  }

  // 2. Fallback to PostgreSQL
  if (await ensureVercelDatabase()) {
    try {
      const rows = await vercelSql!`SELECT data FROM hiphim_users ORDER BY data->>'createdAt' DESC`;
      const result = (rows as Array<{ data: User }>).map((row) => toAdminUserDetail(row.data));
      const existingEmails = new Set(result.map((u) => u.email.toLowerCase()));
      const seedUsers = getAllUsersForAdmin().filter((u) => !existingEmails.has(u.email.toLowerCase()));
      const combined = [...result, ...seedUsers];
      adminUsersCache = { data: combined, timestamp: Date.now() };
      return combined;
    } catch (err) {
      console.warn("[Postgres] Error fetching users for admin:", err);
    }
  }

  // 3. Fallback to local / seed users
  const localList = getAllUsersForAdmin();
  adminUsersCache = { data: localList, timestamp: Date.now() };
  return localList;
}

export async function banUserPersistent(
  userId: string,
  durationHours: number | "permanent",
  reason: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  if (isSuperAdmin(user.email)) return { success: false, error: "Không thể khóa tài khoản Super Admin!" };
  const isPermanent = durationHours === "permanent";
  const bannedUntil = isPermanent ? -1 : Date.now() + Number(durationHours) * 60 * 60 * 1000;
  const updated = await updatePersistentUser(userId, {
    isLocked: isPermanent,
    bannedUntil,
    banReason: reason.trim() || (isPermanent ? "Vi phạm quy định hệ thống" : "Tạm khóa quyền xem phim"),
    bannedAt: new Date().toISOString(),
  });
  return { success: Boolean(updated), user: updated || undefined };
}

export async function unbanUserPersistent(userId: string) {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  const updated = await updatePersistentUser(userId, { isLocked: false, bannedUntil: 0, banReason: "", bannedAt: undefined });
  return { success: Boolean(updated), user: updated || undefined };
}

export async function deleteUserPersistent(userId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  if (isSuperAdmin(user.email)) return { success: false, error: "Không thể xóa tài khoản Super Admin!" };
  invalidateAdminUsersCache();
  invalidateUserProfileCache(userId);
  if (user.email) invalidateUserProfileCache(user.email);
  try {
    deleteUser(userId);
  } catch {}

  // 1. Try Cloudflare D1
  const d1 = await getD1Database();
  if (d1) {
    try {
      await d1.prepare("DELETE FROM hiphim_users WHERE id = ?").bind(userId).run();
      return { success: true };
    } catch (err) {
      console.warn("[D1] Error deleting user, falling back:", err);
    }
  }

  // 2. Fallback to PostgreSQL
  if (!(await ensureVercelDatabase())) return { success: true };
  try {
    await vercelSql!`DELETE FROM hiphim_users WHERE id = ${userId}`;
  } catch {}
  return { success: true };
}

export async function changeUserRolePersistent(userId: string, newRole: "user" | "admin" | "vip") {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  if (isSuperAdmin(user.email)) return { success: false, error: "Không thể thay đổi vai trò của Super Admin tối cao!" };
  const updated = await updatePersistentUser(userId, { role: newRole });
  return { success: Boolean(updated), user: updated || undefined };
}

export async function setUserVerifiedPersistent(userId: string, isVerified: boolean) {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  const updated = await updatePersistentUser(userId, { isVerified });
  return { success: Boolean(updated), user: updated || undefined };
}

export async function clearUserWatchingPersistent(userId: string) {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  const updated = await updatePersistentUser(userId, { history: [] });
  return { success: Boolean(updated), user: updated || undefined };
}

export async function adminResetPasswordPersistent(userId: string, newPasswordPlain: string) {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return { success: false, error: "Không tìm thấy người dùng" };
  if (newPasswordPlain.length < 6) return { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  const updated = await updatePersistentUser(userId, { passwordHash: await hashPassword(newPasswordPlain) });
  return { success: Boolean(updated) };
}

const lastTouchedActivityMap = new Map<string, number>();

export async function touchUserActivityPersistent(userId: string): Promise<void> {
  const now = Date.now();
  const lastTouch = lastTouchedActivityMap.get(userId) || 0;
  // Throttle: only update lastActiveAt once every 15 minutes to eliminate redundant database writes
  if (now - lastTouch < 15 * 60 * 1000) {
    return;
  }
  lastTouchedActivityMap.set(userId, now);

  const d1 = await getD1Database();
  if (d1) {
    try {
      const user = await readPersistentUserById(userId);
      if (user) {
        user.lastActiveAt = new Date().toISOString();
        await d1
          .prepare("UPDATE hiphim_users SET data = ?, updated_at = ? WHERE id = ?")
          .bind(JSON.stringify(user), Date.now(), userId)
          .run();
      }
      return;
    } catch {
      // Non-blocking
    }
  }

  if (await ensureVercelDatabase()) {
    try {
      await vercelSql!`UPDATE hiphim_users SET data = jsonb_set(data, '{lastActiveAt}', to_jsonb(${new Date().toISOString()})) WHERE id = ${userId}`;
      return;
    } catch {
      await updatePersistentUser(userId, { lastActiveAt: new Date().toISOString() });
      return;
    }
  }
  touchUserActivity(userId);
}

export function savePendingRegistration(email: string, passwordHash: string, name: string, otp: string): void {
  const normalized = email.trim().toLowerCase();
  const pending = readPending().filter((p) => p.email.toLowerCase() !== normalized);
  pending.push({
    email: normalized,
    passwordHash,
    name: name.trim() || normalized.split("@")[0],
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  writePending(pending);
}

export function getPendingRegistration(email: string): PendingRegistration | null {
  const normalized = email.trim().toLowerCase();
  const pending = readPending();
  return pending.find((p) => p.email.toLowerCase() === normalized) || null;
}

export function verifyAndCreateUser(
  email: string,
  otp: string,
  pendingOverride?: PendingRegistration
): { user?: User; error?: string } {
  const normalized = email.trim().toLowerCase();
  const pendingList = readPending();
  const index = pendingList.findIndex((p) => p.email.toLowerCase() === normalized);

  const pending = index >= 0 ? pendingList[index] : pendingOverride;
  if (!pending) {
    return { error: "Không tìm thấy yêu cầu đăng ký hoặc mã đã hết hạn. Vui lòng đăng ký lại." };
  }

  if (pending.otp !== otp.trim()) {
    return { error: "Mã xác thực OTP không chính xác. Vui lòng thử lại." };
  }

  // Check if user already exists
  if (findUserByEmail(normalized)) {
    return { error: "Email này đã được kích hoạt tài khoản trước đó. Vui lòng đăng nhập." };
  }

  // Create active user
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: normalized,
    name: pending.name,
    passwordHash: pending.passwordHash,
    avatar: "",
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorites: [],
    history: [],
  };

  const users = readUsers();
  users.push(newUser);
  writeUsers(users);

  // Remove from pending
  if (index >= 0) {
    pendingList.splice(index, 1);
    writePending(pendingList);
  }

  return { user: newUser };
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);
  return users[idx];
}

export function syncUserData(
  userId: string,
  localFavorites?: any[],
  localHistory?: any[],
  mode: "merge" | "replace" = "merge"
): { favorites: any[]; history: any[] } {
  const user = findUserById(userId);
  if (!user) return { favorites: localFavorites || [], history: localHistory || [] };

  let mergedFavorites: any[] = user.favorites || [];
  let mergedHistory: any[] = user.history || [];

  if (mode === "replace") {
    if (Array.isArray(localFavorites)) {
      mergedFavorites = localFavorites;
    }
    if (Array.isArray(localHistory)) {
      mergedHistory = localHistory;
    }
  } else {
    // Mode "merge" (used on initial login or auto-sync)
    if (Array.isArray(localFavorites) && localFavorites.length > 0) {
      const favMap = new Map<string, any>();
      (user.favorites || []).forEach((f) => {
        if (f?.slug) favMap.set(f.slug, f);
      });
      localFavorites.forEach((f) => {
        if (f?.slug) favMap.set(f.slug, f);
      });
      mergedFavorites = Array.from(favMap.values());
    }

    if (Array.isArray(localHistory) && localHistory.length > 0) {
      const historyMap = new Map<string, any>();
      [...(user.history || []), ...localHistory].forEach((h) => {
        if (h?.slug) {
          const existing = historyMap.get(h.slug);
          const newTime = h.watchedAt || h.timestamp || 0;
          const existTime = existing ? (existing.watchedAt || existing.timestamp || 0) : 0;
          if (!existing || newTime > existTime) {
            historyMap.set(h.slug, h);
          }
        }
      });
      mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
        const timeA = a.watchedAt || a.timestamp || 0;
        const timeB = b.watchedAt || b.timestamp || 0;
        return timeB - timeA;
      });
    }
  }

  // Save to database
  updateUser(userId, {
    favorites: mergedFavorites,
    history: mergedHistory,
  });

  return { favorites: mergedFavorites, history: mergedHistory };
}

