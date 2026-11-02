"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Bell,
  Search,
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
  Pin,
  LogIn,
  Play,
  Film,
} from "lucide-react";
import { AnimatedHeaderBellIcon } from "@/components/ui/animated-header-icons";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchAnnouncementShared } from "@/lib/announcement-client";

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
    id: "sys_update_v2026_release",
    title: "Bản cập nhật mới đã phát hành",
    content: "Bản cập nhật mới đã phát hành với giao diện mới và cải thiện server tốc độ cao, mượt mà hơn. Chúc mọi người xem phim vui vẻ. Thân chào!",
    type: "update",
    createdAt: 1793545700000,
    author: "Ban Quản Trị",
  },
  {
    id: "sys_feature_report_2026",
    title: "Tính năng Báo lỗi tập phim",
    content: "Nếu bạn gặp sự cố khi xem phim (video đứng hình, mất tiếng, lệch sub), hãy bấm nút 'Báo lỗi tập' để đội ngũ kỹ thuật khắc phục ngay nhé.",
    type: "info",
    createdAt: 1791495899231,
    author: "Ban Quản Trị",
  },
  {
    id: "sys_welcome_2026",
    title: "Chào mừng bạn ghé thăm!",
    content: "Chúc bạn có những giây phút xem phim thư giãn tuyệt vời với hơn 50.000+ tựa phim bom tấn và tập mới cập nhật liên tục hoàn toàn miễn phí.",
    type: "success",
    createdAt: 1791341099231,
    author: "Ban Quản Trị",
  },
];

