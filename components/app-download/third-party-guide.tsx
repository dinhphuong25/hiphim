"use client";

import { useState } from "react";
import {
  Apple,
  FileCheck2,
  FolderDown,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Flame,
  Layers,
  Sparkles,
  Smartphone,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GuideTab = "esign" | "gbox" | "trollstore" | "pc";

export default function ThirdPartyGuide() {
  const [activeTab, setActiveTab] = useState<GuideTab>("esign");

  return (
    <div className="bg-[#0C1310] border border-white/10 rounded-3xl p-5 sm:p-7 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Apple className="w-4 h-4 text-white/70 fill-current" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-white/50">
              Hướng Dẫn Ký Ứng Dụng Thứ 3
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Cách Ký & Cài Đặt Qua ESign, GBox Hoặc TrollStore
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Nếu bạn đã cài sẵn các app ký chứng chỉ trên iPhone, hãy làm theo hướng dẫn dưới đây để
            cài Hi Phim nhanh chóng.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("esign")}
          className={cn(
            "py-2.5 px-3 rounded-2xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "esign"
              ? "bg-brand-green/15 border-brand-green/50 text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.15)]"
              : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ESign (Khuyên dùng)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gbox")}
          className={cn(
            "py-2.5 px-3 rounded-2xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "gbox"
              ? "bg-brand-green/15 border-brand-green/50 text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.15)]"
              : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GBox / Scarlet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("trollstore")}
          className={cn(
            "py-2.5 px-3 rounded-2xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "trollstore"
              ? "bg-brand-green/15 border-brand-green/50 text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.15)]"
              : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>TrollStore (Vĩnh viễn)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pc")}
          className={cn(
            "py-2.5 px-3 rounded-2xl text-xs font-bold transition-all text-center border flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "pc"
              ? "bg-brand-green/15 border-brand-green/50 text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.15)]"
              : "bg-white/[0.02] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Sideloadly (Máy tính)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB CONTENT 1: ESIGN */}
      {/* ======================================================== */}
      {activeTab === "esign" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-brand-green/5 border border-brand-green/20 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
            <p className="text-xs text-white/80 leading-relaxed">
              <strong>ESign</strong> là công cụ ký app trên iOS phổ biến và ổn định nhất tại Việt Nam.
              Cho phép ký trực tiếp không giới hạn app ngay trên iPhone mà không cần kết nối máy tính.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Tải tệp hiphim.ipa</p>
                <p className="text-white/55">
                  Bấm nút <strong>&ldquo;Tải File .IPA&rdquo;</strong> ở trên để tải gói cài đặt về ứng
                  dụng <strong>Tệp (Files)</strong> của iPhone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Nhập Chứng Chỉ vào ESign</p>
                <p className="text-white/55">
                  Mở <strong>ESign</strong> &rarr; Vào tab <strong>Cài đặt</strong> (Settings) &rarr;
                  Chọn <strong>Nhập quản lý chứng chỉ</strong> &rarr; Chọn tệp <code>.p12</code> (nhập
                  mật khẩu) và tệp <code>.mobileprovision</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Nhập tệp IPA vào thư viện ESign</p>
                <p className="text-white/55">
                  Vào mục <strong>Tệp (Files)</strong> trong ESign &rarr; Bấm dấu <strong>(+)</strong>{" "}
                  góc trên hoặc chọn file <code>hiphim.ipa</code> đã tải &rarr; Chọn{" "}
                  <strong>Nhập vào thư viện ứng dụng (Import)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Bấm Ký & Cài Đặt</p>
                <p className="text-white/55">
                  Vào tab <strong>Ứng dụng</strong> trong ESign &rarr; Bấm vào <strong>Hi Phim</strong>{" "}
                  &rarr; Chọn <strong>Ký (Signature)</strong> &rarr; Chọn chứng chỉ vừa nhập &rarr; Bấm{" "}
                  <strong>Ký</strong>. Ký xong chọn <strong>Cài đặt (Install)</strong> là app sẽ tự
                  xuất hiện ngoài màn hình chính!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 2: GBOX / SCARLET */}
      {/* ======================================================== */}
      {activeTab === "gbox" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <Info className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
            <p className="text-xs text-white/80 leading-relaxed">
              <strong>GBox</strong> và <strong>Scarlet</strong> là hai trình quản lý và ký file IPA
              gọn nhẹ, thao tác đơn giản với giao diện trực quan trên iPhone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Nhập Chứng Chỉ</p>
                <p className="text-white/55">
                  Mở GBox/Scarlet &rarr; Vào phần cài đặt chứng chỉ cá nhân &rarr; Tải lên tệp{" "}
                  <code>.p12</code> (kèm mật khẩu) và <code>.mobileprovision</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Nhập file hiphim.ipa</p>
                <p className="text-white/55">
                  Bấm biểu tượng Tải lên (Import) trong Scarlet/GBox và chọn tệp{" "}
                  <code>hiphim.ipa</code> từ máy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 col-span-1 md:col-span-2">
              <span className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Ký & Cài đặt</p>
                <p className="text-white/55">
                  Bấm vào ứng dụng <strong>Hi Phim</strong> &rarr; Chọn <strong>Ký (Sign)</strong>{" "}
                  bằng chứng chỉ của bạn &rarr; Khi hoàn tất, hệ thống sẽ hiện popup{" "}
                  <em>&ldquo;Cài đặt ứng dụng&rdquo;</em> &rarr; Chọn <strong>Cài đặt</strong> để hoàn
                  tất.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 3: TROLLSTORE */}
      {/* ======================================================== */}
      {activeTab === "trollstore" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-white/80 leading-relaxed">
              <strong>TrollStore</strong> là cách cài đặt ứng dụng đỉnh nhất trên iOS (hỗ trợ iOS
              14.0 - 16.6.1 và iOS 17.0). Cài đặt vĩnh viễn, không cần chứng chỉ, không bao giờ bị
              thu hồi hay hết hạn!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Tải file hiphim.ipa</p>
                <p className="text-white/55">
                  Bấm nút <strong>&ldquo;Tải File .IPA&rdquo;</strong> ở phía trên để tải về iPhone của
                  bạn.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Mở trong TrollStore</p>
                <p className="text-white/55">
                  Mở ứng dụng <strong>Tệp (Files)</strong> &rarr; Tìm tệp <code>hiphim.ipa</code> &rarr;
                  Bấm nút <strong>Chia sẻ (Share)</strong> &rarr; Chọn <strong>TrollStore</strong>{" "}
                  &rarr; Bấm <strong>Install</strong>. Ứng dụng sẽ được cài đặt ngay lập tức trong 2
                  giây!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 4: SIDELOADLY / ALTSTORE */}
      {/* ======================================================== */}
      {activeTab === "pc" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
            <Laptop className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
            <p className="text-xs text-white/80 leading-relaxed">
              <strong>Sideloadly / AltStore</strong>: Cài đặt qua máy tính PC hoặc Mac bằng tài khoản
              Apple ID cá nhân hoàn toàn miễn phí, không lo rủi ro bị thu hồi chứng chỉ doanh nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Kết nối iPhone với PC</p>
                <p className="text-white/55">
                  Cắm cáp nối iPhone với máy tính và mở phần mềm <strong>Sideloadly</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Kéo thả hiphim.ipa</p>
                <p className="text-white/55">
                  Tải file <code>hiphim.ipa</code> về máy tính rồi kéo thả vào giao diện Sideloadly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
              <span className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-green font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="text-xs text-white/80">
                <p className="font-semibold text-white mb-0.5">Nhập Apple ID & Bấm Start</p>
                <p className="text-white/55">
                  Nhập tài khoản Apple ID của bạn và bấm <strong>Start</strong>. Đợi 1 phút, app Hi
                  Phim sẽ tự xuất hiện trên iPhone!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
