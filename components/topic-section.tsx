import MovieSection from "@/components/movie-section";

interface TopicSectionProps {
  topic: {
    name: string;
    slug: string;
  };
  movies: any[];
}

export default function TopicSection({ topic, movies }: TopicSectionProps) {
  return (
    <MovieSection
      indexNumber="00"
      title={topic.name}
      movies={movies}
      viewAllLink={`/?topic=${topic.slug}`}
      variant="carousel"
    />
  );
}
