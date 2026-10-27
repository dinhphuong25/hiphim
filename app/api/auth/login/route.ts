import { NextResponse } from "next/server";
import { findUserByEmailPersistent, verifyPassword, isSuperAdmin } from "@/lib/user-store";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";
import { createSessionToken, ADMIN_COOKIE_NAME, SUPER_ADMIN_EMAIL } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ Email và Mật khẩu" },
        { status: 400 }
      );
    }

    const user = await findUserByEmailPersistent(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const isValid =
      await verifyPassword(password, user.passwordHash) ||
      (password !== password.trim() && await verifyPassword(password.trim(), user.passwordHash));
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Tài khoản hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    // Check if account is permanently locked
    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản của bạn đã bị KHÓA VĨNH VIỄN do: "${user.banReason || "Vi phạm quy chế sử dụng website"}". Vui lòng liên hệ Quản trị viên để được hỗ trợ.`,
        },
        { status: 403 }
      );
    }

    const isSuper = isSuperAdmin(user);
    const role = isSuper ? "superadmin" : (user.role || "user");
    const sessionToken = await createUserSessionToken(user.id, user.email, {
      name: user.name,
      avatar: user.avatar,
      role,
      isVerified: user.isVerified,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
        role,
        createdAt: user.createdAt,
        isLocked: Boolean(user.isLocked),
        bannedUntil: user.bannedUntil || 0,
        banReason: user.banReason || "",
        bannedAt: user.bannedAt,
        favorites: user.favorites || [],
        history: user.history || [],
      },
    });

    response.cookies.set({
      name: USER_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 30, // 30 days
      path: "/",
    });

    // Single Sign-On: If Super Admin, automatically issue admin session cookie
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
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi đăng nhập" },
      { status: 500 }
    );
  }
}
