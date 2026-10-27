"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, memo } from "react";
import { SlidersHorizontal, X, RotateCcw, Check, ChevronDown } from "lucide-react";

interface FilterPanelProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
}

const TYPE_LIST_OPTIONS = [
  { value: "", label: "Tất Cả" },
  { value: "phim-chieu-rap", label: "Phim Chiếu Rạp" },
  { value: "phim-bo", label: "Phim Bộ" },
  { value: "phim-le", label: "Phim Lẻ" },
  { value: "hoat-hinh", label: "Hoạt Hình" },
  { value: "phim-vietsub", label: "Phim Vietsub" },
  { value: "phim-thuyet-minh", label: "Phim Thuyết Minh" },
  { value: "phim-long-tieng", label: "Phim Lồng Tiếng" },
];

const SORT_FIELD_OPTIONS = [
  { value: "modified.time", label: "Mới cập nhật" },
  { value: "_id", label: "ID Phim" },
  { value: "year", label: "Năm phát hành" },
];

const SORT_TYPE_OPTIONS = [
  { value: "desc", label: "Giảm dần" },
  { value: "asc", label: "Tăng dần" },
];

const SORT_LANG_OPTIONS = [
  { value: "", label: "Tất Cả" },
  { value: "vietsub", label: "Vietsub" },
  { value: "thuyet-minh", label: "Thuyết Minh" },
  { value: "long-tieng", label: "Lồng Tiếng" },
];

// Reusable native <select> with glassmorphism styling
function NativeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white/5 border border-white/10 text-white text-base sm:text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
      </div>
    </div>
  );
}

const FilterPanel = ({ categories = [], countries = [] }: FilterPanelProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    typeList: searchParams.get("typeList") || "",
    sortField: searchParams.get("sortField") || "modified.time",
    sortType: searchParams.get("sortType") || "desc",
    sortLang: searchParams.get("sortLang") || "",
    category: searchParams.get("category") || "",
    country: searchParams.get("country") || "",
    year: searchParams.get("year") || "",
  });
  const [isOpen, setIsOpen] = useState(false);

  const YEAR_OPTIONS = useMemo(() => {
    const yr = new Date().getFullYear();
    return [
      { value: "", label: "Tất cả" },
      ...Array.from({ length: yr - 1970 + 1 }, (_, i) => ({
        value: String(yr - i),
        label: String(yr - i),
      })),
    ];
  }, []);

  const set = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const applyFilters = () => {
    setIsOpen(false);
    const p = new URLSearchParams();
    if (filters.typeList) p.set("typeList", filters.typeList);
    if (filters.sortField) p.set("sortField", filters.sortField);
    if (filters.sortType) p.set("sortType", filters.sortType);
    if (filters.sortLang) p.set("sortLang", filters.sortLang);
    if (filters.category) p.set("category", filters.category);
    if (filters.country) p.set("country", filters.country);
    if (filters.year) p.set("year", filters.year);
    router.push(`/?${p.toString()}`);
  };

  const resetFilters = () => {
    setIsOpen(false);
    router.push("/");
  };

  const hasActive = !!(
    filters.typeList || filters.category || filters.country || filters.year ||
    filters.sortLang || filters.sortField !== "modified.time" || filters.sortType !== "desc"
  );

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
          hasActive
            ? "bg-primary text-black border-primary"
            : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
        }`}
        aria-label="Bộ lọc phim"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Lọc</span>
        {hasActive && (
          <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] font-bold flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[59]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-2 z-[60] w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
            style={{ background: "rgba(12,12,14,0.97)", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Bộ Lọc Nâng Cao</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                aria-label="Đóng bộ lọc"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              <NativeSelect label="Loại Phim" value={filters.typeList} onChange={(v) => set("typeList", v)} options={TYPE_LIST_OPTIONS} />
              <NativeSelect label="Sắp Xếp Theo" value={filters.sortField} onChange={(v) => set("sortField", v)} options={SORT_FIELD_OPTIONS} />
              <NativeSelect label="Kiểu Sắp Xếp" value={filters.sortType} onChange={(v) => set("sortType", v)} options={SORT_TYPE_OPTIONS} />
              <NativeSelect label="Ngôn Ngữ" value={filters.sortLang} onChange={(v) => set("sortLang", v)} options={SORT_LANG_OPTIONS} />
              <NativeSelect
                label="Thể Loại"
                value={filters.category}
                onChange={(v) => set("category", v)}
                options={[{ value: "", label: "Tất cả" }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
              />
              <NativeSelect
                label="Quốc Gia"
                value={filters.country}
                onChange={(v) => set("country", v)}
                options={[{ value: "", label: "Tất cả" }, ...countries.map((c) => ({ value: c.slug, label: c.name }))]}
              />
              <div className="col-span-2">
                <NativeSelect label="Năm Phát Hành" value={filters.year} onChange={(v) => set("year", v)} options={YEAR_OPTIONS} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-4 pb-4">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt Lại
              </button>
              <button
                onClick={applyFilters}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-black hover:bg-primary/90 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Áp Dụng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(FilterPanel);
