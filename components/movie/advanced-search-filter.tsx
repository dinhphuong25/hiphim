"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X, Search } from "lucide-react";

interface FilterProps {
  categories: { name: string; slug: string }[];
  countries: { name: string; slug: string }[];
}

const TYPES = [
  { name: "Phim Chiếu Rạp", slug: "phim-chieu-rap" },
  { name: "Phim Bộ", slug: "phim-bo" },
  { name: "Phim Lẻ", slug: "phim-le" },
  { name: "Hoạt Hình", slug: "hoat-hinh" },
];

const SORT_OPTIONS = [
  { label: "Mới cập nhật", value: "modified.time" },
  { label: "Năm phát hành", value: "year" },
  { label: "Tên A-Z", value: "_id" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function AdvancedSearchFilter({ categories, countries }: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [typeList, setTypeList] = useState(searchParams.get("typeList") || "phim-bo");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [sortField, setSortField] = useState(searchParams.get("sortField") || "modified.time");

  const hasActiveFilters = category || country || year || sortField !== "modified.time";

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (typeList) params.set("typeList", typeList);
    if (category) params.set("category", category);
    if (country) params.set("country", country);
    if (year) params.set("year", year);
    if (sortField) params.set("sortField", sortField);
    params.set("sortType", "desc");

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
    setIsOpen(false);
  };

  const resetFilters = () => {
    setTypeList("phim-bo");
    setCategory("");
    setCountry("");
    setYear("");
    setSortField("modified.time");
    startTransition(() => {
      router.push("/search");
    });
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-white text-sm font-medium transition-all duration-200"
      >
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        Bộ lọc nâng cao
        {hasActiveFilters && (
          <span className="ml-1 w-2 h-2 rounded-full bg-primary inline-block" />
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-3 p-4 sm:p-5 bg-zinc-900/95 border border-white/10 rounded-2xl backdrop-blur-md space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Type */}
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Loại phim</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setTypeList(t.slug)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                    typeList === t.slug
                      ? "bg-primary text-black border-primary"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-primary/40 hover:text-white"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Thể loại</p>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-base sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
              >
                <option value="">Tất cả</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Quốc gia</p>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-base sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
              >
                <option value="">Tất cả</option>
                {countries.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Năm phát hành</p>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white text-base sm:text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
              >
                <option value="">Tất cả</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Sắp xếp theo</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortField(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                    sortField === opt.value
                      ? "bg-primary text-black border-primary"
                      : "bg-white/5 text-white/70 border-white/10 hover:border-primary/40 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={applyFilters}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {isPending ? "Đang lọc..." : "Tìm phim"}
            </button>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 text-sm transition-all"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
