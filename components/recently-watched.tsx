"use client";

import { useWatchHistory } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import MovieSection from "@/components/movie-section";

interface RecentlyWatchedProps {
  limit?: number;
}

export default function RecentlyWatched({ limit }: RecentlyWatchedProps) {
  const { user } = useUserAuth();
  const { history, hydrated } = useWatchHistory();

  if (!user || !hydrated || history.length === 0) return null;

  const movies = limit ? history.slice(0, limit) : history;

  return (
    <MovieSection
      indexNumber="00"
      title="Đã Xem Gần Đây"
      movies={movies}
      viewAllLink="/recently"
      variant="carousel"
    />
  );
}