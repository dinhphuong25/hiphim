"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MovieMinimalCard from "@/components/movie/movie-minimal";
import PhimApi from "@/libs/phimapi.com";
import { cn } from "@/lib/utils";

interface TrendingSuggestionsProps {
  limit?: number;
  title?: string;
}

export default function TrendingSuggestions({
  limit = 8,
  title = "Phim Hot Nhất",
}: TrendingSuggestionsProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "popular">("trending");

  useEffect(() => {
    async function fetchTrending() {
      try {
        setIsLoading(true);
        const api = new PhimApi();

        // Fetch both trending and popular by getting filtered lists
        const [trendingMovies] = await api.getFilteredList({
          typeList: "phim-bo",
          page: 1,
          sortField: "view",
          sortType: "desc",
          limit: limit,
        });

        setMovies(trendingMovies || []);
      } catch (error) {
        console.error("Error fetching trending:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrending();
  }, [limit, activeTab]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-lg w-32 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array(8).fill(0).map((_, i) => (
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
          <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
          <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
        </div>

        {/* Tab Switch */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("trending")}
            className={cn(
              "px-3 py-1 text-xs md:text-sm font-medium rounded transition-all",
              activeTab === "trending"
                ? "bg-red-600 text-white"
                : "text-white/70 hover:text-white"
            )}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab("popular")}
            className={cn(
              "px-3 py-1 text-xs md:text-sm font-medium rounded transition-all",
              activeTab === "popular"
                ? "bg-red-600 text-white"
                : "text-white/70 hover:text-white"
            )}
          >
            Hot
          </button>
        </div>
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
