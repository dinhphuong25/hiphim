"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench } from "lucide-react";
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

        if (data && data.enabled === false) {
          window.location.replace("/");
          return;
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

  // Fetch reason on mount and auto-refresh when maintenance completes
  useEffect(() => {
    checkStatus(false);
    const interval = setInterval(() => {
      checkStatus(false);
    }, 20000);
    return () => clearInterval(interval);
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
              max-width: 480px !important;
              border-radius: 24px !important;
              background-color: #0d0d0d !important;
              border: 1px solid rgba(255, 255, 255, 0.12) !important;
              padding: 38px 34px !important;
              text-align: center !important;
              box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95), 0 0 40px rgba(255, 255, 255, 0.02) !important;
            }
            .m-icon {
              width: 56px !important;
              height: 56px !important;
              border-radius: 16px !important;
              background-color: rgba(255, 255, 255, 0.08) !important;
              border: 1px solid rgba(255, 255, 255, 0.12) !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              margin: 0 auto 18px !important;
              color: #ffffff !important;
            }
            .m-h1 {
              font-size: 23px !important;
              font-weight: 700 !important;
              color: #ffffff !important;
              margin: 0 0 12px 0 !important;
              letter-spacing: -0.02em !important;
            }
            .m-desc {
              font-size: 14.5px !important;
              line-height: 1.65 !important;
              color: #a1a1aa !important;
              margin: 0 !important;
              font-weight: 400 !important;
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
          className="m-box w-full max-w-[480px] rounded-3xl bg-[#0d0d0d] border border-white/10 p-8 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-center animate-in fade-in zoom-in-95 duration-200"
          style={{
            width: "100%",
            maxWidth: "480px",
            borderRadius: "24px",
            backgroundColor: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "38px 34px",
            textAlign: "center",
            boxShadow: "0 25px 70px rgba(0,0,0,0.95), 0 0 40px rgba(255,255,255,0.02)",
          }}
        >
          {/* Wrench Icon */}
          <div
            className="m-icon w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white mx-auto mb-5"
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <Wrench className="w-6 h-6 text-white" strokeWidth={2.2} style={{ width: 24, height: 24, color: "#fff" }} />
          </div>

          {/* Heading */}
          <h1
            className="m-h1 text-xl sm:text-2xl font-bold text-white tracking-tight mb-3"
            style={{ fontSize: "23px", fontWeight: "700", color: "#fff", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}
          >
            Máy Chủ Đang Bảo Trì
          </h1>

          {/* Message / Reason */}
          <p
            className="m-desc text-zinc-400 text-sm sm:text-[15px] leading-relaxed font-normal"
            style={{ fontSize: "14.5px", lineHeight: "1.65", color: "#a1a1aa", margin: "0" }}
          >
            {reason || DEFAULT_REASON}
          </p>
        </div>
      </div>
    </>
  );
}
