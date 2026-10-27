"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
  User,
  Shield,
  Megaphone,
  Sparkles,
  Info,
  Pin,
  LogIn,
  Film,
  Clapperboard,
} from "lucide-react";
import { AnimatedHeaderBellIcon } from "@/components/ui/animated-header-icons";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface MovieReportItem {
  id: string;
  movieSlug: string;
  movieName: string;
  episodeName?: string;
  serverName?: string;
  issueType: string;
  description?: string;
  status: "pending" | "resolved";
  createdAt: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  resolvedAt?: number;
}

export interface SystemNotificationItem {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "update";
  link?: string;
  createdAt: number;
  author?: string;
}

function formatRelativeTime(timestamp: number) {
  if (!timestamp) return "";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Date(timestamp).toLocaleDateString("vi-VN");
}

const DEFAULT_FALLBACK_NOTIFICATIONS: SystemNotificationItem[] = [
  {
    id: "sys_welcome_2026",
    title: "Chào mừng bạn ghé thăm!",
    content: "Chúc bạn có những giây phút xem phim thư giãn tuyệt vời với hơn 50.000+ tựa phim bom tấn và tập mới cập nhật liên tục hoàn toàn miễn phí.",
    type: "success",
    createdAt: Date.now() - 3600000 * 24 * 2,
    author: "Ban Quản Trị",
  },
  {
    id: "sys_feature_report_2026",
    title: "Tính năng Báo lỗi tập phim",
    content: "Nếu bạn gặp sự cố khi xem phim (video đứng hình, mất tiếng, lệch sub), hãy bấm nút 'Báo lỗi tập' để đội ngũ kỹ thuật khắc phục ngay nhé.",
    type: "info",
    createdAt: Date.now() - 3600000 * 5,
    author: "Ban Quản Trị",
  },
];

