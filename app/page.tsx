// ISR: trang chủ được cache tĩnh 300s (5 phút), tiết kiệm CPU và băng thông Origin
export const revalidate = 300;

import MovieListClient from "@/components/movie/movie-list-client";
import HomeClient from "@/components/home-client";

import {
  getCachedCategories,
  getCachedCountries,
  getCachedFeaturedMovies,
  getCachedNewUpdates,
  getCachedTopicMovies,
  getCachedFilteredMovies,
} from "@/lib/data";
import ReactDOM from "react-dom";
import { getMovieImageCandidates } from "@/lib/image-helper";
import { getSiteConfig } from "@/lib/site-config";

type HomeProps = {
  searchParams: Promise<{
    index?: string | number;
    category?: string;
    topic?: string;
    typeList?: string;
    sortField?: string;
    sortType?: string;
    sortLang?: string;
    country?: string;
    year?: string;
    limit?: string;
  }>;
};

const TOPICS = [
  { name: "Chương Trình Truyền Hình", slug: "phim-bo" },
  { name: "Phim Điện Ảnh", slug: "phim-le" },
  { name: "Phim Hoạt Hình", slug: "hoat-hinh" },
];

export async function generateMetadata({ searchParams }: HomeProps) {
  const params = await searchParams;
  const index = Number(params.index) || 1;
  const category = params.category;
  const topic = params.topic;
  const typeList = params.typeList || (params as any).typelist;
  const country = params.country;
  const year = params.year;

  let postTitle: { name: string } | undefined;

  if (typeList) {
    postTitle = { name: "Kết quả Lọc" };
  } else if (topic) {
    postTitle = TOPICS.find((t) => t.slug === topic);
  } else if (category) {
    const categories = await getCachedCategories();
    postTitle = (categories as any[]).find((c: any) => c.slug === category);
  } else if (year) {
    postTitle = { name: `Phim Năm ${year}` };
  } else if (country) {
    postTitle = { name: `Phim ${country}` };
  }

  const titleText =
    (postTitle ? `${postTitle.name} | ` : "") +
    "Hi Phim - Xem Phim Online HD Miễn Phí" +
    (index > 1 ? " - Trang " + index : "");

  return {
    title: titleText,
    description:
      "Hi Phim - Trang xem phim online HD miễn phí hàng đầu. Kho 50,000+ phim bộ, phim lẻ, anime vietsub cập nhật mới nhất 2026. Tốc độ nhanh, không quảng cáo.",
    keywords:
      "hi phim, hiphim, xem phim online, phim HD miễn phí, phim mới nhất, phim bộ hay, anime vietsub, phim Hàn Quốc, phim hành động",
    openGraph: {
      title: postTitle ? `${postTitle.name} | Hi Phim` : "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
      description:
        "Kho 50,000+ phim bộ, phim lẻ chiếu rạp, anime vietsub mới nhất 2026. Tốc độ cao, chuẩn Full HD/4K, cập nhật liên tục hàng ngày.",
      url: "https://hiphim.one",
      siteName: "Hi Phim",
      type: "website",
      locale: "vi_VN",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
        },
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: postTitle ? `${postTitle.name} | Hi Phim` : "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
      description:
        "Kho 50,000+ phim bộ, phim lẻ chiếu rạp, anime vietsub mới nhất 2026. Tốc độ cao, chuẩn Full HD/4K, cập nhật liên tục hàng ngày.",
      images: ["/og-image.jpg"],
    },
  };
}


export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const index = Number(params.index) || 1;
  const category = params.category;
  const topic = params.topic;
  const typeList = params.typeList || (params as any).typelist;
  const hasFilters = Boolean(typeList || category || topic || params.country || params.year);

  // Fetch navigation data in parallel — all cached, near-instant after first request
  const [categories, countries] = await Promise.all([
    getCachedCategories(),
    getCachedCountries(),
  ]);

  // Only fetch home page data when no filters active
  let initialMovies: any[] = [];
  let featuredMovies: any[] = [];
  let topicsWithMovies: any[] = [];

  // When filters active, pre-hydrate movies on server so user NEVER sees an empty loading screen
  let initialFilteredMovies: any[] = [];
  let initialPageInfo: any = null;

  if (hasFilters) {
    const filterData = await getCachedFilteredMovies({
      typeList,
      category,
      topic,
      country: params.country,
      year: params.year,
      page: index,
      sortField: params.sortField,
      sortType: params.sortType,
      sortLang: params.sortLang,
      limit: Number(params.limit) || 20,
    });
    initialFilteredMovies = filterData.items;
    initialPageInfo = filterData.pagination;
  } else {
    // Parallel fetch — all cached separately
    const [newUpdates, featuredList, ...topicMoviesList] = await Promise.all([
      getCachedNewUpdates(),
      getCachedFeaturedMovies(),
      ...TOPICS.map((t) => getCachedTopicMovies(t.slug, 12)),
    ]);

    initialMovies = newUpdates;
    featuredMovies = featuredList;
    topicsWithMovies = TOPICS.map((t, idx) => ({
      ...t,
      movies: topicMoviesList[idx] || [],
    }));

    // Preload hero LCP image directly in initial SSR HTML head
    const firstHero = (featuredMovies && featuredMovies[0]) || (initialMovies && initialMovies[0]);
    if (firstHero) {
      const candidates = getMovieImageCandidates(firstHero, "backdrop");
      if (candidates && candidates[0]) {
        ReactDOM.preload(candidates[0], { as: "image", fetchPriority: "high" });
      }
    }
  }

  const siteConfig = getSiteConfig();

  return (
    <>
      {hasFilters ? (
        <main className="max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pb-20 pt-16 sm:pt-24">
          <MovieListClient
            index={index}
            category={category}
            topic={topic}
            typeList={typeList}
            categories={categories as any[]}
            countries={countries as any[]}
            initialMovies={initialFilteredMovies}
            initialPageInfo={initialPageInfo}
          />
        </main>
      ) : (
        <HomeClient
          initialMovies={initialMovies}
          initialTopicsWithMovies={topicsWithMovies}
          topics={TOPICS}
          featuredMovies={featuredMovies}
          categories={categories as any[]}
        />
      )}
    </>
  );
}
