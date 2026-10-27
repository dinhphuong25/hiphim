"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

interface PaginationProps {
  initialPageInfo?: any;
}

export default React.memo(function PaginationComponent({ initialPageInfo }: PaginationProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = React.useState(false);
  const [pageInfo, setPageInfo] = React.useState<any>(initialPageInfo || null);

  React.useEffect(() => {
    if (initialPageInfo) {
      setPageInfo(initialPageInfo);
      return;
    }

    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.matchMedia("(max-width: 640px)").matches);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [initialPageInfo]);

  React.useEffect(() => {
    if (initialPageInfo) {
      setPageInfo(initialPageInfo);
      return;
    }

    const index = Number(searchParams.get("index")) || 1;
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const topic = searchParams.get("topic");
    const typeList = searchParams.get("typeList");
    const sortField = searchParams.get("sortField");
    const sortType = searchParams.get("sortType");
    const sortLang = searchParams.get("sortLang");
    const country = searchParams.get("country");
    const year = searchParams.get("year");
    const limit = searchParams.get("limit");

    // Check if advanced filters are being used
    const hasAdvancedFilters = typeList || sortField || (category && typeList);

    let url: string;
    if (hasAdvancedFilters) {
      // Use advanced filter API
      const type = typeList || "phim-bo";
      const field = sortField || "modified.time";
      const type_sort = sortType || "desc";
      const lang = sortLang || "vietsub";
      const lim = limit || "10";

      url = `https://phimapi.com/v1/api/danh-sach/${type}?page=${index}&sort_field=${field}&sort_type=${type_sort}&limit=${lim}`;
      if (lang) url += `&sort_lang=${lang}`;
      if (category) url += `&category=${category}`;
      if (country) url += `&country=${country}`;
      if (year) url += `&year=${year}`;
    } else if (query) {
      url = `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(query)}&page=${index}`;
    } else if (category) {
      url = `https://phimapi.com/v1/api/the-loai/${category}?page=${index}`;
    } else if (country) {
      url = `https://phimapi.com/v1/api/quoc-gia/${country}?page=${index}`;
    } else if (year) {
      url = `https://phimapi.com/v1/api/nam-phat-hanh/${year}?page=${index}`;
    } else if (topic) {
      url = `https://phimapi.com/v1/api/danh-sach/${topic}?page=${index}`;
    } else {
      url = `https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${index}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Handle different response structures
        if (hasAdvancedFilters || category || topic || query) {
          setPageInfo(data?.data?.params?.pagination || data?.pagination || null);
        } else {
          setPageInfo(data?.pagination || data?.data?.params?.pagination || null);
        }
      })
      .catch(() => {
        setPageInfo(null);
      });
  }, [searchParams, initialPageInfo]);

  const createQueryString = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("index", page.toString());
    return params.toString();
  };

  if (!pageInfo) return null;

  const getVisiblePages = () => {
    const totalPages = pageInfo.totalPages;
    const currentPage = pageInfo.currentPage;
    const delta = isMobile ? 1 : 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <Pagination>
      <PaginationContent className="justify-center gap-2 py-2">
        <PaginationItem>
          <PaginationPrevious
            href={`${pathname}?${createQueryString(
              Math.max(1, pageInfo.currentPage - 1)
            )}`}
            isActive={pageInfo.currentPage > 1}
            className="rounded-lg px-4 py-2 font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700 border border-white/10 transition-colors"
          />
        </PaginationItem>

        {getVisiblePages().map((page, index) =>
          page === "..." ? (
            <PaginationItem key={index}>
              <PaginationEllipsis className="px-2 text-gray-500" />
            </PaginationItem>
          ) : (
            <PaginationItem key={index}>
              <PaginationLink
                href={`${pathname}?${createQueryString(page as number)}`}
                isActive={pageInfo.currentPage === page}
                className={`rounded-lg px-4 py-2 font-medium transition-all ${pageInfo.currentPage === page ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-gray-300 bg-gray-800/50 hover:bg-gray-700 border border-white/10"}`}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href={`${pathname}?${createQueryString(
              Math.min(pageInfo.totalPages, pageInfo.currentPage + 1)
            )}`}
            isActive={pageInfo.currentPage < pageInfo.totalPages}
            className="rounded-lg px-4 py-2 font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700 border border-white/10 transition-colors"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
});
