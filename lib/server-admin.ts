import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-token";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";

/**
 * Checks if the current server-side request has active admin or superadmin privileges.
 * Supports both user JWT session and admin dashboard session.
 */
export async function isServerAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get(USER_COOKIE_NAME)?.value;
    if (userCookie) {
      const userPayload = await verifyUserSessionToken(userCookie);
      if (userPayload?.role === "superadmin" || userPayload?.role === "admin") {
        return true;
      }
    }
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminCookie && (await verifySessionToken(adminCookie))) {
      return true;
    }
  } catch {}
  return false;
}
