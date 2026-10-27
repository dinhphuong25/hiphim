import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, createSessionToken, ADMIN_COOKIE_NAME, SUPER_ADMIN_EMAIL } from "@/lib/admin-auth";
import { findUserByEmailPersistent } from "@/lib/user-store";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng điền đầy đủ tài khoản và mật khẩu!" },
        { status: 400 }
      );
    }

    const isValid = await checkAdminCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác! Chỉ Super Admin được phép truy cập." },
        { status: 401 }
      );
    }

    // Create secure signed admin session token
    const token = await createSessionToken(SUPER_ADMIN_EMAIL);

    const res = NextResponse.json({
      success: true,
      message: "Đăng nhập Super Admin thành công!",
    });

    // 1. Set admin session cookie
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7, // 7 days
    });

    // 2. Also set user session cookie so client user state is unified
    const adminUser = await findUserByEmailPersistent(SUPER_ADMIN_EMAIL);
    if (adminUser) {
      const userToken = await createUserSessionToken(adminUser.id, adminUser.email);
      res.cookies.set(USER_COOKIE_NAME, userToken, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 30, // 30 days
      });
    }

    return res;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra trong quá trình đăng nhập!" },
      { status: 500 }
    );
  }
}
