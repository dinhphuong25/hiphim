import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

let lastCronExecutionTime = 0;
const CRON_COOLDOWN_MS = 20_000; // Minimum 20s cooldown between executions

export async function GET(req: NextRequest) {
  return handleAutoUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleAutoUpdate(req);
}

async function handleAutoUpdate(req: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = req.nextUrl;
  const token =
    searchParams.get("token") ||
    searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  const isAdmin = await isAuthorizedAdminRequest(req);
  const envCronSecret = process.env.CRON_SECRET || "hiphim_secret_2026";
  const isAuthorizedSecret = Boolean(envCronSecret && token === envCronSecret);
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isAdmin && !isVercelCron && !isAuthorizedSecret) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin session or valid cron secret required." },
      { status: 401 }
    );
  }

  // Cooldown guard against rapid repeated triggers
  if (!isAdmin && startTime - lastCronExecutionTime < CRON_COOLDOWN_MS) {
    return NextResponse.json(
      { success: false, error: "Cron cooldown active. Please wait a few seconds." },
      { status: 429 }
    );
  }
  lastCronExecutionTime = startTime;

  try {
    // 1. Revalidate Next.js ISR static & dynamic pages
    revalidatePath("/");
    revalidatePath("/new-updates");
    revalidatePath("/recently");
    revalidatePath("/favorites");
    revalidatePath("/watch");

    // 2. Revalidate cache tags for instant movie catalog updates (Zero Worker subrequests)
    try {
      revalidateTag("new-updates", { expire: 0 });
      revalidateTag("featured-movies", { expire: 0 });
      revalidateTag("movies", { expire: 0 });
      revalidateTag("topic-movies", { expire: 0 });
    } catch (tagErr) {
      console.warn("revalidateTag warning:", tagErr);
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Làm mới bộ nhớ đệm thành công! Phim mới được lấy trực tiếp từ Client không tốn tài nguyên Cloudflare.",
      timestamp: new Date().toISOString(),
      executionTimeMs: durationMs,
      revalidatedPaths: ["/", "/new-updates", "/recently", "/favorites", "/watch"],
      revalidatedTags: ["new-updates", "featured-movies", "movies", "topic-movies"],
    });
  } catch (error: any) {
    console.error("Auto-update cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi trong quá trình tự động cập nhật",
        detail: error?.message,
      },
      { status: 500 }
    );
  }
}
