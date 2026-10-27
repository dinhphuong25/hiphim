import { Metadata } from "next";
import TaiAppClient from "./tai-app-client";

export const metadata: Metadata = {
  title: "Tải App Hi Phim - Cài Đặt Ứng Dụng Cho iOS (.IPA) & Android (.APK) | Hi Phim",
  description:
    "Tải ứng dụng xem phim Hi Phim chất lượng Full HD, load siêu tốc, không quảng cáo trên iPhone/iPad (file .IPA) và Android (file .APK) kèm hướng dẫn cài đặt chi tiết từng bước.",
  keywords: [
    "tải app hi phim",
    "cài đặt hi phim ipa",
    "hi phim apk android",
    "ứng dụng xem phim hi phim",
    "tải file ipa xem phim",
    "hướng dẫn cài ipa iphone",
  ],
  openGraph: {
    title: "Tải App Hi Phim - Ứng Dụng Xem Phim Đỉnh Cao iOS & Android",
    description: "Tải app Hi Phim cho điện thoại iPhone và Android. Xem phim Full HD mượt mà, đồng bộ lịch sử xem thông minh.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function TaiAppPage() {
  return <TaiAppClient />;
}
