"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Megaphone,
  DollarSign,
  Wrench,
  Database,
  Settings,
  Shield,
  LogOut,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Play,
  Eye,
  Lock,
  Clock,
  Users,
  Crown,
  Search,
  Mail,
  UserCheck,
  Heart,
  Calendar,
  Unlock,
  ShieldAlert,
  Ban,
  UserX,
  Activity,
  X,
  Radio,
  Server,
  Zap,
  Check,
  ArrowRight,
  ShieldCheck,
  Layers,
  Flame,
  Cpu,
  Grid,
  List,
  KeyRound,
  CheckCheck,
  SlidersHorizontal,
  Copy,
  Download,
  Menu,
  ChevronRight,
  Bell,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { SiteConfig } from "@/lib/site-config";

type AdminTab =
  | "overview"
  | "featured"
  | "announcement"
  | "ads"
  | "maintenance"
  | "cache"
  | "settings"
  | "security"
  | "users"
  | "reports";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Reports Management state
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "resolved">("all");

  // System Broadcast Notifications state
  const [systemNotifsList, setSystemNotifsList] = useState<any[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [newNotifTitle, setNewNotifTitle] = useState("");
  const [newNotifContent, setNewNotifContent] = useState("");
  const [newNotifType, setNewNotifType] = useState<"info" | "warning" | "success" | "update">("info");
  const [newNotifLink, setNewNotifLink] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  // Cache update test state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // API Health state
  const [apiPing, setApiPing] = useState<number | null>(null);
  const [isCheckingPing, setIsCheckingPing] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Users Management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "watching" | "banned" | "verified" | "unverified">("all");
  const [userSort, setUserSort] = useState<"recent" | "name" | "activity">("recent");
  const [userPage, setUserPage] = useState(1);
  const [userViewMode, setUserViewMode] = useState<"card" | "table">("card");

  // Full Authority Modals & Action States
  const [inspectedUser, setInspectedUser] = useState<any | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<any | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [isSubmittingResetPass, setIsSubmittingResetPass] = useState(false);

  // Ban & Delete Modal states
  const [selectedUserForBan, setSelectedUserForBan] = useState<any | null>(null);
  const [banType, setBanType] = useState<"temp" | "perm">("temp");
  const [banDurationHours, setBanDurationHours] = useState<number>(24);
  const [customHours, setCustomHours] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("Tạm khóa quyền xem phim do vi phạm quy chế");
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isSubmittingBan, setIsSubmittingBan] = useState(false);

  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const handleRoleChange = async (userId: string, newRole: "user" | "admin" | "vip") => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_role", userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Đã đổi vai trò thành ${newRole.toUpperCase()}!`);
        fetchUsers();
        if (inspectedUser && inspectedUser.id === userId) {
          setInspectedUser({ ...inspectedUser, role: newRole });
        }
      } else {
        toast.error(data.error || "Không thể đổi vai trò!");
      }
    } catch {
      toast.error("Lỗi kết nối khi thay đổi vai trò!");
    }
  };

  const handleVerifyOtpToggle = async (userId: string, isVerified: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", userId, isVerified }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đã cập nhật trạng thái OTP!");
        fetchUsers();
        if (inspectedUser && inspectedUser.id === userId) {
          setInspectedUser({ ...inspectedUser, isVerified });
        }
      } else {
        toast.error(data.error || "Lỗi cập nhật OTP!");
      }
    } catch {
      toast.error("Lỗi kết nối khi cập nhật OTP!");
    }
  };

  const handleClearHistory = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa lịch sử xem và dừng phiên phát của "${userName}"?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_history", userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đã xóa lịch sử xem thành công!");
        fetchUsers();
        if (inspectedUser && inspectedUser.id === userId) {
          setInspectedUser({ ...inspectedUser, history: [], historyCount: 0, currentWatching: null });
        }
      } else {
        toast.error(data.error || "Không thể xóa lịch sử!");
      }
    } catch {
      toast.error("Lỗi kết nối khi xóa lịch sử xem!");
    }
  };

  const handleAdminResetPassword = async () => {
    if (!userToResetPassword || !adminNewPassword || adminNewPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    setIsSubmittingResetPass(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          userId: userToResetPassword.id,
          newPassword: adminNewPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đặt lại mật khẩu thành công!");
        setUserToResetPassword(null);
        setAdminNewPassword("");
      } else {
        toast.error(data.error || "Không thể đặt lại mật khẩu!");
      }
    } catch {
      toast.error("Lỗi kết nối khi đặt lại mật khẩu!");
    } finally {
      setIsSubmittingResetPass(false);
    }
  };

  const openBanModal = (u: any, type: "temp" | "perm") => {
    setSelectedUserForBan(u);
    setBanType(type);
    setBanDurationHours(24);
    setCustomHours("");
    setBanReason(
      type === "temp"
        ? "Tạm khóa quyền xem phim do có dấu hiệu vi phạm quy chế website"
        : "Khóa tài khoản vĩnh viễn do vi phạm nghiêm trọng điều khoản sử dụng"
    );
    setIsBanModalOpen(true);
  };

  const handleExecuteBan = async () => {
    if (!selectedUserForBan) return;
    setIsSubmittingBan(true);
    const finalHours = customHours.trim() ? Number(customHours) : banDurationHours;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: banType === "temp" ? "ban_temp" : "ban_perm",
          userId: selectedUserForBan.id,
          durationHours: finalHours,
          reason: banReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Đã áp dụng hạn chế thành công!");
        setIsBanModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Không thể khóa tài khoản!");
      }
    } catch {
      toast.error("Lỗi kết nối khi khóa tài khoản!");
    } finally {
      setIsSubmittingBan(false);
    }
  };

  const handleUnbanUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unban",
          userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã mở khóa tài khoản cho ${userName} thành công!`);
        fetchUsers();
      } else {
        toast.error(data.error || "Không thể mở khóa tài khoản!");
      }
    } catch {
      toast.error("Lỗi kết nối khi mở khóa tài khoản!");
    }
  };

  const openDeleteModal = (u: any) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!userToDelete) return;
    setIsSubmittingDelete(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          userId: userToDelete.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã xóa vĩnh viễn tài khoản ${userToDelete.name || userToDelete.email}!`);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error(data.error || "Không thể xóa tài khoản!");
      }
    } catch {
      toast.error("Lỗi kết nối khi xóa tài khoản!");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users || []);
      } else {
        toast.error(data.error || "Không thể tải danh sách người dùng!");
      }
    } catch {
      toast.error("Lỗi khi kết nối API người dùng!");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      if (data.success) {
        setReportsList(data.reports || []);
      }
    } catch {
      toast.error("Không thể tải danh sách báo lỗi phim!");
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleToggleReportStatus = async (id: string, currentStatus: "pending" | "resolved") => {
    const nextStatus = currentStatus === "pending" ? "resolved" : "pending";
    try {
      let res = await fetch("/api/report", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.status === 405 || !res.ok) {
        const fallbackRes = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_status", id, status: nextStatus }),
        });
        if (fallbackRes.ok) res = fallbackRes;
      }
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        setReportsList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
        );
        toast.success(nextStatus === "resolved" ? "Đã đánh dấu đã sửa lỗi!" : "Đã chuyển về chờ xử lý.");
      } else {
        toast.error((data && data.error) || "Lỗi khi cập nhật trạng thái báo cáo.");
      }
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái báo cáo.");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa báo cáo này không?")) return;
    try {
      const res = await fetch(`/api/report?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setReportsList((prev) => prev.filter((r) => r.id !== id));
        toast.success("Đã xóa báo cáo thành công.");
      }
    } catch {
      toast.error("Lỗi khi xóa báo cáo.");
    }
  };

  const fetchSystemNotifs = async () => {
    setIsLoadingNotifs(true);
    try {
      const res = await fetch("/api/announcement");
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setSystemNotifsList(data.notifications);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifTitle.trim() || !newNotifContent.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo!");
      return;
    }
    try {
      setIsSendingNotif(true);
      const res = await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newNotifTitle,
          content: newNotifContent,
          type: newNotifType,
          link: newNotifLink,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã phát thông báo toàn trang thành công!");
        setNewNotifTitle("");
        setNewNotifContent("");
        setNewNotifLink("");
        fetchSystemNotifs();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("system-notification-created", { detail: data.notification })
          );
        }
      } else {
        toast.error(data.error || "Gửi thất bại.");
      }
    } catch {
      toast.error("Lỗi kết nối khi gửi thông báo.");
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này không?")) return;
    try {
      const res = await fetch(`/api/announcement?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Đã xóa thông báo.");
        setSystemNotifsList((prev) => prev.filter((n) => n.id !== id));
      } else {
        toast.error("Không thể xóa thông báo.");
      }
    } catch {
      toast.error("Lỗi kết nối khi xóa.");
    }
  };

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
    if (tab === "users" && usersList.length === 0) {
      fetchUsers();
    }
    if (tab === "reports") {
      fetchReports();
    }
    if (tab === "announcement") {
      fetchSystemNotifs();
    }
  };

  // Load config on mount
  useEffect(() => {
    fetchConfig();
    checkApiHealth();
    fetchUsers();
    fetchReports();
    fetchSystemNotifs();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const validTabs = ["overview", "featured", "announcement", "maintenance", "cache", "settings", "security", "users", "reports"];
      if (tab && validTabs.includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/config");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch {
      toast.error("Không thể tải cấu hình website!");
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiHealth = async () => {
    setIsCheckingPing(true);
    const start = Date.now();
    try {
      const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2?page=1&limit=1", {
        cache: "no-store",
      });
      if (res.ok) {
        setApiPing(Date.now() - start);
      } else {
        setApiPing(-1);
      }
    } catch {
      setApiPing(-1);
    } finally {
      setIsCheckingPing(false);
    }
  };

  const handleSaveConfig = async (overrideConfig?: Partial<SiteConfig>) => {
    if (!config) return;
    setIsSaving(true);
    const dataToSave = overrideConfig ? { ...config, ...overrideConfig } : config;

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        toast.success("Đã lưu cấu hình thành công! Website đã được cập nhật tức thì.");
      } else {
        toast.error(data.error || "Lỗi khi lưu cấu hình!");
      }
    } catch {
      toast.error("Không thể kết nối đến máy chủ lưu cấu hình!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      toast.success("Đã đăng xuất thành công!");
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  // Featured Movies management
  const handleAddSlug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug.trim() || !config) return;
    const clean = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    if (config.featuredSlugs.includes(clean)) {
      toast.error("Phim này đã có trong danh sách ghim!");
      return;
    }
    const updated = { ...config, featuredSlugs: [clean, ...config.featuredSlugs] };
    setConfig(updated);
    setNewSlug("");
    handleSaveConfig(updated);
  };

  const handleRemoveSlug = (slugToRemove: string) => {
    if (!config) return;
    const updated = {
      ...config,
      featuredSlugs: config.featuredSlugs.filter((s) => s !== slugToRemove),
    };
    setConfig(updated);
    handleSaveConfig(updated);
  };

  const handleMoveSlug = (index: number, direction: "up" | "down") => {
    if (!config) return;
    const items = [...config.featuredSlugs];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    const updated = { ...config, featuredSlugs: items };
    setConfig(updated);
    handleSaveConfig(updated);
  };

  // Cache & Cron Auto-Update Trigger
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cron/auto-update?token=hiphim_secret_2026");
      const data = await res.json();
      if (data.success) {
        setSyncResult(data);
        toast.success("Đã làm mới toàn bộ bộ nhớ đệm trang web thành công!");
      } else {
        toast.error("Lỗi cập nhật dữ liệu: " + data.error);
      }
    } catch {
      toast.error("Không thể kích hoạt làm mới bộ nhớ đệm!");
    } finally {
      setIsSyncing(false);
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không trùng khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Mật khẩu hiện tại không chính xác!");
      }
    } catch {
      toast.error("Lỗi khi đổi mật khẩu!");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center text-white gap-3">
        <RefreshCw className="w-8 h-8 text-brand-green animate-spin" />
        <p className="text-xs font-bold text-white/60">Đang tải trung tâm điều khiển...</p>
      </div>
    );
  }

  // Computed live metrics for Dashboard Overview & Sidebar
  const totalUsersCount = usersList.length;
  const verifiedUsersCount = usersList.filter((u) => u.isVerified).length;
  const active24hUsers = usersList.filter((u) => {
    const ms = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
    return ms > 0 && Date.now() - ms < 24 * 3600 * 1000;
  });
  const active24hCount = active24hUsers.length;
  const watchingUsers = usersList.filter((u) => Boolean(u.currentWatching));
  const watchingCount = watchingUsers.length;
  const bannedUsersCount = usersList.filter(
    (u) => Boolean(u.isLocked || (u.bannedUntil && u.bannedUntil > Date.now()))
  ).length;
  const totalWatchHistory = usersList.reduce((acc, u) => acc + (u.historyCount || 0), 0);
  const totalFavorites = usersList.reduce((acc, u) => acc + (u.favoriteCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#060A08] text-cinema-text flex flex-col select-none">
      {/* ======================================================== */}
      {/* 1. TOP COMMAND BAR (RESPONSIVE FOR DESKTOP & MOBILE)     */}
      {/* ======================================================== */}
      <header className="h-16 border-b border-white/10 bg-[#0C130F]/90 backdrop-blur-2xl sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
        {/* Left: Mobile Toggle + Brand + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Mở menu điều hướng quản trị"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Brand */}
          <Link href="/" target="_blank" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-brand-green via-emerald-500 to-teal-400 flex items-center justify-center text-[#051309] font-black text-lg sm:text-xl shadow-[0_0_20px_rgba(34,197,94,0.45)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all">
              H
            </div>
            <div className="hidden xs:block">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  Hi <span className="text-brand-green drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]">Phim</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                  ADMIN SUITE
                </span>
              </div>
              <p className="text-[10px] text-white/45 font-mono hidden md:block">Trung Tâm Điều Hành Quản Trị</p>
            </div>
          </Link>

          {/* Desktop Breadcrumb Navigation */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-white/10 text-xs">
            <span className="text-white/40">Quản Trị</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 shadow-sm">
              {activeTab === "overview" && "Tổng Quan Hệ Thống"}
              {activeTab === "users" && "Quản Lý Thành Viên & Toàn Quyền"}
              {activeTab === "featured" && "Ghim Tiêu Điểm Phim"}
              {activeTab === "announcement" && "Banner Thông Báo"}
              {activeTab === "ads" && "Quản Lý Quảng Cáo (Popup & Catfish)"}
              {activeTab === "cache" && "Bộ Nhớ Đệm & Đồng Bộ"}
              {activeTab === "maintenance" && "Chế Độ Bảo Trì"}
              {activeTab === "settings" && "Cấu Hình SEO & Chung"}
              {activeTab === "security" && "Bảo Mật & Mật Khẩu"}
              {activeTab === "reports" && "Báo Lỗi Tập Phim"}
            </span>
          </div>
        </div>

        {/* Center: Super Admin Crown Badge (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.12)]">
            <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/60 font-semibold hidden lg:inline">Super Admin:</span>
              <span className="text-white font-mono font-bold tracking-tight">kimdinhphuong205@gmail.com</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse" title="Toàn quyền tối cao" />
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* API Health Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-white/70">
            <span className={`w-2 h-2 rounded-full ${apiPing && apiPing > 0 ? "bg-brand-green shadow-[0_0_6px_rgba(34,197,94,0.8)]" : "bg-amber-400"}`} />
            <span className="hidden md:inline">API: </span>{apiPing && apiPing > 0 ? `${apiPing}ms` : "Ping..."}
          </div>

          {/* View Website Button */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/85 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-sm active:scale-95"
            title="Mở giao diện người dùng trên tab mới"
          >
            <Eye className="w-3.5 h-3.5 text-brand-green" />
            <span className="hidden sm:inline">Xem Web</span>
            <ExternalLink className="w-3 h-3 text-white/40 ml-0.5 hidden sm:inline" />
          </Link>

          {/* Master Save Button */}
          <button
            type="button"
            onClick={() => handleSaveConfig()}
            disabled={isSaving}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-brand-green via-emerald-400 to-teal-400 hover:opacity-95 text-[#051309] shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Lưu tất cả thay đổi cấu hình vào hệ thống"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "Đang lưu..." : "Lưu"}</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            title="Đăng xuất khỏi Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MOBILE DRAWER NAVIGATION (OFF-CANVAS FOR MOBILE)      */}
      {/* ======================================================== */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-[#0d0f0e] border-r border-white/10 p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-y-auto scrollbar-thin">
            <div className="space-y-5">
              {/* Drawer Top */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-green to-emerald-500 flex items-center justify-center text-black font-black text-base shadow-sm">
                    H
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-white">Hi Phim <span className="text-brand-green">ADMIN</span></span>
                    <p className="text-[10px] text-white/40 font-mono">Bảng Điều Khiển</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Super Admin Info Card */}
              <div className="p-3 rounded-2xl bg-amber-400/[0.05] border border-amber-400/20 flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider">Super Admin</p>
                  <p className="text-xs font-mono font-bold text-white truncate">kimdinhphuong205@gmail.com</p>
                </div>
              </div>

              {/* Navigation Groups */}
              <nav className="space-y-4">
                {/* Group 1: ĐIỀU HÀNH & GIÁM SÁT */}
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-black uppercase tracking-wider text-white/30">Điều Hành & Giám Sát</p>
                  <button
                    type="button"
                    onClick={() => switchTab("overview")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "overview"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Tổng Quan Hệ Thống</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("users")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "users"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Quản Lý Thành Viên</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {watchingCount > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === "users" ? "bg-black/30 text-black" : "bg-brand-green/20 text-brand-green animate-pulse"}`}>
                          {watchingCount} xem
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeTab === "users" ? "bg-black/20 text-black" : "bg-white/10 text-white/60"}`}>
                        {usersList.length}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Group 2: NỘI DUNG & PHIM ẢNH */}
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-black uppercase tracking-wider text-white/30">Nội Dung & Phim Ảnh</p>
                  <button
                    type="button"
                    onClick={() => switchTab("featured")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "featured"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Ghim Phim Tiêu Điểm</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "featured" ? "bg-black/20 text-black" : "bg-white/10 text-white/50"}`}>
                      {config.featuredSlugs.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("cache")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "cache"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Bộ Nhớ Đệm & Sync</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("reports")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "reports"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Báo Lỗi Phim</span>
                    {reportsList.filter((r) => r.status === "pending").length > 0 && (
                      <span
                        className={`ml-auto text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          activeTab === "reports"
                            ? "bg-black/30 text-black"
                            : "bg-amber-500/25 text-amber-400 border border-amber-500/30 animate-pulse"
                        }`}
                      >
                        {reportsList.filter((r) => r.status === "pending").length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Group 3: TRUYỀN THÔNG */}
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-black uppercase tracking-wider text-white/30">Truyền Thông</p>
                  <button
                    type="button"
                    onClick={() => switchTab("announcement")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "announcement"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Banner Thông Báo</span>
                    {config.announcement.enabled && (
                      <span className="w-2 h-2 rounded-full bg-brand-green ml-auto animate-ping" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("ads")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "ads"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Quảng Cáo (Ads)</span>
                    {config.ads?.enabled && (
                      <span className="w-2 h-2 rounded-full bg-brand-green ml-auto" />
                    )}
                  </button>
                </div>

                {/* Group 4: HỆ THỐNG & BẢO MẬT */}
                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-black uppercase tracking-wider text-white/30">Hệ Thống & Cấu Hình</p>
                  <button
                    type="button"
                    onClick={() => switchTab("maintenance")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "maintenance"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Chế Độ Bảo Trì</span>
                    {config.maintenance.enabled && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 ml-auto animate-pulse" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("settings")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "settings"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cấu Hình SEO & Chung</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab("security")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === "security"
                        ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Bảo Mật & Mật Khẩu</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-brand-green" />
                <span>Xem Website</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE CONTAINER (DESKTOP + TABLET + MOBILE)  */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-7 gap-6">
        {/* Desktop Sidebar (Categorized & Sticky Glass Container) */}
        <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col gap-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin bg-[#0C130F]/90 border border-white/10 rounded-3xl p-3.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          {/* Group 1: ĐIỀU HÀNH & GIÁM SÁT */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
              Điều Hành & Giám Sát
            </div>
            <button
              type="button"
              onClick={() => switchTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tổng Quan Hệ Thống</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("users")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản Lý Thành Viên</span>
              <div className="ml-auto flex items-center gap-1.5">
                {watchingCount > 0 && (
                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-brand-green/20 text-brand-green font-bold animate-pulse" title={`${watchingCount} người đang xem phim`}>
                    <Radio className="w-2.5 h-2.5" />
                    {watchingCount}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-bold border border-emerald-500/25">
                  {usersList.length}
                </span>
              </div>
            </button>
          </div>

          {/* Group 2: NỘI DUNG & PHIM ẢNH */}
          <div className="space-y-1">
            <div className="px-3 pt-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
              Nội Dung & Phim Ảnh
            </div>
            <button
              type="button"
              onClick={() => switchTab("featured")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "featured"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Ghim Phim Tiêu Điểm</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 font-mono">
                {config.featuredSlugs.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("cache")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "cache"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Bộ Nhớ Đệm & Sync</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("reports")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Báo Lỗi Phim</span>
              {reportsList.filter((r) => r.status === "pending").length > 0 && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
                  {reportsList.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {/* Group 3: TRUYỀN THÔNG */}
          <div className="space-y-1">
            <div className="px-3 pt-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
              Truyền Thông
            </div>
            <button
              type="button"
              onClick={() => switchTab("announcement")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "announcement"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Banner Thông Báo</span>
              {config.announcement.enabled && (
                <span className="w-2 h-2 rounded-full bg-brand-green ml-auto animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => switchTab("ads")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "ads"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Quảng Cáo (Ads)</span>
              {config.ads?.enabled && (
                <span className="w-2 h-2 rounded-full bg-brand-green ml-auto animate-pulse" />
              )}
            </button>
          </div>

          {/* Group 4: HỆ THỐNG & CẤU HÌNH */}
          <div className="space-y-1">
            <div className="px-3 pt-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
              Hệ Thống & Cấu Hình
            </div>
            <button
              type="button"
              onClick={() => switchTab("maintenance")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "maintenance"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Chế Độ Bảo Trì</span>
              {config.maintenance.enabled && (
                <span className="w-2 h-2 rounded-full bg-amber-400 ml-auto animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => switchTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cấu Hình SEO & Chung</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("security")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-gradient-to-r from-emerald-500/20 via-brand-green/15 to-transparent text-emerald-400 border border-emerald-500/35 shadow-[0_0_20px_rgba(32,214,107,0.15)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Bảo Mật & Mật Khẩu</span>
            </button>
          </div>

          {/* Super Admin Status Footer Widget in Sidebar */}
          <div className="mt-auto pt-3 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-sm">
                <Crown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Quyền Hạn Cao Nhất</p>
                <p className="text-xs font-bold text-white truncate">Super Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Tab Content Stage - with bottom padding pb-24 for mobile bottom bar */}
        <main className="flex-1 min-w-0 bg-[#0C130F]/85 border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-7 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] pb-24 lg:pb-7">
          
          {/* ======================================================== */}
          {/* TAB 1: TỔNG QUAN HỆ THỐNG (CINEMA EXECUTIVE COMMAND CENTER) */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 1. Hero Greeting & Operational Status Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-950/80 to-black border border-white/10 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
                {/* Decorative glow background */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                        <Crown className="w-3 h-3" />
                        TRUNG TÂM ĐIỀU HÀNH TỐI CAO
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green text-[10px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-brand-green animate-ping inline-block" />
                        100% Trực Tuyến
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-brand-green">Super Admin Kim Đình Phương</span>
                    </h2>

                    <p className="text-xs sm:text-[13px] text-white/60 leading-relaxed">
                      Toàn bộ nền tảng Hi Phim đang trong trạng thái vận hành tối ưu. Giám sát các luồng xem phim thời gian thực, thành viên hoạt động, bảo mật tài khoản và hệ thống phân phối nội dung.
                    </p>

                    {/* Operational health badges */}
                    <div className="flex items-center gap-2.5 pt-2 flex-wrap text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-white/80">
                        <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        <span>Hệ thống: Bình thường</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-white/80">
                        <span className={`w-2 h-2 rounded-full ${config.maintenance.enabled ? "bg-amber-400 animate-pulse" : "bg-brand-green"}`} />
                        <span>Bảo trì: {config.maintenance.enabled ? "Đang BẬT" : "Đang Tắt"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-white/80">
                        <span className={`w-2 h-2 rounded-full ${config.announcement.enabled ? "bg-brand-green" : "bg-white/30"}`} />
                        <span>Banner: {config.announcement.enabled ? "Đang Hiện" : "Đang Ẩn"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-white/80">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>Độ trễ API: {apiPing !== null && apiPing > 0 ? `${apiPing}ms` : "..."}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right quick shortcut buttons */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => switchTab("users")}
                      className="flex-1 lg:flex-initial flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-brand-green" />
                        <span>Quản lý thành viên</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                        {totalUsersCount}
                      </span>
                    </button>

                    <button
                      onClick={() => switchTab("featured")}
                      className="flex-1 lg:flex-initial flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-amber-300" />
                        <span>Phim ghim trang chủ</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-bold">
                        {config.featuredSlugs.length}
                      </span>
                    </button>

                    <button
                      onClick={() => switchTab("settings")}
                      className="flex-1 lg:flex-initial flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-bold transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-cyan-300" />
                        <span>Cấu hình toàn trang</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Four Master Glowing Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Metric Card 1: Users */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.07] to-white/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Thành Viên Hệ Thống</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white tracking-tight">{totalUsersCount}</span>
                      <span className="text-xs text-white/50">tài khoản</span>
                    </div>
                    <div className="mt-3 space-y-1 text-[11px] text-white/60">
                      <div className="flex items-center justify-between">
                        <span>Đã xác thực OTP:</span>
                        <strong className="text-emerald-400 font-mono font-bold">
                          {verifiedUsersCount} ({totalUsersCount > 0 ? Math.round((verifiedUsersCount / totalUsersCount) * 100) : 0}%)
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hoạt động 24h qua:</span>
                        <strong className="text-white font-mono font-bold">{active24hCount}</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab("users")}
                    className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-brand-green hover:text-brand-green-hover transition-colors cursor-pointer"
                  >
                    <span>Quản lý thành viên & an toàn</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Metric Card 2: Live Watching Monitor */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-green/[0.08] to-white/[0.02] border border-brand-green/25 hover:border-brand-green/45 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Đang Xem Trực Tiếp</span>
                        {watchingCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-brand-green/20 border border-brand-green/35 flex items-center justify-center text-brand-green shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <Radio className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-brand-green tracking-tight">{watchingCount}</span>
                      <span className="text-xs text-white/50">thành viên đang xem</span>
                    </div>
                    <div className="mt-3 space-y-1 text-[11px] text-white/60">
                      <div className="flex items-center justify-between">
                        <span>Lịch sử xem tích lũy:</span>
                        <strong className="text-white font-mono font-bold">{totalWatchHistory} lượt</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Danh sách yêu thích:</span>
                        <strong className="text-white font-mono font-bold">{totalFavorites} phim</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab("users")}
                    className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-brand-green hover:text-brand-green-hover transition-colors cursor-pointer"
                  >
                    <span>Xem bảng giám sát trực tuyến</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Metric Card 3: Featured Movies */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.07] to-white/[0.02] border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Phim Ghim Trang Chủ</span>
                      <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]">
                        <Film className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-amber-300 tracking-tight">{config.featuredSlugs.length}</span>
                      <span className="text-xs text-white/50">phim trên Hero Banner</span>
                    </div>
                    <div className="mt-3 space-y-1 text-[11px] text-white/60">
                      <div className="flex items-center justify-between">
                        <span>Vị trí hiển thị:</span>
                        <strong className="text-amber-300 font-bold">Slider Trang Chủ</strong>
                      </div>
                      <div className="flex items-center justify-between truncate">
                        <span>Phim Top 1:</span>
                        <strong className="text-white font-mono font-bold truncate max-w-[120px]" title={config.featuredSlugs[0] || "Chưa có"}>
                          {config.featuredSlugs[0] || "Chưa có"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab("featured")}
                    className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <span>Quản lý danh sách ghim</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Metric Card 4: Upstream API Health */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/[0.07] to-white/[0.02] border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Máy Chủ Nguồn Phim</span>
                      <button
                        onClick={checkApiHealth}
                        disabled={isCheckingPing}
                        className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                        title="Đo lại tốc độ phản hồi"
                      >
                        <RefreshCw className={`w-4 h-4 ${isCheckingPing ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-cyan-300 tracking-tight">
                        {apiPing === null ? "Đang đo..." : apiPing === -1 ? "Mất kết nối" : `${apiPing}ms`}
                      </span>
                      <span className="text-xs text-white/50">độ trễ (ping)</span>
                    </div>
                    <div className="mt-3 space-y-1 text-[11px] text-white/60">
                      <div className="flex items-center justify-between">
                        <span>Nhà cung cấp:</span>
                        <strong className="text-white font-mono font-bold">phimapi.com</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Trạng thái VOD:</span>
                        <strong className="text-emerald-400 font-bold">Ổn định &amp; CDN HLS</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={checkApiHealth}
                    className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                  >
                    <span>Kiểm tra lại kết nối</span>
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* 3. Live Watching & Activity Monitor (REAL-TIME STREAM HUD) */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white">
                          Giám Sát Người Dùng Đang Xem Phim Thời Gian Thực
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-brand-green/20 text-brand-green text-[10px] font-black uppercase tracking-wider">
                          LIVE HUD
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        Theo dõi tức thì tập phim, tiến trình phát sóng và thành viên đang thưởng thức nội dung.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchUsers}
                      disabled={isLoadingUsers}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin text-brand-green" : ""}`} />
                      <span>Cập nhật</span>
                    </button>
                    <button
                      onClick={() => switchTab("users")}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-green/15 hover:bg-brand-green/25 text-brand-green border border-brand-green/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Xem toàn bộ ({totalUsersCount})
                    </button>
                  </div>
                </div>

                {/* If watching users exist */}
                {watchingUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-2">
                    {watchingUsers.map((u) => {
                      const cw = u.currentWatching!;
                      const cwPercent =
                        cw.duration > 0
                          ? Math.min(100, Math.round((cw.currentTime / cw.duration) * 100))
                          : 0;
                      const isSuper = u.role === "superadmin" || u.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
                      const initial = (u.name || u.email || "U").charAt(0).toUpperCase();

                      return (
                        <div
                          key={u.id}
                          className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/60 border border-brand-green/30 hover:border-brand-green/50 transition-all shadow-lg space-y-3 relative group"
                        >
                          {/* User badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-brand-green/20 text-brand-green flex items-center justify-center font-bold text-xs ring-1 ring-brand-green/40 shrink-0 relative">
                                {initial}
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-green rounded-full ring-2 ring-black animate-ping" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                  {u.name}
                                  {isSuper && (
                                    <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                                  )}
                                </p>
                                <p className="text-[10px] text-white/40 font-mono truncate">{u.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/30 shrink-0">
                              Đang xem
                            </span>
                          </div>

                          {/* Movie & Episode Info */}
                          <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-white truncate" title={cw.name}>
                                {cw.name}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/90 shrink-0">
                                {cw.episodeName || "Tập phim"}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full transition-all duration-300"
                                  style={{ width: `${cwPercent}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                                <span>{formatDurationSeconds(cw.currentTime)} / {formatDurationSeconds(cw.duration)}</span>
                                <span className="text-brand-green font-bold">{cwPercent}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-white/40 text-[10px]">
                              {formatRelativeTime(cw.watchedAt)}
                            </span>
                            <div className="flex items-center gap-2">
                              <a
                                href={`/watch?slug=${cw.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline cursor-pointer"
                              >
                                <span>Xem tập này</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              {!isSuper && (
                                <button
                                  onClick={() => openBanModal(u, "temp")}
                                  className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                                >
                                  Khóa xem
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Radar Idle State + Recent Active Feed */
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto flex items-center justify-center text-white/40">
                        <Radio className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Chưa có thành viên nào đang xem phim trực tiếp</h4>
                      <p className="text-xs text-white/50 max-w-md mx-auto">
                        Hệ thống radar đang hoạt động. Ngay khi có người dùng đăng nhập và nhấn phát phim, thông tin tập phim và tiến trình thời gian thực sẽ hiển thị tại đây.
                      </p>
                    </div>

                    {/* Top 4 recently active users */}
                    <div>
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5">
                        Thành Viên Hoạt Động Gần Đây Nhất
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {usersList.slice(0, 4).map((u) => {
                          const isSuper = u.role === "superadmin" || u.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
                          const initial = (u.name || u.email || "U").charAt(0).toUpperCase();

                          return (
                            <div
                              key={u.id}
                              onClick={() => switchTab("users")}
                              className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 transition-all cursor-pointer space-y-2 group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSuper ? "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40" : "bg-white/10 text-white"
                                }`}>
                                  {initial}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                                    {u.name}
                                    {isSuper && <Crown className="w-3 h-3 text-amber-300 shrink-0" />}
                                  </p>
                                  <p className="text-[10px] text-white/40 font-mono truncate">{u.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/5">
                                <span>{formatRelativeTime(u.lastActiveAt)}</span>
                                <span className="font-semibold text-brand-green group-hover:underline">Chi tiết →</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Interactive Quick Actions Hub (3 Master Control Panels) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Control A: Cache & Sync */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-green font-bold text-xs uppercase tracking-wider">
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                      <span>Bộ Nhớ Đệm &amp; Đồng Bộ Phim</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Làm mới toàn bộ cache trang chủ, bảng xếp hạng và đồng bộ dữ liệu phim mới nhất từ nguồn phát.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green/15 hover:bg-brand-green/25 text-brand-green border border-brand-green/35 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Đang đồng bộ..." : "Đồng Bộ & Làm Mới Cache Ngay"}</span>
                  </button>
                </div>

                {/* Control B: Maintenance 1-Click Toggle */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                        <Wrench className="w-4 h-4" />
                        <span>Chế Độ Bảo Trì Hệ Thống</span>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${config.maintenance.enabled ? "bg-amber-400 animate-pulse" : "bg-brand-green"}`} />
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {config.maintenance.enabled
                        ? "Hệ thống ĐANG BẢO TRÌ. Khách xem phim sẽ thấy màn hình thông báo bảo trì."
                        : "Hệ thống ĐANG MỞ BÌNH THƯỜNG. Tất cả khách xem phim truy cập ổn định."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const updated = {
                          ...config,
                          maintenance: { ...config.maintenance, enabled: !config.maintenance.enabled },
                        };
                        setConfig(updated);
                        handleSaveConfig(updated);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        config.maintenance.enabled
                          ? "bg-amber-400 hover:bg-amber-500 text-black shadow-lg shadow-amber-400/20"
                          : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{config.maintenance.enabled ? "TẮT BẢO TRÌ NGAY (Mở Web)" : "BẬT CHẾ ĐỘ BẢO TRÌ"}</span>
                    </button>
                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                      <Link href="/maintenance?preview=1" target="_blank" className="hover:text-white underline">
                        Xem thử trang bảo trì
                      </Link>
                      <Link href="/?bypass=hiphim_secret_2026" target="_blank" className="hover:text-brand-green underline">
                        Link vượt rào (Bypass)
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Control C: Announcement 1-Click Toggle */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-brand-green font-bold text-xs uppercase tracking-wider">
                        <Megaphone className="w-4 h-4" />
                        <span>Banner Thông Báo Toàn Trang</span>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${config.announcement.enabled ? "bg-brand-green" : "bg-white/30"}`} />
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed truncate" title={config.announcement.text || "Chưa có nội dung thông báo"}>
                      {config.announcement.enabled
                        ? `Đang hiện: "${config.announcement.text || "Thông báo hệ thống"}"`
                        : "Banner thông báo hiện đang ẩn."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const updated = {
                          ...config,
                          announcement: { ...config.announcement, enabled: !config.announcement.enabled },
                        };
                        setConfig(updated);
                        handleSaveConfig(updated);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        config.announcement.enabled
                          ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                          : "bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border border-brand-green/40"
                      }`}
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>{config.announcement.enabled ? "ẨN BANNER THÔNG BÁO" : "BẬT BANNER THÔNG BÁO"}</span>
                    </button>
                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                      <button onClick={() => switchTab("announcement")} className="hover:text-white underline cursor-pointer">
                        Chỉnh sửa nội dung & liên kết →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Pinned Movies Showcase Preview */}
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        Phim Đang Ghim Trên Hero Banner Trang Chủ
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold">
                          {config.featuredSlugs.length} Phim
                        </span>
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">
                        Thứ tự phim hiển thị từ trái qua phải trên thanh trượt Banner Hero đầu website.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => switchTab("featured")}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Thay đổi thứ tự ghim</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {config.featuredSlugs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
                    {config.featuredSlugs.map((slug, idx) => (
                      <div
                        key={slug}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/30 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/30 font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-xs text-white font-bold truncate" title={slug}>
                            {slug}
                          </span>
                        </div>
                        <a
                          href={`/watch?slug=${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/60 hover:text-brand-green transition-colors cursor-pointer shrink-0"
                          title="Xem thử phim"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/40 text-center text-xs text-white/40">
                    Chưa có phim nào được ghim lên trang chủ. Hãy chuyển sang tab &quot;Ghim Phim&quot; để thêm phim mới.
                  </div>
                )}
              </div>

              {/* 6. System Architecture & Environment Specs */}
              <div className="p-6 rounded-3xl bg-white/[0.015] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-white/50">
                  <Cpu className="w-4 h-4 text-brand-green" />
                  <span>Thông Số Hạ Tầng &amp; Công Nghệ Hi Phim</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Framework Vận Hành</p>
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Next.js 16 App Router
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">Turbopack SSR / RSC</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Giao Diện &amp; Style</p>
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> React 19 + Tailwind v4
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">Cinema OLED Glassmorphism</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Bộ Nhớ &amp; Dữ Liệu</p>
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-brand-green" /> Atomic JSON Engine
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">Disk &amp; Cache Sync</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-1">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Bảo Mật Tối Cao</p>
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Super Admin Guard
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">OTP &amp; Role-based Moderation</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GHIM PHIM NỔI BẬT (FEATURED MOVIES) */}
          {/* ======================================================== */}
          {activeTab === "featured" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quản Lý Ghim Phim Nổi Bật</h2>
                <p className="text-xs text-white/50">
                  Các bộ phim này sẽ xuất hiện trên thanh trượt Banner Hero đầu trang chủ. Thứ tự từ trên xuống dưới tương ứng với vị trí hiển thị từ trái qua phải.
                </p>
              </div>

              {/* Cấu hình tự động ghim phim mới */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Tự động ghim phim mới cập nhật lên Hero Banner</span>
                    </div>
                    <p className="text-xs text-white/50 max-w-xl">
                      Khi bật, hệ thống sẽ tự động đưa các phim mới phát hành vào danh sách ghim (sau các phim ghim cố định bên dưới), giúp trang chủ luôn tươi mới.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...config,
                        autoPinNewMovies: config.autoPinNewMovies === false ? true : false,
                      };
                      setConfig(updated);
                      handleSaveConfig(updated);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                      config.autoPinNewMovies !== false
                        ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                        : "bg-white/5 text-white/40 border border-white/10"
                    }`}
                  >
                    {config.autoPinNewMovies !== false ? "ĐANG BẬT" : "ĐANG TẮT"}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-xs text-white/70">
                  <span>Số lượng phim mới tự động ghim thêm:</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={config.autoPinLimit ?? 5}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 5;
                      const updated = {
                        ...config,
                        autoPinLimit: val,
                      };
                      setConfig(updated);
                      handleSaveConfig(updated);
                    }}
                    className="w-16 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-center font-bold text-white focus:outline-none focus:border-brand-green"
                  />
                  <span className="text-white/40">phim</span>
                </div>
              </div>

              {/* Add New Movie Slug Form */}
              <form onSubmit={handleAddSlug} className="flex gap-2">
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="Nhập slug phim (ví dụ: deadpool-va-wolverine hoặc doremon-2026)..."
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ghim Phim</span>
                </button>
              </form>

              {/* Pinned Slugs List */}
              <div className="space-y-2">
                {config.featuredSlugs.map((slug, idx) => (
                  <div
                    key={slug}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 text-[11px] font-black text-brand-green flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs text-white truncate font-bold">{slug}</span>
                      <Link
                        href={`/watch?slug=${slug}`}
                        target="_blank"
                        className="text-white/30 hover:text-brand-green transition-colors"
                        title="Xem phim"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSlug(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                        title="Lên trên"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSlug(idx, "down")}
                        disabled={idx === config.featuredSlugs.length - 1}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                        title="Xuống dưới"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveSlug(slug)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1 cursor-pointer"
                        title="Bỏ ghim"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BANNER THÔNG BÁO (ANNOUNCEMENT BANNER) */}
          {/* ======================================================== */}
          {activeTab === "announcement" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Banner Thông Báo Toàn Trang</h2>
                <p className="text-xs text-white/50">
                  Hiển thị thanh thông báo nổi bật xuất hiện trên đầu website để thông báo tin tức quan trọng tới khán giả.
                </p>
              </div>

              {/* Enable / Disable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">Kích hoạt Banner</span>
                  <span className="text-xs text-white/40 block">Bật hoặc tắt thanh thông báo trên toàn bộ trang web</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.announcement.enabled}
                    onChange={(e) => {
                      const updated = {
                        ...config,
                        announcement: { ...config.announcement, enabled: e.target.checked },
                      };
                      setConfig(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
                </label>
              </div>

              {/* Banner Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Phong cách thông báo</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["info", "warning", "success"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          announcement: { ...config.announcement, type },
                        })
                      }
                      className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        config.announcement.type === type
                          ? "bg-white/15 border-brand-green text-white"
                          : "bg-white/[0.02] border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {type === "info" && "Thông tin (Xanh dương)"}
                      {type === "warning" && "Cảnh báo (Vàng hổ phách)"}
                      {type === "success" && "Nổi bật (Xanh lá điện ảnh)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Text */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Nội dung thông báo</label>
                <textarea
                  rows={3}
                  value={config.announcement.text}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      announcement: { ...config.announcement, text: e.target.value },
                    })
                  }
                  placeholder="Nhập thông báo gửi đến người dùng..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Banner Link */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Liên kết đính kèm (Tùy chọn)</label>
                <input
                  type="text"
                  value={config.announcement.link || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      announcement: { ...config.announcement, link: e.target.value },
                    })
                  }
                  placeholder="https://t.me/... hoặc /phim/deadpool"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Live Preview Box */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">Xem trước hiển thị thực tế</label>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    config.announcement.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : config.announcement.type === "success"
                      ? "bg-brand-green/10 border-brand-green/30 text-brand-green"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 shrink-0" />
                    <span>{config.announcement.text || "Chưa có nội dung thông báo"}</span>
                  </div>
                  {config.announcement.link && (
                    <span className="text-[10px] underline ml-2 shrink-0">Xem chi tiết →</span>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* BROADCAST SYSTEM NOTIFICATIONS TO BELL (PUBLIC TO ALL) */}
              {/* ======================================================== */}
              <div className="pt-8 border-t border-white/10 space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-brand-green" />
                    <h3 className="text-lg font-extrabold text-white">Phát Thông Báo Vào Chuông Toàn Trang</h3>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Gửi thông báo tin tức, cập nhật phim mới, sự kiện... đến toàn bộ khán giả. Mọi người đều bấm chuông xem được ngay mà không cần phải đăng nhập tài khoản.
                  </p>
                </div>

                {/* Send Notification Form */}
                <form onSubmit={handleSendNotif} className="p-5 rounded-2xl bg-[#0d1410] border border-emerald-500/25 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">Tiêu đề thông báo *</label>
                    <input
                      type="text"
                      value={newNotifTitle}
                      onChange={(e) => setNewNotifTitle(e.target.value)}
                      placeholder="Ví dụ: Đã cập nhật tập mới phim Spider-Man / Bảo trì máy chủ..."
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">Nội dung chi tiết *</label>
                    <textarea
                      rows={3}
                      value={newNotifContent}
                      onChange={(e) => setNewNotifContent(e.target.value)}
                      placeholder="Nhập nội dung thông báo gửi đến toàn thể khán giả..."
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green transition-colors resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/80 block">Loại thông báo</label>
                      <select
                        value={newNotifType}
                        onChange={(e) => setNewNotifType(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                      >
                        <option value="info">Thông tin chung (Xanh dương)</option>
                        <option value="success">Nổi bật / Phim mới (Xanh lá điện ảnh)</option>
                        <option value="warning">Lưu ý / Bảo trì (Vàng hổ phách)</option>
                        <option value="update">Bản cập nhật tính năng</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/80 block">Đường dẫn đính kèm (Tùy chọn)</label>
                      <input
                        type="text"
                        value={newNotifLink}
                        onChange={(e) => setNewNotifLink(e.target.value)}
                        placeholder="Ví dụ: /phim/deadpool hoặc /watch?slug=..."
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSendingNotif}
                      className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(32,214,107,0.3)] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSendingNotif ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi thông báo...</span>
                        </>
                      ) : (
                        <>
                          <Megaphone className="w-4 h-4" />
                          <span>Phát Thông Báo Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Sent Notifications List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                      Danh sách thông báo đã phát ({systemNotifsList.length})
                    </h4>
                    <button
                      type="button"
                      onClick={fetchSystemNotifs}
                      disabled={isLoadingNotifs}
                      className="text-xs text-brand-green hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingNotifs ? "animate-spin" : ""}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  {systemNotifsList.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
                      Chưa có thông báo nào được phát. Hãy gửi thông báo đầu tiên ở form trên!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {systemNotifsList.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 flex items-start justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-brand-green/20 text-brand-green border border-brand-green/30">
                                {notif.type}
                              </span>
                              <span className="text-xs font-mono text-white/40">
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                            <h5 className="text-xs sm:text-sm font-bold text-white">{notif.title}</h5>
                            <p className="text-xs text-white/70 leading-relaxed">{notif.content}</p>
                            {notif.link && (
                              <p className="text-[11px] text-brand-green truncate font-mono">
                                Link: {notif.link}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotif(notif.id)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors shrink-0 cursor-pointer"
                            title="Xóa thông báo này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: QUẢN LÝ QUẢNG CÁO (POPUP & CATFISH) */}
          {/* ======================================================== */}
          {activeTab === "ads" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-brand-green" />
                  Quản Lý Hệ Thống Quảng Cáo
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Cấu hình 2 vị trí quảng cáo chiến lược: Popup giữa màn hình và Catfish bám chân trang.
                </p>
              </div>

              {/* Master Toggle: Kích hoạt toàn bộ quảng cáo */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-white block">Kích hoạt Hệ Thống Quảng Cáo</span>
                  <span className="text-xs text-white/40 block">Bật hoặc tắt toàn bộ quảng cáo trên website</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config?.ads?.enabled ?? true}
                    onChange={(e) => {
                      if (!config) return;
                      const updated = {
                        ...config,
                        ads: {
                          ...(config.ads || {}),
                          enabled: e.target.checked,
                        },
                      };
                      setConfig(updated);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
                </label>
              </div>

              {/* Link trỏ đích chung (Target URL) */}
              <div className="space-y-2 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <label className="text-xs font-bold text-white/80 block uppercase tracking-wider">
                  Đường Dẫn Đích Khi Nhấp Quảng Cáo (Target URL)
                </label>
                <p className="text-[11px] text-white/40">
                  Khi người dùng bấm vào banner Popup hoặc Catfish, liên kết này sẽ được mở ở tab mới.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config?.ads?.targetUrl || ""}
                    onChange={(e) => {
                      if (!config) return;
                      const updated = {
                        ...config,
                        ads: {
                          ...(config.ads || {}),
                          targetUrl: e.target.value,
                        },
                      };
                      setConfig(updated);
                    }}
                    placeholder="https://154.82.109.157/2138063.html"
                    className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green font-mono"
                  />
                  {config?.ads?.targetUrl && (
                    <a
                      href={config.ads.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Thử Link</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 2 Cards: Popup & Catfish */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. POPUP */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">1. Popup</span>
                        <h4 className="text-sm font-bold text-white">Giữa Màn Hình</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config?.ads?.showPopup ?? true}
                          onChange={(e) => {
                            if (!config) return;
                            const updated = {
                              ...config,
                              ads: {
                                ...(config.ads || {}),
                                showPopup: e.target.checked,
                              },
                            };
                            setConfig(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400" />
                      </label>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Modal popup nổi lên giữa màn hình khi người dùng truy cập web, có nền mờ và nút tắt tròn X.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 block">Đường dẫn ảnh</label>
                      <input
                        type="text"
                        value={config?.ads?.popupImage || ""}
                        onChange={(e) => {
                          if (!config) return;
                          const updated = {
                            ...config,
                            ads: {
                              ...(config.ads || {}),
                              popupImage: e.target.value,
                            },
                          };
                          setConfig(updated);
                        }}
                        placeholder="/ads/popup.jpg"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green font-mono"
                      />
                    </div>
                  </div>
                  {config?.ads?.popupImage && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/40 block mb-1.5 font-bold">Xem trước:</span>
                      <div className="rounded-xl overflow-hidden border border-white/15 bg-black/40 p-1 max-h-[160px] flex items-center justify-center">
                        <img
                          src={config.ads.popupImage}
                          alt="Popup preview"
                          className="max-h-[150px] w-auto object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. CATFISH */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">2. Catfish</span>
                        <h4 className="text-sm font-bold text-white">Chân Trang (Sticky Bottom)</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config?.ads?.showBottomBanner ?? true}
                          onChange={(e) => {
                            if (!config) return;
                            const updated = {
                              ...config,
                              ads: {
                                ...(config.ads || {}),
                                showBottomBanner: e.target.checked,
                              },
                            };
                            setConfig(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-green" />
                      </label>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Banner dính cố định ở đáy màn hình khi cuộn trang, có nút tắt QC x góc phải.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 block">Đường dẫn ảnh động / banner</label>
                      <input
                        type="text"
                        value={config?.ads?.bottomBannerImage || ""}
                        onChange={(e) => {
                          if (!config) return;
                          const updated = {
                            ...config,
                            ads: {
                              ...(config.ads || {}),
                              bottomBannerImage: e.target.value,
                            },
                          };
                          setConfig(updated);
                        }}
                        placeholder="/ads/banner-bottom.gif"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green font-mono"
                      />
                    </div>
                  </div>
                  {config?.ads?.bottomBannerImage && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/40 block mb-1.5 font-bold">Xem trước:</span>
                      <div className="rounded-xl overflow-hidden border border-white/15 bg-black/40 p-1 max-h-[160px] flex items-center justify-center">
                        <img
                          src={config.ads.bottomBannerImage}
                          alt="Catfish preview"
                          className="max-h-[85px] w-auto object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. TVC VIDEO ĐẦU TRÌNH PHÁT */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">3. TVC Video</span>
                        <h4 className="text-sm font-bold text-white">Đầu Trình Phát Video</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config?.ads?.tvcEnabled ?? true}
                          onChange={(e) => {
                            if (!config) return;
                            const updated = {
                              ...config,
                              ads: {
                                ...(config.ads || {}),
                                tvcEnabled: e.target.checked,
                              },
                            };
                            setConfig(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
                      </label>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      Phát video TVC tài trợ trước khi vào phim chính, đếm ngược cho phép người dùng bỏ qua sau X giây.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 block">Đường dẫn video TVC (.mp4)</label>
                      <input
                        type="text"
                        value={config?.ads?.tvcVideoUrl || ""}
                        onChange={(e) => {
                          if (!config) return;
                          const updated = {
                            ...config,
                            ads: {
                              ...(config.ads || {}),
                              tvcVideoUrl: e.target.value,
                            },
                          };
                          setConfig(updated);
                        }}
                        placeholder="https://bf.333xbet.com/18881999/video9922.mp4"
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 block">Bỏ qua sau (giây)</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={config?.ads?.tvcSkipAfterSeconds ?? 5}
                        onChange={(e) => {
                          if (!config) return;
                          const updated = {
                            ...config,
                            ads: {
                              ...(config.ads || {}),
                              tvcSkipAfterSeconds: Number(e.target.value),
                            },
                          };
                          setConfig(updated);
                        }}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green font-mono"
                      />
                    </div>
                  </div>
                  {config?.ads?.tvcVideoUrl && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/40 block mb-1.5 font-bold">Xem trước TVC:</span>
                      <div className="rounded-xl overflow-hidden border border-white/15 bg-black/40 p-1 max-h-[160px] flex items-center justify-center">
                        <video
                          src={config.ads.tvcVideoUrl}
                          muted
                          playsInline
                          controls
                          className="max-h-[120px] w-auto object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nút lưu cấu hình */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => handleSaveConfig()}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-2xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(32,214,107,0.4)] active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
                  <span>{isSaving ? "Đang lưu..." : "Lưu Cấu Hình Quảng Cáo"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CHẾ ĐỘ BẢO TRÌ (MAINTENANCE CONTROL) */}
          {/* ======================================================== */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quản Lý Chế Độ Bảo Trì</h2>
                <p className="text-xs text-white/50">
                  Khi kích hoạt, toàn bộ người dùng sẽ được chuyển hướng sang trang bảo trì chuyên nghiệp với mã HTTP 503 (chuẩn SEO an toàn).
                </p>
              </div>

              {/* Maintenance Toggle Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#0D1510]/80 border border-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-white">Chế độ Bảo Trì Toàn Trang</span>
                    {config.maintenance.enabled ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        ĐANG KÍCH HOẠT
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ĐANG TẮT (WEB HOẠT ĐỘNG)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed max-w-xl">
                    Khi BẬT: Toàn bộ khán giả truy cập website sẽ được chuyển hướng trực tiếp sang trang <code className="text-emerald-400 font-mono">/maintenance</code>. Quản trị viên vẫn truy cập được bình thường.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      const newEnabled = !config.maintenance.enabled;
                      const updated = {
                        ...config,
                        maintenance: { ...config.maintenance, enabled: newEnabled },
                      };
                      setConfig(updated);
                      await handleSaveConfig(updated);
                      if (newEnabled) {
                        toast.success("Đã BẬT bảo trì hệ thống! Toàn bộ khách truy cập sẽ được chuyển sang /maintenance.");
                      } else {
                        toast.success("Đã TẮT bảo trì! Website đã mở lại hoạt động bình thường.");
                      }
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 ${
                      config.maintenance.enabled
                        ? "bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20"
                        : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{config.maintenance.enabled ? "TẮT BẢO TRÌ NGAY" : "BẬT BẢO TRÌ NGAY"}</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.maintenance.enabled}
                      onChange={async (e) => {
                        const newEnabled = e.target.checked;
                        const updated = {
                          ...config,
                          maintenance: { ...config.maintenance, enabled: newEnabled },
                        };
                        setConfig(updated);
                        await handleSaveConfig(updated);
                        if (newEnabled) {
                          toast.success("Đã BẬT bảo trì hệ thống!");
                        } else {
                          toast.success("Đã TẮT bảo trì! Website đã mở lại hoạt động bình thường.");
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>
              </div>

              {/* Maintenance Reason */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">Thông điệp bảo trì hiển thị với khán giả</label>
                <textarea
                  rows={3}
                  value={config.maintenance.reason}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maintenance: { ...config.maintenance, reason: e.target.value },
                    })
                  }
                  placeholder="Hi Phim đang tiến hành nâng cấp cụm máy chủ và tối ưu hóa hệ thống..."
                  className="w-full bg-[#080E0B] border border-white/15 focus:border-emerald-500 rounded-2xl p-4 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Links */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                <Link
                  href="/maintenance?preview=1"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem trước giao diện trang bảo trì (/maintenance?preview=1)</span>
                </Link>
                <span className="text-white/40">
                  Trạng thái hiện tại: <strong className={config.maintenance.enabled ? "text-amber-400" : "text-emerald-400"}>{config.maintenance.enabled ? "Đang Khóa Web" : "Mở Bình Thường"}</strong>
                </span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CACHE & CRON SYNC */}
          {/* ======================================================== */}
          {activeTab === "cache" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Quản Lý Bộ Nhớ Đệm & Cập Nhật Tự Động</h2>
                <p className="text-xs text-white/50">
                  Làm mới bộ nhớ đệm tĩnh Next.js ISR và mồi dữ liệu phim mới nhất vào RAM.
                </p>
              </div>

              {/* Sync Trigger Card */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-white">Kích Hoạt Làm Mới Cache Tức Thì</h3>
                    <p className="text-xs text-white/50">
                      Hệ thống sẽ làm mới cache của Trang chủ, Trang Phim mới và danh mục, đồng thời nạp trước phim mới từ nguồn.
                    </p>
                  </div>

                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-black text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Đang đồng bộ..." : "Xóa & Làm Mới Cache Ngay"}</span>
                  </button>
                </div>

                {/* Sync Result Output */}
                {syncResult && (
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-brand-green font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{syncResult.message}</span>
                    </div>
                    <p className="text-white/60">Thời gian thực thi: {syncResult.executionTimeMs}ms</p>
                    <p className="text-white/60">Số phim mới tìm thấy: {syncResult.freshMoviesFound}</p>
                    <p className="text-white/60">Các trang đã revalidate: {syncResult.revalidatedPaths?.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Cron Schedule Guide */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white/70">
                  <Clock className="w-4 h-4 text-brand-green" />
                  <span>Lịch trình tự động qua Vercel Cron</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Hệ thống đã cấu hình sẵn tệp <code className="text-brand-green">vercel.json</code> tự động kích hoạt mỗi 15 phút một lần để luôn bảo đảm website của bạn luôn cập nhật tập phim mới nhất mà không cần thao tác thủ công.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: CẤU HÌNH SEO & CHUNG (GENERAL SETTINGS) */}
          {/* ======================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Cấu Hình Chung & SEO</h2>
                <p className="text-xs text-white/50">Cài đặt thông tin thương hiệu, mạng xã hội và trình phát video.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Site Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Tên website</label>
                  <input
                    type="text"
                    value={config.siteName}
                    onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                {/* Telegram Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Kênh Telegram hỗ trợ</label>
                  <input
                    type="text"
                    value={config.contactTelegram || ""}
                    onChange={(e) => setConfig({ ...config, contactTelegram: e.target.value })}
                    placeholder="https://t.me/..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Site Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">Mô tả SEO (Meta Description)</label>
                <textarea
                  rows={2}
                  value={config.siteDescription}
                  onChange={(e) => setConfig({ ...config, siteDescription: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Footer Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 block">Dòng chữ chân trang (Footer Text)</label>
                <input
                  type="text"
                  value={config.customFooterText || ""}
                  onChange={(e) => setConfig({ ...config, customFooterText: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                />
              </div>

              {/* Video Player Settings */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-brand-green" />
                  <span>Cài đặt Trình Phát Video Mặc Định</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">Chế độ phát mặc định</label>
                    <select
                      value={config.player.defaultMode}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          player: { ...config.player, defaultMode: e.target.value as "m3u8" | "embed" },
                        })
                      }
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                    >
                      <option value="m3u8">Trình phát HLS M3U8 (Tùy biến cao cấp, 60fps)</option>
                      <option value="embed">Trình phát Embed (Nhúng trực tiếp từ server)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-xs font-bold text-white">Tự động phát khi tải trang</span>
                    <input
                      type="checkbox"
                      checked={config.player.autoplay}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          player: { ...config.player, autoplay: e.target.checked },
                        })
                      }
                      className="w-4 h-4 accent-brand-green cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY) */}
          {/* ======================================================== */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-white">Bảo Mật Tài Khoản Quản Trị</h2>
                <p className="text-xs text-white/50">Thay đổi mật khẩu đăng nhập của tài khoản admin.</p>
              </div>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ..."
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)..."
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-green"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-3 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isChangingPassword ? "Đang xử lý..." : "Cập Nhật Mật Khẩu"}</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: QUẢN LÝ THÀNH VIÊN (USERS & MODERATION) */}
          {/* ======================================================== */}
          {activeTab === "users" && (() => {
            const totalUsersCount = usersList.length;
            const active24hCount = usersList.filter((u) => {
              const ms = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
              return ms > 0 && Date.now() - ms < 24 * 3600 * 1000;
            }).length;
            const watchingCount = usersList.filter((u) => Boolean(u.currentWatching)).length;
            const verifiedCount = usersList.filter((u) => Boolean(u.isVerified)).length;
            const unverifiedCount = usersList.filter((u) => !u.isVerified).length;
            const bannedCount = usersList.filter(
              (u) => Boolean(u.isLocked || (u.bannedUntil && u.bannedUntil > Date.now()))
            ).length;

            const stripAccents = (str: string | undefined | null) => {
              if (!str) return "";
              return String(str)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "d")
                .toLowerCase()
                .trim();
            };

            const filteredUsers = usersList.filter((u) => {
              const isBanned = Boolean(u.isLocked || (u.bannedUntil && u.bannedUntil > Date.now()));
              const lastActiveMs = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
              const isActive24h = lastActiveMs > 0 && Date.now() - lastActiveMs < 24 * 3600 * 1000;
              const isWatching = Boolean(u.currentWatching);

              if (userFilter === "active" && !isActive24h) return false;
              if (userFilter === "watching" && !isWatching) return false;
              if (userFilter === "verified" && !u.isVerified) return false;
              if (userFilter === "unverified" && u.isVerified) return false;
              if (userFilter === "banned" && !isBanned) return false;

              if (!userSearchTerm.trim()) return true;
              const rawTerm = userSearchTerm.trim().toLowerCase();
              const normTerm = stripAccents(rawTerm);

              const nameNorm = stripAccents(u.name);
              const emailNorm = stripAccents(u.email);
              const idNorm = stripAccents(u.id);
              const movieNorm = stripAccents(u.currentWatching?.name);
              const epNorm = stripAccents(u.currentWatching?.episodeName);
              const slugNorm = stripAccents(u.currentWatching?.slug);
              const roleNorm = stripAccents(u.role);
              const banNorm = stripAccents(u.banReason);

              return (
                nameNorm.includes(normTerm) ||
                emailNorm.includes(normTerm) ||
                idNorm.includes(normTerm) ||
                movieNorm.includes(normTerm) ||
                epNorm.includes(normTerm) ||
                slugNorm.includes(normTerm) ||
                roleNorm.includes(normTerm) ||
                banNorm.includes(normTerm) ||
                (u.email && u.email.toLowerCase().includes(rawTerm)) ||
                (u.name && u.name.toLowerCase().includes(rawTerm)) ||
                (u.id && String(u.id).toLowerCase().includes(rawTerm))
              );
            });

            const sortedUsers = [...filteredUsers].sort((a, b) => {
              if (userSort === "name") return String(a.name || a.email).localeCompare(String(b.name || b.email), "vi");
              if (userSort === "activity") {
                return new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime();
              }
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
            const usersPerPage = 12;
            const totalUserPages = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));
            const currentUserPage = Math.min(userPage, totalUserPages);
            const paginatedUsers = sortedUsers.slice(
              (currentUserPage - 1) * usersPerPage,
              currentUserPage * usersPerPage
            );

            const exportUsersCsv = () => {
              const headers = ["Tên", "Email", "Vai trò", "Đã xác thực OTP", "Trạng thái", "Ngày tham gia", "Hoạt động gần nhất"];
              const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
              const rows = filteredUsers.map((user) => {
                const isBanned = Boolean(user.isLocked || (user.bannedUntil && user.bannedUntil > Date.now()));
                return [
                  user.name,
                  user.email,
                  user.role || "user",
                  user.isVerified ? "Có" : "Chưa",
                  isBanned ? "Bị khóa" : "Bình thường",
                  user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "",
                  user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString("vi-VN") : "",
                ].map(escapeCsv).join(",");
              });
              const csv = `\uFEFF${[headers.map(escapeCsv).join(","), ...rows].join("\n")}`;
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
              const link = document.createElement("a");
              link.href = url;
              link.download = `hiphim-members-${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success(`Đã xuất ${filteredUsers.length} thành viên`);
            };

            return (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-brand-green" />
                        Quản Lý Thành Viên & Toàn Quyền Quản Trị
                      </h2>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-sm">
                        Full Authority
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Giám sát thời gian thực, phân quyền (Admin / VIP / User), xác thực OTP 1 chạm, đặt lại mật khẩu và xử lý vi phạm.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* View Mode Switcher */}
                    <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setUserViewMode("card")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userViewMode === "card"
                            ? "bg-brand-green text-black shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                            : "text-white/60 hover:text-white"
                        }`}
                        title="Xem dạng thẻ toàn diện không bị che"
                      >
                        <Grid className="w-3.5 h-3.5" />
                        <span>Dạng Thẻ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserViewMode("table")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          userViewMode === "table"
                            ? "bg-gradient-to-r from-brand-green to-emerald-400 text-[#051309] font-extrabold shadow-[0_0_15px_rgba(34,197,94,0.35)]"
                            : "text-white/60 hover:text-white"
                        }`}
                        title="Xem dạng bảng dữ liệu cuộn mượt mà"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Dạng Bảng</span>
                      </button>
                    </div>

                    {/* Search Box */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setUserPage(1);
                        }}
                        placeholder="Tìm theo tên, email, ID, phim..."
                        className="bg-[#070C09]/90 border border-white/15 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/35 transition-all w-56 sm:w-72 md:w-80"
                      />
                      {userSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserSearchTerm("");
                            setUserPage(1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {(userSearchTerm || userFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchTerm("");
                          setUserFilter("all");
                          setUserPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Xóa lọc
                      </button>
                    )}

                    <select
                      value={userSort}
                      onChange={(e) => {
                        setUserSort(e.target.value as typeof userSort);
                        setUserPage(1);
                      }}
                      className="bg-[#0A0F0D]/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-white/85 focus:outline-none focus:border-brand-green cursor-pointer"
                      title="Sắp xếp danh sách thành viên"
                    >
                      <option value="recent" className="bg-[#111A15] text-white">Mới tham gia</option>
                      <option value="activity" className="bg-[#111A15] text-white">Hoạt động gần đây</option>
                      <option value="name" className="bg-[#111A15] text-white">Theo tên</option>
                    </select>

                    <button
                      type="button"
                      onClick={exportUsersCsv}
                      disabled={filteredUsers.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-brand-green/30 bg-brand-green/15 text-xs font-bold text-brand-green hover:bg-brand-green/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Xuất danh sách đang hiển thị ra CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất CSV
                    </button>

                    {/* Refresh Button */}
                    <button
                      type="button"
                      onClick={fetchUsers}
                      disabled={isLoadingUsers}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
                      title="Tải lại danh sách người dùng"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? "animate-spin text-brand-green" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* 5 High-End KPI Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  {/* Card 1: Tổng Thành Viên */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-[#121B16]/90 via-[#0B110E]/90 to-[#070B09]/90 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] text-white/50 font-bold uppercase tracking-wider">Tổng Thành Viên</span>
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white/70 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">{totalUsersCount}</p>
                      <span className="text-[10px] font-semibold text-white/40">Tài khoản</span>
                    </div>
                  </div>

                  {/* Card 2: Online (24h) */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-emerald-950/20 via-[#0B110E]/90 to-[#070B09]/90 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] text-emerald-400/80 font-bold uppercase tracking-wider">Online (24h)</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">{active24hCount}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Đang Xem Phim */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-brand-green/10 via-[#0B110E]/90 to-[#070B09]/90 border border-brand-green/25 hover:border-brand-green/50 transition-all duration-300 group shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-green/15 rounded-full blur-2xl group-hover:bg-brand-green/25 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] text-brand-green/80 font-bold uppercase tracking-wider">Đang Xem Phim</span>
                      <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/30 text-brand-green flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all">
                        <Film className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-2xl sm:text-3xl font-black font-mono text-brand-green tracking-tight">{watchingCount}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping" />
                        Phát
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Đã Xác Thực OTP */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-teal-950/20 via-[#0B110E]/90 to-[#070B09]/90 border border-teal-500/20 hover:border-teal-500/50 transition-all duration-300 group shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/15 rounded-full blur-2xl group-hover:bg-teal-500/25 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] text-teal-400/80 font-bold uppercase tracking-wider">Đã Xác Thực OTP</span>
                      <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(20,184,166,0.3)] transition-all">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-2xl sm:text-3xl font-black font-mono text-teal-300 tracking-tight">{verifiedCount}</p>
                      <span className="text-[10px] font-bold text-teal-300/80 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/25">
                        {totalUsersCount > 0 ? Math.round((verifiedCount / totalUsersCount) * 100) : 100}%
                      </span>
                    </div>
                  </div>

                  {/* Card 5: Bị Khóa / Giới Hạn */}
                  <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-b from-red-950/20 via-[#0B110E]/90 to-[#070B09]/90 border border-red-500/20 hover:border-red-500/50 transition-all duration-300 group shadow-[0_4px_24px_rgba(0,0,0,0.35)] col-span-2 sm:col-span-1">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] text-red-400/80 font-bold uppercase tracking-wider">Bị Khóa / Giới Hạn</span>
                      <div className={`w-8 h-8 rounded-xl ${bannedCount > 0 ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-white/50"} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-all`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${bannedCount > 0 ? "text-red-400" : "text-white"}`}>{bannedCount}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bannedCount > 0 ? "text-red-400 bg-red-500/15 border-red-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"}`}>
                        {bannedCount > 0 ? "Cần xử lý" : "An toàn"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-semibold text-white/45">
                    Hiển thị <span className="text-white font-mono font-bold">{filteredUsers.length}</span> / {totalUsersCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setUserFilter("all"); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      userFilter === "all"
                        ? "bg-gradient-to-r from-brand-green to-emerald-400 text-[#051309] font-bold shadow-[0_0_15px_rgba(34,197,94,0.35)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10"
                    }`}
                  >
                    Tất Cả ({totalUsersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserFilter("active"); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      userFilter === "active"
                        ? "bg-gradient-to-r from-brand-green to-emerald-400 text-[#051309] font-bold shadow-[0_0_15px_rgba(34,197,94,0.35)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10"
                    }`}
                  >
                    Đang Online / Hoạt Động ({active24hCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserFilter("watching"); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      userFilter === "watching"
                        ? "bg-gradient-to-r from-brand-green to-emerald-400 text-[#051309] font-bold shadow-[0_0_15px_rgba(34,197,94,0.35)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10"
                    }`}
                  >
                    Đang Xem Phim ({watchingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserFilter("verified"); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      userFilter === "verified"
                        ? "bg-gradient-to-r from-teal-400 to-emerald-400 text-[#051309] font-bold shadow-[0_0_15px_rgba(20,184,166,0.35)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10"
                    }`}
                  >
                    Đã Xác Thực OTP ({verifiedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserFilter("unverified"); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      userFilter === "unverified"
                        ? "bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(251,191,36,0.35)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10"
                    }`}
                  >
                    Chưa Xác Thực ({unverifiedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUserFilter("banned"); setUserPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      userFilter === "banned"
                        ? "bg-red-500 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.35)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10"
                    }`}
                  >
                    Bị Khóa / Hạn Chế ({bannedCount})
                  </button>
                </div>

                {/* Active Search / Filter State Indicator */}
                {userSearchTerm && (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-white animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <Search className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-white/80 truncate">
                        Kết quả tìm kiếm cho: <strong className="text-emerald-400 font-bold">&quot;{userSearchTerm}&quot;</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                        Tìm thấy {filteredUsers.length} / {totalUsersCount} thành viên
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchTerm("");
                        setUserPage(1);
                      }}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline shrink-0 cursor-pointer"
                    >
                      Xóa tìm kiếm
                    </button>
                  </div>
                )}

                {/* ======================================================== */}
                {/* 1. CARD VIEW (DEFAULT - FULL AUTHORITY & NEVER CLIPPED)  */}
                {/* ======================================================== */}
                {userViewMode === "card" && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {paginatedUsers.map((u) => {
                      const isSuper = u.role === "superadmin" || u.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
                      const isPermBanned = Boolean(u.isLocked);
                      const isTempBanned = Boolean(u.bannedUntil && u.bannedUntil > Date.now());
                      const isBanned = isPermBanned || isTempBanned;
                      const initial = (u.name || u.email || "U").charAt(0).toUpperCase();

                      const lastActiveMs = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
                      const isOnlineNow = lastActiveMs > 0 && Date.now() - lastActiveMs < 15 * 60 * 1000;
                      const isActiveToday = lastActiveMs > 0 && Date.now() - lastActiveMs < 24 * 3600 * 1000;

                      // Current watching progress
                      const cw = u.currentWatching;
                      const cwPercent =
                        cw && cw.duration > 0
                          ? Math.min(100, Math.round((cw.currentTime / cw.duration) * 100))
                          : 0;

                      return (
                        <div
                          key={u.id}
                          className={`rounded-3xl border transition-all duration-300 p-5 sm:p-5.5 flex flex-col justify-between gap-4 backdrop-blur-xl relative overflow-hidden group ${
                            isSuper
                              ? "bg-gradient-to-br from-amber-500/[0.12] via-[#0E1511]/90 to-[#070B09]/90 border-amber-400/35 shadow-[0_0_35px_rgba(251,191,36,0.15)]"
                              : isBanned
                              ? "bg-gradient-to-br from-red-950/30 via-[#0E1210]/90 to-[#070B09]/90 border-red-500/35 shadow-[0_0_30px_rgba(239,68,68,0.12)]"
                              : "bg-gradient-to-b from-[#111A15]/90 via-[#0B100D]/85 to-[#070B09]/90 border-white/10 hover:border-emerald-500/35 hover:shadow-[0_8px_30px_rgba(32,214,107,0.12)] shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
                          }`}
                        >
                          {/* Top Row: User Avatar, Name, Role & OTP Toggle */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 relative ${
                                  isSuper
                                    ? "bg-gradient-to-tr from-amber-400 to-brand-green text-black ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                                    : isBanned
                                    ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/40"
                                    : isOnlineNow
                                    ? "bg-brand-green/20 text-brand-green ring-2 ring-brand-green/40 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                {initial}
                                {isOnlineNow && !isBanned && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-green rounded-full ring-2 ring-black animate-pulse" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-extrabold text-white text-sm truncate">{u.name}</p>
                                  {isSuper && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm">
                                      <Crown className="w-3 h-3" /> Super Admin
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <p className="text-xs text-white/50 font-mono truncate">{u.email}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(u.email);
                                      toast.success(`Đã sao chép: ${u.email}`);
                                    }}
                                    className="text-white/30 hover:text-white p-0.5 rounded transition-colors"
                                    title="Sao chép email"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-white/30" />
                                  Tham gia: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                                </p>
                              </div>
                            </div>

                            {/* Role Selector & OTP Toggle */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              {/* Role Selector */}
                              {isSuper ? (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                                  Quyền Tối Cao
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-white/40 font-semibold hidden sm:inline">Quyền:</span>
                                  <select
                                    value={u.role || "user"}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                    className="bg-black/70 border border-white/20 hover:border-brand-green rounded-lg px-2 py-1 text-[11px] font-bold text-brand-green focus:outline-none focus:border-brand-green cursor-pointer transition-colors"
                                    title="Thay đổi vai trò thành viên"
                                  >
                                    <option value="user" className="bg-[#181818] text-white">Thành Viên</option>
                                    <option value="vip" className="bg-[#181818] text-amber-300">VIP Member</option>
                                    <option value="admin" className="bg-[#181818] text-emerald-400">Quản Trị Viên</option>
                                  </select>
                                </div>
                              )}

                              {/* OTP Verification Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleVerifyOtpToggle(u.id, !u.isVerified)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  u.isVerified
                                    ? "bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25"
                                    : "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                                }`}
                                title="Click để chuyển đổi trạng thái xác thực OTP"
                              >
                                {u.isVerified ? (
                                  <>
                                    <CheckCheck className="w-3 h-3 text-teal-400" />
                                    <span>Đã xác thực OTP</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span>Chưa xác thực OTP</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Middle Section: Live Watching & Activity Status */}
                          <div className="space-y-2.5">
                            {/* Watching Status */}
                            {cw ? (
                              <div className="p-3.5 rounded-2xl bg-[#060D09]/80 border border-emerald-500/25 space-y-2.5 backdrop-blur-md shadow-inner">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-brand-green animate-ping shrink-0" />
                                    <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">
                                      Đang phát trực tiếp:
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-green/20 text-brand-green font-bold">
                                      {cw.episodeName || `Tập ${(cw.episodeIndex ?? 0) + 1}`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <Link
                                      href={`/phim/${cw.slug}`}
                                      target="_blank"
                                      className="text-[10px] text-brand-green hover:underline flex items-center gap-0.5"
                                    >
                                      <span>Xem</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </Link>
                                    <span className="text-white/20">|</span>
                                    <button
                                      type="button"
                                      onClick={() => handleClearHistory(u.id, u.name || u.email)}
                                      className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                                      title="Dừng phiên xem và xóa lịch sử của tài khoản này"
                                    >
                                      Dừng & Xóa LS
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-bold text-white truncate">{cw.name}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-brand-green to-emerald-400 rounded-full"
                                        style={{ width: `${cwPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono text-brand-green shrink-0 font-bold">
                                      {cwPercent}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-white/40 mt-1 font-mono">
                                    <span>{formatDurationSeconds(cw.currentTime)} / {formatDurationSeconds(cw.duration)}</span>
                                    <span>{formatRelativeTime(cw.watchedAt)}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl bg-white/[0.025] border border-white/5 flex items-center justify-between text-xs text-white/50">
                                <span className="flex items-center gap-1.5 text-[11px]">
                                  <Film className="w-3.5 h-3.5 text-white/30" />
                                  Chưa có phiên xem phim nào đang phát
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {isOnlineNow ? "Đang trực tuyến" : `Truy cập: ${formatRelativeTime(u.lastActiveAt)}`}
                                </span>
                              </div>
                            )}

                            {/* Banned Alert if any */}
                            {isBanned && (
                              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-300">
                                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-red-300 text-[11px]">
                                    {isPermBanned ? "Tài khoản bị KHÓA VĨNH VIỄN" : `Tạm khóa còn: ${formatBanRemaining(u.bannedUntil)}`}
                                  </p>
                                  <p className="text-[10px] text-red-200/60 truncate mt-0.5">
                                    Lý do: {u.banReason || "Vi phạm điều khoản sử dụng website"}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Stats Chips */}
                            <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1" title="Phim trong danh sách yêu thích">
                                  <Heart className="w-3.5 h-3.5 text-red-400" />
                                  <strong className="text-white/80">{u.favoritesCount ?? 0}</strong> yêu thích
                                </span>
                                <span className="inline-flex items-center gap-1" title="Lịch sử xem phim">
                                  <Clock className="w-3.5 h-3.5 text-brand-green" />
                                  <strong className="text-white/80">{u.historyCount ?? 0}</strong> đã xem
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOnlineNow ? "bg-brand-green animate-pulse" : isActiveToday ? "bg-amber-400" : "bg-white/30"
                                  }`}
                                />
                                <span className={isOnlineNow ? "text-brand-green font-bold" : "text-white/40"}>
                                  {isOnlineNow ? "Online" : formatRelativeTime(u.lastActiveAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action Bar: Full Authority - Completely visible without clipping */}
                          <div className="flex items-center justify-between gap-2 pt-3.5 border-t border-white/10 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {/* Soi Dữ Liệu */}
                              <button
                                type="button"
                                onClick={() => setInspectedUser(u)}
                                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 text-white/80 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Xem toàn bộ lịch sử xem phim và danh sách yêu thích của thành viên"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-green" />
                                <span>Soi Dữ Liệu</span>
                              </button>

                              {/* Đổi Mật Khẩu */}
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToResetPassword(u);
                                  setAdminNewPassword("");
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/30 text-white/80 border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                title="Admin cấp lại mật khẩu trực tiếp cho thành viên"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                <span>Đổi MK</span>
                              </button>
                            </div>

                            {/* Moderation Controls */}
                            <div className="flex items-center gap-1.5">
                              {isSuper ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                                  <Shield className="w-3.5 h-3.5" /> Được bảo vệ tối cao
                                </span>
                              ) : isBanned ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUnbanUser(u.id, u.name || u.email)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                                    title="Mở khóa tài khoản ngay lập tức"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Mở Khóa</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(u)}
                                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer active:scale-95"
                                    title="Xóa vĩnh viễn tài khoản"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Tạm Khóa */}
                                  <button
                                    type="button"
                                    onClick={() => openBanModal(u, "temp")}
                                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Tạm khóa quyền xem phim trong số giờ quy định"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Tạm Khóa</span>
                                  </button>

                                  {/* Khóa Vĩnh Viễn */}
                                  <button
                                    type="button"
                                    onClick={() => openBanModal(u, "perm")}
                                    className="px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Khóa vĩnh viễn tài khoản này"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-red-400" />
                                    <span>Khóa</span>
                                  </button>

                                  {/* Xóa Tài Khoản */}
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(u)}
                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
                                    title="Xóa tài khoản khỏi hệ thống"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <div className="col-span-full py-16 text-center text-white/40 border border-white/5 rounded-2xl bg-black/20">
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
                            <span>Đang tải danh sách thành viên...</span>
                          </div>
                        ) : (
                          <div className="space-y-3 max-w-md mx-auto px-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                              <Search className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-white/70 font-medium">
                              {userSearchTerm.trim()
                                ? `Không tìm thấy thành viên nào khớp với "${userSearchTerm.trim()}"`
                                : "Không tìm thấy tài khoản thành viên nào phù hợp bộ lọc."}
                            </p>
                            {userSearchTerm.trim() && (
                              <p className="text-xs text-white/40">
                                Gợi ý: Thử tìm bằng tên không dấu, email hoặc User ID.
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setUserSearchTerm("");
                                setUserFilter("all");
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-black text-xs font-bold hover:bg-emerald-300 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              Hiển thị tất cả thành viên
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ======================================================== */}
                {/* 2. TABLE VIEW (FULL MIN-WIDTH & HORIZONTAL SMOOTH SCROLL) */}
                {/* ======================================================== */}
                {userViewMode === "table" && (
                  <div className="w-full border border-white/10 rounded-3xl overflow-hidden bg-gradient-to-b from-[#0D1510]/80 via-[#090F0C]/80 to-[#060A08]/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      <table className="w-full min-w-[1100px] text-left text-xs text-white/80 divide-y divide-white/5">
                        <thead className="bg-white/[0.04] text-white/60 font-bold uppercase tracking-wider text-[10px] border-b border-white/10">
                          <tr>
                            <th className="px-4 py-3.5 min-w-[240px] whitespace-nowrap">Thành Viên</th>
                            <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">Vai Trò & Xác Thực</th>
                            <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Thời Lượng & Hoạt Động</th>
                            <th className="px-4 py-3.5 min-w-[270px] whitespace-nowrap">Đang Xem Phim Nào</th>
                            <th className="px-4 py-3.5 min-w-[260px] text-right whitespace-nowrap">Thao Tác Quản Trị</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {paginatedUsers.map((u) => {
                            const isSuper = u.role === "superadmin" || u.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
                            const isPermBanned = Boolean(u.isLocked);
                            const isTempBanned = Boolean(u.bannedUntil && u.bannedUntil > Date.now());
                            const isBanned = isPermBanned || isTempBanned;
                            const initial = (u.name || u.email || "U").charAt(0).toUpperCase();

                            const lastActiveMs = u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : 0;
                            const isOnlineNow = lastActiveMs > 0 && Date.now() - lastActiveMs < 15 * 60 * 1000;
                            const isActiveToday = lastActiveMs > 0 && Date.now() - lastActiveMs < 24 * 3600 * 1000;

                            const cw = u.currentWatching;
                            const cwPercent =
                              cw && cw.duration > 0
                                ? Math.min(100, Math.round((cw.currentTime / cw.duration) * 100))
                                : 0;

                            return (
                              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                {/* 1. Member Info */}
                                <td className="px-4 py-3.5 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 relative ${
                                        isSuper
                                          ? "bg-gradient-to-tr from-amber-400 to-brand-green text-black ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                                          : isBanned
                                          ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/30"
                                          : isOnlineNow
                                          ? "bg-brand-green/20 text-brand-green ring-2 ring-brand-green/30"
                                          : "bg-white/10 text-white"
                                      }`}
                                    >
                                      {initial}
                                      {isOnlineNow && !isBanned && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-green rounded-full ring-2 ring-black animate-pulse" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-white flex items-center gap-1.5 truncate">
                                        {u.name}
                                        {isSuper && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                            <Crown className="w-3 h-3" /> Super Admin
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-white/50 font-mono truncate">{u.email}</p>
                                      <p className="text-[10px] text-white/30 mt-0.5">
                                        Tham gia: {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Role & OTP */}
                                <td className="px-4 py-3.5 align-middle">
                                  <div className="space-y-1.5">
                                    {isSuper ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                                        Super Admin
                                      </span>
                                    ) : (
                                      <select
                                        value={u.role || "user"}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                        className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-[10px] font-bold text-brand-green focus:outline-none focus:border-brand-green cursor-pointer"
                                      >
                                        <option value="user" className="bg-[#181818] text-white">Member</option>
                                        <option value="vip" className="bg-[#181818] text-amber-300">VIP</option>
                                        <option value="admin" className="bg-[#181818] text-emerald-400">Admin</option>
                                      </select>
                                    )}

                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyOtpToggle(u.id, !u.isVerified)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                          u.isVerified
                                            ? "bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20"
                                            : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                                        }`}
                                        title="Click để đổi trạng thái OTP"
                                      >
                                        {u.isVerified ? (
                                          <>
                                            <CheckCheck className="w-3 h-3 text-teal-400" />
                                            <span>Đã xác thực OTP</span>
                                          </>
                                        ) : (
                                          <>
                                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                                            <span>Chưa xác thực</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Last Access & Activity */}
                                <td className="px-4 py-3.5 align-middle">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          isOnlineNow
                                            ? "bg-brand-green shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                            : isActiveToday
                                            ? "bg-amber-400"
                                            : "bg-white/30"
                                        }`}
                                      />
                                      <span
                                        className={`text-xs font-semibold ${
                                          isOnlineNow
                                            ? "text-brand-green"
                                            : isActiveToday
                                            ? "text-amber-300"
                                            : "text-white/60"
                                        }`}
                                      >
                                        {isOnlineNow ? "Đang trực tuyến" : formatRelativeTime(u.lastActiveAt)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-white/40 font-mono whitespace-nowrap">
                                      {u.lastActiveAt
                                        ? new Date(u.lastActiveAt).toLocaleString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "2-digit",
                                            month: "2-digit",
                                          })
                                        : "—"}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                                      <span className="flex items-center gap-0.5">
                                        <Heart className="w-3 h-3 text-red-400" /> {u.favoritesCount || 0}
                                      </span>
                                      <span className="flex items-center gap-0.5">
                                        <Clock className="w-3 h-3 text-brand-green" /> {u.historyCount || 0}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* 4. Watching Now */}
                                <td className="px-4 py-3.5 align-middle">
                                  {cw ? (
                                    <div className="space-y-1.5 max-w-xs">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-bold text-white text-xs truncate" title={cw.name}>
                                          {cw.name}
                                        </p>
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-green/20 text-brand-green font-bold shrink-0">
                                          {cw.episodeName || `Tập ${(cw.episodeIndex ?? 0) + 1}`}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-brand-green rounded-full"
                                            style={{ width: `${cwPercent}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] font-mono text-white/50 shrink-0">{cwPercent}%</span>
                                      </div>

                                      <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                                        <span>
                                          {formatDurationSeconds(cw.currentTime)} / {formatDurationSeconds(cw.duration)}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <Link
                                            href={`/phim/${cw.slug}`}
                                            target="_blank"
                                            className="text-brand-green hover:underline flex items-center gap-0.5"
                                          >
                                            <span>Xem</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </Link>
                                          <button
                                            type="button"
                                            onClick={() => handleClearHistory(u.id, u.name || u.email)}
                                            className="text-red-400 hover:text-red-300 font-bold"
                                            title="Dừng phiên xem"
                                          >
                                            Dừng
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-white/40 text-[11px] italic">Không trong phiên xem nào</span>
                                  )}
                                </td>

                                {/* 5. Moderation Actions - Never Clipped */}
                                <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                                  {isSuper ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                                      <Shield className="w-3 h-3" /> Được bảo vệ tối cao
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      {/* Soi Dữ Liệu */}
                                      <button
                                        type="button"
                                        onClick={() => setInspectedUser(u)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
                                        title="Soi dữ liệu xem phim & yêu thích"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-brand-green" />
                                      </button>

                                      {/* Đổi Mật Khẩu */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUserToResetPassword(u);
                                          setAdminNewPassword("");
                                        }}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
                                        title="Đặt lại mật khẩu cho thành viên"
                                      >
                                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                      </button>

                                      {isBanned ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleUnbanUser(u.id, u.name || u.email)}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            title="Mở khóa tài khoản ngay lập tức"
                                          >
                                            <Unlock className="w-3.5 h-3.5" />
                                            <span>Mở Khóa</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => openDeleteModal(u)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer active:scale-95"
                                            title="Xóa vĩnh viễn tài khoản"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {/* Tạm Khóa */}
                                          <button
                                            type="button"
                                            onClick={() => openBanModal(u, "temp")}
                                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                            title="Tạm thời khóa quyền xem phim (chọn thời hạn)"
                                          >
                                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Tạm Khóa</span>
                                          </button>

                                          {/* Khóa Vĩnh Viễn */}
                                          <button
                                            type="button"
                                            onClick={() => openBanModal(u, "perm")}
                                            className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                            title="Khóa vĩnh viễn tài khoản này"
                                          >
                                            <Lock className="w-3.5 h-3.5 text-red-400" />
                                            <span>Khóa</span>
                                          </button>

                                          {/* Xóa Tài Khoản */}
                                          <button
                                            type="button"
                                            onClick={() => openDeleteModal(u)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
                                            title="Xóa tài khoản khỏi hệ thống"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-14 text-center text-white/40">
                                {isLoadingUsers ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
                                    <span>Đang tải danh sách thành viên...</span>
                                  </div>
                                ) : (
                                  <div className="space-y-3 max-w-md mx-auto px-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                                      <Search className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm text-white/70 font-medium">
                                      {userSearchTerm.trim()
                                        ? `Không tìm thấy thành viên nào khớp với "${userSearchTerm.trim()}"`
                                        : "Không tìm thấy tài khoản thành viên nào phù hợp bộ lọc."}
                                    </p>
                                    {userSearchTerm.trim() && (
                                      <p className="text-xs text-white/40">
                                        Gợi ý: Thử tìm bằng tên không dấu, email hoặc User ID.
                                      </p>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUserSearchTerm("");
                                        setUserFilter("all");
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-green text-black text-xs font-bold hover:bg-emerald-300 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Hiển thị tất cả thành viên
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {totalUserPages > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-white/50 font-medium">
                      Trang <strong className="text-emerald-400 font-mono">{currentUserPage}</strong> / <span className="font-mono">{totalUserPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentUserPage === 1}
                        onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                        className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ← Trang trước
                      </button>
                      <button
                        type="button"
                        disabled={currentUserPage === totalUserPages}
                        onClick={() => setUserPage((page) => Math.min(totalUserPages, page + 1))}
                        className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Trang sau →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* TAB 9: QUẢN LÝ BÁO LỖI PHIM & LINK HỎNG                  */}
          {/* ======================================================== */}
          {activeTab === "reports" && (() => {
            const filteredReports = reportsList.filter((r) => {
              if (reportFilter === "all") return true;
              return r.status === reportFilter;
            });
            const pendingCount = reportsList.filter((r) => r.status === "pending").length;
            const resolvedCount = reportsList.filter((r) => r.status === "resolved").length;

            return (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white">Quản Lý Báo Lỗi Phim</h2>
                      <p className="text-xs text-white/50">
                        Theo dõi và xử lý kịp thời các sự cố đường truyền, mất tiếng, sai tập do khán giả báo cáo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={fetchReports}
                      disabled={isLoadingReports}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReports ? "animate-spin" : ""}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  {[
                    { id: "all", label: "Tất cả", count: reportsList.length },
                    { id: "pending", label: "Chờ xử lý", count: pendingCount },
                    { id: "resolved", label: "Đã sửa", count: resolvedCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReportFilter(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        reportFilter === tab.id
                          ? "bg-brand-green text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                          : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        reportFilter === tab.id ? "bg-black/20 text-black" : "bg-white/10 text-white/60"
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Reports List */}
                {filteredReports.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-white/[0.02] border border-white/10">
                    <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-white">Tuyệt vời! Không có báo cáo lỗi nào trong mục này.</p>
                    <p className="text-xs text-white/50 mt-1">Toàn bộ các tập phim đều đang phát ổn định.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredReports.map((report) => {
                      const isPending = report.status === "pending";
                      return (
                        <div
                          key={report.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isPending
                              ? "bg-[#14100c] border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                              : "bg-white/[0.02] border-white/10 opacity-75"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Left: Movie & Issue Info */}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isPending
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-brand-green/20 text-brand-green border border-brand-green/30"
                                }`}>
                                  {isPending ? "Chờ xử lý" : "Đã khắc phục"}
                                </span>

                                <span className="text-xs font-mono text-white/40">
                                  {formatRelativeTime(report.createdAt)}
                                </span>

                                {report.serverName && (
                                  <span className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                    Máy chủ: {report.serverName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                                  {report.movieName}
                                </h4>
                                {report.episodeName && (
                                  <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md border border-brand-green/20 shrink-0">
                                    {report.episodeName}
                                  </span>
                                )}
                              </div>

                              {(report.userName || report.userEmail) && (
                                <div className="flex items-center gap-1.5 text-xs text-white/70">
                                  <span className="font-semibold text-emerald-400">Tài khoản báo:</span>
                                  <span className="font-medium text-white">{report.userName || "Người dùng"}</span>
                                  {report.userEmail && (
                                    <span className="text-white/40 font-mono text-[11px]">({report.userEmail})</span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-start gap-2 pt-1 text-xs">
                                <span className="font-semibold text-amber-400 shrink-0">Sự cố:</span>
                                <span className="text-white/90 font-medium">{report.issueType}</span>
                              </div>

                              {report.description && (
                                <p className="text-xs text-white/60 italic bg-black/40 p-2.5 rounded-xl border border-white/5 mt-1">
                                  &ldquo;{report.description}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                              <Link
                                href={`/watch?slug=${encodeURIComponent(report.movieSlug)}`}
                                target="_blank"
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-brand-green" />
                                <span>Mở xem thử</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleToggleReportStatus(report.id, report.status)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                  isPending
                                    ? "bg-brand-green hover:bg-brand-green-hover text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                    : "bg-white/10 hover:bg-white/15 text-white"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isPending ? "Đánh dấu đã sửa" : "Đổi sang chờ xử lý"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReport(report.id)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
                                title="Xóa báo cáo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        </main>
      </div>

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (STICKY ON PHONES)       */}
      {/* ======================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around shadow-[0_-4px_30px_rgba(0,0,0,0.8)] select-none">
        <button
          type="button"
          onClick={() => switchTab("overview")}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "overview"
              ? "text-brand-green font-bold"
              : "text-white/50 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Tổng Quan</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("users")}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "users"
              ? "text-brand-green font-bold"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Thành Viên</span>
          {watchingCount > 0 && (
            <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-brand-green animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab("featured")}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "featured"
              ? "text-brand-green font-bold"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px]">Ghim Phim</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("maintenance")}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "maintenance"
              ? "text-brand-green font-bold"
              : "text-white/50 hover:text-white"
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px]">Bảo Trì</span>
          {config?.maintenance.enabled && (
            <span className="absolute top-0 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* MODAL 1: TẠM KHÓA / KHÓA TÀI KHOẢN */}
      {/* ======================================================== */}
      {isBanModalOpen && selectedUserForBan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBanModalOpen(false);
          }}
        >
          <div
            className="relative bg-[#131514] border border-white/15 sm:border-white/20 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#161917] shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    banType === "temp"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {banType === "temp" ? <Clock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-white text-sm sm:text-base truncate">
                    {banType === "temp" ? "Tạm Khóa Quyền Xem Phim" : "Khóa Vĩnh Viễn Tài Khoản"}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-white/50 truncate">
                    Áp dụng biện pháp xử lý vi phạm với thành viên
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBanModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 overscroll-contain">
              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 bg-black/60 rounded-xl sm:rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setBanType("temp");
                    if (banReason.includes("vĩnh viễn")) {
                      setBanReason("Tạm khóa quyền xem phim do có dấu hiệu vi phạm quy chế website");
                    }
                  }}
                  className={`py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    banType === "temp"
                      ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tạm Khóa (Có Hạn)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBanType("perm");
                    if (banReason.includes("Tạm khóa")) {
                      setBanReason("Khóa tài khoản vĩnh viễn do vi phạm nghiêm trọng điều khoản sử dụng");
                    }
                  }}
                  className={`py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    banType === "perm"
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Khóa Vĩnh Viễn</span>
                </button>
              </div>

              {/* Target Member Info */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm text-white shrink-0">
                  {(selectedUserForBan.name || selectedUserForBan.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-xs sm:text-sm truncate">{selectedUserForBan.name}</p>
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-mono truncate">{selectedUserForBan.email}</p>
                </div>
              </div>

              {/* If Temporary: Duration Selection */}
              {banType === "temp" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/80 block">
                    Thời lượng tạm khóa không cho xem:
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {[
                      { label: "1 Giờ", hours: 1 },
                      { label: "6 Giờ", hours: 6 },
                      { label: "12 Giờ", hours: 12 },
                      { label: "24 Giờ", hours: 24 },
                      { label: "3 Ngày", hours: 72 },
                      { label: "7 Ngày", hours: 168 },
                      { label: "30 Ngày", hours: 720 },
                    ].map((preset) => (
                      <button
                        key={preset.hours}
                        type="button"
                        onClick={() => {
                          setBanDurationHours(preset.hours);
                          setCustomHours("");
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          banDurationHours === preset.hours && !customHours
                            ? "bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="Hoặc nhập số giờ tùy chỉnh (VD: 48)..."
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Reason Selection & Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 block">
                  Lý do khóa tài khoản <span className="text-red-400">*</span>:
                </label>

                {/* Quick Reason Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Spam bình luận / Quảng cáo",
                    "Chia sẻ tài khoản bất thường",
                    "Vi phạm quy tắc ứng xử",
                    "Gian lận / Lạm dụng hệ thống",
                    "Tạm ngưng theo yêu cầu",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBanReason(chip)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2.5}
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể hiển thị cho thành viên biết khi mở phim..."
                  required
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-brand-green leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-white/10 bg-[#161917] shrink-0">
              <button
                type="button"
                onClick={() => setIsBanModalOpen(false)}
                disabled={isSubmittingBan}
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBan}
                disabled={isSubmittingBan || !banReason.trim()}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                  banType === "temp"
                    ? "bg-amber-400 hover:bg-amber-500 text-black shadow-amber-500/20"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                }`}
              >
                {isSubmittingBan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Xác Nhận {banType === "temp" ? "Tạm Khóa" : "Khóa Vĩnh Viễn"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: XÁC NHẬN XÓA TÀI KHOẢN */}
      {/* ======================================================== */}
      {isDeleteModalOpen && userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setUserToDelete(null);
            }
          }}
        >
          <div
            className="relative bg-[#180909] border border-red-500/30 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-[0_25px_60px_rgba(239,68,68,0.25)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#1f0b0b] shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-md">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Xóa Vĩnh Viễn Tài Khoản</h3>
                  <p className="text-[10px] sm:text-[11px] text-red-300/60">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 text-xs text-white/80 scrollbar-thin">
              <div className="p-3.5 rounded-xl sm:rounded-2xl bg-black/40 border border-red-500/20 space-y-2">
                <p>
                  Bạn có chắc chắn muốn xóa thành viên <strong className="text-white">{userToDelete.name}</strong> (
                  <span className="font-mono text-red-300">{userToDelete.email}</span>)?
                </p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Toàn bộ dữ liệu tài khoản bao gồm lịch sử xem phim ({userToDelete.historyCount || 0} phim) và danh sách yêu thích ({userToDelete.favoritesCount || 0} phim) sẽ bị xóa sạch khỏi hệ thống.
                </p>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-white/10 bg-[#1f0b0b] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isSubmittingDelete}
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isSubmittingDelete}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingDelete ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ĐẶT LẠI MẬT KHẨU THÀNH VIÊN */}
      {/* ======================================================== */}
      {userToResetPassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUserToResetPassword(null);
              setAdminNewPassword("");
            }
          }}
        >
          <div
            className="relative bg-[#141414] border border-amber-500/30 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-[0_25px_60px_rgba(251,191,36,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#181818] shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
                  <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">Đặt Lại Mật Khẩu Thành Viên</h3>
                  <p className="text-[10px] sm:text-[11px] text-white/50">Cấp mật khẩu mới trực tiếp từ quản trị viên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserToResetPassword(null);
                  setAdminNewPassword("");
                }}
                className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin">
              {/* Target Member Info */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm text-white shrink-0">
                  {(userToResetPassword.name || userToResetPassword.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-xs sm:text-sm truncate">{userToResetPassword.name}</p>
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-mono truncate">{userToResetPassword.email}</p>
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80">Mật khẩu mới:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = "Phim@" + Math.floor(100000 + Math.random() * 900000);
                      setAdminNewPassword(rand);
                      toast.info(`Đã tạo mật khẩu mẫu: ${rand}`);
                    }}
                    className="text-[10px] text-brand-green hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo ngẫu nhiên</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự..."
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400 font-mono tracking-wider"
                />
                <p className="text-[10px] text-white/40">
                  Mật khẩu này sẽ được mã hóa an toàn và áp dụng ngay lập tức cho tài khoản.
                </p>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-white/10 bg-[#181818] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUserToResetPassword(null);
                  setAdminNewPassword("");
                }}
                disabled={isSubmittingResetPass}
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleAdminResetPassword}
                disabled={isSubmittingResetPass || !adminNewPassword.trim() || adminNewPassword.length < 6}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingResetPass ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Xác Nhận Đổi Mật Khẩu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CHI TIẾT DỮ LIỆU & TOÀN QUYỀN THÀNH VIÊN */}
      {/* ======================================================== */}
      {inspectedUser && (() => {
        const isSuper = inspectedUser.role === "superadmin" || inspectedUser.email?.toLowerCase() === "kimdinhphuong205@gmail.com";
        const isPermBanned = Boolean(inspectedUser.isLocked);
        const isTempBanned = Boolean(inspectedUser.bannedUntil && inspectedUser.bannedUntil > Date.now());
        const isBanned = isPermBanned || isTempBanned;
        const initial = (inspectedUser.name || inspectedUser.email || "U").charAt(0).toUpperCase();

        const historyItems = inspectedUser.history || [];
        const favoriteItems = inspectedUser.favorites || [];

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) setInspectedUser(null);
            }}
          >
            <div
              className="relative bg-[#121413] border border-white/15 sm:border-white/20 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div className="flex items-start justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#161917] shrink-0">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                      isSuper
                        ? "bg-gradient-to-tr from-amber-400 to-brand-green text-black ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                        : isBanned
                        ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/40"
                        : "bg-brand-green/20 text-brand-green ring-2 ring-brand-green/30"
                    }`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-white text-base truncate">{inspectedUser.name}</h3>
                      {isSuper && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-white/60 font-mono truncate">{inspectedUser.email}</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(inspectedUser.email);
                          toast.success(`Đã sao chép: ${inspectedUser.email}`);
                        }}
                        className="text-white/30 hover:text-white p-0.5 rounded transition-colors"
                        title="Sao chép email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      ID: <span className="font-mono">{inspectedUser.id}</span> • Tham gia:{" "}
                      {inspectedUser.createdAt ? new Date(inspectedUser.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedUser(null)}
                  className="p-2 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-white/20 overscroll-contain">
                {/* 1. Full Authority Quick Controls */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-brand-green" />
                    Thiết Lập Quyền Hạn & Trạng Thái
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Role Selector */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-white/50 font-bold">Vai Trò Hệ Thống</p>
                        <p className="text-xs font-bold text-white mt-0.5">
                          {isSuper ? "Super Admin Tối Cao" : inspectedUser.role === "admin" ? "Quản Trị Viên" : inspectedUser.role === "vip" ? "Thành Viên VIP" : "Thành Viên Tiêu Chuẩn"}
                        </p>
                      </div>

                      {isSuper ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded">Bất tử</span>
                      ) : (
                        <select
                          value={inspectedUser.role || "user"}
                          onChange={(e) => handleRoleChange(inspectedUser.id, e.target.value as any)}
                          className="bg-black/80 border border-white/20 hover:border-brand-green rounded-lg px-2.5 py-1 text-xs font-bold text-brand-green cursor-pointer focus:outline-none"
                        >
                          <option value="user" className="bg-[#181818] text-white">Member</option>
                          <option value="vip" className="bg-[#181818] text-amber-300">VIP</option>
                          <option value="admin" className="bg-[#181818] text-emerald-400">Admin</option>
                        </select>
                      )}
                    </div>

                    {/* OTP Toggle */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-white/50 font-bold">Xác Thực OTP Email</p>
                        <p className="text-xs font-bold mt-0.5 text-white">
                          {inspectedUser.isVerified ? "Đã Xác Minh" : "Chưa Xác Minh"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyOtpToggle(inspectedUser.id, !inspectedUser.isVerified)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          inspectedUser.isVerified
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                        }`}
                      >
                        {inspectedUser.isVerified ? "Hủy OTP" : "Kích Hoạt OTP"}
                      </button>
                    </div>
                  </div>

                  {/* Banned Alert if any */}
                  {isBanned && (
                    <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-red-300">
                          {isPermBanned ? "Tài khoản đang bị KHÓA VĨNH VIỄN" : `Tạm khóa: Còn lại ${formatBanRemaining(inspectedUser.bannedUntil)}`}
                        </p>
                        <p className="text-[11px] text-red-200/70 mt-0.5">
                          Lý do: {inspectedUser.banReason || "Không có lý do cụ thể"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Currently Watching Live */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-brand-green" />
                      Phiên Xem Hiện Tại (Real-time Stream)
                    </p>
                    {inspectedUser.currentWatching && (
                      <button
                        type="button"
                        onClick={() => handleClearHistory(inspectedUser.id, inspectedUser.name || inspectedUser.email)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      >
                        Dừng & Xóa Lịch Sử
                      </button>
                    )}
                  </div>

                  {inspectedUser.currentWatching ? (
                    <div className="p-3 rounded-xl bg-black/60 border border-brand-green/30 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-white text-xs truncate">
                          {inspectedUser.currentWatching.name}
                        </p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-green/20 text-brand-green font-bold">
                          {inspectedUser.currentWatching.episodeName || "Tập phim"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
                        <span>
                          {formatDurationSeconds(inspectedUser.currentWatching.currentTime)} /{" "}
                          {formatDurationSeconds(inspectedUser.currentWatching.duration)}
                        </span>
                        <Link
                          href={`/phim/${inspectedUser.currentWatching.slug}`}
                          target="_blank"
                          className="text-brand-green hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Mở trang phim</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic py-1">Không có phiên xem nào đang phát trực tiếp.</p>
                  )}
                </div>

                {/* 3. Watch History (up to 50 films) */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-green" />
                      Lịch Sử Xem Phim ({historyItems.length})
                    </p>
                    {historyItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearHistory(inspectedUser.id, inspectedUser.name || inspectedUser.email)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                      >
                        Xóa Toàn Bộ Lịch Sử
                      </button>
                    )}
                  </div>

                  {historyItems.length > 0 ? (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {historyItems.map((h: any, idx: number) => {
                        const hTime = h.watchedAt || h.timestamp || 0;
                        const hPercent =
                          h.duration > 0 ? Math.min(100, Math.round(((h.currentTime || 0) / h.duration) * 100)) : 0;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white truncate">{h.name || h.slug}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">
                                {h.episodeName || (typeof h.episodeIndex === "number" ? `Tập ${h.episodeIndex + 1}` : "Tập 1")} • {hPercent}% • {formatRelativeTime(hTime)}
                              </p>
                            </div>
                            <Link
                              href={`/phim/${h.slug}`}
                              target="_blank"
                              className="text-[11px] text-brand-green hover:underline flex items-center gap-1 shrink-0"
                            >
                              <span>Xem</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic py-1">Người dùng này chưa có lịch sử xem phim nào.</p>
                  )}
                </div>

                {/* 4. Favorites List */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <p className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    Danh Sách Yêu Thích ({favoriteItems.length})
                  </p>

                  {favoriteItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                      {favoriteItems.map((fav: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-white truncate">{fav.name || fav.slug}</span>
                          <Link
                            href={`/phim/${fav.slug}`}
                            target="_blank"
                            className="text-[10px] text-brand-green hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>Xem</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic py-1">Người dùng này chưa thêm phim yêu thích nào.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-white/10 bg-[#161917] shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserToResetPassword(inspectedUser);
                      setAdminNewPassword("");
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đổi Mật Khẩu</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!isSuper && (
                    <>
                      {isBanned ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleUnbanUser(inspectedUser.id, inspectedUser.name || inspectedUser.email);
                            setInspectedUser(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở Khóa</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              openBanModal(inspectedUser, "temp");
                              setInspectedUser(null);
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Tạm Khóa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              openBanModal(inspectedUser, "perm");
                              setInspectedUser(null);
                            }}
                            className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Khóa</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          openDeleteModal(inspectedUser);
                          setInspectedUser(null);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setInspectedUser(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Helpers for User Admin Panel
function formatRelativeTime(dateString?: string | number): string {
  if (!dateString) return "Chưa có dữ liệu";
  const date = typeof dateString === "number" ? dateString : new Date(dateString).getTime();
  if (isNaN(date)) return "Chưa có dữ liệu";
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
}

function formatDurationSeconds(sec: number): string {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatBanRemaining(bannedUntil?: number): string {
  if (!bannedUntil || bannedUntil <= Date.now()) return "Hết hạn";
  const diffSec = Math.floor((bannedUntil - Date.now()) / 1000);
  const d = Math.floor(diffSec / 86400);
  const h = Math.floor((diffSec % 86400) / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  if (d > 0) return `${d} ngày ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} phút`;
}
