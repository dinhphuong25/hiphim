import { getSiteConfig } from "@/lib/site-config";
import { createReport, getReports } from "@/lib/report-store";

export interface BrokenStreamItem {
  movieName: string;
  movieSlug: string;
  episodeName: string;
  serverName: string;
  streamUrl: string;
  errorReason: string;
}

export interface HealthCheckResult {
  totalMoviesChecked: number;
  totalStreamsChecked: number;
  healthyCount: number;
  brokenCount: number;
  brokenList: BrokenStreamItem[];
  durationMs: number;
}

/**
 * Ping check a stream URL to verify if it responds with valid media
 */
async function pingStreamUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!url || typeof url !== "string") {
    return { ok: false, error: "Đường dẫn stream trống" };
  }

  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    return { ok: false, error: "Đường dẫn không hợp lệ" };
  }

  try {
    // 1. Try HEAD request first (fastest, no body transfer)
    const headRes = await fetch(cleanUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(4500),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimHealthChecker/2.0",
        Accept: "*/*",
      },
    });

    if (headRes.ok || headRes.status === 206 || headRes.status === 302 || headRes.status === 301) {
      return { ok: true, status: headRes.status };
    }

    // If server rejects HEAD (e.g. 405 Method Not Allowed), retry with GET Range
    if (headRes.status === 405) {
      const getRes = await fetch(cleanUrl, {
        method: "GET",
        signal: AbortSignal.timeout(4500),
        headers: {
          Range: "bytes=0-1024",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimHealthChecker/2.0",
        },
      });
      if (getRes.ok || getRes.status === 206) {
        return { ok: true, status: getRes.status };
      }
      return { ok: false, status: getRes.status, error: `HTTP ${getRes.status}` };
    }

    return { ok: false, status: headRes.status, error: `HTTP ${headRes.status}` };
  } catch (err: any) {
    if (err?.name === "TimeoutError" || err?.name === "AbortError") {
      return { ok: false, error: "Timeout kết nối (>4.5s)" };
    }
    return { ok: false, error: err?.message || "Lỗi kết nối mạng" };
  }
}

/**
 * Run health check across featured and latest updated movies
 */
export async function runStreamHealthCheck(limitMovies = 6): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const config = getSiteConfig();

  // 1. Collect target movie slugs
  const targetSlugs = new Set<string>();

  // Featured slugs from config
  if (Array.isArray(config.featuredSlugs)) {
    for (const slug of config.featuredSlugs.slice(0, 4)) {
      if (slug) targetSlugs.add(slug);
    }
  }

  // Fetch newly updated movies from PhimAPI to test current trends
  try {
    const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=8", {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimHealthChecker/2.0",
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        for (const item of data.items) {
          if (item?.slug && targetSlugs.size < limitMovies) {
            targetSlugs.add(item.slug);
          }
        }
      }
    }
  } catch {
    // ignore
  }

  const slugsToCheck = Array.from(targetSlugs).slice(0, limitMovies);
  const brokenList: BrokenStreamItem[] = [];
  let totalStreamsChecked = 0;
  let healthyCount = 0;

  // Retrieve existing pending reports to avoid duplicating
  const allReports = await getReports(100);
  const existingReports = allReports.filter((r) => r.status === "pending");
  const existingPendingKeys = new Set(
    existingReports.map((r) => `${r.movieSlug}_${r.episodeName || ""}_${r.serverName || ""}`.toLowerCase())
  );

  for (const slug of slugsToCheck) {
    try {
      const movieRes = await fetch(`https://phimapi.com/phim/${slug}`, {
        signal: AbortSignal.timeout(5000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HiPhimHealthChecker/2.0",
        },
      });

      if (!movieRes.ok) continue;
      const movieData = await movieRes.json();
      const movie = movieData?.movie;
      const episodesList = movieData?.episodes || [];
      const movieName = movie?.name || slug;

      if (!Array.isArray(episodesList)) continue;

      for (const server of episodesList) {
        const serverName = server?.server_name || "Mặc định";
        const serverData = server?.server_data;
        if (!Array.isArray(serverData) || serverData.length === 0) continue;

        // Test the first episode of this server
        const firstEp = serverData[0];
        const epName = firstEp?.name ? `Tập ${firstEp.name}` : "Tập 1";
        const streamUrl = firstEp?.link_m3u8 || firstEp?.link_embed;

        if (streamUrl) {
          totalStreamsChecked++;
          const checkRes = await pingStreamUrl(streamUrl);

          if (checkRes.ok) {
            healthyCount++;
          } else {
            const item: BrokenStreamItem = {
              movieName,
              movieSlug: slug,
              episodeName: epName,
              serverName,
              streamUrl,
              errorReason: checkRes.error || `HTTP ${checkRes.status}`,
            };
            brokenList.push(item);

            // Auto-create report if not already in pending
            const reportKey = `${slug}_${epName}_${serverName}`.toLowerCase();
            if (!existingPendingKeys.has(reportKey)) {
              existingPendingKeys.add(reportKey);
              try {
                const autoRepairEnabled = config.autoRepair?.enabled !== false;
                const autoResolve = config.autoRepair?.autoResolveReports !== false;
                
                // If the movie has other valid servers, auto-repair can resolve it immediately
                const hasAlternativeServers = episodesList.some(
                  (altS: any) => altS?.server_name !== serverName && Array.isArray(altS?.server_data) && altS.server_data.length > 0
                );

                const shouldAutoResolve = autoRepairEnabled && autoResolve && hasAlternativeServers;
                const resolvedStatus = shouldAutoResolve ? "resolved" : "pending";
                const desc = shouldAutoResolve
                  ? `[🤖 Hệ Thống Quét Tự Động] Phát hiện cảnh báo nguồn phát (${checkRes.error || "HTTP " + checkRes.status}). [⚡ Đã Tự Động Sửa] Hệ thống đã tự động định tuyến sang máy chủ phát dự phòng hoạt động ổn định.`
                  : `[🤖 Hệ Thống Quét Tự Động] Server nguồn phát phản hồi lỗi (${checkRes.error || "Mã HTTP: " + checkRes.status}). Cần kiểm tra hoặc thay thế server phát.`;

                const created = await createReport({
                  movieSlug: slug,
                  movieName,
                  episodeName: epName,
                  serverName,
                  issueType: "link_die",
                  description: desc,
                  userName: "🤖 Hệ Thống Quét Tự Động (Auto Health-Check)",
                  userEmail: "system-scanner@hiphim.one",
                });

                if (shouldAutoResolve && created?.id) {
                  const { updateReportStatus } = await import("@/lib/report-store");
                  await updateReportStatus(created.id, "resolved");
                }
              } catch (reportErr) {
                console.warn("[HealthCheck] Failed to auto create report:", reportErr);
              }
            }
          }
        }
      }
    } catch {
      // ignore single movie error and continue
    }
  }

  return {
    totalMoviesChecked: slugsToCheck.length,
    totalStreamsChecked,
    healthyCount,
    brokenCount: brokenList.length,
    brokenList,
    durationMs: Date.now() - startTime,
  };
}
