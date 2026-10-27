import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phim yêu thích",
  description: "Danh sách phim bạn đã đánh dấu yêu thích trên Hi Phim.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  alternates: {
    canonical: "https://hiphim.one/favorites",
  },
  openGraph: {
    title: "Phim yêu thích | Hi Phim",
    description: "Danh sách phim bạn đã đánh dấu yêu thích trên Hi Phim.",
    url: "https://hiphim.one/favorites",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phim yêu thích | Hi Phim",
    description: "Danh sách phim bạn đã đánh dấu yêu thích trên Hi Phim.",
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
