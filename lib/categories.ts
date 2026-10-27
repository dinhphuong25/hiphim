/**
 * Category Helper & Metadata
 * Provides emojis, popularity categorization, and search helpers for movie genres
 */

export interface CategoryItem {
  name: string;
  slug: string;
  emoji?: string;
  popular?: boolean;
}

// Danh sách các thể loại phim hàng đầu được yêu thích nhất
export const POPULAR_CATEGORIES: CategoryItem[] = [
  { name: "Hành Động", slug: "hanh-dong", emoji: "💥", popular: true },
  { name: "Cổ Trang", slug: "co-trang", emoji: "🏮", popular: true },
  { name: "Tình Cảm", slug: "tinh-cam", emoji: "💖", popular: true },
  { name: "Kinh Dị", slug: "kinh-di", emoji: "👻", popular: true },
  { name: "Hài Hước", slug: "hai-huoc", emoji: "😂", popular: true },
  { name: "Viễn Tưởng", slug: "vien-tuong", emoji: "🚀", popular: true },
  { name: "Hoạt Hình", slug: "hoat-hinh", emoji: "🎨", popular: true },
  { name: "Tâm Lý", slug: "tam-ly", emoji: "🧠", popular: true },
  { name: "Võ Thuật", slug: "vo-thuat", emoji: "🥋", popular: true },
  { name: "Hình Sự", slug: "hinh-su", emoji: "🚨", popular: true },
  { name: "Phiêu Lưu", slug: "phieu-luu", emoji: "🗺️", popular: true },
  { name: "Gia Đình", slug: "gia-dinh", emoji: "🏡", popular: true },
];

export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // Common slugs
  "hanh-dong": "💥",
  "co-trang": "🏮",
  "chien-tranh": "🎖️",
  "bi-an": "🔮",
  "kinh-di": "👻",
  "hai-huoc": "😂",
  "tinh-cam": "💖",
  "tam-ly": "🧠",
  "khoa-hoc": "🔬",
  "khoa-hoc-vien-tuong": "🚀",
  "vien-tuong": "🚀",
  "phieu-luu": "🗺️",
  "am-nhac": "🎵",
  "gia-dinh": "🏡",
  "hoc-duong": "🎓",
  "vo-thuat": "🥋",
  "hinh-su": "🚨",
  "than-thoai": "🐉",
  "the-thao": "⚽",
  "tai-lieu": "📽️",
  "lich-su": "🏛️",
  "mien-tay": "🤠",
  "phim-18": "🔞",
  "phim-18-plus": "🔞",
  "18-plus": "🔞",
  "phim-ngan": "⏱️",
  "kinh-dien": "🏆",
  "chinh-kich": "🎭",
  "tre-em": "🧸",
  "hoat-hinh": "🎨",
  "anime": "🐱",
  "kich-tinh": "⚡",
  "gay-can": "⚡",
  "trinh-tham": "🕵️‍♂️",
  "huyen-huyen": "✨",
  "tien-hiep": "🗡️",
  "kiem-hiep": "⚔️",
  "tv-shows": "📺",
  "show": "📺",
  "am-thuc": "🍜",
  "y-khoa": "🩺",
  "sitcom": "🛋️",
  "chieu-rap": "🍿",
  "phim-chieu-rap": "🍿",
  "phim-bo": "📺",
  "phim-le": "🎬",
};

/**
 * Get category emoji by slug or fallback to name heuristics
 */
export function getCategoryEmoji(slug?: string, name?: string): string {
  if (slug) {
    const cleanSlug = slug.toLowerCase().trim();
    if (CATEGORY_EMOJI_MAP[cleanSlug]) {
      return CATEGORY_EMOJI_MAP[cleanSlug];
    }
  }

  if (name) {
    const lower = name.toLowerCase().trim();
    if (lower.includes("hành động") || lower.includes("action")) return "💥";
    if (lower.includes("cổ trang") || lower.includes("costume")) return "🏮";
    if (lower.includes("tình cảm") || lower.includes("lãng mạn") || lower.includes("romance")) return "💖";
    if (lower.includes("kinh dị") || lower.includes("horror") || lower.includes("ma")) return "👻";
    if (lower.includes("hài") || lower.includes("comedy")) return "😂";
    if (lower.includes("viễn tưởng") || lower.includes("sci-fi")) return "🚀";
    if (lower.includes("hoạt hình") || lower.includes("animation") || lower.includes("anime")) return "🎨";
    if (lower.includes("tâm lý") || lower.includes("drama")) return "🧠";
    if (lower.includes("võ thuật") || lower.includes("martial")) return "🥋";
    if (lower.includes("hình sự") || lower.includes("tội phạm") || lower.includes("crime")) return "🚨";
    if (lower.includes("phiêu lưu") || lower.includes("adventure")) return "🗺️";
    if (lower.includes("gia đình") || lower.includes("family")) return "🏡";
    if (lower.includes("học đường") || lower.includes("school")) return "🎓";
    if (lower.includes("chiến tranh") || lower.includes("war")) return "🎖️";
    if (lower.includes("bí ẩn") || lower.includes("mystery")) return "🔮";
    if (lower.includes("khoa học") || lower.includes("science")) return "🔬";
    if (lower.includes("âm nhạc") || lower.includes("music")) return "🎵";
    if (lower.includes("thần thoại") || lower.includes("myth")) return "🐉";
    if (lower.includes("thể thao") || lower.includes("sport")) return "⚽";
    if (lower.includes("tài liệu") || lower.includes("documentary")) return "📽️";
    if (lower.includes("lịch sử") || lower.includes("history")) return "🏛️";
    if (lower.includes("miền tây") || lower.includes("western")) return "🤠";
    if (lower.includes("18+") || lower.includes("18") || lower.includes("người lớn")) return "🔞";
    if (lower.includes("ngắn") || lower.includes("short")) return "⏱️";
    if (lower.includes("kinh điển") || lower.includes("classic")) return "🏆";
    if (lower.includes("chính kịch")) return "🎭";
    if (lower.includes("trẻ em") || lower.includes("kids")) return "🧸";
    if (lower.includes("kịch tính") || lower.includes("gay cấn") || lower.includes("thriller")) return "⚡";
    if (lower.includes("trinh thám") || lower.includes("detective")) return "🕵️‍♂️";
    if (lower.includes("chiếu rạp") || lower.includes("cinema")) return "🍿";
  }

  return "🎬";
}