export default function NotificationBell({ className }: { className?: string }) {
  const { user, openAuthModal } = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const isSuperAdmin = Boolean(
    user &&
      (user.role === "admin" ||
        user.role === "superadmin" ||
        user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Lock root & body scroll when fullscreen notification overlay is open (identical to SearchOverlay)
  useEffect(() => {
    if (isOpen) {
      const html = document.documentElement;
      const body = document.body;
      const prevHtmlOverflow = html.style.overflow;
      const prevBodyOverflow = body.style.overflow;

      html.style.overflow = "hidden";
      body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        html.style.overflow = prevHtmlOverflow;
        body.style.overflow = prevBodyOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);
      };
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

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

  // Fetch system broadcast notifications (Public, No Auth Required)
  const fetchSystemNotifications = useCallback(async () => {
    try {
      const data = await fetchAnnouncementShared();
      if (data?.success) {
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

  // Initial fetch and 5-minute background refresh
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

  const hasUnread = isSuperAdmin
    ? pendingReportsCount > 0
    : totalSystemUnread > 0 || userResolvedCount > 0;

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

  // Filtered system notifications by search query
  const filteredSystemNotifs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return systemNotifs;
    return systemNotifs.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.author && n.author.toLowerCase().includes(q))
    );
  }, [systemNotifs, searchQuery]);

  // Filtered reports by search query
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayedReports;
    return displayedReports.filter(
      (r) =>
        r.movieName.toLowerCase().includes(q) ||
        (r.episodeName && r.episodeName.toLowerCase().includes(q)) ||
        (r.issueType && r.issueType.toLowerCase().includes(q)) ||
        (r.serverName && r.serverName.toLowerCase().includes(q)) ||
        (r.userName && r.userName.toLowerCase().includes(q)) ||
        (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
    );
  }, [displayedReports, searchQuery]);

  // FULLSCREEN NOTIFICATION OVERLAY (Synchronized 100% with SearchOverlay layout & style)
  const fullscreenOverlay = (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#050807] overscroll-contain shadow-none modal-scroll custom-scrollbar select-none animate-in fade-in duration-200">
      <div className="min-h-full flex flex-col">
        {/* Sticky Header Container — Solid dark cinema glass matching Search */}
        <div className="sticky top-0 z-40 bg-[#050807]/95 backdrop-blur-md border-b border-white/5 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
            {/* Top Bar: Icon + Search / Filter Bar + Close Button */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 focus-within:border-white/20 transition-colors relative">
              <div className="flex items-center gap-2.5 sm:gap-4 flex-1 mr-2 sm:mr-4">
                <Bell className="w-5 h-5 sm:w-7 sm:h-7 text-brand-green shrink-0 animate-pulse" />
                <input
                  ref={searchInputRef}
                  type="text"
                  aria-label="Tìm kiếm thông báo, tin tức, phim báo lỗi"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thông báo, tin tức, phim báo lỗi..."
                  className="w-full bg-transparent text-lg sm:text-2xl md:text-3xl font-bold text-white placeholder:text-white/30 focus:outline-none font-sans tracking-wide"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green animate-spin shrink-0" />
                )}
              </div>

              {/* Close Button matching SearchOverlay */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng thông báo"
                className="p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-bar: Shortcuts + Unread Status + Action Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50 mt-2.5 sm:mt-3 px-1">
              {/* Left Cluster: ESC shortcut & unread count */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-white/40">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/80 font-semibold text-[11px]">
                    ESC
                  </kbd>{" "}
                  Đóng
                </span>

                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 text-[11px] font-semibold text-white/80">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      hasUnread ? "bg-brand-green animate-ping" : "bg-white/30"
                    )}
                  />
                  <span>{hasUnread ? `${badgeCount} cập nhật mới` : "Tất cả đã đọc"}</span>
                </div>

                {hasUnread && !isSuperAdmin && (
                  <button
                    type="button"
                    onClick={markAllSystemAsRead}
                    className="text-[11px] sm:text-xs font-bold text-brand-green hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Đánh dấu đã đọc tất cả</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => refreshAll(false)}
                  disabled={isLoading}
                  className="text-[11px] sm:text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tải lại thông báo"
                >
                  <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin text-brand-green")} />
                  <span className="hidden xs:inline">Làm mới</span>
                </button>
              </div>

              {/* Right Cluster: Category Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMainTab("system")}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    mainTab === "system"
                      ? "bg-brand-green text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Từ Admin ({systemNotifs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainTab("reports")}
                  className={cn(
                    "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    mainTab === "reports"
                      ? "bg-brand-green text-black shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Báo Lỗi Tập</span>
                  {pendingReportsCount > 0 && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black",
                        mainTab === "reports" ? "bg-black/30 text-black" : "bg-amber-400 text-black"
                      )}
                    >
                      {pendingReportsCount}
                    </span>
                  )}
                </button>

                {isSuperAdmin && (
                  <Link
                    href="/admin?tab=announcement"
                    onClick={() => setIsOpen(false)}
                    className="hidden md:flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-lg transition-colors ml-1"
                  >
                    <Shield className="w-3 h-3" />
                    <span>Quản Trị</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Sub-Filter for Admin inside Reports tab */}
            {isSuperAdmin && mainTab === "reports" && (
              <div className="flex items-center gap-2 pt-3 px-1 text-xs">
                <span className="text-white/40 text-[11px]">Trạng thái:</span>
                <button
                  type="button"
                  onClick={() => setAdminReportSubTab("pending")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                    adminReportSubTab === "pending"
                      ? "bg-amber-400/20 text-amber-300 border border-amber-400/35"
                      : "bg-white/5 text-white/50 hover:text-white"
                  )}
                >
                  Chờ sửa ({reports.filter((r) => r.status === "pending").length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminReportSubTab("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                    adminReportSubTab === "all"
                      ? "bg-brand-green/20 text-brand-green border border-brand-green/35"
                      : "bg-white/5 text-white/50 hover:text-white"
                  )}
                >
                  Tất cả báo cáo ({reports.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body Content Area — Responsive Grid matching SearchOverlay results */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
          {/* TAB 1: System Notifications & Admin Broadcasts */}
          {mainTab === "system" && (
            <div className="space-y-6">
              {/* Pinned Announcement Banner if set by Admin */}
              {announcementBanner?.enabled && Boolean(announcementBanner.text) && (
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0e1913] to-[#070d0a] border border-brand-green/40 shadow-[0_0_30px_rgba(32,214,107,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/30 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green text-black">
                          Ghim Nổi Bật
                        </span>
                        <span className="text-xs font-semibold text-white/50">Thông điệp từ Ban Quản Trị</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white mt-1.5 leading-snug">
                        {announcementBanner.text}
                      </p>
                    </div>
                  </div>
                  {announcementBanner.link && (
                    <Link
                      href={announcementBanner.link}
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(32,214,107,0.3)] active:scale-95 transition-all shrink-0"
                    >
                      <span>Xem ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}

              {/* Grid of System Notifications */}
              {filteredSystemNotifs.length === 0 ? (
                <div className="py-16 text-center text-white/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-1">
                    <Megaphone className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white/80">
                    {searchQuery ? "Không tìm thấy thông báo nào phù hợp" : "Chưa có thông báo mới"}
                  </h4>
                  <p className="text-xs text-white/40 max-w-sm leading-relaxed">
                    {searchQuery
                      ? `Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.`
                      : "Khi có thông báo bảo trì, cập nhật tính năng hoặc sự kiện mới, ban quản trị sẽ thông báo tại đây."}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredSystemNotifs.map((item, index) => {
                    const isUnread = !readSystemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 bg-[#0c1310] border transition-all duration-200 shadow-md",
                          isUnread
                            ? "border-brand-green/40 hover:border-brand-green shadow-[0_0_20px_rgba(32,214,107,0.08)] bg-gradient-to-br from-[#0e1713] to-[#0c1310]"
                            : "border-white/10 hover:border-brand-green/60 hover:bg-[#0f1814]"
                        )}
                      >
                        <div>
                          {/* Card Top: Order Number + Badge + Relative Time + Indicator */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Số thứ tự thông báo ở góc trên */}
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-brand-green/15 border border-brand-green/35 text-[11px] font-mono font-black text-brand-green shadow-[0_0_10px_rgba(32,214,107,0.2)] shrink-0">
                                #{String(index + 1).padStart(2, "0")}
                              </span>

                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 font-mono",
                                  item.type === "update"
                                    ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[0_0_10px_rgba(32,214,107,0.25)]"
                                    : item.type === "success"
                                    ? "bg-brand-green/15 text-brand-green border border-brand-green/30"
                                    : item.type === "warning"
                                    ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                                    : "bg-blue-400/15 text-blue-300 border border-blue-400/30"
                                )}
                              >
                                {item.type === "update"
                                  ? "Cập Nhật"
                                  : item.type === "success"
                                  ? "Chào Mừng"
                                  : item.type === "warning"
                                  ? "Cảnh Báo"
                                  : "Hệ Thống"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" title="Chưa đọc" />
                              )}
                              <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-white/30" />
                                {formatRelativeTime(item.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Card Title */}
                          <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-brand-green transition-colors leading-snug">
                            {item.title}
                          </h4>

                          {/* Card Content */}
                          <p className="text-xs sm:text-[13px] text-white/70 leading-relaxed mt-2.5">
                            {item.content}
                          </p>
                        </div>

                        {/* Card Bottom: Author + Link */}
                        <div className="pt-4 mt-5 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] text-white/40 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-brand-green/70" />
                            {item.author || "Ban Quản Trị"}
                          </span>

                          {item.link ? (
                            <Link
                              href={item.link}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-brand-green hover:underline group-hover:translate-x-0.5 transition-transform"
                            >
                              <span>Xem chi tiết</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-white/30 font-mono">Hi Phim Official</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Episode Error Reports & Fix Status */}
          {mainTab === "reports" && (
            <div className="space-y-6">
              {/* Not Logged In Prompt */}
              {!user ? (
                <div className="max-w-md mx-auto py-12 px-6 text-center text-white/70 flex flex-col items-center justify-center gap-4 bg-[#0c1310] border border-white/10 rounded-2xl shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-brand-green/10 border border-brand-green/30 flex items-center justify-center text-brand-green">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1.5">Theo dõi báo lỗi theo tài khoản</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Đăng nhập để xem tiến độ và nhận thông báo khi Ban Quản Trị đã khắc phục xong tập phim bạn đã báo lỗi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal("login");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(32,214,107,0.3)] active:scale-95 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Ngay</span>
                  </button>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="py-16 text-center text-white/50 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-1">
                    <CheckCircle2 className="w-8 h-8 text-brand-green/70" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white/80">
                    {searchQuery
                      ? "Không tìm thấy báo cáo lỗi phù hợp"
                      : isSuperAdmin
                      ? adminReportSubTab === "pending"
                        ? "Tuyệt vời! Không còn tập nào đang chờ sửa"
                        : "Chưa có báo cáo lỗi nào trong hệ thống"
                      : "Bạn chưa gửi báo lỗi tập phim nào"}
                  </h4>
                  <p className="text-xs text-white/40 max-w-sm leading-relaxed">
                    {searchQuery
                      ? "Thử tìm kiếm với tên phim hoặc tập khác."
                      : isSuperAdmin
                      ? "Hệ thống sẽ cập nhật tự động ngay khi có khán giả gửi báo lỗi tập mới."
                      : "Khi xem phim nếu phát hiện lỗi, hãy bấm nút 'Báo lỗi tập' để admin xử lý ngay nhé."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredReports.map((report, index) => {
                    const isPending = report.status === "pending";
                    return (
                      <div
                        key={report.id}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 bg-[#0c1310] border transition-all duration-200 shadow-md",
                          isPending
                            ? "border-amber-400/30 hover:border-amber-400/60 bg-gradient-to-br from-[#14120a] to-[#0c1310]"
                            : "border-white/10 hover:border-brand-green/60 opacity-90 hover:opacity-100"
                        )}
                      >
                        <div className="space-y-3">
                          {/* Order Number + Status + Server + Time */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Số thứ tự báo lỗi ở góc trên */}
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/35 text-[11px] font-mono font-black text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)] shrink-0">
                                #{String(index + 1).padStart(2, "0")}
                              </span>

                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 font-mono",
                                  isPending
                                    ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                                    : "bg-brand-green/15 text-brand-green border border-brand-green/30"
                                )}
                              >
                                {isPending ? (
                                  <>
                                    <Clock className="w-3 h-3" />
                                    Chờ xử lý
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Đã sửa xong
                                  </>
                                )}
                              </span>

                              {report.serverName && (
                                <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                                  {report.serverName}
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/30" />
                              {formatRelativeTime(report.createdAt)}
                            </span>
                          </div>

                          {/* Movie Name & Episode */}
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h4 className="text-base font-bold text-white group-hover:text-brand-green transition-colors line-clamp-1">
                                {report.movieName}
                              </h4>
                              {report.episodeName && (
                                <span className="text-xs font-black text-brand-green bg-brand-green/10 border border-brand-green/30 px-2 py-0.5 rounded shrink-0">
                                  {report.episodeName}
                                </span>
                              )}
                            </div>

                            {(report.userName || report.userEmail) && (
                              <div className="flex items-center gap-1.5 text-xs text-white/50 mt-1">
                                <User className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                <span className="font-medium text-white/70 truncate">
                                  {report.userName || report.userEmail?.split("@")[0]}
                                </span>
                                {report.userEmail && (
                                  <span className="text-white/40 font-mono text-[10px] truncate">
                                    ({report.userEmail})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Issue Note Box */}
                          <div className="p-3 rounded-xl bg-[#080d0a] border border-white/5 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{report.issueType}</span>
                            </div>
                            {report.description && (
                              <p className="text-white/70 italic leading-relaxed text-[11.5px] line-clamp-3">
                                &ldquo;{report.description}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                          <Link
                            href={`/watch?slug=${encodeURIComponent(report.movieSlug)}`}
                            onClick={() => setIsOpen(false)}
                            className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 text-brand-green fill-current" />
                            <span>Xem tập</span>
                          </Link>

                          {isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleMarkResolved(report.id, report.status)}
                              disabled={updatingId === report.id}
                              className={cn(
                                "py-1.5 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md",
                                isPending
                                  ? "bg-brand-green hover:bg-brand-green-hover text-black shadow-[0_0_15px_rgba(32,214,107,0.35)]"
                                  : "bg-white/10 hover:bg-white/15 text-white"
                              )}
                            >
                              {updatingId === report.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>{isPending ? "Đã sửa" : "Mở lại"}</span>
                            </button>
                          ) : !isPending ? (
                            <span className="text-xs font-semibold text-brand-green flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã sửa xong</span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-300/80 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Đang xử lý</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("relative shrink-0 pointer-events-auto", className)}>
      {/* Bell Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center justify-center w-9 sm:w-9.5 h-9 sm:h-9.5 rounded-xl bg-white/[0.04] hover:bg-brand-green/10 border border-white/10 hover:border-brand-green/60 text-white/80 hover:text-white transition-all duration-200 group cursor-pointer active:scale-95 shadow-sm",
          isOpen && "border-brand-green bg-brand-green/15 text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.25)]"
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

        {/* Counter Badge with Live Number Effect */}
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

      {/* Fullscreen Notification Overlay rendered via React Portal into document.body */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(fullscreenOverlay, document.body)}
    </div>
  );
}
