import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { getSiteConfigAsync, saveSiteConfigAsync } from "@/lib/site-config";
import { getPendingReportsCount } from "@/lib/report-store";
import {
  runAutoRepairPendingReports,
  resolveAllPendingReports,
  clearAllResolvedReports,
} from "@/lib/auto-repair";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getSiteConfigAsync(true);
    const pendingCount = await getPendingReportsCount();

    return NextResponse.json({
      success: true,
      autoRepair: config.autoRepair || {
        enabled: true,
        autoResolveReports: true,
        fallbackSources: ["phimapi", "nguonc", "ophim"],
        ignoreDatacenterFalseAlarm: true,
        notifyOnFix: true,
      },
      pendingCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi khi lấy cấu hình tự động sửa" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body?.action || "auto_repair";

    if (action === "auto_repair") {
      const repairResult = await runAutoRepairPendingReports();
      return NextResponse.json({
        success: true,
        message: `Đã tự động kiểm tra và sửa thành công ${repairResult.repairedCount}/${repairResult.totalPending} báo cáo!`,
        result: repairResult,
      });
    }

    if (action === "resolve_all") {
      const res = await resolveAllPendingReports();
      return NextResponse.json({
        success: true,
        message: `Đã đánh dấu hoàn tất xử lý cho tất cả ${res.count} báo cáo!`,
        count: res.count,
      });
    }

    if (action === "clear_resolved") {
      const res = await clearAllResolvedReports();
      return NextResponse.json({
        success: true,
        message: `Đã dọn dẹp ${res.count} báo cáo đã sửa xong!`,
        count: res.count,
      });
    }

    if (action === "save_config") {
      const newAutoRepairConfig = body?.autoRepair;
      if (!newAutoRepairConfig || typeof newAutoRepairConfig !== "object") {
        return NextResponse.json(
          { success: false, error: "Cấu hình tự động sửa không hợp lệ" },
          { status: 400 }
        );
      }

      const currentConfig = await getSiteConfigAsync(true);
      const updatedConfig = {
        ...currentConfig,
        autoRepair: {
          ...currentConfig.autoRepair,
          ...newAutoRepairConfig,
        },
      };

      await saveSiteConfigAsync(updatedConfig);
      return NextResponse.json({
        success: true,
        message: "Đã lưu thành công cấu hình tự động sửa báo lỗi!",
        autoRepair: updatedConfig.autoRepair,
      });
    }

    return NextResponse.json(
      { success: false, error: `Hành động không được hỗ trợ: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Auto-fix API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi xử lý tự động sửa" },
      { status: 500 }
    );
  }
}
