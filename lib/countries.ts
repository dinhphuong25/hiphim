/**
 * Popular Country Helper & Metadata
 * Provides flags, popularity sorting, and comprehensive country list
 */

export interface CountryItem {
  name: string;
  slug: string;
  code?: string;
  popular?: boolean;
}

// Danh sách các quốc gia điện ảnh hàng đầu theo thứ tự ưu tiên
export const POPULAR_COUNTRIES: CountryItem[] = [
  { name: "Trung Quốc", slug: "trung-quoc", code: "CN", popular: true },
  { name: "Hàn Quốc", slug: "han-quoc", code: "KR", popular: true },
  { name: "Âu Mỹ", slug: "au-my", code: "US", popular: true },
  { name: "Nhật Bản", slug: "nhat-ban", code: "JP", popular: true },
  { name: "Thái Lan", slug: "thai-lan", code: "TH", popular: true },
  { name: "Việt Nam", slug: "viet-nam", code: "VN", popular: true },
  { name: "Hồng Kông", slug: "hong-kong", code: "HK", popular: true },
  { name: "Ấn Độ", slug: "an-do", code: "IN", popular: true },
  { name: "Đài Loan", slug: "dai-loan", code: "TW", popular: true },
  { name: "Pháp", slug: "phap", code: "FR", popular: true },
  { name: "Anh", slug: "anh", code: "GB", popular: true },
  { name: "Đức", slug: "duc", code: "DE", popular: true },
];

// Mapping từ slug sang mã ISO 3166-1 alpha-2 (sử dụng với FlagCDN)
export const COUNTRY_CODE_MAP: Record<string, string> = {
  // Châu Á & Trung Đông
  "trung-quoc": "CN",
  "han-quoc": "KR",
  "nhat-ban": "JP",
  "thai-lan": "TH",
  "viet-nam": "VN",
  "hong-kong": "HK",
  "an-do": "IN",
  "dai-loan": "TW",
  "tai-wan": "TW",
  "philippines": "PH",
  "malaysia": "MY",
  "indonesia": "ID",
  "singapore": "SG",
  "tho-nhi-ky": "TR",
  "a-rap-xe-ut": "SA",
  "arap-xeut": "SA",
  "saudi-arabia": "SA",
  "uae": "AE",
  "cac-tieu-vuong-quoc-a-rap-thong-nhat": "AE",
  "trieu-tien": "KP",
  "mong-co": "MN",
  "kazakhstan": "KZ",
  "iran": "IR",
  "israel": "IL",
  "lao": "LA",
  "campuchia": "KH",
  "myanmar": "MM",

  // Châu Âu
  "anh": "GB",
  "vuong-quoc-anh": "GB",
  "phap": "FR",
  "duc": "DE",
  "y": "IT",
  "tay-ban-nha": "ES",
  "tây-ban-nha": "ES",
  "bo-dao-nha": "PT",
  "bồ-đào-nha": "PT",
  "ba-lan": "PL",
  "ha-lan": "NL",
  "bi": "BE",
  "thuy-dien": "SE",
  "thuy-si": "CH",
  "na-uy": "NO",
  "dan-mach": "DK",
  "nga": "RU",
  "ukraina": "UA",
  "ukraine": "UA",
  "ireland": "IE",
  "ao": "AT",
  "phan-lan": "FI",
  "hy-lap": "GR",
  "sec": "CZ",
  "cong-hoa-sec": "CZ",
  "hungary": "HU",
  "romania": "RO",
  "bulgaria": "BG",
  "croatia": "HR",
  "serbia": "RS",
  "iceland": "IS",

  // Châu Mỹ
  "au-my": "US",
  "my": "US",
  "hoa-ky": "US",
  "canada": "CA",
  "brazil": "BR",
  "mexico": "MX",
  "argentina": "AR",
  "chile": "CL",
  "colombia": "CO",
  "peru": "PE",
  "venezuela": "VE",

  // Châu Úc
  "uc": "AU",
  "australia": "AU",
  "new-zealand": "NZ",

  // Châu Phi
  "chau-phi": "ZA", // Cờ đa sắc Nam Phi đại diện điện ảnh Châu Phi
  "nam-phi": "ZA",
  "ai-cap": "EG",
  "nigeria": "NG",
  "kenya": "KE",
  "morocco": "MA",

  // Khác
  "quoc-gia-khac": "WW",
};

// Mapping từ tên tiếng Việt (viết thường) sang mã ISO
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "trung quốc": "CN",
  "hàn quốc": "KR",
  "nhật bản": "JP",
  "thái lan": "TH",
  "việt nam": "VN",
  "hồng kông": "HK",
  "ấn độ": "IN",
  "đài loan": "TW",
  "pháp": "FR",
  "anh": "GB",
  "đức": "DE",
  "ý": "IT",
  "tây ban nha": "ES",
  "bồ đào nha": "PT",
  "ba lan": "PL",
  "hà lan": "NL",
  "bỉ": "BE",
  "thụy điển": "SE",
  "thụy sĩ": "CH",
  "na uy": "NO",
  "đan mạch": "DK",
  "nga": "RU",
  "mexico": "MX",
  "brazil": "BR",
  "philippines": "PH",
  "malaysia": "MY",
  "indonesia": "ID",
  "thổ nhĩ kỳ": "TR",
  "singapore": "SG",
  "âu mỹ": "US",
  "mỹ": "US",
  "hoa kỳ": "US",
  "canada": "CA",
  "úc": "AU",
  "uae": "AE",
  "các tiểu vương quốc ả rập": "AE",
  "các tiểu vương quốc ả rập thống nhất": "AE",
  "ả rập xê út": "SA",
  "a rập xê út": "SA",
  "ukraina": "UA",
  "châu phi": "ZA",
  "nam phi": "ZA",
  "ai cập": "EG",
  "argentina": "AR",
  "chile": "CL",
  "colombia": "CO",
  "ireland": "IE",
  "áo": "AT",
  "phần lan": "FI",
  "hy lạp": "GR",
  "séc": "CZ",
  "cộng hòa séc": "CZ",
  "hungary": "HU",
  "romania": "RO",
  "new zealand": "NZ",
  "iran": "IR",
  "israel": "IL",
  "triều tiên": "KP",
  "mông cổ": "MN",
  "kazakhstan": "KZ",
  "lào": "LA",
  "campuchia": "KH",
  "myanmar": "MM",
};

