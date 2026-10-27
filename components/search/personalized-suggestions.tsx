"use client";

import { useEffect, useState } from "react";
import MovieMinimalCard from "@/components/movie/movie-minimal";
import PhimApi from "@/libs/phimapi.com";
import { cn } from "@/lib/utils";

interface PersonalizedSuggestionsProps {
  limit?: number;
  title?: string;
}

export default function PersonalizedSuggestions({
  limit = 6,
  title = "Dành Cho Bạn",
}: PersonalizedSuggestionsProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchedCategories, setWatchedCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPersonalized() {
      try {
        setIsLoading(true);

        // Get watched movies from cookies
        const Cookies = require("js-cookie");
        const recentlyWatched = JSON.parse(
          Cookies.get("recentlyWatched") || "[]"
        );

        if (recentlyWatched.length === 0) {
          // Fallback to trending if no watch history
          const api = new PhimApi();
          const [trendingMovies] = await api.getFilteredList({
            typeList: "phim-bo",
            page: 1,
            sortField: "view",
            sortType: "desc",
            limit: limit,
          });
          setMovies(trendingMovies || []);
          return;
        }

        // Analyze watched categories from recent watches
        const lastWatched = recentlyWatched[0];
        const api = new PhimApi();

        if (lastWatched?.slug) {
          try {
            const { movie } = await api.get(lastWatched.slug);

            if (movie?.category && movie.category.length > 0) {
              const categorySlug = movie.category[0].slug;
              setWatchedCategories([categorySlug]);

              // Fetch similar movies
              const [similarMovies] = await api.byCategory(categorySlug, 1);
              const filtered = (similarMovies || [])
                .filter((m: any) => m.slug !== lastWatched.slug)
                .slice(0, limit);

              setMovies(filtered);
            }
          } catch {
            // Fallback to trending
            const [trendingMovies] = await api.getFilteredList({
              typeList: "phim-bo",
              page: 1,
              sortField: "modified.time",
              sortType: "desc",
              limit: limit,
            });
            setMovies(trendingMovies || []);
          }
        }
      } catch (error) {
        console.error("Error fetching personalized suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPersonalized();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-lg w-40 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!movies.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
        </div>
        {watchedCategories.length > 0 && (
          <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30">
            Dựa trên lịch sử xem
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {movies.map((movie: any, idx: number) => (
          <div
            key={`${movie.slug}-${idx}`}
            className="aspect-[2/3]"
            style={{
              animation: `fadeInUp 0.5s ease-out ${idx * 0.05}s both`,
            }}
          >
            <MovieMinimalCard movie={movie} />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
