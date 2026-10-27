import RecentlyWatchedClient from "./recently-client";

export const metadata = {
  title: "Lịch Sử Xem | Hi Phim",
  description: "Phim bạn đã xem gần đây",
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function RecentlyWatchedPage() {
  return <RecentlyWatchedClient />;
}