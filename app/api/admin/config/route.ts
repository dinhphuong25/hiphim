import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig, saveSiteConfig } from "@/lib/site-config";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { setMaintenanceState } from "@/lib/maintenance";
import { revalidatePath, revalidateTag } from "next/cache";

export async function GET(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const config = getSiteConfig();
  return NextResponse.json({
    success: true,
    config,
  });
}

export async function POST(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const updatedConfig = saveSiteConfig(body);

    // Synchronize maintenance state if included
    if (body.maintenance) {
      setMaintenanceState(body.maintenance);
    }

    // Revalidate Next.js pages so changes take effect immediately
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/new-updates");
      revalidatePath("/recently");
      revalidatePath("/favorites");
      revalidateTag("featured-movies", { expire: 0 });
      revalidateTag("featured-movie", { expire: 0 });
      revalidateTag("categories", { expire: 0 });
      revalidateTag("countries", { expire: 0 });
    } catch (e) {
      console.warn("Revalidate path warning:", e);
    }

    const response = NextResponse.json({
      success: true,
      message: "Cập nhật cấu hình website thành công!",
      config: updatedConfig,
    });

    if (updatedConfig.maintenance?.enabled) {
      response.cookies.set("hiphim_maintenance_active", "true", {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400 * 3,
      });
    } else {
      response.cookies.set("hiphim_maintenance_active", "false", {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
      });
    }

    return response;
  } catch (err: any) {
    console.error("Config save error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi lưu cấu hình: " + err?.message },
      { status: 500 }
    );
  }
}
