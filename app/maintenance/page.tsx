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
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * { box-sizing: border-box; }
            a[href="#main-content"], .sr-only {
              display: none !important;
              visibility: hidden !important;
              position: absolute !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #000000 !important;
              color: #ffffff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              min-height: 100vh !important;
              width: 100% !important;
            }
            .m-wrap {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-height: 100vh !important;
              padding: 16px !important;
              background-color: #000000 !important;
              user-select: none !important;
            }
            .m-box {
              width: 100% !important;
              max-width: 390px !important;
              border-radius: 20px !important;
              background-color: #0d0d0d !important;
              border: 1px solid rgba(255, 255, 255, 0.12) !important;
              padding: 28px !important;
              text-align: center !important;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95) !important;
            }
            .m-icon {
              width: 48px !important;
              height: 48px !important;
              border-radius: 14px !important;
              background-color: rgba(255, 255, 255, 0.08) !important;
              border: 1px solid rgba(255, 255, 255, 0.12) !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              margin: 0 auto 16px !important;
              color: #ffffff !important;
            }
            .m-h1 {
              font-size: 19px !important;
              font-weight: 700 !important;
              color: #ffffff !important;
              margin: 0 0 10px 0 !important;
              letter-spacing: -0.02em !important;
            }
            .m-desc {
              font-size: 13px !important;
              line-height: 1.6 !important;
              color: #a1a1aa !important;
              margin: 0 0 24px 0 !important;
              font-weight: 400 !important;
            }
            .m-btn {
              width: 100% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 8px !important;
              padding: 12px 18px !important;
              border-radius: 12px !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              font-weight: 700 !important;
              font-size: 13.5px !important;
              border: none !important;
              cursor: pointer !important;
              box-shadow: 0 4px 14px rgba(255, 255, 255, 0.15) !important;
            }
            .m-btn:disabled {
              opacity: 0.5 !important;
              cursor: not-allowed !important;
            }
          `,
        }}
      />
      <div
        className="m-wrap min-h-screen bg-black text-white flex items-center justify-center p-4 select-none font-sans"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          padding: "16px",
        }}
      >
        {/* Minimalist Centered Popup */}
        <div
          className="m-box w-full max-w-[390px] rounded-2xl bg-[#0d0d0d] border border-white/10 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-center animate-in fade-in zoom-in-95 duration-200"
          style={{
            width: "100%",
            maxWidth: "390px",
            borderRadius: "20px",
            backgroundColor: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "28px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.95)",
          }}
        >
          {/* Wrench Icon */}
          <div
            className="m-icon w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white mx-auto mb-4"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Wrench className="w-5 h-5 text-white" strokeWidth={2} style={{ width: 20, height: 20, color: "#fff" }} />
          </div>

          {/* Heading */}
          <h1
            className="m-h1 text-lg font-bold text-white tracking-tight mb-2.5"
            style={{ fontSize: "19px", fontWeight: "700", color: "#fff", margin: "0 0 10px 0" }}
          >
            Máy Chủ Đang Bảo Trì
          </h1>

          {/* Message / Reason */}
          <p
            className="m-desc text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 font-normal"
            style={{ fontSize: "13px", lineHeight: "1.6", color: "#a1a1aa", margin: "0 0 24px 0" }}
          >
            {reason || DEFAULT_REASON}
          </p>

          {/* Single Action Button */}
          <button
            type="button"
            onClick={() => checkStatus(true)}
            disabled={isChecking}
            className="m-btn w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 18px",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              color: "#000000",
              fontWeight: 700,
              fontSize: "13.5px",
              border: "none",
              cursor: isChecking ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-black ${isChecking ? "animate-spin" : ""}`}
              style={{ width: 14, height: 14, color: "#000" }}
            />
            <span>{isChecking ? "Đang kiểm tra..." : "Tải Lại Trang"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
