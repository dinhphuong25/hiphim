"use client";

import { useEffect, useState } from "react";
import { isSlugHidden } from "@/lib/hidden-movies";
import {
  MovieDetailClientRescue,
  WatchClientRescue,
  TrueNotFoundCard,
} from "@/components/movie/movie-client-rescue";

export default function NotFound() {
  const [rescueRoute, setRescueRoute] = useState<{
    type: "detail" | "watch" | "none";
    slug: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      setRescueRoute({ type: "none", slug: "" });
      return;
    }

    const pathname = window.location.pathname || "";
    const search = window.location.search || "";

    if (pathname.startsWith("/phim/")) {
      const slug = pathname.replace(/^\/phim\//, "").replace(/\/+$/, "").trim();
      if (slug && !isSlugHidden(slug)) {
        setRescueRoute({ type: "detail", slug });
        return;
      }
    }

    if (pathname.startsWith("/watch")) {
      const params = new URLSearchParams(search);
      const slug = params.get("slug")?.trim() || "";
      if (slug && !isSlugHidden(slug)) {
        setRescueRoute({ type: "watch", slug });
        return;
      }
    }

    setRescueRoute({ type: "none", slug: "" });
  }, []);

  if (!rescueRoute) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-3 bg-cinema-bg text-white px-4">
        <div className="w-10 h-10 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin" />
      </div>
    );
  }

  if (rescueRoute.type === "detail" && rescueRoute.slug) {
    return <MovieDetailClientRescue slug={rescueRoute.slug} />;
  }

  if (rescueRoute.type === "watch" && rescueRoute.slug) {
    return <WatchClientRescue slug={rescueRoute.slug} />;
  }

  return <TrueNotFoundCard />;
}
