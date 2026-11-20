"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Lock, ShieldAlert, Clock } from "lucide-react";
import {
  STORAGE_KEYS,
  hydrateGlobalFavorites,
  hydrateGlobalHistory,
} from "@/hooks/useLocalStorage";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  role?: "user" | "vip" | "admin" | "superadmin";
  createdAt?: string;
  lastActiveAt?: string;
  isLocked?: boolean;
  bannedUntil?: number;
  banReason?: string;
  bannedAt?: string;
  favorites?: any[];
  history?: any[];
  favoritesCount?: number;
  historyCount?: number;
}

interface UserAuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register" | "otp";
  pendingEmail: string;
  openAuthModal: (mode?: "login" | "register" | "otp", email?: string) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, turnstileToken?: string) => Promise<{ success: boolean; error?: string; devMode?: boolean; devCode?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string; devMode?: boolean; devCode?: string }>;
  logout: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  updateServerData: (
    data: { favorites?: any[]; history?: any[] },
    options?: { silent?: boolean; mode?: "merge" | "replace"; keepalive?: boolean }
  ) => Promise<void>;
  checkAuthOrPrompt: (actionName?: string) => boolean;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

// --- Permanent Ban Modal Component ---
function PermanentBanModal({ reason, onDismiss }: { reason: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-red-400/25 bg-[#141111]"
        style={{ width: "calc(100vw - 32px)", maxWidth: "380px" }}
      >
        {/* Accent bar */}
        <div className="h-0.5 w-full bg-red-500" />

        {/* Header */}
        <div className="flex flex-col items-center border-b border-white/10 px-5 pb-4 pt-5 text-center">
          <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Tài khoản bị khóa vĩnh viễn</h2>
            <p className="mt-1.5 text-xs text-white/50">Quyền truy cập tài khoản đã bị ngừng.</p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 px-4 py-4">
          <div className="rounded-lg bg-white/[0.04] px-3.5 py-3">
            <p className="mb-1 text-[11px] font-semibold text-white/40">Lý do</p>
            <p className="text-sm leading-5 text-white/80">
              {reason || "Vi phạm nghiêm trọng quy chế sử dụng website."}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3.5 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-[11px] leading-4 text-red-100/70">
              Tài khoản đã bị đình chỉ vĩnh viễn và sẽ được đăng xuất. Liên hệ quản trị viên nếu cần hỗ trợ.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <button
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-400 active:scale-[0.99]"
          >
            <Lock className="h-4 w-4" />
            Đã hiểu, đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Temporary Ban Modal Component ---
function TempBanModal({
  reason,
  bannedUntil,
  onDismiss,
}: {
  reason: string;
  bannedUntil: number;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = React.useState("");

  React.useEffect(() => {
    const update = () => {
      const diff = bannedUntil - Date.now();
      if (diff <= 0) {
        setCountdown("Đã hết thời hạn. Vui lòng tải lại trang.");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts: string[] = [];
      if (d > 0) parts.push(`${d} ngày`);
      if (h > 0 || d > 0) parts.push(`${h} giờ`);
      if (m > 0 || h > 0 || d > 0) parts.push(`${m} phút`);
      parts.push(`${s} giây`);
      setCountdown(parts.join(" "));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [bannedUntil]);

  const untilStr = new Date(bannedUntil).toLocaleString("vi-VN");

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(3, 7, 5, 0.86)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111613]"
        style={{
          width: "calc(100vw - 32px)",
          maxWidth: "380px",
        }}
      >
        <div className="h-0.5 w-full bg-brand-green" />

        <div className="relative border-b border-white/10 px-4 pb-4 pt-5 text-center">
          <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">Tài khoản đang tạm khóa</h2>
          <p className="mt-1.5 text-xs leading-5 text-white/50">Quyền xem phim sẽ được tự động khôi phục khi hết thời hạn.</p>
        </div>

        <div className="space-y-2.5 px-3.5 py-3.5">
          <section className="rounded-lg bg-white/[0.04] px-3.5 py-3">
            <p className="mb-1 text-[11px] font-semibold text-white/40">Lý do</p>
            <p className="text-sm leading-5 text-white/80">
              {reason || "Tạm khóa quyền xem phim do vi phạm quy chế website."}
            </p>
          </section>

          <section className="rounded-lg bg-white/[0.04] px-3.5 py-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-white/60">
                <Clock className="h-3.5 w-3.5 text-brand-green" />
                Mở khóa lúc
              </span>
              <span className="text-right text-xs font-semibold text-white/70">{untilStr}</span>
            </div>
            <div className="mt-2.5 rounded-md bg-black/25 px-2.5 py-2.5 text-center">
              <p className="mb-0.5 text-[10px] font-semibold text-white/35">Còn lại</p>
              <p className="font-mono text-base font-bold tracking-wide text-amber-200">{countdown}</p>
            </div>
          </section>

          <div className="flex items-start gap-2 px-1 text-[11px] leading-4 text-white/40">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Trong thời gian tạm khóa, bạn không thể xem phim.</p>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 pb-4 pt-3.5">
          <button
            onClick={onDismiss}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-green py-2.5 text-sm font-bold text-black transition-colors hover:bg-emerald-300 active:scale-[0.99]"
          >
            <ShieldAlert className="h-4 w-4" />
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

const CACHED_USER_KEY = "hiphim_cached_user_profile";

/**
 * Hydrates per-episode localStorage keys (watchProgress_* & lastWatchedEpisode_*) from cloud history
 * whenever cloud history contains newer or further watch progress from another device.
 */
function syncCloudHistoryToLocalEpisodeStorage(historyList: any[]) {
  if (typeof window === "undefined" || !Array.isArray(historyList)) return;
  try {
    for (const item of historyList) {
      const slug = (item?.slug || item?.movieSlug || "").trim();
      if (!slug) continue;
      const cloudTime = Number(item.currentTime) || 0;
      const cloudDur = Number(item.duration) || 0;
      const cloudEpIdx = typeof item.episodeIndex === "number" && item.episodeIndex >= 0 ? item.episodeIndex : 0;
      const cloudSvIdx = typeof item.serverIndex === "number" && item.serverIndex >= 0 ? item.serverIndex : 0;
      const cloudWatchedAt = Number(item.watchedAt || item.timestamp || 0);

      if (cloudTime <= 5) continue;

      const lastKey = `lastWatchedEpisode_${slug}`;
      let shouldUpdateLast = true;
      try {
        const rawLast = localStorage.getItem(lastKey);
        if (rawLast) {
          const parsedLast = JSON.parse(rawLast);
          const localWatchedAt = Number(parsedLast?.watchedAt || 0);
          if (localWatchedAt > cloudWatchedAt && cloudWatchedAt > 0) {
            shouldUpdateLast = false;
          } else if (
            !cloudWatchedAt &&
            parsedLast?.episodeIndex === cloudEpIdx &&
            Number(parsedLast?.currentTime) > cloudTime
          ) {
            shouldUpdateLast = false;
          }
        }
      } catch {}

      if (shouldUpdateLast) {
        localStorage.setItem(
          lastKey,
          JSON.stringify({
            serverIndex: cloudSvIdx,
            episodeIndex: cloudEpIdx,
            episodeName: item.episodeName || `Tập ${cloudEpIdx + 1}`,
            episodeSlug: item.episodeSlug || "",
            currentTime: Math.floor(cloudTime),
            duration: Math.floor(cloudDur),
            watchedAt: cloudWatchedAt || Date.now(),
          })
        );
        const epKey = `watchProgress_${slug}_${cloudSvIdx}_${cloudEpIdx}`;
        const existingEpTime = Number(localStorage.getItem(epKey) || 0);
        if (!existingEpTime || cloudTime >= existingEpTime || cloudWatchedAt > 0) {
          localStorage.setItem(epKey, String(Math.floor(cloudTime)));
        }
        // Also mirror onto server 0 key so Default server always resumes at the cloud timestamp
        if (cloudSvIdx !== 0) {
          const sv0Key = `watchProgress_${slug}_0_${cloudEpIdx}`;
          const existingSv0Time = Number(localStorage.getItem(sv0Key) || 0);
          if (!existingSv0Time || cloudTime >= existingSv0Time) {
            localStorage.setItem(sv0Key, String(Math.floor(cloudTime)));
          }
        }
      }
    }
  } catch {}
}

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "otp">("login");
  const [pendingEmail, setPendingEmail] = useState("");

  // Ban modal state
  const [permBanModal, setPermBanModal] = useState<{ open: boolean; reason: string }>({ open: false, reason: "" });
  const [tempBanModal, setTempBanModal] = useState<{ open: boolean; reason: string; bannedUntil: number }>({ open: false, reason: "", bannedUntil: 0 });

  // Refs to track previous ban state for change detection
  const prevBanStateRef = useRef<{ isLocked: boolean; bannedUntil: number }>({ isLocked: false, bannedUntil: 0 });
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const favMutationVersionRef = useRef<number>(0);
  const histMutationVersionRef = useRef<number>(0);

  // Restore cached profile on client mount for 0ms instant display (no skeleton delay)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHED_USER_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && (cached.id || cached.email)) {
          setUser(cached);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  const updateServerData = useCallback(
    async (
      data: { favorites?: any[]; history?: any[] },
      options?: { silent?: boolean; mode?: "merge" | "replace"; keepalive?: boolean }
    ) => {
      const hasFavUpdate = Array.isArray(data.favorites);
      const hasHistUpdate = Array.isArray(data.history);
      if (!hasFavUpdate && !hasHistUpdate) return;

      const reqFavVer = hasFavUpdate ? ++favMutationVersionRef.current : favMutationVersionRef.current;
      const reqHistVer = hasHistUpdate ? ++histMutationVersionRef.current : histMutationVersionRef.current;

      // 1. Optimistic immediate local state update (0ms latency)
      if (hasFavUpdate) {
        hydrateGlobalFavorites(data.favorites!);
      }
      if (hasHistUpdate) {
        hydrateGlobalHistory(data.history!);
      }

      if (!options?.silent) {
        setUser((prev) => {
          if (!prev) return null;
          const next = {
            ...prev,
            favorites: hasFavUpdate ? data.favorites! : prev.favorites,
            history: hasHistUpdate ? data.history! : prev.history,
            favoritesCount: hasFavUpdate ? data.favorites!.length : prev.favoritesCount,
            historyCount: hasHistUpdate ? data.history!.length : prev.historyCount,
          };
          try {
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      } else {
        // Silent background update (e.g. video watch progress): update cache without whole-tree re-render
        try {
          const cached = localStorage.getItem(CACHED_USER_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed) {
              if (hasFavUpdate) parsed.favorites = data.favorites;
              if (hasHistUpdate) parsed.history = data.history;
              localStorage.setItem(CACHED_USER_KEY, JSON.stringify(parsed));
            }
          }
        } catch {}
      }

      // 2. Persist to server (Cloudflare D1 / Postgres)
      try {
        const payload: any = { mode: options?.mode || "replace" };
        if (hasFavUpdate) payload.favorites = data.favorites;
        if (hasHistUpdate) payload.history = data.history;

        const bodyStr = JSON.stringify(payload);
        const useKeepalive = Boolean((options?.keepalive || options?.silent) && bodyStr.length < 60_000);

        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr,
          keepalive: useKeepalive,
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            const canApplyFav = hasFavUpdate && favMutationVersionRef.current === reqFavVer && Array.isArray(resData.favorites);
            const canApplyHist = hasHistUpdate && histMutationVersionRef.current === reqHistVer && Array.isArray(resData.history);

            if (canApplyFav) {
              hydrateGlobalFavorites(resData.favorites);
            }
            if (canApplyHist) {
              hydrateGlobalHistory(resData.history);
              syncCloudHistoryToLocalEpisodeStorage(resData.history);
            }

            if (!options?.silent && (canApplyFav || canApplyHist)) {
              setUser((prev) => {
                if (!prev) return null;
                const next = {
                  ...prev,
                  favorites: canApplyFav ? resData.favorites : prev.favorites,
                  history: canApplyHist ? resData.history : prev.history,
                  favoritesCount: canApplyFav ? resData.favorites.length : prev.favoritesCount,
                  historyCount: canApplyHist ? resData.history.length : prev.historyCount,
                };
                try {
                  localStorage.setItem(CACHED_USER_KEY, JSON.stringify(next));
                } catch {}
                return next;
              });
            }
          }
        }
      } catch (err) {
        console.error("updateServerData error:", err);
      }
    },
    []
  );

  const syncWithServer = useCallback(async () => {
    try {
      const reqFavVer = favMutationVersionRef.current;
      const reqHistVer = histMutationVersionRef.current;

      let localFavorites = [];
      let localHistory = [];
      try {
        const rawFav = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (rawFav) localFavorites = JSON.parse(rawFav);
        const rawHist = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (rawHist) localHistory = JSON.parse(rawHist);
      } catch {}

      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: localFavorites, history: localHistory, mode: "merge" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const canApplyFav = favMutationVersionRef.current === reqFavVer && Array.isArray(data.favorites);
          const canApplyHist = histMutationVersionRef.current === reqHistVer && Array.isArray(data.history);

          if (canApplyFav) {
            hydrateGlobalFavorites(data.favorites);
          }
          if (canApplyHist) {
            hydrateGlobalHistory(data.history);
          }

          setUser((prev) => {
            if (!prev) return null;
            const next = {
              ...prev,
              favorites: canApplyFav ? data.favorites : prev.favorites,
              history: canApplyHist ? data.history : prev.history,
              favoritesCount: canApplyFav ? data.favorites.length : prev.favoritesCount,
              historyCount: canApplyHist ? data.history.length : prev.historyCount,
            };
            try {
              localStorage.setItem(CACHED_USER_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      }
    } catch (err) {
      console.error("Auto-sync error:", err);
    }
  }, []);

  const doLogout = useCallback(async (oldUserId?: string) => {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
    });
    setUser(null);
    favMutationVersionRef.current++;
    histMutationVersionRef.current++;
    try {
      localStorage.removeItem(CACHED_USER_KEY);
    } catch {}
    hydrateGlobalFavorites([]);
    hydrateGlobalHistory([]);
    localStorage.removeItem("continue_watching_list");
    if (oldUserId) {
      localStorage.removeItem(`continue_watching_${oldUserId}`);
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("continue_watching_") || key.startsWith("hiphim_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.removeItem("hiphim_welcomed_session");
    } catch {}
    window.dispatchEvent(new Event("storage"));
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      let cachedUserId = "";
      try {
        const rawCached = typeof window !== "undefined" ? localStorage.getItem(CACHED_USER_KEY) : null;
        if (rawCached) {
          const parsedCached = JSON.parse(rawCached);
          cachedUserId = parsedCached?.id || "";
        }
      } catch {}

      if (!cachedUserId) {
        setLoading(true);
      }

      const initFavVer = favMutationVersionRef.current;
      const initHistVer = histMutationVersionRef.current;

      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          prevBanStateRef.current = {
            isLocked: Boolean(data.user.isLocked),
            bannedUntil: Number(data.user.bannedUntil) || 0,
          };

          const serverFavorites = Array.isArray(data.user.favorites) ? data.user.favorites : [];
          const serverHistory = Array.isArray(data.user.history) ? data.user.history : [];

          let finalFavorites = serverFavorites;
          let finalHistory = serverHistory;
          let hasUnsyncedLocalData = false;

          // Only merge local items if the cached session belonged to this exact same user ID
          if (cachedUserId && cachedUserId === data.user.id) {
            try {
              const localFavRaw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
              const localHistRaw = localStorage.getItem(STORAGE_KEYS.HISTORY);
              const localFavs = localFavRaw ? JSON.parse(localFavRaw) : [];
              const localHist = localHistRaw ? JSON.parse(localHistRaw) : [];

              const serverFavSlugs = new Set(
                serverFavorites.map((f: any) => f?.slug || f?.movie?.slug).filter(Boolean)
              );
              const serverHistMap = new Map<string, any>(
                serverHistory.map((h: any) => [h?.slug || h?.movieSlug, h])
              );

              if (Array.isArray(localFavs) && localFavs.length > 0) {
                const unsyncedFavs = localFavs.filter((f: any) => {
                  const s = f?.slug || f?.movie?.slug;
                  return s && !serverFavSlugs.has(s);
                });
                if (unsyncedFavs.length > 0) {
                  hasUnsyncedLocalData = true;
                  finalFavorites = [...unsyncedFavs, ...serverFavorites];
                }
              }

              if (Array.isArray(localHist) && localHist.length > 0) {
                for (const lh of localHist) {
                  const s = lh?.slug || lh?.movieSlug;
                  if (!s) continue;
                  const sh = serverHistMap.get(s);
                  const lTime = Number(lh?.watchedAt || lh?.timestamp || 0);
                  const sTime = sh ? Number(sh?.watchedAt || sh?.timestamp || 0) : 0;
                  if (!sh || lTime > sTime) {
                    hasUnsyncedLocalData = true;
                  }
                }
                if (hasUnsyncedLocalData) {
                  finalHistory = [...localHist, ...serverHistory];
                }
              }
            } catch {}
          }

          if (favMutationVersionRef.current === initFavVer) {
            hydrateGlobalFavorites(finalFavorites);
          }
          if (histMutationVersionRef.current === initHistVer) {
            hydrateGlobalHistory(finalHistory);
            syncCloudHistoryToLocalEpisodeStorage(finalHistory);
          }

          const hydratedUser = {
            ...data.user,
            favorites: favMutationVersionRef.current === initFavVer ? finalFavorites : data.user.favorites,
            history: histMutationVersionRef.current === initHistVer ? finalHistory : data.user.history,
          };
          setUser(hydratedUser);
          try {
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(hydratedUser));
          } catch {}

          if (hasUnsyncedLocalData) {
            syncWithServer();
          }
        } else {
          setUser(null);
          try {
            localStorage.removeItem(CACHED_USER_KEY);
          } catch {}
          hydrateGlobalFavorites([]);
          hydrateGlobalHistory([]);
          localStorage.removeItem("continue_watching_list");
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem(CACHED_USER_KEY);
        } catch {}
        hydrateGlobalFavorites([]);
        hydrateGlobalHistory([]);
        localStorage.removeItem("continue_watching_list");
      }
    } catch (err) {
      console.error("Fetch current user failed:", err);
    } finally {
      setLoading(false);
    }
  }, [syncWithServer]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // --- Real-time Cloud Sync & Ban Heartbeat ---
  useEffect(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (!user) return;

    const isAdminAccount = user.role === "superadmin" || user.role === "admin";
    let lastCheckTs = 0;

    const checkCloudAndBanStatus = async () => {
      // Only poll when tab is visible to avoid unnecessary requests
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastCheckTs < 4000) return;
      lastCheckTs = now;

      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
        });

        if (!res.ok) return;
        const data = await res.json();

        // Session expired - user was deleted or logged out from another tab
        if (!data.authenticated) {
          setUser(null);
          window.dispatchEvent(new Event("storage"));
          return;
        }

        const freshUser = data.user;

        // --- Cross-Device Cloud Sync: Merge newer watch history & favorites from other devices ---
        if (Array.isArray(freshUser.history) && freshUser.history.length > 0) {
          let localHist: any[] = [];
          try {
            const rawHist = localStorage.getItem(STORAGE_KEYS.HISTORY);
            if (rawHist) localHist = JSON.parse(rawHist);
          } catch {}

          const localMap = new Map<string, any>(
            (Array.isArray(localHist) ? localHist : []).map((h: any) => [h?.slug || h?.movieSlug, h])
          );
          let hasNewerCloudProgress = false;

          for (const ch of freshUser.history) {
            const s = ch?.slug || ch?.movieSlug;
            if (!s) continue;
            const lh = localMap.get(s);
            const cWatched = Number(ch?.watchedAt || ch?.timestamp || 0);
            const lWatched = lh ? Number(lh?.watchedAt || lh?.timestamp || 0) : 0;
            const cTime = Number(ch?.currentTime || 0);
            const lTime = lh ? Number(lh?.currentTime || 0) : 0;
            if (
              !lh ||
              cWatched > lWatched + 1000 ||
              ch?.episodeIndex !== lh?.episodeIndex ||
              Math.abs(cTime - lTime) >= 5
            ) {
              hasNewerCloudProgress = true;
              break;
            }
          }

          if (hasNewerCloudProgress) {
            const combinedHistory = [...freshUser.history, ...(Array.isArray(localHist) ? localHist : [])];
            hydrateGlobalHistory(combinedHistory);
            syncCloudHistoryToLocalEpisodeStorage(freshUser.history);
            setUser((prev) => {
              if (!prev) return null;
              const next = {
                ...prev,
                history: freshUser.history,
                historyCount: freshUser.history.length,
                favorites: Array.isArray(freshUser.favorites) ? freshUser.favorites : prev.favorites,
                favoritesCount: Array.isArray(freshUser.favorites) ? freshUser.favorites.length : prev.favoritesCount,
              };
              try {
                localStorage.setItem(CACHED_USER_KEY, JSON.stringify(next));
              } catch {}
              return next;
            });
          }
        }

        if (isAdminAccount) return;

        const prev = prevBanStateRef.current;

        const isNowPermLocked = Boolean(freshUser.isLocked);
        const isNowTempBanned = Boolean(freshUser.bannedUntil && freshUser.bannedUntil > Date.now());

        // --- Case 1: Permanent ban detected ---
        if (isNowPermLocked && !prev.isLocked) {
          document.querySelectorAll("video").forEach((v) => {
            try { v.pause(); v.src = ""; } catch {}
          });
          setPermBanModal({ open: true, reason: freshUser.banReason || "" });
          prevBanStateRef.current = { isLocked: true, bannedUntil: Number(freshUser.bannedUntil) || 0 };
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          return;
        }

        // --- Case 2: Temp ban newly applied ---
        const prevBannedUntil = prev.bannedUntil || 0;
        const newBannedUntil = Number(freshUser.bannedUntil) || 0;

        if (isNowTempBanned && newBannedUntil !== prevBannedUntil) {
          document.querySelectorAll("video").forEach((v) => {
            try { v.pause(); } catch {}
          });
          setTempBanModal({ open: true, reason: freshUser.banReason || "", bannedUntil: newBannedUntil });
          setUser((prev) => prev ? { ...prev, ...freshUser } : freshUser);
          prevBanStateRef.current = { isLocked: false, bannedUntil: newBannedUntil };
          return;
        }

        // --- Case 3: Temp ban expired (server auto-unblocked) ---
        if (prevBannedUntil > 0 && !isNowTempBanned && !isNowPermLocked) {
          setUser((prev) => prev ? { ...prev, bannedUntil: 0, banReason: "", isLocked: false } : prev);
          prevBanStateRef.current = { isLocked: false, bannedUntil: 0 };
          toast.success("Thời hạn tạm khóa đã kết thúc. Bạn có thể xem phim trở lại!");
          return;
        }

        prevBanStateRef.current = {
          isLocked: isNowPermLocked,
          bannedUntil: newBannedUntil,
        };
      } catch {
        // Network error - silently ignore
      }
    };

    // Check on visibility change or window focus (when user switches from phone to computer tab)
    const handleVis = () => {
      if (document.visibilityState === "visible") {
        checkCloudAndBanStatus();
      }
    };
    const handleFocus = () => {
      checkCloudAndBanStatus();
    };
    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("focus", handleFocus);

    heartbeatIntervalRef.current = setInterval(checkCloudAndBanStatus, 180000);

    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      window.removeEventListener("focus", handleFocus);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [user?.id, user?.role]);

  const handlePermBanDismiss = useCallback(async () => {
    setPermBanModal({ open: false, reason: "" });
    const oldId = user?.id;
    await doLogout(oldId);
    toast.error("Tài khoản của bạn đã bị khóa vĩnh viễn.");
  }, [user?.id, doLogout]);

  const handleTempBanDismiss = useCallback(() => {
    setTempBanModal({ open: false, reason: "", bannedUntil: 0 });
  }, []);


  const openAuthModal = useCallback((mode: "login" | "register" | "otp" = "login", email?: string) => {
    setAuthModalMode(mode);
    if (email) setPendingEmail(email);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        return {
          success: false,
          error: "Máy chủ đang phản hồi chậm. Vui lòng bấm thử lại.",
        };
      }
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Đăng nhập thất bại" };
      }

      setUser(data.user);
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      } catch {}
      prevBanStateRef.current = {
        isLocked: Boolean(data.user.isLocked),
        bannedUntil: Number(data.user.bannedUntil) || 0,
      };
      setIsAuthModalOpen(false);

      hydrateGlobalFavorites(Array.isArray(data.user?.favorites) ? data.user.favorites : []);
      hydrateGlobalHistory(Array.isArray(data.user?.history) ? data.user.history : []);

      const isUserAdmin =
        data.user?.role === "admin" ||
        data.user?.role === "superadmin";

      if (typeof window !== "undefined") {
        sessionStorage.setItem("hiphim_welcomed_session", "true");
        window.dispatchEvent(
          new CustomEvent("show-auth-welcome", {
            detail: {
              type: "welcome_back",
              user: data.user,
            },
          })
        );
      }

      if (isUserAdmin) {
        toast.success(`Chào mừng Quản trị viên, ${data.user.name || "bạn"}! Đang vào bảng quản trị...`);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 300);
      } else {
        toast.success(`Chào mừng trở lại, ${data.user.name || "bạn"}!`);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi kết nối máy chủ" };
    }
  }, [syncWithServer]);

  const register = useCallback(async (email: string, password: string, name: string, turnstileToken?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, turnstileToken }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        return {
          success: false,
          error: "Máy chủ đang xử lý gửi mã OTP. Vui lòng bấm thử lại.",
        };
      }
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Đăng ký thất bại" };
      }

      setPendingEmail(email.trim().toLowerCase());
      setAuthModalMode("otp");
      return {
        success: true,
        devMode: data.devMode,
        devCode: data.devCode,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi kết nối máy chủ" };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        return {
          success: false,
          error: "Máy chủ đang xử lý xác thực. Vui lòng bấm thử lại.",
        };
      }
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Xác thực mã OTP thất bại" };
      }

      setUser(data.user);
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      } catch {}
      setIsAuthModalOpen(false);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("hiphim_welcomed_session", "true");
        window.dispatchEvent(
          new CustomEvent("show-auth-welcome", {
            detail: {
              type: "new_register",
              user: data.user,
            },
          })
        );
      }

      toast.success("Kích hoạt tài khoản thành công!");
      hydrateGlobalFavorites(Array.isArray(data.user?.favorites) ? data.user.favorites : []);
      hydrateGlobalHistory(Array.isArray(data.user?.history) ? data.user.history : []);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi kết nối máy chủ" };
    }
  }, [syncWithServer]);

  const resendOtp = useCallback(async (email: string) => {
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        return {
          success: false,
          error: "Máy chủ đang xử lý gửi lại mã OTP. Vui lòng bấm thử lại.",
        };
      }
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Gửi lại mã OTP thất bại" };
      }
      return {
        success: true,
        devMode: data.devMode,
        devCode: data.devCode,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || "Lỗi kết nối máy chủ" };
    }
  }, []);

  const checkAuthOrPrompt = useCallback(
    (actionName?: string): boolean => {
      if (!user) {
        toast.info(actionName ? `Vui lòng đăng nhập để ${actionName}!` : "Vui lòng đăng nhập để tiếp tục!");
        openAuthModal("login");
        return false;
      }
      return true;
    },
    [user, openAuthModal]
  );

  const logout = useCallback(async () => {
    try {
      const oldUserId = user?.id;
      await doLogout(oldUserId);
      toast.success("Đã đăng xuất tài khoản");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [user?.id, doLogout]);

  const authContextValue = useMemo(
    () => ({
      user,
      loading,
      isAuthModalOpen,
      authModalMode,
      pendingEmail,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      syncWithServer,
      updateServerData,
      checkAuthOrPrompt,
    }),
    [
      user,
      loading,
      isAuthModalOpen,
      authModalMode,
      pendingEmail,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      syncWithServer,
      updateServerData,
      checkAuthOrPrompt,
    ]
  );

  return (
    <UserAuthContext.Provider value={authContextValue}>
      {children}

      {/* Permanent Ban Modal - renders on top of every page */}
      {permBanModal.open && (
        <PermanentBanModal reason={permBanModal.reason} onDismiss={handlePermBanDismiss} />
      )}

      {/* Temporary Ban Modal - renders on top of every page */}
      {tempBanModal.open && (
        <TempBanModal
          reason={tempBanModal.reason}
          bannedUntil={tempBanModal.bannedUntil}
          onDismiss={handleTempBanDismiss}
        />
      )}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
