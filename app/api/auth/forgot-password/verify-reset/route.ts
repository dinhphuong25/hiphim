import { NextRequest, NextResponse } from "next/server";
import { verifyAndResetPasswordPersistent } from "@/lib/user-store";
import { createUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";
import { createSessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { verifyTurnstileToken } from "@/lib/turnstile";

// Brute-force shield: max 5 failed attempts per 15 minutes
const attemptMap = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, newPassword, turnstileToken } = body;

    if (turnstileToken) {
      const clientIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        undefined;
      const cfCheck = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!cfCheck.success) {
        return NextResponse.json(
          { success: false, error: cfCheck.error || "Xác thực bảo vệ Cloudflare không thành công." },
          { status: 403 }
        );
      }
    }

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ Email, mã OTP và Mật khẩu mới." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();
    const existingAttempt = attemptMap.get(normalizedEmail);

    if (existingAttempt && existingAttempt.lockUntil > now) {
      const mins = Math.ceil((existingAttempt.lockUntil - now) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng chờ ${mins} phút hoặc yêu cầu mã OTP mới.`,
        },
        { status: 429 }
      );
    }

    const result = await verifyAndResetPasswordPersistent(normalizedEmail, otp.trim(), newPassword);

    if (!result.success || !result.user) {
      const count = (existingAttempt?.count || 0) + 1;
      attemptMap.set(normalizedEmail, {
        count,
        lockUntil: count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0,
      });

      const remaining = MAX_ATTEMPTS - count;
      const errorMsg =
        remaining > 0
          ? `${result.error || "Mã OTP không hợp lệ."} (Còn ${remaining} lần thử)`
          : `Bạn đã nhập sai mã OTP quá 5 lần. Tài khoản tạm khóa thử lại trong 15 phút.`;

      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    // Clear failed attempts on success
    attemptMap.delete(normalizedEmail);

    const user = result.user;
    const isSuperAdmin = user.role === "superadmin" || user.role === "admin";

    // Auto issue user session token
    const sessionToken = await createUserSessionToken(user.id, user.email, {
      name: user.name,
      avatar: user.avatar,
      role: user.role || "user",
      isVerified: user.isVerified,
    });

    const response = NextResponse.json({
      success: true,
      message: "Đặt lại mật khẩu thành công! Đang tự động đăng nhập...",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role || "user",
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        favorites: user.favorites || [],
        history: user.history || [],
      },
    });

    // Set user session cookie (1 year duration)
    response.cookies.set({
      name: USER_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });

    // If admin, also issue admin cookie
    if (isSuperAdmin) {
      const adminToken = await createSessionToken(user.email);
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: adminToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (err: any) {
    console.error("[FORGOT_PASSWORD_VERIFY_RESET_ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
