import type { Metadata } from "next";
import FavoritesClient from "./favorites-client";

export const metadata: Metadata = {
  title: "Phim Yêu Thích | Hi Phim",
  description: "Danh sách phim yêu thích đã lưu của bạn trên Hi Phim.",
  openGraph: {
    title: "Phim Yêu Thích | Hi Phim",
    description: "Danh sách phim yêu thích đã lưu của bạn trên Hi Phim.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Phim Yêu Thích - Hi Phim" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function FavoritesPage() {
  return <FavoritesClient />;
}
