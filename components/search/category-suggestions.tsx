"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface Category {
  id?: string;
  name: string;
  slug: string;
}

interface CategorySuggestionsProps {
  categories: Category[];
  limit?: number;
  title?: string;
}

const categoryIcons: { [key: string]: string } = {
  "phim-hanh-dong": "🔥",
  "phim-tinh-cam": "💕",
  "phim-hai-huoc": "😂",
  "phim-kinh-di": "👻",
  "phim-phieu-luu": "🗺️",
  "phim-khoa-hoc-vien-tuong": "🚀",
  "phim-tam-ly": "🧠",
  "phim-toi-pham": "🔍",
  "anime": "🎨",
  "phim-bo": "📺",
  "phim-le": "🎬",
};

export default function CategorySuggestions({
  categories,
  limit = 6,
  title = "Khám Phá Thể Loại",
}: CategorySuggestionsProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  const displayCategories = categories.slice(0, limit);
  const colors = [
    "from-red-600/30 to-red-500/10",
    "from-blue-600/30 to-blue-500/10",
    "from-purple-600/30 to-purple-500/10",
    "from-pink-600/30 to-pink-500/10",
    "from-green-600/30 to-green-500/10",
    "from-amber-600/30 to-amber-500/10",
  ];

  const borderColors = [
    "border-red-500/30",
    "border-blue-500/30",
    "border-purple-500/30",
    "border-pink-500/30",
    "border-green-500/30",
    "border-amber-500/30",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
        <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayCategories.map((category, index) => {
          const icon = categoryIcons[category.slug] || "🎬";
          const gradientColor = colors[index % colors.length];
          const borderColor = borderColors[index % borderColors.length];

          return (
            <Link
              key={category.slug}
              href={`/danh-sach/${category.slug}`}
              className={cn(
                "relative group overflow-hidden rounded-xl border transition-all duration-300",
                "p-4 flex flex-col items-center justify-center gap-2",
                "backdrop-blur-sm hover:shadow-lg hover:shadow-white/20",
                `bg-gradient-to-br ${gradientColor}`,
                `border-white/10 hover:border-white/30 ${borderColor}`,
                "animate-fade-in-scale hover:scale-105"
              )}
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative z-10 text-center space-y-1">
                <p className="text-3xl">{icon}</p>
                <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-white transition-colors">
                  {category.name}
                </p>
              </div>

              {/* Hover arrow */}
              <svg
                className="absolute bottom-2 right-2 w-4 h-4 text-white/40 group-hover:text-white/70 transition-all transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* Category Count Info */}
      <p className="text-xs text-white/50 text-center">
        Hiển thị {displayCategories.length} từ {categories.length} thể loại
      </p>
    </div>
  );
}
