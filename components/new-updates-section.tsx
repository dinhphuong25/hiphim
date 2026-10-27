import MovieSection from "@/components/movie-section";

interface NewUpdatesSectionProps {
  movies: any[];
}

export default function NewUpdatesSection({ movies }: NewUpdatesSectionProps) {
  return (
    <MovieSection
      indexNumber="00"
      title="Mới Cập Nhật"
      movies={movies}
      viewAllLink="/new-updates"
      variant="carousel"
    />
  );
}