/**
 * Sort categories to place popular ones at the top
 */
export function sortCategoriesByPopularity(rawCategories: { name: string; slug: string }[]): CategoryItem[] {
  if (!Array.isArray(rawCategories) || rawCategories.length === 0) {
    return POPULAR_CATEGORIES;
  }

  const popularSlugs = new Set(POPULAR_CATEGORIES.map((c) => c.slug));
  const popularList: CategoryItem[] = [];
  const remainingList: CategoryItem[] = [];

  // Match popular ones first in defined order
  POPULAR_CATEGORIES.forEach((pop) => {
    const matched = rawCategories.find((c) => c.slug === pop.slug);
    if (matched) {
      popularList.push({
        name: matched.name,
        slug: matched.slug,
        emoji: pop.emoji || getCategoryEmoji(matched.slug, matched.name),
        popular: true,
      });
    } else {
      popularList.push(pop);
    }
  });

  // Collect other categories
  rawCategories.forEach((c) => {
    if (!popularSlugs.has(c.slug)) {
      remainingList.push({
        name: c.name,
        slug: c.slug,
        emoji: getCategoryEmoji(c.slug, c.name),
        popular: false,
      });
    }
  });

  // Sort remaining alphabetically by Vietnamese collator
  remainingList.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return [...popularList, ...remainingList];
}

export const CATEGORY_NAMES_MAP: Record<string, string> = {
  "hanh-dong": "Hành Động",
  "co-trang": "Cổ Trang",
  "chien-tranh": "Chiến Tranh",
  "bi-an": "Bí Ẩn",
  "kinh-di": "Kinh Dị",
  "hai-huoc": "Hài Hước",
  "tinh-cam": "Tình Cảm",
  "tam-ly": "Tâm Lý",
  "khoa-hoc": "Khoa Học",
  "khoa-hoc-vien-tuong": "Viễn Tưởng",
  "vien-tuong": "Viễn Tưởng",
  "phieu-luu": "Phiêu Lưu",
  "am-nhac": "Âm Nhạc",
  "gia-dinh": "Gia Đình",
  "hoc-duong": "Học Đường",
  "vo-thuat": "Võ Thuật",
  "hinh-su": "Hình Sự",
  "than-thoai": "Thần Thoại",
  "the-thao": "Thể Thao",
  "tai-lieu": "Tài Liệu",
  "lich-su": "Lịch Sử",
  "mien-tay": "Miền Tây",
  "phim-18": "Phim 18+",
  "phim-18-plus": "Phim 18+",
  "18-plus": "Phim 18+",
  "phim-ngan": "Phim Ngắn",
  "kinh-dien": "Kinh Điển",
  "chinh-kich": "Chính Kịch",
  "tre-em": "Trẻ Em",
  "hoat-hinh": "Hoạt Hình",
  "anime": "Anime",
  "kich-tinh": "Kịch Tính",
  "gay-can": "Gay Cấn",
  "trinh-tham": "Trinh Thám",
  "huyen-huyen": "Huyền Huyễn",
  "tien-hiep": "Tiên Hiệp",
  "kiem-hiep": "Kiếm Hiệp",
  "tv-shows": "TV Shows",
  "show": "TV Shows",
  "am-thuc": "Ẩm Thực",
  "y-khoa": "Y Khoa",
  "sitcom": "Sitcom",
  "chieu-rap": "Chiếu Rạp",
  "phim-chieu-rap": "Phim Chiếu Rạp",
  "phim-bo": "Phim Bộ",
  "phim-le": "Phim Lẻ",
};

export function getCategoryDisplayName(slug?: string | null, categoriesList?: { slug: string; name: string }[]): string {
  if (!slug) return "";
  if (categoriesList && categoriesList.length > 0) {
    const found = categoriesList.find((c) => c.slug === slug);
    if (found?.name) return found.name;
  }
  if (CATEGORY_NAMES_MAP[slug]) {
    return CATEGORY_NAMES_MAP[slug];
  }
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
