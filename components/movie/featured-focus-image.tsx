"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Film } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { getMovieImageCandidates, STATIC_BLUR_DATA_URL } from "@/lib/image-helper";

interface FeaturedFocusImageProps {
  movie: {
    name: string;
    thumb_url?: string;
    poster_url?: string;
  };
}

export default function FeaturedFocusImage({ movie }: FeaturedFocusImageProps) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: "80px 0px",
  });

  const candidates = useMemo(
    () => getMovieImageCandidates(movie, "backdrop"),
    [movie.thumb_url, movie.poster_url]
  );

  const src = !hasError && candidates.length > 0 ? candidates[candidateIdx] : null;

  if (!inView || !src) {
    return (
      <div ref={inViewRef} className="w-full h-full bg-[#0c1310] flex flex-col items-center justify-center p-4 text-center">
        <Film className="w-10 h-10 text-brand-green/70 mb-2" />
        <span className="text-sm font-bold text-white/90 line-clamp-1">{movie.name}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={movie.name}
      fill
      quality={75}
      placeholder="blur"
      blurDataURL={STATIC_BLUR_DATA_URL}
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      sizes="(max-width: 1024px) 100vw, 33vw"
      onError={() => {
        if (candidateIdx + 1 < candidates.length) setCandidateIdx((i) => i + 1);
        else setHasError(true);
      }}
    />
  );
}
