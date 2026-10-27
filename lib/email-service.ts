import nodemailer from "nodemailer";

const DEFAULT_SENDER = process.env.EMAIL_FROM || "noreply@hiphim.one";

export interface SendOtpResult {
  success: boolean;
  devMode?: boolean;
  devCode?: string;
  error?: string;
}

/**
 * Sends a 6-digit activation OTP email through Resend on Vercel.
 */
export async function sendOtpEmail(toEmail: string, otp: string, userName?: string): Promise<SendOtpResult> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const gmailUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "notification.hiphim@gmail.com").trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "").trim();
  const subject = "Mã xác nhận kích hoạt tài khoản Hi Phim của bạn";
  const textContent = `Mã xác thực kích hoạt tài khoản Hi Phim của bạn là: ${otp}\n\nTuyệt đối không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ Hi Phim`;
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<body style="margin:0;padding:35px 12px;background:#080b09;color:#fff;font-family:Arial,sans-serif">
  <div style="max-width:540px;margin:auto;padding:36px;background:#121714;border:1px solid #20d66b;border-radius:20px;text-align:center">
    <h1><span style="color:#fff">Hi</span> <span style="color:#20d66b">Phim</span></h1>
    <p>Mã xác thực kích hoạt tài khoản của bạn:</p>
    <div style="padding:24px;border:2px solid #20d66b;border-radius:16px;color:#20d66b;font:900 42px monospace;letter-spacing:14px">${otp}</div>
    <p style="color:#aaa">Nếu bạn không yêu cầu tạo tài khoản tại Hi Phim, vui lòng bỏ qua email này.</p>
  </div>
</body>
</html>`;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: DEFAULT_SENDER,
          to: [toEmail],
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      if (response.ok) return { success: true, devMode: false };
      const errorBody = await response.text();
      console.error("[RESEND ERROR] Failed to send OTP email:", errorBody);
    } catch (err) {
      console.error("[RESEND ERROR] Request failed:", err);
    }
  }

  if (!gmailPass) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Hệ thống email chưa được cấu hình trên Vercel." };
    }
    console.log(`[HI PHIM EMAIL OTP DEV MODE] To: ${toEmail}; OTP: ${otp}`);
    return { success: true, devMode: true, devCode: otp };
  }

  let lastError: any;
  for (const smtpConfig of [
    { port: 465, secure: true },
    { port: 587, secure: false },
  ]) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        requireTLS: !smtpConfig.secure,
        auth: { user: gmailUser, pass: gmailPass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const info = await transporter.sendMail({
        from: `"Hi Phim" <${gmailUser}>`,
        replyTo: gmailUser,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
        headers: {
          "X-Priority": "1 (Highest)",
          "X-MSMail-Priority": "High",
          "Importance": "High",
        },
      });

      console.log(`[SMTP SUCCESS] OTP email sent to ${toEmail} via port ${smtpConfig.port}. MessageId: ${info.messageId}`);
      return { success: true, devMode: false };
    } catch (err: any) {
      lastError = err;
      console.error(`[SMTP ERROR] Port ${smtpConfig.port} failed:`, err?.message || err);
    }
  }

  return {
    success: false,
    error: `Gmail SMTP không gửi được (${lastError?.code || "UNKNOWN"}). Hãy kiểm tra App Password và log Vercel.`,
  };
}
