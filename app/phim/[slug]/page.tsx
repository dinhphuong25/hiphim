import { cache } from "react";
import PhimApi from "@/libs/phimapi.com";
import { HIDDEN_MOVIE_SLUGS } from "@/lib/hidden-movies";
import { MovieStructuredData, BreadcrumbStructuredData } from "@/components/seo/structured-data";
import MovieDetailView from "@/components/movie/movie-detail-view";
import { MovieDetailClientRescue, TrueNotFoundCard } from "@/components/movie/movie-client-rescue";

// Request-level memoization via React cache() — avoids double JSON serialization on Cloudflare Workers
const getMovie = cache(async (slug: string) => {
  const api = new PhimApi();
  return api.get(slug);
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug || HIDDEN_MOVIE_SLUGS.includes(slug)) return { title: "Chi Tiết Phim | Hi Phim" };

  try {
    const { movie } = await getMovie(slug);

    const posterUrl = movie.poster_url?.startsWith("http")
      ? movie.poster_url
      : `https://phimimg.com/${movie.poster_url}`;

    return {
      title: `${movie.name} - Thông Tin & Xem Phim HD | Hi Phim`,
      description: movie.content?.substring(0, 160) || `Xem phim ${movie.name} HD miễn phí tại Hi Phim`,
      openGraph: {
        title: `${movie.name} - Hi Phim`,
        description: movie.content?.substring(0, 200),
        images: [{ url: posterUrl, width: 300, height: 450, alt: movie.name }],
      },
      alternates: { canonical: `https://hiphim.one/phim/${slug}` },
    };
  } catch {
    return { title: "Chi Tiết Phim | Hi Phim" };
  }
}

export default async function PhimDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug || HIDDEN_MOVIE_SLUGS.includes(slug)) {
    return <TrueNotFoundCard />;
  }

  let movie: any = null;
  let episodes: any[] = [];
  try {
    const data = await getMovie(slug);
    movie = data?.movie || null;
    episodes = data?.server || (data as any)?.episodes || [];
  } catch {
    // Server fetch timed out or rate-limited on Worker — hand off to Client Rescue
    return <MovieDetailClientRescue slug={slug} />;
  }

  if (!movie) {
    return <MovieDetailClientRescue slug={slug} />;
  }

  return (
    <>
      <MovieStructuredData movie={movie} url={`https://hiphim.one/phim/${slug}`} />
      <BreadcrumbStructuredData
        items={[
          { name: "Trang chủ", url: "https://hiphim.one" },
          { name: movie.name, url: `https://hiphim.one/phim/${slug}` },
        ]}
      />
      <MovieDetailView movie={movie} episodes={episodes} />
    </>
  );
}
