import { normalizeImageUrl } from "@/lib/image-helper";
import { isSlugHidden } from "@/lib/hidden-movies";

export interface RescuedMovieData {
  movie: any;
  episodes: any[];
}

function normalizeTitleForMatch(str: string | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function hasAnyM3u8Stream(episodes: any[]): boolean {
  if (!Array.isArray(episodes)) return false;
  return episodes.some(
    (s: any) =>
      Array.isArray(s?.server_data) &&
      s.server_data.some((ep: any) => {
        const m3u8 = ep?.link_m3u8?.trim() || "";
        const embed = ep?.link_embed?.trim() || "";
        return m3u8 !== "" || embed.includes(".m3u8");
      })
  );
}

export function injectM3u8IntoServers(targetServers: any[], m3u8Servers: any[]): any[] {
  if (!Array.isArray(m3u8Servers) || m3u8Servers.length === 0) return targetServers || [];
  if (!Array.isArray(targetServers) || targetServers.length === 0) return m3u8Servers;

  const primaryEpList = m3u8Servers[0]?.server_data || [];
  if (primaryEpList.length === 0) return targetServers;

  return targetServers.map((server: any, sIdx: number) => {
    const donorEpList = m3u8Servers[sIdx]?.server_data || primaryEpList;
    const updatedData = (server?.server_data || []).map((ep: any, epIdx: number) => {
      if (ep?.link_m3u8 && ep.link_m3u8.trim() !== "") return ep;
      const matchedDonor =
        donorEpList[epIdx] ||
        donorEpList.find((d: any) => d?.slug === ep?.slug) ||
        donorEpList[0];
      if (matchedDonor?.link_m3u8) {
        return {
          ...ep,
          link_m3u8: matchedDonor.link_m3u8,
        };
      }
      return ep;
    });
    return {
      ...server,
      server_data: updatedData,
    };
  });
}

/**
 * Fetches primary movie & m3u8 streams directly from the user's browser to phimapi.com.
 * Because phimapi.com sets Access-Control-Allow-Origin: *, residential/4G client IPs
 * bypass Cloudflare Worker datacenter rate-limits completely.
 */
export async function fetchPrimaryPhimApiClient(
  slug: string,
  movieName?: string,
  originName?: string
): Promise<RescuedMovieData | null> {
  const cleanSlug = decodeURIComponent(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug || isSlugHidden(cleanSlug)) return null;

  // 1. Direct slug lookup on phimapi.com
  try {
    const directRes = await fetch(`https://phimapi.com/phim/${cleanSlug}`);
    if (directRes.ok) {
      const data = await directRes.json();
      const episodes = data?.episodes || data?.server || [];
      if (data?.movie?.slug && hasAnyM3u8Stream(episodes)) {
        return {
          movie: {
            ...data.movie,
            thumb_url: normalizeImageUrl(data.movie.thumb_url),
            poster_url: normalizeImageUrl(data.movie.poster_url),
          },
          episodes,
        };
      }
    }
  } catch {}

  // 2. If slug differed (e.g. NguonC slug), search phimapi.com by movie name / origin_name
  const keywords = [movieName, originName, cleanSlug.replace(/-/g, " ")].filter(
    (k, i, arr) => Boolean(k && k.trim()) && arr.indexOf(k) === i
  ) as string[];

  for (const kw of keywords) {
    try {
      const searchUrl = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw.trim())}&limit=5`;
      const sRes = await fetch(searchUrl);
      if (!sRes.ok) continue;
      const sData = await sRes.json();
      const items: any[] = sData?.data?.items || sData?.items || [];
      if (!Array.isArray(items) || items.length === 0) continue;

      const normName = normalizeTitleForMatch(movieName);
      const normOrigin = normalizeTitleForMatch(originName);

      const matched =
        items.find((it: any) => {
          const itName = normalizeTitleForMatch(it?.name);
          const itOrigin = normalizeTitleForMatch(it?.origin_name);
          return (
            it?.slug === cleanSlug ||
            (normName && (itName === normName || itOrigin === normName)) ||
            (normOrigin && (itOrigin === normOrigin || itName === normOrigin))
          );
        }) || items[0];

      if (matched?.slug) {
        const detailRes = await fetch(`https://phimapi.com/phim/${matched.slug}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const episodes = detailData?.episodes || detailData?.server || [];
          if (detailData?.movie?.slug && hasAnyM3u8Stream(episodes)) {
            return {
              movie: {
                ...detailData.movie,
                thumb_url: normalizeImageUrl(detailData.movie.thumb_url),
                poster_url: normalizeImageUrl(detailData.movie.poster_url),
              },
              episodes,
            };
          }
        }
      }
    } catch {}
  }

  return null;
}

export async function fetchMovieClientSide(slug: string): Promise<RescuedMovieData | null> {
  const cleanSlug = decodeURIComponent(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug || isSlugHidden(cleanSlug)) return null;

  // 1. PRIORITY #1: Direct browser fetch from phimapi.com (residential/4G IP, always returns m3u8 Default Player)
  const primaryDirect = await fetchPrimaryPhimApiClient(cleanSlug);
  if (primaryDirect) {
    return primaryDirect;
  }

  let fallbackCandidate: RescuedMovieData | null = null;

  // 3. Direct browser fetch from NguonC fallback
  if (!fallbackCandidate) {
    try {
      const fbRes = await fetch(`https://phim.nguonc.com/api/film/${cleanSlug}`);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        const fbMovie = fbData?.movie;
        if (fbMovie && fbMovie.slug) {
          const mappedMovie = {
            name: fbMovie.name,
            slug: fbMovie.slug,
            origin_name: fbMovie.original_name,
            content: fbMovie.description,
            thumb_url: normalizeImageUrl(fbMovie.poster_url || fbMovie.thumb_url),
            poster_url: normalizeImageUrl(fbMovie.thumb_url || fbMovie.poster_url),
            year: fbMovie.created ? new Date(fbMovie.created).getFullYear() : 2026,
            episode_current: fbMovie.current_episode,
            quality: fbMovie.quality || "HD",
            lang: fbMovie.language || "Vietsub",
          };
          const mappedEpisodes = (fbMovie.episodes || []).map((s: any, idx: number) => ({
            server_name: s.server_name ? `Dự Phòng (${s.server_name})` : `Dự Phòng ${idx > 0 ? idx + 1 : ""}`.trim(),
            server_data: (s.items || []).map((it: any) => ({
              name: it.name?.startsWith("Tập") ? it.name : `Tập ${it.name}`,
              slug: it.slug,
              filename: it.name,
              link_embed: it.embed,
              link_m3u8: "",
            })),
          }));
          fallbackCandidate = {
            movie: mappedMovie,
            episodes: mappedEpisodes,
          };
        }
      }
    } catch {}
  }

  // 4. If we got a NguonC fallback (which lacks m3u8), resolve m3u8 from phimapi.com by movie name so it uses the Default Player UI!
  if (fallbackCandidate) {
    const resolvedByTitle = await fetchPrimaryPhimApiClient(
      cleanSlug,
      fallbackCandidate.movie?.name,
      fallbackCandidate.movie?.origin_name
    );
    if (resolvedByTitle && hasAnyM3u8Stream(resolvedByTitle.episodes)) {
      return {
        movie: {
          ...fallbackCandidate.movie,
          ...resolvedByTitle.movie,
          slug: fallbackCandidate.movie.slug || cleanSlug,
        },
        episodes: injectM3u8IntoServers(resolvedByTitle.episodes, resolvedByTitle.episodes),
      };
    }
    return fallbackCandidate;
  }

  return null;
}
