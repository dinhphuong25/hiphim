"use client";

import React, { useState, useEffect, memo } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

interface AdConfig {
  enabled: boolean;
  targetUrl: string;
  popupImage: string;
  bottomBannerImage: string;
  showPopup: boolean;
  showBottomBanner: boolean;
}

const DEFAULT_AD_CONFIG: AdConfig = {
  enabled: true,
  targetUrl: "https://154.82.109.157/2138063.html",
  popupImage: "/ads/popup.jpg",
  bottomBannerImage: "/ads/banner-bottom.gif",
  showPopup: true,
  showBottomBanner: true,
};

export function AdFloatingSystemComponent() {
  const pathname = usePathname();
  const [adConfig, setAdConfig] = useState<AdConfig>(DEFAULT_AD_CONFIG);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showBottomBanner, setShowBottomBanner] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Không hiển thị quảng cáo trong trang quản trị hoặc trang bảo trì
  const isAdminOrMaintenance =
    pathname?.startsWith("/admin") || pathname?.startsWith("/maintenance");

  useEffect(() => {
    setIsMounted(true);

    // Tải cấu hình quảng cáo từ server nếu có
    fetch("/api/announcement")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ads) {
          setAdConfig((prev) => ({
            ...prev,
            ...data.ads,
            showBottomBanner: data.ads.showBottomBanner ?? true,
            showPopup: data.ads.showPopup ?? true,
          }));
        }
      })
      .catch(() => {});

    // Kiểm tra xem trong 5 phút qua người dùng đã tắt popup chưa
    try {
      const popupClosedAt = sessionStorage.getItem("hiphim_ad_popup_closed");
      const isPopupExpired =
        !popupClosedAt || Date.now() - Number(popupClosedAt) > 5 * 60 * 1000;
      if (isPopupExpired) {
        // Tự động bật popup sau 350ms khi vừa vào trang
        const timer = setTimeout(() => {
          setShowPopup(true);
        }, 350);
        return () => clearTimeout(timer);
      }
    } catch {
      setShowPopup(true);
    }

    // Kiểm tra xem catfish banner có bị đóng trong 5 phút qua không
    try {
      const bottomClosedAt = sessionStorage.getItem("hiphim_ad_bottom_closed");
      if (bottomClosedAt && Date.now() - Number(bottomClosedAt) < 5 * 60 * 1000) {
        setShowBottomBanner(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
    try {
      sessionStorage.setItem("hiphim_ad_popup_closed", Date.now().toString());
    } catch {
      // ignore
    }
  };

  const handleCloseBottomBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBottomBanner(false);
    try {
      sessionStorage.setItem("hiphim_ad_bottom_closed", Date.now().toString());
    } catch {
      // ignore
    }
  };

  if (!isMounted || isAdminOrMaintenance || !adConfig.enabled) return null;

  return (
    <>
      {/* 1. POPUP QUẢNG CÁO GIỮA MÀN HÌNH (Center Popup Modal) */}
      {showPopup && adConfig.showPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-[4px] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
          onClick={handleClosePopup}
        >
          <div
            className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[460px] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/20 bg-[#0d1310] animate-in zoom-in-95 duration-200 group"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng tròn góc trên bên phải */}
            <button
              type="button"
              onClick={handleClosePopup}
              aria-label="Đóng quảng cáo"
              className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white flex items-center justify-center border border-white/30 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:scale-105"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Ảnh quảng cáo kèm link trỏ */}
            <a
              href={adConfig.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full overflow-hidden cursor-pointer active:opacity-95"
            >
              <img
                src={adConfig.popupImage}
                alt="Khuyến mãi đặc biệt"
                className="w-full h-auto object-contain block group-hover:scale-[1.01] transition-transform duration-200"
                loading="eager"
              />
            </a>
          </div>
        </div>
      )}

      {/* 2. QUẢNG CÁO CỐ ĐỊNH DƯỚI CHÂN MÀN HÌNH (Sticky Bottom Banner) */}
      {showBottomBanner && adConfig.showBottomBanner && (
        <div className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 lg:pl-[225px] z-[110] pointer-events-none select-none animate-in slide-in-from-bottom-3 duration-300">
          <div className="relative mx-auto w-full max-w-[760px] px-2 sm:px-4 pb-1 sm:pb-2 pointer-events-auto">
            <div className="relative rounded-xl overflow-hidden bg-[#0a0f0d]/95 border border-white/15 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.7)] p-1 sm:p-1.5 flex items-center justify-center">
              {/* Nút tắt QC [x] phong cách chuẩn web xem phim */}
              <button
                type="button"
                onClick={handleCloseBottomBanner}
                aria-label="Tắt quảng cáo"
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/80 hover:bg-black text-white/80 hover:text-white border border-white/25 text-[10px] font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                title="Đóng quảng cáo"
              >
                <span className="text-[9px] text-white/60 tracking-wider">QC</span>
                <X className="w-3 h-3 text-white/90" />
              </button>

              {/* Banner ảnh động kèm link trỏ */}
              <a
                href={adConfig.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-[728px] overflow-hidden rounded-lg cursor-pointer text-center group"
              >
                <img
                  src={adConfig.bottomBannerImage}
                  alt="Quảng cáo tài trợ"
                  className="w-full h-auto max-h-[58px] sm:max-h-[75px] md:max-h-[85px] object-contain mx-auto group-hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(AdFloatingSystemComponent);
