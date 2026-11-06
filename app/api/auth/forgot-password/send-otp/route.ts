import { NextRequest, NextResponse } from "next/server";
import { findUserByEmailPersistent, savePasswordResetOtpPersistent } from "@/lib/user-store";
import { sendPasswordResetOtpEmail } from "@/lib/email-service";
import { verifyTurnstileToken } from "@/lib/turnstile";

// Cooldown map: max 1 request per 60 seconds per email
const cooldownMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, turnstileToken } = body;

    // Optional Cloudflare Turnstile verification
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

    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.endsWith("@gmail.com")) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com)" },
        { status: 400 }
      );
    }

    // Check if account exists
    const user = await findUserByEmailPersistent(normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email này chưa được đăng ký tài khoản trên Hi Phim." },
        { status: 404 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản này đã bị khóa do: "${user.banReason || "Vi phạm quy chế"}". Vui lòng liên hệ Admin.`,
        },
        { status: 403 }
      );
    }

    // Check 60-second cooldown
    const now = Date.now();
    const lastSent = cooldownMap.get(normalizedEmail) || 0;
    if (now - lastSent < 60 * 1000) {
      const remaining = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return NextResponse.json(
        { success: false, error: `Vui lòng đợi ${remaining} giây trước khi yêu cầu mã mới.` },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save in persistent store (D1 / Vercel DB / Memory) with 5-minute expiry
    await savePasswordResetOtpPersistent(normalizedEmail, otp);
    cooldownMap.set(normalizedEmail, now);

    // Send email
    const emailResult = await sendPasswordResetOtpEmail(normalizedEmail, otp, user.name);
    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || "Lỗi khi gửi email xác thực. Vui lòng thử lại sau." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Mã OTP xác thực đã được gửi tới ${normalizedEmail}. Vui lòng kiểm tra hộp thư đến hoặc mục Spam.`,
      devCode: emailResult.devCode,
    });
  } catch (err: any) {
    console.error("[FORGOT_PASSWORD_SEND_OTP_ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
