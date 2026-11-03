import { NextRequest, NextResponse } from "next/server";
import {
  getMaintenanceState,
  setMaintenanceState,
  MAINTENANCE_COOKIE_NAME,
  BYPASS_COOKIE_NAME,
} from "@/lib/maintenance";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";

function hasConfiguredMaintenanceSecret(secret: string | null | undefined): boolean {
  const envSecret = process.env.SYSTEM_MAINTENANCE_TOKEN;
  if (!envSecret || envSecret === "hiphim_secret_2026") return false;
  return Boolean(secret && secret === envSecret);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const secret = searchParams.get("secret") || searchParams.get("token");
  const reason = searchParams.get("reason");
  const duration = parseInt(searchParams.get("duration") || "60", 10);

  // 1. Public read-only status check (Cache at Edge for 10 minutes)
  if (!action) {
    const state = getMaintenanceState();
    return NextResponse.json(state, {
      headers: {
        "Cache-Control": "public, s-maxage=600, max-age=60, stale-while-revalidate=3600",
        "CDN-Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
        "Cloudflare-CDN-Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
      },
    });
  }

  // Require authenticated Admin session OR a custom environment SYSTEM_MAINTENANCE_TOKEN
  const isAdmin = await isAuthorizedAdminRequest(req);
  const isSecretValid = hasConfiguredMaintenanceSecret(secret);

  if (!isAdmin && !isSecretValid) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin authentication required." },
      { status: 401 }
    );
  }

  // 2. Admin Bypass Verification
  if (action === "bypass") {
    const res = NextResponse.json({
      success: true,
      message: "Admin bypass verified successfully",
    });
    const envSecret = process.env.SYSTEM_MAINTENANCE_TOKEN;
    if (envSecret) {
      res.cookies.set(BYPASS_COOKIE_NAME, envSecret, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 7,
      });
    }
    return res;
  }

  // 3. Enable / Disable Maintenance Mode
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
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, secret, duration = 60, reason } = body;

    const isAdmin = await isAuthorizedAdminRequest(req);
    const isSecretValid = hasConfiguredMaintenanceSecret(secret);

    if (!isAdmin && !isSecretValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin authentication required." },
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
