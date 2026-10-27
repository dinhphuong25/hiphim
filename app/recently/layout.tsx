import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phim đã xem gần đây",
  description: "Xem lại danh sách phim bạn đã xem gần đây trên Hi Phim.",
  alternates: {
    canonical: "https://hiphim.one/recently",
  },
  openGraph: {
    title: "Phim đã xem gần đây | Hi Phim",
    description: "Xem lại danh sách phim bạn đã xem gần đây trên Hi Phim.",
    url: "https://hiphim.one/recently",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phim đã xem gần đây | Hi Phim",
    description: "Xem lại danh sách phim bạn đã xem gần đây trên Hi Phim.",
  },
};

export default function RecentlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
