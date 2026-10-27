"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Wrench, RefreshCw, KeyRound, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  const [reason, setReason] = useState<string>(
    "Hi Phim đang tiến hành nâng cấp cụm máy chủ và tối ưu hóa hệ thống phát video. Chúng tôi sẽ sớm quay trở lại phục vụ bạn!"
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [bypassToken, setBypassToken] = useState("");
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);

  // Check maintenance status
  const checkStatus = useCallback(
    async (isManual = false) => {
      if (isManual) setIsChecking(true);
      try {
        const res = await fetch("/api/system/maintenance", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.reason) {
            setReason(data.reason);
          }

          // If maintenance is turned OFF, automatically redirect back to home!
          if (!data?.enabled && !isPreview) {
            toast.success("Bảo trì đã hoàn tất! Đang chuyển hướng về trang chủ...");
            setTimeout(() => {
              window.location.replace("/");
            }, 600);
            return;
          }

          if (isManual) {
            if (data?.enabled) {
              toast.info("Hệ thống vẫn đang trong quá trình bảo trì. Vui lòng quay lại sau ít phút!");
            }
          }
        }
      } catch {
        if (isManual) {
          toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!");
        }
      } finally {
        setLastChecked(
          new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
        if (isManual) setIsChecking(false);
      }
    },
    [isPreview]
  );

  // Run on mount and periodically every 5 seconds
  useEffect(() => {
    checkStatus(false);
    const interval = setInterval(() => {
      checkStatus(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleAdminBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bypassToken.trim()) {
      toast.error("Vui lòng nhập mã bảo mật!");
      return;
    }

    setIsSubmittingToken(true);
    try {
      const res = await fetch(
        `/api/system/maintenance?action=bypass&token=${encodeURIComponent(bypassToken.trim())}`
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Xác thực quản trị viên thành công! Đang chuyển hướng...");
        setTimeout(() => {
          window.location.replace("/?bypass=" + encodeURIComponent(bypassToken.trim()));
        }, 600);
      } else {
        toast.error("Mã bảo mật không chính xác!");
      }
    } catch {
      toast.error("Đã có lỗi xảy ra khi xác thực!");
    } finally {
      setIsSubmittingToken(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A08] text-[#F3F4F6] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Subtle Ambient Emerald Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/[0.08] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-green/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header / Branding */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(32,214,107,0.35)] group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Hi <span className="text-brand-green">Phim</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isPreview && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Chế độ Xem trước
            </span>
          )}
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ĐANG BẢO TRÌ HỆ THỐNG
          </span>
        </div>
      </header>

      {/* Main Focus Stage */}
      <main className="w-full max-w-lg mx-auto my-auto text-center z-10 flex flex-col items-center py-6 sm:py-10">
        {/* Minimalist Icon Squircle */}
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-[#0D1410] border border-white/10 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl relative">
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 blur-md pointer-events-none" />
            <Wrench className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-400 relative z-10" />
          </div>
        </div>

        {/* Heading & Clean Message */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
          Hệ Thống Đang Nâng Cấp & Bảo Trì
        </h1>

        <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-md mb-8">
          {reason}
        </p>

        {/* Action Controls & Live Auto-Refresh */}
        <div className="w-full max-w-md bg-[#0C130F]/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50 pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Tự động kiểm tra trạng thái</span>
            </div>
            {lastChecked && (
              <span className="font-mono text-[11px] text-white/40">Cập nhật: {lastChecked}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={isChecking}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-brand-green to-emerald-400 hover:from-emerald-400 hover:to-brand-green text-[#051309] font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(32,214,107,0.3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Đang kiểm tra lại..." : "Tải Lại Trang"}</span>
            </button>

            <Link
              href="/admin"
              className="px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Vào trang quản trị (Admin)"
            >
              <span>Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowAdminBypass(!showAdminBypass)}
              className="text-[11px] text-white/40 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer py-1"
            >
              <KeyRound className="w-3 h-3" />
              <span>Nhập mã Bypass truy cập</span>
            </button>
          </div>
        </div>

        {/* Compact Admin Bypass Form */}
        {showAdminBypass && (
          <form
            onSubmit={handleAdminBypassSubmit}
            className="mt-4 w-full max-w-md p-4 rounded-2xl bg-[#0C130F] border border-white/10 text-left animate-in fade-in zoom-in duration-200"
          >
            <label className="block text-[11px] font-bold text-white/70 mb-2">
              Nhập mã Secret Token để truy cập kiểm thử website:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={bypassToken}
                onChange={(e) => setBypassToken(e.target.value)}
                placeholder="Nhập mã token bí mật..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green transition-colors"
              />
              <button
                type="submit"
                disabled={isSubmittingToken}
                className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                <span>Vào</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-3 z-10 border-t border-white/5">
        <p className="text-xs text-white/40">
          Hi Phim — Nền tảng xem phim chất lượng cao. Hẹn gặp lại bạn sớm nhất!
        </p>
      </footer>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060A08]" />}>
      <MaintenanceContent />
    </Suspense>
  );
}
