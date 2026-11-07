"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_REASON =
  "Hệ thống đang được nâng cấp định kỳ để cải thiện dịch vụ và nâng cấp máy chủ. Vui lòng quay lại sau, xin thông cảm vì sự bất tiện này.";

export default function MaintenancePage() {
  const [reason, setReason] = useState<string>(DEFAULT_REASON);
  const [isChecking, setIsChecking] = useState(false);

  // Check maintenance status
  const checkStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsChecking(true);
    try {
      const res = await fetch("/api/system/maintenance", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.reason) {
          const cleanReason = data.reason.replace(
            /để cải thiện trải nghiệm xem phim\.?/gi,
            "để cải thiện dịch vụ và nâng cấp máy chủ. Vui lòng quay lại sau, xin thông cảm vì sự bất tiện này."
          );
          setReason(cleanReason);
        }

        if (isManual) {
          if (!data?.enabled) {
            toast.success("Bảo trì đã hoàn tất! Đang quay lại trang chủ...");
            setTimeout(() => {
              window.location.replace("/");
            }, 600);
            return;
          }
          toast.info("Hệ thống vẫn đang trong quá trình bảo trì.");
        }
      }
    } catch {
      if (isManual) {
        toast.error("Không thể kết nối đến máy chủ.");
      }
    } finally {
      if (isManual) setIsChecking(false);
    }
  }, []);

  // Fetch reason on mount
  useEffect(() => {
    checkStatus(false);
  }, [checkStatus]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 select-none font-sans">
      {/* Minimalist Centered Popup */}
      <div className="w-full max-w-[390px] rounded-2xl bg-[#0d0d0d] border border-white/10 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Wrench Icon */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white mx-auto mb-4">
          <Wrench className="w-5 h-5 text-white" strokeWidth={2} />
        </div>

        {/* Heading */}
        <h1 className="text-lg font-bold text-white tracking-tight mb-2.5">
          Máy Chủ Đang Bảo Trì
        </h1>

        {/* Message / Reason */}
        <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 font-normal">
          {reason || DEFAULT_REASON}
        </p>

        {/* Single Action Button */}
        <button
          type="button"
          onClick={() => checkStatus(true)}
          disabled={isChecking}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-black ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Đang kiểm tra..." : "Tải Lại Trang"}</span>
        </button>
      </div>
    </div>
  );
}
