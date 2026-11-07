"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Wrench, RefreshCw, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function MaintenanceContent() {
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";

  const [reason, setReason] = useState<string>(
    "Hệ thống đang được nâng cấp định kỳ để cải thiện trải nghiệm xem phim. Vui lòng quay lại sau ít phút."
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
            toast.success("Bảo trì hoàn tất! Đang chuyển hướng về trang chủ...");
            setTimeout(() => {
              window.location.replace("/");
            }, 600);
            return;
          }

          if (isManual) {
            if (data?.enabled) {
              toast.info("Hệ thống vẫn đang trong quá trình bảo trì.");
            }
          }
        }
      } catch {
        if (isManual) {
          toast.error("Không thể kết nối đến máy chủ.");
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
        toast.success("Xác thực quản trị viên thành công!");
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
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 relative select-none font-sans">
      {/* Top Header / Branding */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between py-2 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-white text-black font-black text-xs flex items-center justify-center transition-transform group-hover:scale-105">
            H
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            Hi Phim
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isPreview && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/10 text-white/70 border border-white/15">
              <ShieldCheck className="w-3 h-3 text-white" />
              Xem trước
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/20 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            BẢO TRÌ HỆ THỐNG
          </span>
        </div>
      </header>

      {/* Main Focus: Black & White Minimalist Notification Popup */}
      <main className="w-full max-w-md mx-auto my-auto z-10 flex flex-col items-center py-6">
        <div className="w-full rounded-2xl bg-[#0e0e0e] border border-white/15 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl text-center relative animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Icon */}
          <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-white mx-auto mb-4">
            <Wrench className="w-5 h-5 text-white" strokeWidth={2} />
          </div>

          {/* Heading */}
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2">
            Hệ Thống Đang Nâng Cấp & Bảo Trì
          </h1>

          {/* Message / Reason */}
          <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-5 font-normal">
            {reason}
          </p>

          {/* Live Auto-Refresh Status Bar */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Tự động kiểm tra trạng thái</span>
            </div>
            {lastChecked && (
              <span className="font-mono text-[10.5px] text-zinc-500">
                {lastChecked}
              </span>
            )}
          </div>

          {/* Action Buttons: Pure Black & White */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={isChecking}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-black ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Đang kiểm tra..." : "Tải Lại Trang"}</span>
            </button>

            <Link
              href="/admin"
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Vào trang quản trị"
            >
              <span>Quản Trị</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/80" />
            </Link>
          </div>

          {/* Admin Bypass Toggle */}
          <div className="pt-4 mt-4 border-t border-white/10 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowAdminBypass(!showAdminBypass)}
              className="text-[11px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-0.5"
            >
              <KeyRound className="w-3 h-3" />
              <span>Mã truy cập quản trị viên</span>
            </button>

            {/* Expandable Bypass Form */}
            {showAdminBypass && (
              <form
                onSubmit={handleAdminBypassSubmit}
                className="mt-3 w-full p-3 rounded-xl bg-black/60 border border-white/15 text-left animate-in fade-in duration-150"
              >
                <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                  Nhập mã Token để truy cập:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="password"
                    value={bypassToken}
                    onChange={(e) => setBypassToken(e.target.value)}
                    placeholder="Mã bí mật..."
                    className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingToken}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <span>Vào</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 z-10">
        <p className="text-[11px] text-zinc-600">
          Hi Phim — Hệ thống đang được bảo trì định kỳ. Cảm ơn sự kiên nhẫn của bạn.
        </p>
      </footer>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MaintenanceContent />
    </Suspense>
  );
}
