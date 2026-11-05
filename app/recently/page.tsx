import type { Metadata } from "next";
import RecentlyWatchedClient from "./recently-client";

export const metadata: Metadata = {
  title: "Lịch Sử Xem Phim | Hi Phim",
  description: "Danh sách những bộ phim bạn đã xem gần đây trên Hi Phim.",
  openGraph: {
    title: "Lịch Sử Xem Phim | Hi Phim",
    description: "Danh sách những bộ phim bạn đã xem gần đây trên Hi Phim.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Lịch Sử Xem Phim - Hi Phim" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function RecentlyWatchedPage() {
  return <RecentlyWatchedClient />;
}