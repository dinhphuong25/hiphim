import fs from "fs";
import path from "path";
import { ensureVercelDatabase, vercelSql } from "@/lib/vercel-db";
import seedUsers from "./seed-data.json";

const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");
const PENDING_FILE_PATH = path.join(process.cwd(), "data", "pending-registrations.json");
const USERS_TABLE = "hiphim_users";
const PENDING_TABLE = "hiphim_pending_registrations";

export const SUPER_ADMIN_EMAIL = "kimdinhphuong205@gmail.com";

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

async function readPersistentUserByEmail(email: string): Promise<User | null | undefined> {
  if (!(await ensureVercelDatabase())) return undefined;
  const rows = await vercelSql!`SELECT data FROM hiphim_users WHERE email = ${email}`;
  const row = rows[0] as { data: User } | undefined;
  if (row) return row.data;

  // Import a legacy local account the first time it is requested.
  const localUser = readUsers().find((user) => user.email.toLowerCase() === email);
  if (localUser) {
    await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${localUser.email}, ${localUser.id}, ${JSON.stringify(localUser)}::jsonb) ON CONFLICT (email) DO NOTHING`;
    return localUser;
  }
  return null;
}

async function readPersistentUserById(id: string): Promise<User | null | undefined> {
  if (!(await ensureVercelDatabase())) return undefined;
  const rows = await vercelSql!`SELECT data FROM hiphim_users WHERE id = ${id}`;
  return rows[0] ? (rows[0] as { data: User }).data : null;
}

async function writePersistentUser(user: User): Promise<boolean> {
  if (!(await ensureVercelDatabase())) return false;
  await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${user.email}, ${user.id}, ${JSON.stringify(user)}::jsonb)
    ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, data = EXCLUDED.data`;
  return true;
}

export async function findUserByEmailPersistent(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const user = await readPersistentUserByEmail(normalized);
  return user === undefined ? findUserByEmail(normalized) : user;
}

export async function findUserByIdPersistent(id: string): Promise<User | null> {
  const user = await readPersistentUserById(id);
  return user === undefined ? findUserById(id) : user;
}

export async function savePendingRegistrationPersistent(
  email: string,
  passwordHash: string,
  name: string,
  otp: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!(await ensureVercelDatabase())) {
    savePendingRegistration(normalized, passwordHash, name, otp);
    return;
  }
  const pending: PendingRegistration = {
    email: normalized,
    passwordHash,
    name: name.trim() || normalized.split("@")[0],
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  await vercelSql!`INSERT INTO hiphim_pending_registrations (email, data, expires_at) VALUES (${normalized}, ${JSON.stringify(pending)}::jsonb, ${pending.expiresAt})
    ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`;
}

export async function getPendingRegistrationPersistent(email: string): Promise<PendingRegistration | null> {
  const normalized = email.trim().toLowerCase();
  if (!(await ensureVercelDatabase())) return getPendingRegistration(normalized);
  const rows = await vercelSql!`SELECT data, expires_at FROM hiphim_pending_registrations WHERE email = ${normalized}`;
  const row = rows[0] as { data: PendingRegistration; expires_at: number } | undefined;
  if (!row || Number(row.expires_at) <= Date.now()) return null;
  return row.data;
}

export async function verifyAndCreateUserPersistent(
  email: string,
  otp: string,
  pendingOverride?: PendingRegistration
): Promise<{ user?: User; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!(await ensureVercelDatabase())) return verifyAndCreateUser(normalized, otp, pendingOverride);
  const pending = await getPendingRegistrationPersistent(normalized) || pendingOverride;
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

  try {
    await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${newUser.email}, ${newUser.id}, ${JSON.stringify(newUser)}::jsonb)`;
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "23505") {
      return { error: "Email này đã được kích hoạt tài khoản trước đó. Vui lòng đăng nhập." };
    }
    throw error;
  }

  await vercelSql!`DELETE FROM hiphim_pending_registrations WHERE email = ${normalized}`;
  return { user: newUser };
}

export async function syncUserDataPersistent(
  userId: string,
  localFavorites?: any[],
  localHistory?: any[],
  mode: "merge" | "replace" = "merge"
): Promise<{ favorites: any[]; history: any[] }> {
  if (!(await ensureVercelDatabase())) return syncUserData(userId, localFavorites, localHistory, mode);

  const user = await findUserByIdPersistent(userId);
  if (!user) return { favorites: localFavorites || [], history: localHistory || [] };

  let mergedFavorites = user.favorites || [];
  let mergedHistory = user.history || [];
  if (mode === "replace") {
    if (Array.isArray(localFavorites)) mergedFavorites = localFavorites;
    if (Array.isArray(localHistory)) mergedHistory = localHistory;
  } else {
    const favMap = new Map<string, any>();
    [...(user.favorites || []), ...(localFavorites || [])].forEach((favorite) => {
      if (favorite?.slug) favMap.set(favorite.slug, favorite);
    });
    mergedFavorites = Array.from(favMap.values());

    const historyMap = new Map<string, any>();
    [...(user.history || []), ...(localHistory || [])].forEach((historyItem) => {
      if (historyItem?.slug) {
        const existing = historyMap.get(historyItem.slug);
        const itemTime = historyItem.watchedAt || historyItem.timestamp || 0;
        const existingTime = existing ? (existing.watchedAt || existing.timestamp || 0) : 0;
        if (!existing || itemTime > existingTime) historyMap.set(historyItem.slug, historyItem);
      }
    });
    mergedHistory = Array.from(historyMap.values()).sort((a, b) =>
      (b.watchedAt || b.timestamp || 0) - (a.watchedAt || a.timestamp || 0)
    );
  }

  const updated = { ...user, favorites: mergedFavorites, history: mergedHistory, updatedAt: new Date().toISOString() };
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
    return emailOrUser.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }
  if (emailOrUser.email && emailOrUser.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
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
  return user === undefined ? findUserById(userId) : user;
}

async function updatePersistentUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const user = await getPersistentUserForAdmin(userId);
  if (!user) return null;
  const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
  if (!(await writePersistentUser(updated))) {
    return updateUser(userId, updates);
  }
  return updated;
}

export async function updateUserPersistent(userId: string, updates: Partial<User>): Promise<User | null> {
  return updatePersistentUser(userId, updates);
}

export async function getAllUsersForAdminPersistent(): Promise<UserAdminDetail[]> {
  if (!(await ensureVercelDatabase())) return getAllUsersForAdmin();
  for (const localUser of readUsers()) {
    await vercelSql!`INSERT INTO hiphim_users (email, id, data) VALUES (${localUser.email}, ${localUser.id}, ${JSON.stringify(localUser)}::jsonb)
      ON CONFLICT (email) DO NOTHING`;
  }
  const rows = await vercelSql!`SELECT data FROM hiphim_users ORDER BY data->>'createdAt' DESC`;
  return (rows as Array<{ data: User }>).map((row) => toAdminUserDetail(row.data));
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
  if (!(await ensureVercelDatabase())) return deleteUser(userId);
  await vercelSql!`DELETE FROM hiphim_users WHERE id = ${userId}`;
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

export async function touchUserActivityPersistent(userId: string): Promise<void> {
  if (await ensureVercelDatabase()) {
    await updatePersistentUser(userId, { lastActiveAt: new Date().toISOString() });
    return;
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

