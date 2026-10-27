import { NextRequest, NextResponse } from "next/server";
import {
  getMaintenanceState,
  setMaintenanceState,
  verifyMaintenanceToken,
  DEFAULT_MAINTENANCE_TOKEN,
  MAINTENANCE_COOKIE_NAME,
  BYPASS_COOKIE_NAME,
} from "@/lib/maintenance";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const secret = searchParams.get("secret") || searchParams.get("token");
  const reason = searchParams.get("reason");
  const duration = parseInt(searchParams.get("duration") || "60", 10);

  // 1. Check current status without secret (Cache at Edge for 30s to protect serverless quotas)
  if (!action) {
    const state = getMaintenanceState();
    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "public, s-maxage=30, max-age=10, stale-while-revalidate=120",
      },
    });
  }

  // 2. Admin Bypass Verification
  if (action === "bypass") {
    if (!verifyMaintenanceToken(secret)) {
      return NextResponse.json(
        { success: false, error: "Invalid secret token" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: "Admin bypass verified successfully",
    });
    res.cookies.set(BYPASS_COOKIE_NAME, DEFAULT_MAINTENANCE_TOKEN, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7, // 7 days
    });
    return res;
  }

  // 3. Enable / Disable Maintenance Mode
  if (!verifyMaintenanceToken(secret)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Valid secret required." },
      { status: 401 }
    );
  }

  if (action === "enable") {
    const estimatedEndTime = new Date(Date.now() + duration * 60 * 1000).toISOString();
    const updatedState = setMaintenanceState({
      enabled: true,
      reason: reason || "Hệ thống đang được nâng cấp định kỳ để cải thiện tốc độ và dịch vụ.",
      startedAt: new Date().toISOString(),
      estimatedEndTime,
    });

    const res = NextResponse.json({
      success: true,
      message: "Maintenance mode enabled successfully",
      state: updatedState,
    });

    res.cookies.set(MAINTENANCE_COOKIE_NAME, "true", {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 3, // 3 days
    });

    return res;
  }

  if (action === "disable") {
    const updatedState = setMaintenanceState({
      enabled: false,
    });

    const res = NextResponse.json({
      success: true,
      message: "Maintenance mode disabled successfully",
      state: updatedState,
    });

    res.cookies.set(MAINTENANCE_COOKIE_NAME, "false", {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, secret, duration = 60, reason } = body;

    if (!verifyMaintenanceToken(secret)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Valid secret required." },
        { status: 401 }
      );
    }

    if (action === "enable") {
      const estimatedEndTime = new Date(Date.now() + Number(duration) * 60 * 1000).toISOString();
      const updatedState = setMaintenanceState({
        enabled: true,
        reason: reason || "Hệ thống đang được nâng cấp định kỳ.",
        startedAt: new Date().toISOString(),
        estimatedEndTime,
      });

      const res = NextResponse.json({
        success: true,
        message: "Maintenance mode enabled successfully",
        state: updatedState,
      });

      res.cookies.set(MAINTENANCE_COOKIE_NAME, "true", {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 3,
      });

      return res;
    }

    if (action === "disable") {
      const updatedState = setMaintenanceState({
        enabled: false,
      });

      const res = NextResponse.json({
        success: true,
        message: "Maintenance mode disabled successfully",
        state: updatedState,
      });

      res.cookies.set(MAINTENANCE_COOKIE_NAME, "false", {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
      });

      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
