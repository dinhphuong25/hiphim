import { MovieGridSkeleton } from "@/components/movie/movie-skeleton";

export default function NewUpdatesLoading() {
  return (
    <div className="w-full px-3.5 sm:px-6 lg:px-6 xl:px-8 pt-20 pb-20">
      <div className="pt-2 sm:pt-4 px-1 sm:px-0">
        <MovieGridSkeleton count={10} />
      </div>
    </div>
  );
}
