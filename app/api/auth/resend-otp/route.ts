import { NextResponse } from "next/server";
import { getPendingRegistrationPersistent, savePendingRegistrationPersistent, type PendingRegistration } from "@/lib/user-store";
import { sendOtpEmail } from "@/lib/email-service";
import {
  createPendingRegistrationToken,
  PENDING_REGISTRATION_COOKIE_NAME,
  verifyPendingRegistrationToken,
} from "@/lib/user-token";

export const runtime = "nodejs";

const resendCooldownMap = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60_000; // 60 seconds per email

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Vui lòng cung cấp email" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const nextAllowed = resendCooldownMap.get(normalizedEmail) || 0;
    if (now < nextAllowed) {
      const waitSeconds = Math.ceil((nextAllowed - now) / 1000);
      return NextResponse.json(
        { success: false, error: `Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu mã OTP mới.` },
        { status: 429 }
      );
    }

    const pending = await getPendingRegistrationPersistent(email) || await getPendingFromCookie(request, email);
    if (!pending) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy yêu cầu đăng ký đang chờ hoặc mã đã hết hạn." },
        { status: 404 }
      );
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await savePendingRegistrationPersistent(pending.email, pending.passwordHash, pending.name, newOtp);

    const emailResult = await sendOtpEmail(pending.email, newOtp, pending.name);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.",
        },
        { status: 500 }
      );
    }

    resendCooldownMap.set(normalizedEmail, Date.now() + RESEND_COOLDOWN_MS);

    const pendingToken = await createPendingRegistrationToken({
      email: pending.email,
      passwordHash: pending.passwordHash,
      name: pending.name,
      otp: newOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const response = NextResponse.json({
      success: true,
      message: `Đã gửi lại mã OTP mới đến ${pending.email}`,
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
    console.error("Resend OTP error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi gửi lại mã OTP" },
      { status: 500 }
    );
  }
}

async function getPendingFromCookie(request: Request, email: string): Promise<PendingRegistration | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .find((part) => part.trim().startsWith(`${PENDING_REGISTRATION_COOKIE_NAME}=`));
  if (!cookie) return null;

  const token = decodeURIComponent(cookie.trim().slice(PENDING_REGISTRATION_COOKIE_NAME.length + 1));
  const pending = await verifyPendingRegistrationToken(token);
  return pending?.email === email.trim().toLowerCase() ? pending : null;
}
