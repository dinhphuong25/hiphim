"use client";

import { useWatchHistory } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import MovieSection from "@/components/movie-section";
import { filterHiddenMovies } from "@/lib/hidden-movies";
import { isClientAdmin } from "@/lib/vietnam-copyright";

interface RecentlyWatchedProps {
  limit?: number;
}

export default function RecentlyWatched({ limit }: RecentlyWatchedProps) {
  const { user } = useUserAuth();
  const { history, hydrated } = useWatchHistory();

  if (!user || !hydrated || history.length === 0) return null;

  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "superadmin")) || isClientAdmin();
  const visibleHistory = filterHiddenMovies(history, { isAdmin });
  if (visibleHistory.length === 0) return null;

  const movies = limit ? visibleHistory.slice(0, limit) : visibleHistory;

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