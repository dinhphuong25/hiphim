export const revalidate = 300; // Cache 5 minutes at Edge CDN
import MovieListClient from "@/components/movie/movie-list-client";
import { getCachedNewUpdates } from "@/lib/data";

type NewUpdatesProps = {
  searchParams: Promise<{
    index?: string;
  }>;
};

export async function generateMetadata({ searchParams }: NewUpdatesProps) {
  const params = await searchParams;
  const index = Number(params.index) || 1;

  return {
    title: `Mới Cập Nhật | Hi Phim${index > 1 ? " - Trang " + index : ""}`,
    description: "Khám phá những bộ phim mới nhất được cập nhật trên Hi Phim.",
    keywords: "phim mới, phim cập nhật, phim ảnh, phim hd, hi phim, hiphim",
  };
}

export default async function NewUpdatesPage({ searchParams }: NewUpdatesProps) {
  const params = await searchParams;
  const index = Number(params.index) || 1;

  let initialMovies: any[] = [];
  try {
    if (index === 1) {
      initialMovies = await getCachedNewUpdates();
    }
  } catch (err) {
    console.warn("Could not pre-fetch new updates for SSR:", err);
  }

  return (
    <>
      <div className="w-full px-3.5 sm:px-6 lg:px-6 xl:px-8 pt-20 pb-20">
        <MovieListClient index={index} initialMovies={initialMovies} />
      </div>
    </>
  );
}