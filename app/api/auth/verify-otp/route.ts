import { NextResponse } from "next/server";
import { verifyAndCreateUserPersistent, type PendingRegistration } from "@/lib/user-store";
import {
  createUserSessionToken,
  PENDING_REGISTRATION_COOKIE_NAME,
  USER_COOKIE_NAME,
  verifyPendingRegistrationToken,
} from "@/lib/user-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ email và mã OTP" },
        { status: 400 }
      );
    }

    const pendingCookie = getCookie(request, PENDING_REGISTRATION_COOKIE_NAME);
    const pendingToken = await verifyPendingRegistrationToken(pendingCookie);
    const pendingOverride: PendingRegistration | undefined = pendingToken || undefined;
    const result = await verifyAndCreateUserPersistent(email, otp, pendingOverride);
    if (result.error || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "Mã OTP không hợp lệ" },
        { status: 400 }
      );
    }

    const user = result.user;
    const sessionToken = await createUserSessionToken(user.id, user.email, {
      name: user.name,
      avatar: user.avatar,
      role: user.role || "user",
      isVerified: user.isVerified,
    });

    const response = NextResponse.json({
      success: true,
      message: "Kích hoạt tài khoản thành công!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
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
    response.cookies.set({
      name: PENDING_REGISTRATION_COOKIE_NAME,
      value: "",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi xác thực mã OTP" },
      { status: 500 }
    );
  }
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader.split(";").find((part) => part.trim().startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null;
}
