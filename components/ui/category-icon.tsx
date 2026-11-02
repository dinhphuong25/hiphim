import React, { memo } from "react";
import {
  Film,
  Flame,
  Crown,
  Swords,
  Eye,
  Ghost,
  Laugh,
  Heart,
  Theater,
  Rocket,
  Compass,
  Music,
  Home,
  GraduationCap,
  Shield,
  Sparkles,
  Trophy,
  Video,
  Landmark,
  AlertOctagon,
  Clock,
  Award,
  Palette,
  Tv,
  Ticket,
  Zap,
  Search,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LUCIDE_MAP: Record<string, LucideIcon> = {
  "hanh-dong": Flame,
  "co-trang": Crown,
  "chien-tranh": Swords,
  "bi-an": Eye,
  "kinh-di": Ghost,
  "hai-huoc": Laugh,
  "tinh-cam": Heart,
  "tam-ly": Theater,
  "khoa-hoc": Rocket,
  "khoa-hoc-vien-tuong": Rocket,
  "vien-tuong": Rocket,
  "phieu-luu": Compass,
  "am-nhac": Music,
  "gia-dinh": Home,
  "hoc-duong": GraduationCap,
  "vo-thuat": Swords,
  "hinh-su": Shield,
  "toi-pham": Shield,
  "than-thoai": Sparkles,
  "the-thao": Trophy,
  "tai-lieu": Video,
  "lich-su": Landmark,
  "mien-tay": Compass,
  "phim-18": AlertOctagon,
  "phim-18-plus": AlertOctagon,
  "18-plus": AlertOctagon,
  "phim-ngan": Clock,
  "kinh-dien": Award,
  "chinh-kich": Theater,
  "tre-em": Sparkles,
  "hoat-hinh": Palette,
  "anime": Tv,
  "kich-tinh": Zap,
  "gay-can": Zap,
  "trinh-tham": Search,
  "huyen-huyen": Sparkles,
  "tien-hiep": Swords,
  "kiem-hiep": Swords,
  "tv-shows": Tv,
  "show": Tv,
  "chieu-rap": Ticket,
  "phim-chieu-rap": Ticket,
  "phim-bo": Tv,
  "phim-le": Film,
};

function resolveCategoryIcon(slug?: string, name?: string): LucideIcon {
  if (slug) {
    const clean = slug.toLowerCase().trim();
    if (CATEGORY_LUCIDE_MAP[clean]) {
      return CATEGORY_LUCIDE_MAP[clean];
    }
  }

  if (name) {
    const lower = name.toLowerCase().trim();
    if (lower.includes("hành động") || lower.includes("action")) return Flame;
    if (lower.includes("cổ trang") || lower.includes("costume")) return Crown;
    if (lower.includes("tình cảm") || lower.includes("lãng mạn") || lower.includes("romance")) return Heart;
    if (lower.includes("kinh dị") || lower.includes("horror") || lower.includes("ma")) return Ghost;
    if (lower.includes("hài") || lower.includes("comedy")) return Laugh;
    if (lower.includes("viễn tưởng") || lower.includes("sci-fi")) return Rocket;
    if (lower.includes("hoạt hình") || lower.includes("anime") || lower.includes("animation")) return Palette;
    if (lower.includes("tâm lý") || lower.includes("drama")) return Theater;
    if (lower.includes("võ thuật") || lower.includes("kiếm hiệp") || lower.includes("chiến tranh")) return Swords;
    if (lower.includes("hình sự") || lower.includes("tội phạm")) return Shield;
    if (lower.includes("phiêu lưu") || lower.includes("miền tây")) return Compass;
    if (lower.includes("gia đình")) return Home;
    if (lower.includes("học đường")) return GraduationCap;
    if (lower.includes("bí ẩn")) return Eye;
    if (lower.includes("khoa học")) return Rocket;
    if (lower.includes("âm nhạc")) return Music;
    if (lower.includes("thần thoại") || lower.includes("huyền huyễn")) return Sparkles;
    if (lower.includes("thể thao")) return Trophy;
    if (lower.includes("tài liệu")) return Video;
    if (lower.includes("lịch sử")) return Landmark;
    if (lower.includes("18")) return AlertOctagon;
    if (lower.includes("ngắn")) return Clock;
    if (lower.includes("kinh điển")) return Award;
    if (lower.includes("chính kịch")) return Theater;
    if (lower.includes("chiếu rạp")) return Ticket;
    if (lower.includes("kịch tính") || lower.includes("gay cấn")) return Zap;
    if (lower.includes("trinh thám")) return Search;
  }

  return Film;
}

export interface CategoryIconProps {
  slug?: string;
  name?: string;
  className?: string;
  size?: number;
}

export const CategoryIcon = memo(function CategoryIcon({
  slug,
  name,
  className,
  size = 20,
}: CategoryIconProps) {
  const IconComponent = resolveCategoryIcon(slug, name);
  return (
    <IconComponent
      style={{ width: size, height: size }}
      className={cn("shrink-0 stroke-[2] transition-transform duration-200", className)}
    />
  );
});

export default CategoryIcon;
