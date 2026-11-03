import { cache, Suspense, Fragment } from "react";
import PhimApi from "@/libs/phimapi.com";
import Description from "@/components/movie/description";
import { MovieStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import { HIDDEN_MOVIE_SLUGS } from "@/lib/hidden-movies";
import { LoadingWatch } from "@/components/ui/page-loaders";
import { normalizeImageUrl } from "@/lib/image-helper";
import { WatchClientRescue, TrueNotFoundCard } from "@/components/movie/movie-client-rescue";

// Request-level memoization via React cache() — shares the exact same parsed JS object
// between generateMetadata() and WatchContent() without double JSON serialization on Cloudflare Workers
const getMovieData = cache(async (slug: string) => {
  const api = new PhimApi();
  return api.get(slug);
});

export async function generateMetadata({ searchParams }: any) {
  const { slug } = await searchParams;
  if (!slug || HIDDEN_MOVIE_SLUGS.includes(slug)) return { title: "Xem phim | Hi Phim" };

  try {
    const data = await getMovieData(slug);
    const movie = data?.movie;
    if (!movie?.name) return { title: "Xem phim | Hi Phim" };
    const watchUrl = `https://hiphim.one/watch?slug=${slug}`;
    const canonicalUrl = watchUrl;

    const posterUrl = normalizeImageUrl(movie.poster_url);
    const thumbUrl = normalizeImageUrl(movie.thumb_url);

    const ogParams = new URLSearchParams({
      title: movie.name || "",
      origin_name: movie.origin_name || "",
      year: String(movie.year || ""),
      quality: movie.quality || "Full HD",
      ep: movie.episode_current || "",
      poster: thumbUrl || posterUrl || "",
    });
    const dynamicOgUrl = `https://hiphim.one/api/og?${ogParams.toString()}`;

    return {
      title: `${movie.name} - Xem phim HD chất lượng cao | Hi Phim`,
      description: movie.content
        ? movie.content.substring(0, 160) + "..."
        : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
      openGraph: {
        title: `${movie.name} - Xem phim HD chất lượng cao`,
        description: movie.content
          ? movie.content.substring(0, 160) + "..."
          : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
        url: watchUrl,
        siteName: "Hi Phim",
        images: [
          {
            url: dynamicOgUrl,
            width: 1200,
            height: 630,
            alt: `${movie.name} - Hi Phim`,
          },
          ...(posterUrl ? [{ url: posterUrl, width: 300, height: 450, alt: movie.name }] : []),
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.name} - Xem phim HD`,
        description: movie.content
          ? movie.content.substring(0, 160) + "..."
          : `Xem phim ${movie.name} HD chất lượng cao miễn phí tại Hi Phim.`,
        images: [dynamicOgUrl],
      },
      alternates: { canonical: canonicalUrl },
    };
  } catch {
    return { title: "Xem phim | Hi Phim" };
  }
}

export default async function WatchPage({ searchParams }: any) {
  const { slug, ep, sv } = await searchParams;

  if (!slug || HIDDEN_MOVIE_SLUGS.includes(slug)) {
    return <TrueNotFoundCard />;
  }

  return (
    <Suspense fallback={<LoadingWatch />}>
      <WatchContent slug={slug} ep={ep} sv={sv} />
    </Suspense>
  );
}

async function WatchContent({ slug, ep, sv }: { slug: string; ep?: string; sv?: string }) {
  let movie: any = null;
  let server: any = [];

  try {
    const data = await getMovieData(slug);
    movie = data?.movie || null;
    server = data?.server || [];
  } catch {
    return <WatchClientRescue slug={slug} />;
  }

  if (!movie?.name) {
    return <WatchClientRescue slug={slug} />;
  }

  const breadcrumbItems = [
    { name: "Trang chủ", url: "/" },
    { name: "Xem phim", url: "/watch" },
    { name: movie.name, url: `/watch?slug=${slug}`, current: true },
  ];

  const structuredBreadcrumbItems = breadcrumbItems.map((item) => ({
    name: item.name,
    url: `https://hiphim.one${item.url}`,
  }));

  let targetM3u8 = "";
  if (server && Array.isArray(server) && server.length > 0) {
    const svIndex = sv ? parseInt(sv, 10) : 0;
    const activeServer = svIndex >= 0 && svIndex < server.length ? server[svIndex] : server[0];
    const episodes = activeServer?.server_data || [];
    if (ep) {
      const parsedEp = parseInt(ep, 10);
      if (!isNaN(parsedEp) && parsedEp > 0) {
        const epIdx = parsedEp - 1;
        if (epIdx >= 0 && epIdx < episodes.length) {
          targetM3u8 = episodes[epIdx]?.link_m3u8 || "";
        } else {
          const matched = episodes.find((e: any) => {
            const num = parseInt(e.name?.match(/\d+/)?.[0] || "-1", 10);
            return num === parsedEp;
          });
          if (matched) targetM3u8 = matched.link_m3u8 || "";
        }
      } else {
        const matched = episodes.find(
          (e: any) => e.slug === ep || e.name?.toLowerCase() === String(ep).toLowerCase()
        );
        if (matched) targetM3u8 = matched.link_m3u8 || "";
      }
    }
    if (!targetM3u8 && episodes.length > 0) {
      targetM3u8 = episodes[0]?.link_m3u8 || "";
    }
  }

  let m3u8Origin = "";
  if (targetM3u8) {
    try {
      m3u8Origin = new URL(targetM3u8).origin;
    } catch {}
  }

  const cdnOrigins = [
    m3u8Origin,
    "https://s1.phimapi.com",
    "https://s2.phimapi.com",
    "https://s3.phimapi.com",
    "https://vip.opstream16.com",
    "https://vip.opstream17.com",
    "https://vip.opstream18.com",
    "https://phimimg.com",
    "https://img.phimapi.com",
    "https://player.phimapi.com",
  ].filter((orig, idx, self) => orig && self.indexOf(orig) === idx);

  return (
    <div className="min-h-screen bg-cinema-bg text-white selection:bg-brand-green selection:text-cinema-bg">
      {cdnOrigins.map((orig) => (
        <Fragment key={orig}>
          <link rel="dns-prefetch" href={orig} />
          <link rel="preconnect" href={orig} crossOrigin="anonymous" />
        </Fragment>
      ))}
      <main className="relative z-10 min-h-0 sm:min-h-screen flex flex-col w-full">
        <MovieStructuredData movie={movie} url={`https://hiphim.one/watch?slug=${slug}`} />
        <BreadcrumbStructuredData items={structuredBreadcrumbItems} />

        <div className="w-full max-w-[1920px] mx-auto pb-3 sm:pb-16 px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col">
          <Description movie={movie} serverData={server} slug={slug} thumb_url={movie.thumb_url} />
        </div>
      </main>
    </div>
  );
}
