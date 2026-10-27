import { NextResponse } from "next/server";
import { findUserByEmailPersistent, hashPassword, savePendingRegistrationPersistent } from "@/lib/user-store";
import { sendOtpEmail } from "@/lib/email-service";
import { createPendingRegistrationToken, PENDING_REGISTRATION_COOKIE_NAME } from "@/lib/user-token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.endsWith("@gmail.com")) {
      return NextResponse.json(
        { success: false, error: "Hệ thống chỉ chấp nhận địa chỉ email có đuôi @gmail.com" },
        { status: 400 }
      );
    }

    const localPart = normalizedEmail.replace("@gmail.com", "").trim();
    if (!localPart || localPart.length < 3) {
      return NextResponse.json(
        { success: false, error: "Địa chỉ Gmail không hợp lệ (tên tài khoản quá ngắn)" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
    }

    // Check existing
    const existing = await findUserByEmailPersistent(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập." },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await hashPassword(password);
    const displayName = typeof name === "string" && name.trim()
      ? name.trim().replace(/\s+/g, " ")
      : normalizedEmail.split("@")[0];

    await savePendingRegistrationPersistent(normalizedEmail, passwordHash, displayName, otp);

    // Send email
    const emailResult = await sendOtpEmail(normalizedEmail, otp, displayName);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Không thể gửi email OTP. Vui lòng kiểm tra lại địa chỉ email.",
        },
        { status: 500 }
      );
    }

    const pendingToken = await createPendingRegistrationToken({
      email: normalizedEmail,
      passwordHash,
      name: displayName,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const response = NextResponse.json({
      success: true,
      message: `Mã OTP kích hoạt đã được gửi đến ${normalizedEmail}`,
      devMode: emailResult.devMode,
      devCode: emailResult.devCode,
    });
    response.cookies.set({
      name: PENDING_REGISTRATION_COOKIE_NAME,
      value: pendingToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi tạo tài khoản" },
      { status: 500 }
    );
  }
}
