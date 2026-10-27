import { MetadataRoute } from "next";
import PhimApi from "@/libs/phimapi.com";

export const revalidate = 3600; // Re-generate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hiphim.one";
  const api = new PhimApi();

  try {
    // Fetch multiple pages of movies for comprehensive coverage
    const [page1] = await api.newAdding(1);
    const [page2] = await api.newAdding(2);
    const [page3] = await api.newAdding(3);
    const [page4] = await api.newAdding(4);
    const [page5] = await api.newAdding(5);
    const allMovies = [...page1, ...page2, ...page3, ...page4, ...page5];

    const categories = await api.listCategories();
    const topics = api.listTopics();

    // Core pages — highest priority
    const routes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/new-updates`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/favorites`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/recently`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      },
    ];

    // Topic pages — important for category SEO
    const topicRoutes: MetadataRoute.Sitemap = topics.map((topic: any) => ({
      url: `${baseUrl}/?topic=${topic.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Category pages
    const categoryList = Array.isArray(categories) ? categories : [];
    const categoryRoutes: MetadataRoute.Sitemap = categoryList.map((category: any) => ({
      url: `${baseUrl}/?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Movie watch pages — each movie gets indexed directly
    const movieRoutes: MetadataRoute.Sitemap = allMovies.map((movie: any) => ({
      url: `${baseUrl}/watch?slug=${movie.slug}`,
      lastModified: movie.modified_time ? new Date(movie.modified_time) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...routes, ...topicRoutes, ...categoryRoutes, ...movieRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
    ];
  }
}
