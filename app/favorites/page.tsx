import FavoritesClient from "./favorites-client";

export const metadata = {
  title: "Phim Yêu Thích | Hi Phim",
  description: "Danh sách phim yêu thích của bạn",
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function FavoritesPage() {
  return <FavoritesClient />;
}
