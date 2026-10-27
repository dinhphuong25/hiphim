import {
  SUPER_ADMIN_EMAIL,
  findUserByEmailPersistent,
  verifyPassword,
  hashPassword,
  updateUserPersistent,
} from "./user-store";
import type { NextRequest } from "next/server";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "./user-token";
import { createSessionToken, verifySessionToken, ADMIN_COOKIE_NAME } from "./admin-token";
export { createSessionToken, verifySessionToken, ADMIN_COOKIE_NAME } from "./admin-token";

export { SUPER_ADMIN_EMAIL };

/**
 * Checks if incoming request has valid superadmin permissions (either via admin cookie or superadmin user cookie).
 */
export async function isAuthorizedAdminRequest(req: NextRequest): Promise<boolean> {
  // 1. Check admin session cookie
  const adminToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (adminToken && (await verifySessionToken(adminToken))) {
    return true;
  }

  // 2. Check user session cookie for Super Admin
  const userToken = req.cookies.get(USER_COOKIE_NAME)?.value;
  if (userToken) {
    const userPayload = await verifyUserSessionToken(userToken);
    if (userPayload?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Validates admin credentials.
 * Per security specification: Only kimdinhphuong205@gmail.com has superadmin privileges.
 * The default 'admin' account is disabled.
 */
export async function checkAdminCredentials(usernameOrEmail: string, password: string): Promise<boolean> {
  const input = (usernameOrEmail || "").trim().toLowerCase();
  const superEmail = SUPER_ADMIN_EMAIL.toLowerCase();
  const superPrefix = superEmail.split("@")[0].toLowerCase();

  const isMatch = input === superEmail || input === superPrefix;
  if (!isMatch) {
    return false;
  }

  const adminUser = await findUserByEmailPersistent(SUPER_ADMIN_EMAIL);
  if (!adminUser || !adminUser.passwordHash) {
    return false;
  }

  return await verifyPassword(password.trim(), adminUser.passwordHash);
}

/**
 * Updates Super Admin password directly in the user store.
 */
export async function updateAdminPassword(newPassword: string, _username?: string): Promise<boolean> {
  try {
    const adminUser = await findUserByEmailPersistent(SUPER_ADMIN_EMAIL);
    if (!adminUser) return false;

    const newHash = await hashPassword(newPassword);
    const updated = await updateUserPersistent(adminUser.id, { passwordHash: newHash });
    return !!updated;
  } catch (err) {
    console.error("Could not update super admin password:", err);
    return false;
  }
}