export function getCountryCode(slugOrName?: string | null): string {
  if (!slugOrName) return "WW";
  const clean = slugOrName.toLowerCase().trim();
  if (COUNTRY_CODE_MAP[clean]) return COUNTRY_CODE_MAP[clean];
  if (COUNTRY_NAME_TO_CODE[clean]) return COUNTRY_NAME_TO_CODE[clean];

  // Chuẩn hóa bỏ dấu tiếng Việt để kiểm tra fallback
  const noAccents = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-");
  if (COUNTRY_CODE_MAP[noAccents]) return COUNTRY_CODE_MAP[noAccents];

  return "WW";
}

export function sortCountriesByPopularity(rawCountries: { name: string; slug: string }[]): CountryItem[] {
  if (!Array.isArray(rawCountries) || rawCountries.length === 0) {
    return POPULAR_COUNTRIES;
  }

  const popularSlugs = new Set(POPULAR_COUNTRIES.map((c) => c.slug));
  const popularList: CountryItem[] = [];
  const remainingList: CountryItem[] = [];

  // Match popular ones first in defined order
  POPULAR_COUNTRIES.forEach((pop) => {
    const matched = rawCountries.find((c) => c.slug === pop.slug || (pop.slug === "au-my" && c.slug === "my"));
    if (matched) {
      popularList.push({
        name: matched.name,
        slug: matched.slug,
        code: pop.code || getCountryCode(matched.slug) || getCountryCode(matched.name),
        popular: true,
      });
    } else {
      popularList.push(pop);
    }
  });

  // Collect other countries
  rawCountries.forEach((c) => {
    if (!popularSlugs.has(c.slug) && c.slug !== "my") {
      const code = getCountryCode(c.slug) !== "WW" ? getCountryCode(c.slug) : getCountryCode(c.name);
      remainingList.push({
        name: c.name,
        slug: c.slug,
        code: code,
        popular: false,
      });
    }
  });

  // Sort remaining alphabetically by Vietnamese collator
  remainingList.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return [...popularList, ...remainingList];
}

export const COUNTRY_NAMES_MAP: Record<string, string> = {
  "trung-quoc": "Trung Quốc",
  "han-quoc": "Hàn Quốc",
  "au-my": "Âu Mỹ",
  "my": "Mỹ",
  "nhat-ban": "Nhật Bản",
  "thai-lan": "Thái Lan",
  "viet-nam": "Việt Nam",
  "hong-kong": "Hồng Kông",
  "an-do": "Ấn Độ",
  "dai-loan": "Đài Loan",
  "phap": "Pháp",
  "anh": "Anh",
  "duc": "Đức",
  "y": "Ý",
  "tay-ban-nha": "Tây Ban Nha",
  "tây-ban-nha": "Tây Ban Nha",
  "bo-dao-nha": "Bồ Đào Nha",
  "ba-lan": "Ba Lan",
  "canada": "Canada",
  "uc": "Úc",
  "ha-lan": "Hà Lan",
  "bi": "Bỉ",
  "thuy-dien": "Thụy Điển",
  "thuy-si": "Thụy Sĩ",
  "na-uy": "Na Uy",
  "dan-mach": "Đan Mạch",
  "nga": "Nga",
  "mexico": "Mexico",
  "brazil": "Brazil",
  "philippines": "Philippines",
  "malaysia": "Malaysia",
  "indonesia": "Indonesia",
  "tho-nhi-ky": "Thổ Nhĩ Kỳ",
  "singapore": "Singapore",
  "a-rap-xe-ut": "Ả Rập Xê Út",
  "uae": "UAE",
  "ukraina": "Ukraina",
  "chau-phi": "Châu Phi",
  "nam-phi": "Nam Phi",
  "ai-cap": "Ai Cập",
  "argentina": "Argentina",
  "chile": "Chile",
  "colombia": "Colombia",
  "ireland": "Ireland",
  "ao": "Áo",
  "phan-lan": "Phần Lan",
  "hy-lap": "Hy Lạp",
  "sec": "Séc",
  "cong-hoa-sec": "Cộng hòa Séc",
  "hungary": "Hungary",
  "romania": "Romania",
  "new-zealand": "New Zealand",
  "quoc-gia-khac": "Quốc Gia Khác",
};

export function getCountryDisplayName(slug?: string | null, countriesList?: { slug: string; name: string }[]): string {
  if (!slug) return "";
  if (countriesList && countriesList.length > 0) {
    const found = countriesList.find((c) => c.slug === slug);
    if (found?.name) return found.name;
  }
  if (COUNTRY_NAMES_MAP[slug]) {
    return COUNTRY_NAMES_MAP[slug];
  }
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
