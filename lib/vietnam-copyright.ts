/**
 * Vietnam Domestic Cinema Copyright Protection Policy
 * Enforces zero-streaming policy for Vietnamese copyrighted movies.
 */

export const VIETNAMESE_COPYRIGHT_POLICY = {
  title: "Thông Báo Bản Quyền Điện Ảnh Việt Nam",
  subtitle: "Chính Sách Bảo Vệ Quyền Tác Giả & Tác Phẩm Nước Nhà",
  description:
    "Nhằm tôn trọng và tuân thủ nghiêm ngặt Luật Sở hữu trí tuệ cũng như chung tay bảo vệ sự phát triển của nền điện ảnh nước nhà, Hi Phim áp dụng chính sách KHÔNG phát sóng và không lưu trữ bất kỳ tác phẩm điện ảnh hay phim truyền hình nào của Việt Nam.",
  recommendation:
    "Kính mong quý khán giả yêu điện ảnh nước nhà hãy thưởng thức các tác phẩm của các nhà sản xuất, đạo diễn và diễn viên Việt Nam tại các cụm rạp chiếu phim chính thống trên toàn quốc hoặc qua các nền tảng số phát hành có bản quyền chính thức (Galaxy Play, FPT Play, VieON, Netflix...).",
};

// Danh sách các slug phim Việt Nam đã xác định để chặn tức thì
export const KNOWN_VIETNAMESE_SLUGS = new Set<string>([
  "xom-nho",
  "can-nha-khong-mai-che",
  "bay-tien",
  "phu-sa",
  "mui-pho",
  "song-hy-lam-nguy",
  "thu-tinh-gui-ngoai",
  "nha-ba-toi-mot-phong",
  "lat-mat-7-mot-dieu-uoc",
  "lat-mat-6-tam-ve-dinh-menh",
  "lat-mat-48h",
  "lat-mat-ba-chang-khuyet",
  "lat-mat-phim-truong",
  "lat-mat",
  "mai",
  "nha-ba-nu",
  "bo-gia",
  "gap-lai-chi-bau",
  "dao-pho-va-piano",
  "cong-tu-bac-lieu",
  "cam",
  "ke-an-hon",
  "tet-o-lang-dia-nguc",
  "quy-cau",
  "ma-da",
  "hai-muoi",
  "nguoi-vo-cuoi-cung",
  "chi-chi-em-em",
  "chi-chi-em-em-2",
  "em-va-trinh",
  "tro-tan-ruc-ro",
  "dat-rung-phuong-nam",
  "sieu-lua-gap-sieu-lay",
  "chuyen-xom-tui",
  "con-nhot-mot-chong",
  "co-gai-tu-qua-khu",
  "muoi-loi-nguyen-tro-lai",
  "nghe-sieu-de",
  "chia-khoa-tram-ty",
  "dem-toi-ruc-ro",
  "chuyen-ma-gan-nha",
  "bong-de",
  "578-phat-dan-cua-ke-dien",
  "bay-ngot-ngao",
  "nguoi-lang-nghe-loi-thi-tham",
  "vo-nguoi-ta",
  "trang-ti",
  "kieu",
  "gai-gia-lam-chieu-v",
  "tiec-trang-mau",
  "rom",
  "bang-chung-vo-toi",
  "mat-biec",
  "hai-phuong",
  "cua-lai-vo-bau",
  "nguoi-bat-tu",
  "thang-nam-ruc-ro",
  "nham-mat-thay-mua-he",
  "song-lang",
  "chang-vo-cua-em",
  "em-chua-18",
  "co-gai-den-tu-hom-qua",
  "toi-thay-hoa-vang-tren-co-xanh",
]);

export function isVietnameseSlug(slug?: string | null): boolean {
  if (!slug) return false;
  try {
    const clean = decodeURIComponent(slug).toLowerCase().trim().replace(/^\/+|\/+$/g, "");
    if (KNOWN_VIETNAMESE_SLUGS.has(clean)) return true;
    if (clean.startsWith("phim-viet-nam") || clean.startsWith("phim-viet-")) return true;
    return false;
  } catch {
    const raw = String(slug).toLowerCase().trim();
    return KNOWN_VIETNAMESE_SLUGS.has(raw);
  }
}

export function isVietnameseMovie(movie: any): boolean {
  if (!movie) return false;
  if (typeof movie === "string") return isVietnameseSlug(movie);
  if (movie.slug && isVietnameseSlug(movie.slug)) return true;

  const countries = Array.isArray(movie.country)
    ? movie.country
    : movie.country
    ? [movie.country]
    : [];

  return countries.some((c: any) => {
    const slug = typeof c === "string" ? c : c?.slug || "";
    const name = typeof c === "string" ? c : c?.name || "";
    const cleanSlug = slug.toLowerCase().trim();
    const cleanName = name.toLowerCase().trim();
    return (
      cleanSlug === "viet-nam" ||
      cleanSlug === "vietnam" ||
      cleanName === "việt nam" ||
      cleanName === "viet nam"
    );
  });
}

const VN_SEARCH_TERMS = [
  "phim việt",
  "phim viet",
  "phim việt nam",
  "phim viet nam",
  "việt nam",
  "viet nam",
  "phim rạp việt",
  "phim rap viet",
  "phim chiếu rạp việt",
  "phim chieu rap viet",
  "điện ảnh việt",
  "dien anh viet",
  "phim vn",
];

export function isVietnameseQuery(query?: string | null): boolean {
  if (!query) return false;
  const clean = query.toLowerCase().trim();
  if (!clean) return false;
  if (clean === "vn" || clean === "vietnam" || clean === "viet nam") return true;
  return VN_SEARCH_TERMS.some((term) => clean.includes(term));
}

export function openVietnamCopyrightModal(options?: { movieName?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("open-vietnam-copyright-modal", {
      detail: options || {},
    })
  );
}
