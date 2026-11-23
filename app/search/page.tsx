export const revalidate = 600; // Cache search results at Edge for 10 minutes
import PhimApi from "@/libs/phimapi.com";
import { MovieCardEditorial } from "@/components/movie/movie-card-editorial";
import AdvancedSearchFilter from "@/components/movie/advanced-search-filter";
import Pagination from "@/components/pagination";
import { Search, Film, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { getCachedCategories, getCachedCountries } from "@/lib/data";
import { filterHiddenMovies } from "@/lib/hidden-movies";
import { isVietnameseQuery } from "@/lib/vietnam-copyright";
import type { MovieListItem, Pagination as PaginationInfo } from "@/lib/types";

type SearchPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

function getParam(value?: string | string[]): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

function getPageIndex(value?: string | string[]): number {
  const parsed = Number(getParam(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getYear(value?: string | string[]): number | undefined {
  const parsed = Number(getParam(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const index = getPageIndex(params.index);
  const query = getParam(params.query);
  const postTitle = query ? `Kết quả cho "${query}"` : "Tìm kiếm Nâng cao";

  const titleText =
    `${postTitle} | Hi Phim` + (index > 1 ? " - Trang " + index : "");
  return {
    title: titleText,
    description:
      "Khám phá kho tàng phim ảnh chất lượng cao với hình ảnh và âm thanh hoàn hảo. Trải nghiệm những tác phẩm điện ảnh kinh điển với chất lượng tuyệt đỉnh.",
    keywords: `${query || "phim ảnh"}, phim ảnh, phim chất lượng cao, phim hd, phim kinh điển`,
    openGraph: {
      title: `${postTitle} | Hi Phim`,
      description: "Tìm kiếm phim bộ, phim lẻ, anime vietsub chất lượng cao trên Hi Phim.",
      type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Tìm Kiếm Phim - Hi Phim" }],
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const index = getPageIndex(params.index);
  const query = getParam(params.query);
  const category = getParam(params.category);
  const country = getParam(params.country);
  const typeList = getParam(params.typeList);
  const year = getParam(params.year);
  const sortField = getParam(params.sortField);
  const sortType = getParam(params.sortType);
  
  const api = new PhimApi();
  const categoriesAndCountries = Promise.allSettled([
    getCachedCategories(),
    getCachedCountries(),
  ]);

  let movies: MovieListItem[] = [];
  let pageInfo: PaginationInfo | null = null;
  const isVnBlocked = country === "viet-nam" || isVietnameseQuery(query);

  try {
    if (isVnBlocked) {
      movies = [];
      pageInfo = null;
    } else if (query) {
      const [rawMovies, rawInfo] = await api.search(query, index);
      movies = filterHiddenMovies(rawMovies);
      pageInfo = rawInfo;
    } else if (category || country || typeList || year) {
      const [rawMovies, rawInfo] = await api.getFilteredList({
        typeList: typeList || "phim-bo",
        page: index,
        category,
        country,
        year: getYear(year),
        sortField: sortField || "modified.time",
        sortType: sortType || "desc",
        limit: 20
      });
      movies = filterHiddenMovies(rawMovies);
      pageInfo = rawInfo;
    } else {
      // Default fallback
      const [rawMovies, rawInfo] = await api.newAdding(index);
      movies = filterHiddenMovies(rawMovies);
      pageInfo = rawInfo;
    }
  } catch (err) {
    console.error("Search API fetch error:", err);
    movies = [];
    pageInfo = null;
  }

  const [categoriesResult, countriesResult] = await categoriesAndCountries;
  if (categoriesResult.status === "rejected") {
    console.error("Search categories fetch error:", categoriesResult.reason);
  }
  if (countriesResult.status === "rejected") {
    console.error("Search countries fetch error:", countriesResult.reason);
  }
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const countries = countriesResult.status === "fulfilled" ? countriesResult.value : [];
  movies = filterHiddenMovies(movies).slice(0, 20);

  return (
    <>
      <div className="w-full px-3.5 sm:px-6 lg:px-6 xl:px-8 pt-20 pb-16">
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
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
            {movies.map((movie) => (
              <MovieCardEditorial key={movie.slug} movie={movie} />
            ))}
          </div>
        ) : isVnBlocked ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-full max-w-xl text-center p-6 sm:p-9 rounded-3xl bg-[#0B120E] border border-amber-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.15)] flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/25 via-amber-500/20 to-red-600/10 border border-amber-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <ShieldAlert className="w-7 h-7 text-amber-400 stroke-[2.2]" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-2">
                Bản Quyền Điện Ảnh Việt Nam
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                Không Chiếu Phim Việt Nam
              </h2>
              <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-md mb-6">
                Nhằm tôn trọng và tuân thủ Luật Sở hữu trí tuệ, bảo vệ sự phát triển của điện ảnh nước nhà, <strong className="text-amber-300 font-semibold">Hi Phim cam kết KHÔNG phát sóng và không lưu trữ bất kỳ tác phẩm điện ảnh nào của Việt Nam</strong>. Quý khán giả vui lòng theo dõi tại rạp chiếu phim hoặc các nền tảng có bản quyền chính thức.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-green text-black font-extrabold text-xs sm:text-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_4px_16px_rgba(32,214,107,0.3)]"
                >
                  Khám Phá Phim Quốc Tế
                </Link>
                <Link
                  href="/?typeList=phim-chieu-rap"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/85 hover:text-white border border-white/10 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Phim Chiếu Rạp Quốc Tế
                </Link>
              </div>
            </div>
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
        {movies.length > 0 && (
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
