import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import {
  createReport,
  getReports,
  getUserReports,
  getPendingReportsCount,
  updateReportStatus,
  deleteReport,
} from "@/lib/report-store";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";

// In-memory rate limiting map for user reports (prevents spam: max 4 reports per minute per IP/account)
const reportRateLimit = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const body = await req.json();

    // Support admin status update via POST as resilient fallback
    if (body.action === "update_status" || (body.id && (body.status === "pending" || body.status === "resolved") && !body.movieSlug)) {
      const isAuthorized = await isAuthorizedAdminRequest(req);
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
      const { id, status } = body;
      const ok = await updateReportStatus(id, status);
      return NextResponse.json({ success: ok });
    }

    const { movieSlug, movieName, episodeName, serverName, issueType, description } = body;

    // Verify user authentication
    let userId = body.userId ? String(body.userId).trim() : undefined;
    let userEmail = body.userEmail ? String(body.userEmail).trim() : undefined;
    let userName = body.userName ? String(body.userName).trim() : undefined;

    const userToken = req.cookies.get(USER_COOKIE_NAME)?.value;
    if (userToken) {
      const userPayload = await verifyUserSessionToken(userToken);
      if (userPayload) {
        userId = userPayload.userId;
        userEmail = userPayload.email;
        userName = userPayload.name || userName || userPayload.email.split("@")[0];
      }
    }

    // Require account login
    if (!userEmail && !userId) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập tài khoản để gửi báo lỗi tập phim." },
        { status: 401 }
      );
    }

    const rateKey = userEmail ? `user_${userEmail.toLowerCase()}` : `ip_${ip}`;
    const now = Date.now();
    const rate = reportRateLimit.get(rateKey);
    if (rate && rate.resetTime > now) {
      if (rate.count >= 4) {
        return NextResponse.json(
          { success: false, error: "Bạn đã gửi báo lỗi quá thường xuyên. Vui lòng chờ 1 phút rồi thử lại." },
          { status: 429 }
        );
      }
      rate.count += 1;
    } else {
      reportRateLimit.set(rateKey, { count: 1, resetTime: now + 60000 });
    }

    if (!movieSlug || !movieName || !issueType) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin báo lỗi bắt buộc." },
        { status: 400 }
      );
    }

    const report = await createReport({
      movieSlug: String(movieSlug).trim(),
      movieName: String(movieName).trim(),
      episodeName: episodeName ? String(episodeName).trim() : undefined,
      serverName: serverName ? String(serverName).trim() : undefined,
      issueType: String(issueType).trim(),
      description: description ? String(description).slice(0, 500).trim() : undefined,
      userId,
      userEmail,
      userName,
      ip,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi gửi báo cáo." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const isAdmin = await isAuthorizedAdminRequest(req);

    if (isAdmin) {
      const reports = await getReports(200);
      const pendingCount = await getPendingReportsCount();
      return NextResponse.json({
        success: true,
        isAdmin: true,
        reports,
        pendingCount,
      });
    }

    // Non-admin: Check if authenticated regular user
    const userToken = req.cookies.get(USER_COOKIE_NAME)?.value;
    if (userToken) {
      const userPayload = await verifyUserSessionToken(userToken);
      if (userPayload?.email) {
        const userReports = await getUserReports(userPayload.email, userPayload.userId, 50);
        return NextResponse.json({
          success: true,
          isAdmin: false,
          reports: userReports,
        });
      }
    }

    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi khi tải danh sách báo cáo." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || (status !== "pending" && status !== "resolved")) {
      return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    const ok = await updateReportStatus(id, status);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ success: false, error: "Lỗi cập nhật." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID báo cáo." }, { status: 400 });
    }

    const ok = await deleteReport(id);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ success: false, error: "Lỗi xóa báo cáo." }, { status: 500 });
  }
}