export default function NotificationBell({ className }: { className?: string }) {
  const { user, openAuthModal } = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);

  // System broadcast notifications (from Admin, available to all without login)
  const [systemNotifs, setSystemNotifs] = useState<SystemNotificationItem[]>(DEFAULT_FALLBACK_NOTIFICATIONS);
  const [announcementBanner, setAnnouncementBanner] = useState<{
    enabled: boolean;
    text: string;
    link?: string;
    type?: string;
  } | null>(null);

  // Episode reports (user or admin)
  const [reports, setReports] = useState<MovieReportItem[]>([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  // Tab states
  const [mainTab, setMainTab] = useState<"system" | "reports">("system");
  const [adminReportSubTab, setAdminReportSubTab] = useState<"pending" | "all">("pending");

  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [readSystemIds, setReadSystemIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "superadmin" ||
        user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );

  // Set default main tab: Admin defaults to reports; regular users and guests default to system notices
  useEffect(() => {
    if (isSuperAdmin) {
      setMainTab("reports");
    } else {
      setMainTab("system");
    }
  }, [isSuperAdmin]);

  // Load cached notifications & read notification IDs from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("hiphim_cached_system_notifs");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSystemNotifs(parsed);
        }
      }
      const stored = localStorage.getItem("hiphim_read_notif_ids_v2");
      if (stored) {
        setReadSystemIds(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const markAllSystemAsRead = useCallback(() => {
    const allIds = [
      ...systemNotifs.map((n) => n.id),
      announcementBanner?.text ? `banner_${announcementBanner.text.slice(0, 15)}` : "",
    ].filter(Boolean);

    setReadSystemIds((prev) => {
      const next = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem("hiphim_read_notif_ids_v2", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
  }, [systemNotifs, announcementBanner]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch system broadcast notifications (Public, No Auth Required)
  const fetchSystemNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/announcement", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.notifications)) {
          setSystemNotifs(data.notifications);
          try {
            localStorage.setItem("hiphim_cached_system_notifs", JSON.stringify(data.notifications));
          } catch {
            // Ignore
          }
        }
        if (data.announcement) {
          setAnnouncementBanner(data.announcement);
        }
      }
    } catch {
      // Ignore background fetch error
    }
  }, []);

  // Fetch episode reports (Only if user logged in)
  const fetchReports = useCallback(async (isSilent = false) => {
    if (!user) {
      setReports([]);
      setPendingReportsCount(0);
      return;
    }

    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch("/api/report", { method: "GET" });
      if (!res.ok) {
        if (!isSilent) setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
        if (data.isAdmin) {
          setPendingReportsCount(
            typeof data.pendingCount === "number"
              ? data.pendingCount
              : data.reports.filter((r: MovieReportItem) => r.status === "pending").length
          );
        } else {
          const resolvedCount = data.reports.filter((r: MovieReportItem) => r.status === "resolved").length;
          setPendingReportsCount(resolvedCount);
        }
      }
    } catch {
      // Ignore background fetch error
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [user]);

  const refreshAll = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      await Promise.all([fetchSystemNotifications(), fetchReports(true)]);
      if (!isSilent) setIsLoading(false);
    },
    [fetchSystemNotifications, fetchReports]
  );

  // Initial fetch and 5-minute background refresh (protecting Vercel serverless quotas)
  useEffect(() => {
    refreshAll(false);

    const handleVis = () => {
      if (document.visibilityState === "visible") {
        refreshAll(true);
      }
    };
    document.addEventListener("visibilitychange", handleVis);

    const interval = setInterval(() => {
      refreshAll(true);
    }, 300000); // 5 minutes

    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      clearInterval(interval);
    };
  }, [refreshAll]);

  // Real-time custom events
  useEffect(() => {
    const handleReportCreated = (e: any) => {
      const newReport: MovieReportItem = e.detail;
      if (!newReport) return;

      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);

      if (isSuperAdmin) {
        setPendingReportsCount((c) => c + 1);
        toast.info("🔔 Báo lỗi tập mới vừa được gửi", {
          description: `${newReport.movieName} ${newReport.episodeName ? `(${newReport.episodeName})` : ""}`,
        });
      }
    };

    const handleReportStatusChanged = (e: any) => {
      const { id, status } = e.detail || {};
      if (!id || !status) return;

      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, resolvedAt: status === "resolved" ? Date.now() : undefined } : r))
      );

      if (isSuperAdmin) {
        setPendingReportsCount((prev) => Math.max(0, status === "resolved" ? prev - 1 : prev + 1));
      }
    };

    const handleSystemNotifCreated = (e: any) => {
      const newNotif: SystemNotificationItem = e.detail;
      if (!newNotif) return;
      setSystemNotifs((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      toast.info(`📢 Thông báo mới: ${newNotif.title}`);
    };

    window.addEventListener("report-created", handleReportCreated);
    window.addEventListener("report-status-changed", handleReportStatusChanged);
    window.addEventListener("system-notification-created", handleSystemNotifCreated);

    return () => {
      window.removeEventListener("report-created", handleReportCreated);
      window.removeEventListener("report-status-changed", handleReportStatusChanged);
      window.removeEventListener("system-notification-created", handleSystemNotifCreated);
    };
  }, [isSuperAdmin]);

  // Admin: 1-click status toggle
  const handleMarkResolved = async (reportId: string, currentStatus: "pending" | "resolved") => {
    const newStatus = currentStatus === "pending" ? "resolved" : "pending";
    try {
      setUpdatingId(reportId);
      let res = await fetch("/api/report", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status: newStatus }),
      });

      // If PATCH is not accepted or fails, gracefully fallback to POST
      if (res.status === 405 || !res.ok) {
        const fallbackRes = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_status", id: reportId, status: newStatus }),
        });
        if (fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      const data = await res.json().catch(() => null);
      if (data && data.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status: newStatus, resolvedAt: newStatus === "resolved" ? Date.now() : undefined }
              : r
          )
        );

        if (newStatus === "resolved") {
          setPendingReportsCount((prev) => Math.max(0, prev - 1));
          toast.success("Đã đánh dấu tập phim này đã sửa xong!");
        } else {
          setPendingReportsCount((prev) => prev + 1);
          toast.info("Đã chuyển lại sang chờ xử lý.");
        }

        window.dispatchEvent(
          new CustomEvent("report-status-changed", {
            detail: { id: reportId, status: newStatus },
          })
        );
      } else {
        toast.error((data && data.error) || "Không thể cập nhật trạng thái.");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute unread system notifications count
  const unreadSystemCount = systemNotifs.filter((n) => !readSystemIds.includes(n.id)).length;
  const isBannerUnread =
    announcementBanner?.enabled &&
    Boolean(announcementBanner.text) &&
    !readSystemIds.includes(`banner_${announcementBanner.text.slice(0, 15)}`);

  const totalSystemUnread = unreadSystemCount + (isBannerUnread ? 1 : 0);
  const totalSystemCount = systemNotifs.length + (announcementBanner?.enabled && announcementBanner.text ? 1 : 0);
  const userResolvedCount = user ? reports.filter((r) => r.status === "resolved").length : 0;

  // Unread status check
  const hasUnread = isSuperAdmin
    ? pendingReportsCount > 0
    : totalSystemUnread > 0 || userResolvedCount > 0;

  // Badge count shown on bell icon:
  // For SuperAdmin: show pendingReportsCount if > 0, else total system count
  // For Users & Guests: show unread count if unread > 0, else show total active notices count!
  const badgeCount = isSuperAdmin
    ? (pendingReportsCount > 0 ? pendingReportsCount : totalSystemCount)
    : (totalSystemUnread > 0
        ? totalSystemUnread + userResolvedCount
        : totalSystemCount > 0
          ? totalSystemCount + userResolvedCount
          : 0);

  // Bump spring animation on count change
  const [isBumping, setIsBumping] = useState(false);
  const prevBadgeCountRef = useRef(badgeCount);

  useEffect(() => {
    if (prevBadgeCountRef.current !== badgeCount) {
      prevBadgeCountRef.current = badgeCount;
      setIsBumping(true);
      const timer = setTimeout(() => setIsBumping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [badgeCount]);

  const displayedReports = isSuperAdmin
    ? adminReportSubTab === "pending"
      ? reports.filter((r) => r.status === "pending")
      : reports
    : reports;

  return (
    <div className={cn("relative shrink-0 pointer-events-auto", className)} ref={containerRef}>
      {/* Bell Trigger Button - Open without needing to login */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-[#111714] border border-white/10 hover:border-brand-green/60 text-white/80 hover:text-white transition-all duration-300 group cursor-pointer active:scale-95 shadow-sm",
          isOpen && "border-brand-green bg-[#141e18] text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.25)]"
        )}
        aria-label="Thông báo hệ thống và báo lỗi tập"
        title="Thông báo"
      >
        <AnimatedHeaderBellIcon
          size={21}
          hasUnread={badgeCount > 0 && hasUnread}
          isOpen={isOpen}
        />

        {/* Outer Radar Ping Effect Wave for unread notifications in Green */}
        {badgeCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 w-5 h-5 rounded-full pointer-events-none animate-notif-radar",
              isSuperAdmin && pendingReportsCount > 0 ? "bg-amber-400" : "bg-brand-green"
            )}
          />
        )}

        {/* Counter Badge with Live Number Effect in Brand Green */}
        {badgeCount > 0 && (
          <span
            className={cn(
              "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-mono font-black text-[10.5px] leading-none select-none z-10 transition-all duration-300 pointer-events-none",
              "ring-2 ring-[#070b09] shadow-lg animate-notif-bounce",
              isSuperAdmin && pendingReportsCount > 0
                ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-red-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.85)] border border-white/50"
                : "bg-gradient-to-tr from-emerald-600 via-brand-green to-emerald-300 text-black shadow-[0_0_14px_rgba(32,214,107,0.9)] border border-emerald-200/60",
              isBumping && "scale-125"
            )}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown - Solid Dark Cinema Slate */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 w-[340px] sm:w-[380px] max-w-[calc(100vw-20px)]",
            "right-0 lg:-right-36",
            "bg-[#0d1410] border border-emerald-500/25 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(32,214,107,0.08)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white flex flex-col select-none"
          )}
        >
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-white/8 bg-[#090e0b] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand-green/15 border border-brand-green/30 text-brand-green flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">Trung Tâm Thông Báo</h3>
                  {isSuperAdmin && (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 truncate">
                  {isSuperAdmin
                    ? `${pendingReportsCount} tập cần sửa • ${systemNotifs.length} thông báo toàn trang`
                    : "Thông báo từ Ban Quản Trị & tiến độ phim"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {hasUnread && !isSuperAdmin && (
                <button
                  type="button"
                  onClick={markAllSystemAsRead}
                  className="px-2 py-1 rounded-lg text-[10.5px] font-semibold text-brand-green hover:bg-brand-green/10 border border-brand-green/25 transition-colors cursor-pointer flex items-center gap-1"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline">Đã đọc</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => refreshAll(false)}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-brand-green")} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Category Tabs: [📢 Từ Admin] vs [⚠ Báo Lỗi Tập] */}
          <div className="p-2 bg-[#090f0c] border-b border-white/5 shrink-0">
            <div className="flex items-center gap-1 bg-[#050806] p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setMainTab("system")}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  mainTab === "system"
                    ? "bg-brand-green text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Từ Admin</span>
                {systemNotifs.length > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                      mainTab === "system" ? "bg-black/25 text-black" : "bg-white/10 text-white/70"
                    )}
                  >
                    {systemNotifs.length + (announcementBanner?.enabled ? 1 : 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMainTab("reports")}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  mainTab === "reports"
                    ? "bg-brand-green text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Báo Lỗi Tập</span>
                {isSuperAdmin && pendingReportsCount > 0 && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                      mainTab === "reports" ? "bg-black/25 text-black" : "bg-rose-500/80 text-white"
                    )}
                  >
                    {pendingReportsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Admin Subtabs when on 'reports' tab */}
            {isSuperAdmin && mainTab === "reports" && (
              <div className="flex items-center gap-1.5 pt-2 px-1">
                <button
                  type="button"
                  onClick={() => setAdminReportSubTab("pending")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors",
                    adminReportSubTab === "pending"
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  Chờ xử lý ({pendingReportsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminReportSubTab("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors",
                    adminReportSubTab === "all"
                      ? "bg-white/15 text-white border border-white/20"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  Tất cả ({reports.length})
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: System Broadcast Notifications (From Admin - Accessible without login) */}
          {mainTab === "system" && (
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2.5 space-y-2.5 bg-[#0d1410]">
              {/* Personalized Welcome Card (For logged in members only) */}
              {user && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#101913] to-[#0c140f] border border-emerald-500/25 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                      {user.createdAt && Date.now() - new Date(user.createdAt).getTime() < 86400000 * 3
                        ? `Chào mừng thành viên mới, ${user.name || "bạn"}!`
                        : `Chào mừng quay trở lại, ${user.name || "bạn"}!`}
                    </h4>
                    <span className="text-[10px] font-mono text-white/40 shrink-0">Vừa xong</span>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {user.createdAt && Date.now() - new Date(user.createdAt).getTime() < 86400000 * 3
                      ? "Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể lưu phim yêu thích, xem lịch sử và báo lỗi tập phim bất cứ lúc nào."
                      : "Hôm nay có nhiều phim bom tấn và tập mới được cập nhật, chúc bạn có những phút giây thư giãn tuyệt vời!"}
                  </p>
                </div>
              )}

              {/* Always Pinned Welcome Notice from Ban Quản Trị */}
              {systemNotifs.find(
                (n) => n.id === "sys_welcome_2026" || n.title.toLowerCase().includes("chào mừng")
              ) && (() => {
                const welcomeItem = systemNotifs.find(
                  (n) => n.id === "sys_welcome_2026" || n.title.toLowerCase().includes("chào mừng")
                )!;
                return (
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/50 via-[#121c16] to-[#0e1611] border border-brand-green/35 shadow-[0_0_15px_rgba(32,214,107,0.08)] space-y-1.5 group">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/15 text-brand-green border border-emerald-500/25 flex items-center gap-1 shrink-0">
                          <Shield className="w-2.5 h-2.5" />
                          {welcomeItem.author || "Ban Quản Trị"}
                        </span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold bg-brand-green/20 text-brand-green border border-brand-green/30 flex items-center gap-1 shrink-0">
                          <Pin className="w-2.5 h-2.5 rotate-45 text-brand-green" />
                          ĐÃ GHIM
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 shrink-0">
                        {formatRelativeTime(welcomeItem.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-brand-green transition-colors leading-snug">
                      {welcomeItem.title}
                    </h4>

                    <p className="text-[11px] text-white/70 leading-relaxed">
                      {welcomeItem.content.includes("50.000+") ? (
                        <>
                          {welcomeItem.content.split("50.000+")[0]}
                          <span className="text-brand-green font-bold">50.000+</span>
                          {welcomeItem.content.split("50.000+")[1]}
                        </>
                      ) : (
                        welcomeItem.content
                      )}
                    </p>

                    {welcomeItem.link && (
                      <div className="pt-1 border-t border-white/5">
                        <Link
                          href={welcomeItem.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green hover:underline"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Active Pinned Announcement Banner if set by Admin */}
              {announcementBanner?.enabled && announcementBanner.text && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/60 via-[#101b14] to-[#0c140f] border border-brand-green/40 shadow-[0_0_15px_rgba(32,214,107,0.12)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-green flex items-center gap-1">
                      <Pin className="w-3 h-3 rotate-45" />
                      Thông báo ghim toàn trang
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold bg-brand-green/20 text-brand-green border border-brand-green/30">
                      QUAN TRỌNG
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-medium">
                    {announcementBanner.text}
                  </p>
                  {announcementBanner.link && (
                    <Link
                      href={announcementBanner.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline pt-0.5"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}

              {/* Broadcast System Notifications List (Excluding Pinned Welcome Notice) */}
              {systemNotifs.filter(
                (n) => n.id !== "sys_welcome_2026" && !n.title.toLowerCase().includes("chào mừng")
              ).length === 0 &&
              !systemNotifs.find((n) => n.id === "sys_welcome_2026" || n.title.toLowerCase().includes("chào mừng")) &&
              (!announcementBanner?.enabled || !announcementBanner?.text) ? (
                <div className="p-8 text-center text-white/50 flex flex-col items-center justify-center gap-2">
                  <Megaphone className="w-8 h-8 text-white/30 mb-1" />
                  <p className="text-xs font-semibold text-white/80">Chưa có thông báo mới từ Admin</p>
                  <p className="text-[11px] text-white/40 max-w-[250px] leading-relaxed">
                    Khi ban quản trị phát thông báo tin tức hoặc sự kiện, nội dung sẽ xuất hiện ngay tại đây.
                  </p>
                </div>
              ) : (
                systemNotifs
                  .filter(
                    (n) => n.id !== "sys_welcome_2026" && !n.title.toLowerCase().includes("chào mừng")
                  )
                  .map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#121915] hover:bg-[#16211c] border border-white/8 hover:border-brand-green/30 transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/15 text-brand-green border border-emerald-500/25 flex items-center gap-1 shrink-0">
                          <Shield className="w-2.5 h-2.5" />
                          {item.author || "Ban Quản Trị"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-brand-green transition-colors leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-white/70 leading-relaxed">
                      {item.content}
                    </p>

                    {item.link && (
                      <div className="pt-1 border-t border-white/5">
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-green hover:underline"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Episode Error Reports */}
          {mainTab === "reports" && (
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2.5 space-y-2 bg-[#0d1410]">
              {/* Not Logged In Prompt */}
              {!user ? (
                <div className="p-6 text-center text-white/70 flex flex-col items-center justify-center gap-3 bg-[#121915] border border-white/8 rounded-xl my-2">
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white mb-1">Theo dõi báo lỗi theo tài khoản</p>
                    <p className="text-[11px] text-white/50 leading-relaxed max-w-[260px]">
                      Đăng nhập để xem tiến độ và nhận thông báo khi Ban Quản Trị đã khắc phục xong tập phim bạn báo lỗi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal("login");
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(32,214,107,0.3)] active:scale-95 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng Nhập Ngay</span>
                  </button>
                </div>
              ) : displayedReports.length === 0 ? (
                <div className="p-8 text-center text-white/50 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-brand-green/70 mb-1" />
                  <p className="text-xs font-semibold text-white/90">
                    {isSuperAdmin
                      ? adminReportSubTab === "pending"
                        ? "Tuyệt vời! Không còn tập nào chờ sửa."
                        : "Chưa có báo cáo lỗi nào trong hệ thống."
                      : "Bạn chưa gửi báo lỗi tập phim nào."}
                  </p>
                  <p className="text-[11px] text-white/40 max-w-[260px] leading-relaxed">
                    {isSuperAdmin
                      ? "Hệ thống sẽ cập nhật tự động khi có thành viên gửi báo cáo lỗi tập mới."
                      : "Khi xem phim nếu phát hiện lỗi, hãy bấm nút 'Báo lỗi tập' để admin xử lý nhé."}
                  </p>
                </div>
              ) : (
                displayedReports.map((report) => {
                  const isPending = report.status === "pending";
                  return (
                    <div
                      key={report.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all duration-200 group relative space-y-2",
                        "bg-[#121915] hover:bg-[#16211c]",
                        isPending
                          ? "border-white/10 hover:border-brand-green/35"
                          : "border-white/5 opacity-80 hover:opacity-100"
                      )}
                    >
                      {/* Top Row: Status badge & timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1",
                              isPending
                                ? "bg-amber-400/15 text-amber-300 border border-amber-400/25"
                                : "bg-brand-green/15 text-brand-green border border-brand-green/25"
                            )}
                          >
                            {isPending ? (
                              <>
                                <Clock className="w-2.5 h-2.5" />
                                Chờ xử lý
                              </>
                            ) : (
                              <>
                                <Check className="w-2.5 h-2.5" />
                                Đã sửa xong
                              </>
                            )}
                          </span>

                          {report.serverName && (
                            <span className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                              {report.serverName}
                            </span>
                          )}
                        </div>

                        <span className="text-[10.5px] font-mono text-white/40">
                          {formatRelativeTime(report.createdAt)}
                        </span>
                      </div>

                      {/* Movie title & Episode */}
                      <div className="flex items-baseline gap-1.5">
                        <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-brand-green transition-colors line-clamp-1">
                          {report.movieName}
                        </h4>
                        {report.episodeName && (
                          <span className="text-[11px] font-extrabold text-brand-green shrink-0 bg-brand-green/10 border border-brand-green/25 px-1.5 py-0.2 rounded">
                            {report.episodeName}
                          </span>
                        )}
                      </div>

                      {/* Reporter info */}
                      {(report.userName || report.userEmail) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                          <User className="w-3 h-3 text-brand-green shrink-0" />
                          <span className="font-medium text-white/80 truncate">
                            {report.userName || report.userEmail?.split("@")[0]}
                          </span>
                          {report.userEmail && (
                            <span className="text-white/40 font-mono truncate text-[10px]">
                              ({report.userEmail})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Issue note box */}
                      <div className="p-2 rounded-lg bg-[#080d0a] border border-white/6 text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{report.issueType}</span>
                        </div>
                        {report.description && (
                          <p className="text-[11px] text-white/70 mt-1 line-clamp-2 italic leading-relaxed">
                            &ldquo;{report.description}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                        <Link
                          href={`/watch?slug=${encodeURIComponent(report.movieSlug)}`}
                          onClick={() => setIsOpen(false)}
                          className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Mở xem tập phim"
                        >
                          <ExternalLink className="w-3 h-3 text-brand-green" />
                          <span>Xem tập</span>
                        </Link>

                        {/* Admin 1-Click Status Toggle */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleMarkResolved(report.id, report.status)}
                            disabled={updatingId === report.id}
                            className={cn(
                              "py-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                              isPending
                                ? "bg-brand-green hover:bg-brand-green-hover text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                                : "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white"
                            )}
                          >
                            {updatingId === report.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>{isPending ? "Đã sửa" : "Mở lại"}</span>
                          </button>
                        )}

                        {!isSuperAdmin && !isPending && (
                          <span className="text-[11px] font-semibold text-brand-green flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã khắc phục
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer Navigation */}
          {isSuperAdmin && (
            <div className="p-2.5 bg-[#090e0b] border-t border-white/8 shrink-0 flex items-center justify-between text-xs">
              <span className="text-[11px] text-white/40">Quản trị toàn hệ thống</span>
              <Link
                href="/admin?tab=announcement"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 text-xs font-bold text-brand-green hover:text-emerald-300 transition-colors group"
              >
                <span>Tạo & quản lý thông báo</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
