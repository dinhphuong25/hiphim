"use client";

import { useEffect, useState } from "react";
import MovieMinimalCard from "./movie-minimal";
import PhimApi from "@/libs/phimapi.com";

interface MovieRecommendationsProps {
  currentMovie: any;
  limit?: number;
}

export default function MovieRecommendations({
  currentMovie,
  limit = 6,
}: MovieRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setIsLoading(true);
        const api = new PhimApi();

        // Get first category if available
        if (currentMovie?.category && currentMovie.category.length > 0) {
          const firstCategory = currentMovie.category[0];
          const [movies] = await api.byCategory(firstCategory.slug, 1);

          // Filter out current movie and limit results
          const filtered = movies
            .filter((m: any) => m.slug !== currentMovie.slug)
            .slice(0, limit);

          setRecommendations(filtered);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [currentMovie, limit]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-lg w-32 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-5 bg-brand-green rounded-full shadow-[0_0_8px_rgba(32,214,107,0.8)]" />
        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">Phim tương tự</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {recommendations.map((movie: any, idx: number) => (
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
