"use client";

import { useState } from "react";
import {
  Apple,
  Smartphone,
  Check,
  Copy,
  ArrowDownToLine,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import IosSignerTool from "@/components/app-download/ios-signer-tool";

const IOS_IPA_URL =
  "https://expo.dev/artifacts/eas/6ahM1Trwhg6kUcIHiO2Bt-j60VPaxwqo1doGY24SvAQ.ipa";
const ANDROID_APK_URL =
  "https://expo.dev/artifacts/eas/Ks1hH1Stya9KDKXE6l3XfQGUKDdM3vjbJJmna1_b5f4.apk";

export default function TaiAppClient() {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [copied, setCopied] = useState(false);

  const handleCopy = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã sao chép liên kết tải");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  return (
    <div className="min-h-screen bg-[#070908] text-white pt-7 sm:pt-9 pb-20">
      <main className="w-full max-w-[840px] mx-auto px-4 sm:px-6">
        {/* Simple Clean Title (No breadcrumb, no subtext line) */}
        <div className="text-center mb-5 sm:mb-7">
          <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight">
            Tải Ứng Dụng Xem Phim
          </h1>
        </div>

        {/* Platform Switcher */}
        <div className="flex justify-center mb-6 sm:mb-7">
          <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setPlatform("ios")}
              className={cn(
                "px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer",
                platform === "ios"
                  ? "bg-white text-black shadow-sm"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Apple className="w-4 h-4 fill-current" />
              <span>iPhone / iPad (iOS)</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform("android")}
              className={cn(
                "px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer",
                platform === "android"
                  ? "bg-white text-black shadow-sm"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (APK)</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PLATFORM 1: IOS VIEW                                    */}
        {/* ======================================================== */}
        {platform === "ios" && (
          <div className="space-y-5 sm:space-y-6">
            {/* Quick File Download Row */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white">Gói Cài Đặt Hi Phim iOS</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Tệp: <code>hiphim.ipa</code> (45.8 MB) &bull; Dành cho iOS 14.0 trở lên
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/download/ios"
                  download="hiphim.ipa"
                  className="px-4 py-2 sm:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Tải File .IPA</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(IOS_IPA_URL)}
                  className="px-3 py-2 sm:py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  title="Sao chép liên kết"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Online Signer Tool */}
            <IosSignerTool />

            {/* 3rd-Party App Guide (ESign, Scarlet) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-[13px] text-white/70 space-y-3">
              <h3 className="font-bold text-white text-sm sm:text-[15px]">
                Hướng Dẫn Cài Đặt Bằng ESign Hoặc Scarlet
              </h3>
              <div className="space-y-2 leading-relaxed">
                <p>1. Tải tệp <code>hiphim.ipa</code> về máy bằng nút ở trên.</p>
                <p>
                  2. Mở ứng dụng <strong>ESign</strong> hoặc <strong>Scarlet</strong>, vào phần quản lý chứng chỉ để nhập tệp <code>.p12</code> (kèm mật khẩu) và tệp <code>.mobileprovision</code>.
                </p>
                <p>
                  3. Chọn tệp <code>hiphim.ipa</code> đã tải và bấm <strong>Ký (Signature)</strong> với chứng chỉ vừa nhập.
                </p>
                <p>
                  4. Bấm <strong>Cài đặt (Install)</strong> khi có thông báo hiển thị để đưa ứng dụng ra màn hình chính.
                </p>
              </div>
              <p className="text-[11px] text-white/40 pt-2.5 border-t border-white/5">
                Nếu máy báo chưa tin cậy nhà phát triển: Mở <em>Cài đặt &rarr; Cài đặt chung &rarr; Quản lý VPN & Thiết bị</em> &rarr; Chọn chứng chỉ và bấm <strong>Tin cậy</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PLATFORM 2: ANDROID VIEW                                */}
        {/* ======================================================== */}
        {platform === "android" && (
          <div className="space-y-5 sm:space-y-6">
            {/* Quick File Download Row */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white">Gói Cài Đặt Hi Phim Android</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Tệp: <code>hiphim.apk</code> (35.2 MB) &bull; Dành cho Android 8.0 trở lên
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/download/android"
                  download="hiphim.apk"
                  className="px-4 py-2 sm:py-2.5 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs sm:text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Tải File .APK</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy(ANDROID_APK_URL)}
                  className="px-3 py-2 sm:py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  title="Sao chép liên kết"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Android Guide */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-[13px] text-white/70 space-y-3">
              <h3 className="font-bold text-white text-sm sm:text-[15px]">
                Hướng Dẫn Cài Đặt Tệp .APK
              </h3>
              <div className="space-y-2 leading-relaxed">
                <p>1. Bấm nút <strong>Tải File .APK</strong> ở trên để lưu gói cài đặt về máy.</p>
                <p>
                  2. Nếu trình duyệt hiện thông báo <em>&ldquo;Tệp này có thể gây hại...&rdquo;</em>, chọn <strong>&ldquo;Vẫn tải xuống&rdquo;</strong> (đây là cảnh báo tự động mặc định của hệ điều hành cho mọi file APK tải ngoài CH Play).
                </p>
                <p>
                  3. Mở tệp từ thanh thông báo và bấm <strong>Cài đặt</strong> (bật Cho phép nguồn này nếu có yêu cầu bảo mật).
                </p>
              </div>
              <p className="text-[11px] text-white/40 pt-2.5 border-t border-white/5">
                Ứng dụng an toàn, sạch 100%, không kèm quảng cáo và chỉ yêu cầu quyền kết nối mạng để phát phim.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
