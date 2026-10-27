"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { Scale, Shield, ShieldAlert, X } from "lucide-react";
import BrandLogo from "@/components/ui/brand-logo";

interface FooterProps {
  customFooterText?: string;
}

function FooterComponent({ customFooterText }: FooterProps = {}) {
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "disclaimer" | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  return (
    <footer className="w-full mt-auto mb-0 select-none text-cinema-text px-4 sm:px-8 lg:px-12 pb-20 sm:pb-24 lg:pb-6 pt-1 sm:pt-2">
      {/* Footer Card Container matching Hi Download - Compact & Centered */}
      <div className="w-full max-w-[760px] mx-auto rounded-2xl border border-white/10 bg-[#0C130F]/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] py-3.5 px-4 sm:py-4 sm:px-5">
        {/* Top Row: Brand Info (Left) + Quick Navigation Links (Right) */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-center sm:text-left">
          {/* Left: Brand Identity & Tagline */}
          <div className="flex flex-col items-center sm:items-start shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              aria-label="Về trang chủ Hi Phim"
            >
              <BrandLogo size="sm" showSlogan={false} />
            </Link>
            <p className="text-[11.5px] sm:text-[12px] text-white/55 font-normal leading-normal mt-0.5 sm:mt-1 text-center sm:text-left">
              {customFooterText ? customFooterText.replace(/\s*phi lợi nhuận/gi, "") : "Nền tảng xem phim trực tuyến miễn phí."}
            </p>
          </div>

          {/* Right: Quick Links (cùng 1 hàng) */}
          <div className="flex items-center justify-center sm:justify-end flex-wrap gap-2.5 sm:gap-3 text-[12px] sm:text-[12.5px] font-medium text-white/85">
            {/* 1. Điều Khoản */}
            <button
              type="button"
              onClick={() => setActiveModal("terms")}
              className="flex items-center gap-1.5 hover:text-brand-green transition-colors cursor-pointer group"
              title="Xem Điều khoản sử dụng"
            >
              <Scale className="w-3.5 h-3.5 text-brand-green shrink-0 group-hover:scale-110 transition-transform" />
              <span>Điều Khoản</span>
            </button>

            {/* Divider */}
            <div className="w-[1.5px] h-3 bg-white/20 hidden xs:block" />

            {/* 2. Bảo Mật */}
            <button
              type="button"
              onClick={() => setActiveModal("privacy")}
              className="flex items-center gap-1.5 hover:text-brand-green transition-colors cursor-pointer group"
              title="Xem Chính sách bảo mật"
            >
              <Shield className="w-3.5 h-3.5 text-brand-green shrink-0 group-hover:scale-110 transition-transform" />
              <span>Bảo Mật</span>
            </button>

            {/* Divider */}
            <div className="w-[1.5px] h-3 bg-white/20 hidden xs:block" />

            {/* 3. Miễn Trừ Pháp Lý */}
            <button
              type="button"
              onClick={() => setActiveModal("disclaimer")}
              className="flex items-center gap-1.5 hover:text-brand-green transition-colors cursor-pointer group"
              title="Xem Tuyên bố miễn trừ trách nhiệm pháp lý"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-brand-green shrink-0 group-hover:scale-110 transition-transform" />
              <span>Miễn Trừ Pháp Lý</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-2.5 sm:my-3" />

        {/* Bottom Row: Copyright & Founder Info */}
        <div className="text-center space-y-0.5">
          <p className="text-[11.5px] sm:text-[12px] text-white/85 font-medium">
            © 2026 Hi Phim. Toàn quyền được bảo lưu.
          </p>
          {/* Tạm ẩn người thành lập và phát triển */}
          {/* <p className="text-[11px] sm:text-[11.5px] text-white/50 font-normal">
            Được thành lập và phát triển bởi <span className="text-brand-green font-medium">Kim Đình Phương</span>.
          </p> */}
        </div>
      </div>

      {/* Terms of Service Modal */}
      {activeModal === "terms" && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0F1712] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[min(86vh,540px)] overflow-hidden animate-in zoom-in-95 duration-200 text-left select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#0F1712]">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-brand-green" />
                <h3 className="text-base sm:text-lg font-bold text-white">Điều Khoản Sử Dụng</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="px-5 sm:px-6 py-4 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-[13px] text-white/70 space-y-3 leading-relaxed text-justify">
              <p>
                Chào mừng bạn đến với <strong>Hi Phim</strong>. Khi truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản sau:
              </p>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">1. Mục đích hoạt động</h4>
                <p>
                  Hi Phim là một nền tảng phi lợi nhuận, được xây dựng nhằm mục đích học tập, nghiên cứu công nghệ và phục vụ cộng đồng xem phim giải trí hoàn toàn miễn phí.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">2. Bản quyền nội dung</h4>
                <p>
                  Tất cả các nội dung phim ảnh, hình ảnh và video trên website đều được tổng hợp tự động từ các nguồn công khai trên Internet. Hi Phim không trực tiếp lưu trữ hay sở hữu bất kỳ tệp video vi phạm bản quyền nào trên máy chủ riêng.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">3. Trách nhiệm người dùng</h4>
                <p>
                  Người dùng cam kết không sử dụng trang web cho các mục đích thương mại trái phép, không tấn công phá hoại hạ tầng mạng hoặc can thiệp tiêu cực vào trải nghiệm của người khác.
                </p>
              </div>
            </div>

            {/* Modal Footer - Fixed & Always Fully Visible */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-white/10 bg-[#0F1712] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl bg-brand-green text-[#051309] font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === "privacy" && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0F1712] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[min(86vh,540px)] overflow-hidden animate-in zoom-in-95 duration-200 text-left select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#0F1712]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-green" />
                <h3 className="text-base sm:text-lg font-bold text-white">Chính Sách Bảo Mật</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="px-5 sm:px-6 py-4 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-[13px] text-white/70 space-y-3 leading-relaxed text-justify">
              <p>
                Hi Phim coi trọng quyền riêng tư của người dùng và cam kết bảo mật thông tin tối đa:
              </p>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">1. Dữ liệu cá nhân</h4>
                <p>
                  Chúng tôi không bắt buộc người dùng phải cung cấp thông tin cá nhân nhạy cảm khi xem phim. Bạn hoàn toàn có thể thưởng thức nội dung với tư cách Khách.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">2. Lưu trữ cục bộ & Cookie</h4>
                <p>
                  Dữ liệu lịch sử xem, danh sách phim yêu thích và tiến trình tập phim được lưu trữ an toàn trong trình duyệt (LocalStorage) của thiết bị bạn đang dùng để mang lại trải nghiệm tiện lợi nhất.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">3. Cam kết an toàn</h4>
                <p>
                  Hi Phim cam kết không bán, trao đổi hoặc chia sẻ bất kỳ dữ liệu cá nhân nào của bạn cho bên thứ ba vì mục đích quảng cáo hoặc theo dõi người dùng.
                </p>
              </div>
            </div>

            {/* Modal Footer - Fixed & Always Fully Visible */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-white/10 bg-[#0F1712] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl bg-brand-green text-[#051309] font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Disclaimer Modal */}
      {activeModal === "disclaimer" && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0F1712] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[min(86vh,540px)] overflow-hidden animate-in zoom-in-95 duration-200 text-left select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 shrink-0 bg-[#0F1712]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-green" />
                <h3 className="text-base sm:text-lg font-bold text-white">Miễn Trừ Trách Nhiệm Pháp Lý</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="px-5 sm:px-6 py-4 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-[13px] text-white/70 space-y-3 leading-relaxed text-justify">
              <p>
                <strong>Tuyên bố từ chối trách nhiệm pháp lý đối với nội dung (Legal Disclaimer):</strong>
              </p>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">1. Tính chất hoạt động</h4>
                <p>
                  Hi Phim là một nền tảng phi lợi nhuận hoạt động như một công cụ tìm kiếm và lập chỉ mục nội dung video có sẵn trên Internet. Website hoàn toàn không sản xuất, không thương mại hóa và không biên tập bất kỳ nội dung nào.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">2. Không lưu trữ tệp đa phương tiện</h4>
                <p>
                  Mọi video, hình ảnh và nguồn phát đều được nhúng tự động từ các dịch vụ lưu trữ của bên thứ ba công khai trên Internet. Máy chủ của Hi Phim hoàn toàn không lưu trữ hay truyền tải bất kỳ tệp video nào vi phạm quyền tác giả.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white text-[13.5px] mb-1">3. Bản quyền tác giả & Khiếu nại (DMCA)</h4>
                <p>
                  Chúng tôi luôn tôn trọng quyền sở hữu trí tuệ hợp pháp. Nếu bạn là chủ sở hữu bản quyền của bất kỳ tài liệu nào và muốn yêu cầu gỡ bỏ liên kết, vui lòng gửi thông báo cho chúng tôi để được xử lý gỡ bỏ ngay lập tức.
                </p>
              </div>
            </div>

            {/* Modal Footer - Fixed & Always Fully Visible */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-white/10 bg-[#0F1712] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-xl bg-brand-green text-[#051309] font-bold text-xs sm:text-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}

export default memo(FooterComponent);
