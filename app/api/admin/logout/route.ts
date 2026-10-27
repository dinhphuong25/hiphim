import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { USER_COOKIE_NAME } from "@/lib/user-token";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(USER_COOKIE_NAME);

  const res = NextResponse.json(
    {
      success: true,
      message: "Đăng xuất thành công!",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, private",
        "Pragma": "no-cache",
      },
    }
  );

  // Clear admin session
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
  });

  // Clear user session
  res.cookies.set(USER_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
  });

  return res;
}

export async function GET() {
  return POST();
}
