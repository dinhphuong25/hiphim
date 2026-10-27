export const revalidate = 300; // Cache 5 minutes at Edge CDN
import MovieListClient from "@/components/movie/movie-list-client";

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

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-24 pb-20">
        <MovieListClient index={index} />
      </div>
    </>
  );
}