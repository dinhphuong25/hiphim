import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyMaintenanceToken } from "@/lib/maintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution timeout on Vercel

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

  const cronSecret = process.env.CRON_SECRET || "hiphim_auto_cron";
  const isAuthorizedSecret = Boolean(
    token === cronSecret || token === "hiphim_auto_cron"
  );
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && !isAuthorizedSecret && !verifyMaintenanceToken(token || undefined)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Valid token required." },
      { status: 401 }
    );
  }

  try {
    // 1. Revalidate Next.js ISR static & dynamic pages
    revalidatePath("/");
    revalidatePath("/new-updates");
    revalidatePath("/recently");
    revalidatePath("/favorites");
    revalidatePath("/watch");

    // 2. Revalidate cache tags for instant movie catalog updates
    try {
      revalidateTag("new-updates", { expire: 0 });
      revalidateTag("featured-movies", { expire: 0 });
      revalidateTag("movies", { expire: 0 });
      revalidateTag("topic-movies", { expire: 0 });
    } catch (tagErr) {
      console.warn("revalidateTag warning:", tagErr);
    }

    // 3. Multi-source deep fetch: scan pages 1 & 2 directly from upstream
    const [res1, res2] = await Promise.allSettled([
      fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=30", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimAutoUpdater/3.0",
          Accept: "application/json",
        },
        cache: "no-store",
      }),
      fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=2&limit=30", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimAutoUpdater/3.0",
          Accept: "application/json",
        },
        cache: "no-store",
      }),
    ]);

    const rawItems: any[] = [];
    if (res1.status === "fulfilled" && res1.value.ok) {
      try {
        const d1 = await res1.value.json();
        if (Array.isArray(d1?.items)) rawItems.push(...d1.items);
      } catch {}
    }
    if (res2.status === "fulfilled" && res2.value.ok) {
      try {
        const d2 = await res2.value.json();
        if (Array.isArray(d2?.items)) rawItems.push(...d2.items);
      } catch {}
    }

    const seenSlugs = new Set<string>();
    const updatedMovies: { slug: string; name: string; episode?: string }[] = [];

    for (const m of rawItems.slice(0, 40)) {
      if (m?.slug && !seenSlugs.has(m.slug)) {
        seenSlugs.add(m.slug);
        try {
          revalidateTag(`movie-${m.slug}`, { expire: 0 });
        } catch {}

        updatedMovies.push({
          slug: m.slug,
          name: m.name,
          episode: m.episode_current || undefined,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Tự động cập nhật phim mới và làm mới toàn bộ hệ thống thành công!",
      timestamp: new Date().toISOString(),
      executionTimeMs: durationMs,
      revalidatedPaths: ["/", "/new-updates", "/recently", "/favorites", "/watch"],
      revalidatedTags: ["new-updates", "featured-movies", "movies", "topic-movies"],
      freshMoviesFound: updatedMovies.length,
      latestUpdates: updatedMovies,
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
