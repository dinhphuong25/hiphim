export const revalidate = 600; // Cache search results at Edge for 10 minutes
import PhimApi from "@/libs/phimapi.com";
import { MovieCardEditorial } from "@/components/movie/movie-card-editorial";
import AdvancedSearchFilter from "@/components/movie/advanced-search-filter";
import Pagination from "@/components/pagination";
import { Search, Film } from "lucide-react";
import Link from "next/link";
import { getCachedCategories, getCachedCountries } from "@/lib/data";

type SearchPageProps = {
  searchParams: Promise<{
    index?: string;
    query?: string;
    category?: string;
    country?: string;
    typeList?: string;
    sortField?: string;
    sortType?: string;
    year?: string;
  }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const index = params.index ? parseInt(params.index) : 1;
  const query = params.query;
  const postTitle = query ? `Kết quả cho "${query}"` : "Tìm kiếm Nâng cao";

  const titleText =
    `${postTitle} | Hi Phim` + (index > 1 ? " - Trang " + index : "");
  return {
    title: titleText,
    description:
      "Khám phá kho tàng phim ảnh chất lượng cao với hình ảnh và âm thanh hoàn hảo. Trải nghiệm những tác phẩm điện ảnh kinh điển với chất lượng tuyệt đỉnh.",
    keywords: `${query || "phim ảnh"}, phim ảnh, phim chất lượng cao, phim hd, phim kinh điển`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const index = params.index ? parseInt(params.index) : 1;
  const query = params.query;
  const { category, country, typeList, year, sortField, sortType } = params;
  
  const api = new PhimApi();
  const topics = api.listTopics();
  const [categories, countries] = await Promise.all([
    getCachedCategories(),
    getCachedCountries(),
  ]);
  
  let movies: any[] = [], pageInfo: any = null;

  try {
    if (query) {
      [movies, pageInfo] = await api.search(query, index);
    } else if (category || country || typeList || year) {
      [movies, pageInfo] = await api.getFilteredList({
        typeList: typeList || "phim-bo",
        page: index,
        category,
        country,
        year: year ? parseInt(year) : undefined,
        sortField: sortField || "modified.time",
        sortType: sortType || "desc",
        limit: 20
      });
    } else {
      // Default fallback
      [movies, pageInfo] = await api.newAdding(index);
    }
  } catch (err) {
    console.error("Search API fetch error:", err);
    movies = [];
    pageInfo = null;
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-24 pb-16">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-12">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center">
                <Search className="w-5 h-5 text-brand-green" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider">
                {query ? "Kết quả tìm kiếm" : "Lọc nâng cao"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-cinema-text-muted mt-1 font-medium">
              {query && <span>Từ khóa: <span className="text-brand-green">"{query}"</span></span>}
              {category && <span>Thể loại: <span className="text-white/80">{category}</span></span>}
              {country && <span>Quốc gia: <span className="text-white/80">{country}</span></span>}
              {year && <span>Năm: <span className="text-white/80">{year}</span></span>}
              
              {movies && movies.length > 0 ? (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-brand-green">Tìm thấy {movies.length} kết quả</span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">Không có kết quả</span>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filter */}
        <div className="mb-10">
          <AdvancedSearchFilter 
            categories={Array.isArray(categories) ? categories : []}
            countries={Array.isArray(countries) ? countries : []}
          />
        </div>

        {/* Movie Grid */}
        {movies && movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {movies.map((movie: any, idx: number) => (
              <MovieCardEditorial key={movie.slug} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-cinema-surface border border-white/10 flex items-center justify-center">
              <Film className="w-10 h-10 text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-white/60 text-lg font-bold mb-1">Không tìm thấy phim</p>
              <p className="text-cinema-text-muted text-sm">Thử tìm kiếm với từ khóa hoặc bộ lọc khác</p>
            </div>
            <Link href="/" className="mt-2 px-5 py-2.5 bg-brand-green text-cinema-bg font-extrabold rounded-xl hover:bg-brand-green-hover transition-colors text-sm">
              Về trang chủ
            </Link>
          </div>
        )}

        {/* Pagination */}
        {movies && movies.length > 0 && (
          <div className="mt-16 flex justify-center">
            <div className="bg-cinema-surface rounded-2xl p-4 border border-white/10 shadow-none">
              <Pagination initialPageInfo={pageInfo} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
