import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findUserByIdPersistent, isSuperAdmin } from "@/lib/user-store";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";
import { createSessionToken, ADMIN_COOKIE_NAME, SUPER_ADMIN_EMAIL } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, private",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { headers: NO_CACHE_HEADERS });
    }

    const payload = await verifyUserSessionToken(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { headers: NO_CACHE_HEADERS });
    }

    const storedUser = await findUserByIdPersistent(payload.userId);
    if (!storedUser && !payload.name) {
      return NextResponse.json({ authenticated: false }, { headers: NO_CACHE_HEADERS });
    }

    const user = storedUser || {
      id: payload.userId,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatar: payload.avatar || "",
      isVerified: payload.isVerified ?? true,
      role: payload.role === "superadmin" ? "superadmin" : "user",
      createdAt: new Date().toISOString(),
      isLocked: false,
      bannedUntil: 0,
      banReason: "",
      bannedAt: undefined,
      favorites: [],
      history: [],
    };

    // Update real-time user activity
    if (storedUser) {
      const { touchUserActivityPersistent } = await import("@/lib/user-store");
      await touchUserActivityPersistent(user.id);
    }

    const isSuper = isSuperAdmin(user);
    const role = isSuper ? "superadmin" : (user.role || "user");

    // Check if temporary ban has expired
    let isLocked = Boolean(user.isLocked);
    let bannedUntil = user.bannedUntil;
    let banReason = user.banReason;
    if (bannedUntil && bannedUntil > 0 && bannedUntil <= Date.now()) {
      isLocked = false;
      bannedUntil = 0;
      banReason = "";
    }

    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isVerified: user.isVerified,
          role,
          createdAt: user.createdAt,
          lastActiveAt: new Date().toISOString(),
          isLocked,
          bannedUntil,
          banReason,
          bannedAt: user.bannedAt,
          favorites: user.favorites || [],
          history: user.history || [],
          favoritesCount: (user.favorites || []).length,
          historyCount: (user.history || []).length,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );

    // Automatically maintain admin session cookie for Super Admin
    if (isSuper) {
      const adminToken = await createSessionToken(SUPER_ADMIN_EMAIL);
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: adminToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  } catch (err: any) {
    console.error("Get me error:", err);
    return NextResponse.json({ authenticated: false }, { headers: NO_CACHE_HEADERS });
  }
}
