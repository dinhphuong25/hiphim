import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE_NAME } from "@/lib/user-token";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-token";

export const dynamic = "force-dynamic";

async function performLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE_NAME);
  cookieStore.delete(ADMIN_COOKIE_NAME);

  const response = NextResponse.json(
    { success: true, message: "Đã đăng xuất" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, private",
        "Pragma": "no-cache",
      },
    }
  );

  response.cookies.set({
    name: USER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });

  return response;
}

export async function POST() {
  return performLogout();
}

export async function GET() {
  return performLogout();
}
