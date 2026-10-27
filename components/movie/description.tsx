"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Episode from "./episode";
import WatchHeader from "../watch/watch-header";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useWatchHistory, useFavorites } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import PlayerErrorBoundary, { PlayerErrorBoundary as PlayerErrorBoundaryNamed } from "@/components/player/player-error-boundary";
import UnreleasedMovieOverlay from "../player/unreleased-movie-overlay";
import { normalizeImageUrl } from "@/lib/image-helper";
import ReportModal from "./report-modal";

const SafePlayerErrorBoundary: any = PlayerErrorBoundary || PlayerErrorBoundaryNamed || (({ children }: any) => <>{children}</>);

import VideoPlayer from "../player/video-player";
import EmbedPlayer from "../player/embed-player";

interface ResolvedInitialWatch {
  serverIndex: number;
  episodeIndex: number;
  resumeTime: number;
  episodeUrl: string;
  mode: "m3u8" | "embed";
}

function resolveInitialWatchState(
  slug: string,
  serverData: any[],
  defaultMode: "m3u8" | "embed" = "m3u8"
): ResolvedInitialWatch {
  let resolvedServer = 0;
  let resolvedEpisode = 0;
  let resolvedTime = 0;

  if (typeof window !== "undefined" && slug && Array.isArray(serverData) && serverData.length > 0) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const epParam = urlParams.get("ep") || urlParams.get("episode");
      const svParam = urlParams.get("sv") || urlParams.get("server");
      const tParam = urlParams.get("t") || urlParams.get("time");

      // 1. Resolve Server
      if (svParam !== null) {
        const parsedSv = parseInt(svParam, 10);
        if (!isNaN(parsedSv) && parsedSv >= 0 && parsedSv < serverData.length) {
          resolvedServer = parsedSv;
        }
      }

      const episodes = serverData[resolvedServer]?.server_data || [];

      // 2. Resolve Episode
      if (epParam) {
        const parsedNum = parseInt(epParam, 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          const targetIdx = parsedNum - 1;
          if (targetIdx >= 0 && targetIdx < episodes.length) {
            resolvedEpisode = targetIdx;
          } else {
            const matchedIdx = episodes.findIndex((ep: any) => {
              const numInName = parseInt(ep.name?.match(/\d+/)?.[0] || "-1", 10);
              return numInName === parsedNum;
            });
            if (matchedIdx !== -1) resolvedEpisode = matchedIdx;
          }
        } else {
          const matchedIdx = episodes.findIndex(
            (ep: any) => ep.slug === epParam || ep.name?.toLowerCase() === epParam.toLowerCase()
          );
          if (matchedIdx !== -1) resolvedEpisode = matchedIdx;
        }
      } else {
        // No query param in URL: Check localStorage for last watched episode for this movie
        let foundInStorage = false;
        const lastWatchedRaw = localStorage.getItem(`lastWatchedEpisode_${slug}`);
        if (lastWatchedRaw) {
          try {
            const parsed = JSON.parse(lastWatchedRaw);
            if (parsed && typeof parsed.episodeIndex === "number" && parsed.episodeIndex >= 0) {
              const sv0Episodes = serverData[0]?.server_data || [];
              if (parsed.episodeIndex < sv0Episodes.length) {
                resolvedServer = 0;
                resolvedEpisode = parsed.episodeIndex;
                if (parsed.currentTime && parsed.currentTime > 0) {
                  resolvedTime = parsed.currentTime;
                }
                foundInStorage = true;
              } else {
                const sv = typeof parsed.serverIndex === "number" ? parsed.serverIndex : resolvedServer;
                if (sv >= 0 && sv < serverData.length) {
                  resolvedServer = sv;
                }
                const svEpisodes = serverData[resolvedServer]?.server_data || [];
                if (parsed.episodeIndex < svEpisodes.length) {
                  resolvedEpisode = parsed.episodeIndex;
                  if (parsed.currentTime && parsed.currentTime > 0) {
                    resolvedTime = parsed.currentTime;
                  }
                  foundInStorage = true;
                }
              }
            }
          } catch {}
        }

        // Fallback to rpc_history or watchHistory
        if (!foundInStorage) {
          try {
            const histRaw = localStorage.getItem("rpc_history") || localStorage.getItem("watchHistory");
            if (histRaw) {
              const histArr = JSON.parse(histRaw);
              if (Array.isArray(histArr)) {
                const found = histArr.find((h: any) => h.slug === slug);
                if (found && typeof found.episodeIndex === "number" && found.episodeIndex >= 0) {
                  const sv0Episodes = serverData[0]?.server_data || [];
                  if (found.episodeIndex < sv0Episodes.length) {
                    resolvedServer = 0;
                    resolvedEpisode = found.episodeIndex;
                    if (found.currentTime && found.currentTime > 0) {
                      resolvedTime = found.currentTime;
                    }
                    foundInStorage = true;
                  } else {
                    const sv = typeof found.serverIndex === "number" ? found.serverIndex : resolvedServer;
                    if (sv >= 0 && sv < serverData.length) {
                      resolvedServer = sv;
                    }
                    const svEpisodes = serverData[resolvedServer]?.server_data || [];
                    if (found.episodeIndex < svEpisodes.length) {
                      resolvedEpisode = found.episodeIndex;
                      if (found.currentTime && found.currentTime > 0) {
                        resolvedTime = found.currentTime;
                      }
                      foundInStorage = true;
                    }
                  }
                }
              }
            }
          } catch {}
        }

        // Fallback to continue_watching_list
        if (!foundInStorage) {
          try {
            const cwRaw = localStorage.getItem("continue_watching_list");
            if (cwRaw) {
              const cwArr = JSON.parse(cwRaw);
              if (Array.isArray(cwArr)) {
                const found = cwArr.find((h: any) => h.slug === slug);
                if (found && typeof found.episodeIndex === "number" && found.episodeIndex >= 0) {
                  const sv0Episodes = serverData[0]?.server_data || [];
                  if (found.episodeIndex < sv0Episodes.length) {
                    resolvedServer = 0;
                    resolvedEpisode = found.episodeIndex;
                    if (found.currentTime && found.currentTime > 0) {
                      resolvedTime = found.currentTime;
                    }
                  } else {
                    const sv = typeof found.serverIndex === "number" ? found.serverIndex : resolvedServer;
                    if (sv >= 0 && sv < serverData.length) {
                      resolvedServer = sv;
                    }
                    const svEpisodes = serverData[resolvedServer]?.server_data || [];
                    if (found.episodeIndex < svEpisodes.length) {
                      resolvedEpisode = found.episodeIndex;
                      if (found.currentTime && found.currentTime > 0) {
                        resolvedTime = found.currentTime;
                      }
                    }
                  }
                }
              }
            }
          } catch {}
        }
      }

      // 3. Resolve Timestamp / Resume Time
      if (tParam) {
        const parsedTime = parseInt(tParam, 10);
        if (!isNaN(parsedTime) && parsedTime > 0) {
          resolvedTime = parsedTime;
        }
      } else if (resolvedTime <= 0) {
        const progressKey = `watchProgress_${slug}_${resolvedServer}_${resolvedEpisode}`;
        const savedProgress = Number(localStorage.getItem(progressKey) || 0);
        if (Number.isFinite(savedProgress) && savedProgress > 0) {
          resolvedTime = savedProgress;
        }
      }
    } catch (e) {
      console.error("Error resolving initial watch state:", e);
    }
  }

  const targetEpisode =
    serverData?.[resolvedServer]?.server_data?.[resolvedEpisode] ||
    serverData?.[0]?.server_data?.[0];

  const hasM3u8 = Boolean(targetEpisode?.link_m3u8 && targetEpisode.link_m3u8.trim() !== "");
  const hasEmbed = Boolean(targetEpisode?.link_embed && targetEpisode.link_embed.trim() !== "");

  let resolvedMode: "m3u8" | "embed" = "m3u8";
  if (!hasM3u8 && hasEmbed) {
    resolvedMode = "embed";
  } else {
    resolvedMode = "m3u8";
  }

  const resolvedUrl =
    resolvedMode === "m3u8" && hasM3u8
      ? targetEpisode.link_m3u8
      : (targetEpisode?.link_embed || targetEpisode?.link_m3u8 || "");

  return {
    serverIndex: resolvedServer,
    episodeIndex: resolvedEpisode,
    resumeTime: resolvedTime,
    episodeUrl: resolvedUrl,
    mode: resolvedMode,
  };
}

export default function Description({ movie, serverData: rawServerData }: any) {
  // Sanitize serverData: If primary server (index 0) exists and has episodes, remove any extraneous NguonC backup servers
  const serverData = useMemo(() => {
    if (!Array.isArray(rawServerData) || rawServerData.length <= 1) return rawServerData || [];
    const hasPrimaryEpisodes = Array.isArray(rawServerData[0]?.server_data) && rawServerData[0].server_data.length > 0;
    if (hasPrimaryEpisodes) {
      return rawServerData.filter((s: any) => {
        const name = s?.server_name || "";
        return !name.includes("Dự Phòng VIP") && !name.includes("Dự Phòng (NguonC)");
      });
    }
    return rawServerData;
  }, [rawServerData]);

  const defaultMode: 'm3u8' | 'embed' = useMemo(() => {
    const firstEp = serverData?.[0]?.server_data?.[0];
    if (firstEp && !firstEp.link_m3u8 && firstEp.link_embed) {
      return 'embed';
    }
    return 'm3u8';
  }, [serverData]);

  const initialWatchState = useMemo(() => {
    return resolveInitialWatchState(movie?.slug, serverData, defaultMode);
  }, [movie?.slug, serverData, defaultMode]);

  const [playerMode, setPlayerMode] = useState<'m3u8' | 'embed'>(() => initialWatchState.mode);
  const [currentServerData, setCurrentServerData] = useState<any[]>(() => serverData || []);
  const [newestEpisodeIndices, setNewestEpisodeIndices] = useState<Record<number, boolean>>({});

  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<{
    server: number;
    episode: number;
  }>(() => ({ server: initialWatchState.serverIndex, episode: initialWatchState.episodeIndex }));

  const [currentEpisodeUrl, setCurrentEpisodeUrl] = useState<string>(() => initialWatchState.episodeUrl);

  const [resumeTime, setResumeTime] = useState<number>(() => initialWatchState.resumeTime);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);

  useEffect(() => {
    if (Array.isArray(serverData) && serverData.length > 0) {
      setCurrentServerData(serverData);
      const curSv = currentEpisodeIndex?.server || 0;
      const curEp = currentEpisodeIndex?.episode || 0;
      const curEpData = serverData[curSv]?.server_data?.[curEp] || serverData[0]?.server_data?.[0];
      if (curEpData) {
        const hasM3u8 = Boolean(curEpData.link_m3u8 && curEpData.link_m3u8.trim() !== "");
        const hasEmbed = Boolean(curEpData.link_embed && curEpData.link_embed.trim() !== "");
        if (!hasM3u8 && hasEmbed) {
          setPlayerMode('embed');
          setCurrentEpisodeUrl(curEpData.link_embed);
        } else if (!hasEmbed && hasM3u8) {
          setPlayerMode('m3u8');
          setCurrentEpisodeUrl(curEpData.link_m3u8);
        }
      }
    }
  }, [serverData, currentEpisodeIndex?.server, currentEpisodeIndex?.episode]);

  // Sync document.title with the active movie name and episode on client-side
  useEffect(() => {
    if (typeof window === "undefined" || !movie?.name) return;
    const epName = currentServerData?.[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode]?.name;
    const epSuffix = epName ? ` - Tập ${epName}` : "";
    document.title = `${movie.name}${epSuffix} - Xem phim HD chất lượng cao | Hi Phim`;
  }, [movie?.name, currentEpisodeIndex, currentServerData]);

  const [completedEpisodes, setCompletedEpisodes] = useState<Record<number, boolean>>({});
  const { user, checkAuthOrPrompt, updateServerData } = useUserAuth();
  const { updateProgress } = useContinueWatching();
  const { addToHistory, updateHistoryProgress } = useWatchHistory();
  const { toggleFavorite, isFavorite } = useFavorites();
  const prefetchedNextRef = useRef<string | null>(null);
  const lastSavedProgressRef = useRef<number>(0);
  const initialResolvedRef = useRef<boolean>(false);
  const cloudSyncedRef = useRef<boolean>(false);

  const isUserPermanentlyBanned = Boolean(user?.isLocked);
  const isUserTemporarilyBanned = Boolean(user?.bannedUntil && user.bannedUntil > Date.now());
  const isUserBanned = isUserPermanentlyBanned || isUserTemporarilyBanned;

  const [banRemainingTime, setBanRemainingTime] = useState<string>("");

  // Stop video immediately when user gets banned (real-time heartbeat response)
  const prevBannedRef = useRef<boolean>(isUserBanned);
  useEffect(() => {
    if (isUserBanned && !prevBannedRef.current) {
      // Newly banned - stop all videos
      document.querySelectorAll("video").forEach((v) => {
        try { v.pause(); } catch {}
      });
    }
    prevBannedRef.current = isUserBanned;
  }, [isUserBanned]);

  useEffect(() => {
    if (!isUserTemporarilyBanned || !user?.bannedUntil) return;
    const updateCountdown = () => {
      const diff = (user.bannedUntil || 0) - Date.now();
      if (diff <= 0) {
        setBanRemainingTime("Đã hết thời hạn tạm khóa. Vui lòng tải lại trang.");
      } else {
        const totalSec = Math.floor(diff / 1000);
        const d = Math.floor(totalSec / 86400);
        const h = Math.floor((totalSec % 86400) / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        const parts = [];
        if (d > 0) parts.push(`${d} ngày`);
        if (h > 0 || d > 0) parts.push(`${h} giờ`);
        if (m > 0 || h > 0 || d > 0) parts.push(`${m} phút`);
        parts.push(`${s} giây`);
        setBanRemainingTime(parts.join(" "));
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isUserTemporarilyBanned, user?.bannedUntil]);

  const isFav = isFavorite(movie.slug);

  const handleToggleFavorite = useCallback(() => {
    if (!checkAuthOrPrompt("lưu phim yêu thích")) return;
    const updated = toggleFavorite({
      slug: movie.slug,
      name: movie.name,
      origin_name: movie.origin_name,
      thumb_url: movie.thumb_url || movie.poster_url || "",
      poster_url: movie.poster_url,
      year: typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year,
      quality: movie.quality,
      episode_current: movie.episode_current,
      tmdb: movie.tmdb,
      imdb: movie.imdb,
    });

    if (user && updated) {
      updateServerData({ favorites: updated });
    }

    if (!isFav) {
      toast.success(`Đã thêm "${movie.name}" vào danh sách yêu thích`);
    } else {
      toast.info(`Đã xóa "${movie.name}" khỏi danh sách yêu thích`);
    }
  }, [checkAuthOrPrompt, isFav, movie, toggleFavorite, updateServerData, user]);

  const [showReportModal, setShowReportModal] = useState(false);

  const favoriteButton = (
    <button
      onClick={handleToggleFavorite}
      className={cn(
        "w-full max-w-[260px] sm:max-w-[280px] mx-auto py-2 px-4 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 font-bold text-xs active:scale-[0.98] cursor-pointer group shadow-sm",
        isFav
          ? "bg-brand-green/[0.15] border-brand-green/40 text-brand-green hover:bg-brand-green/20"
          : "bg-white/[0.04] hover:bg-white/[0.08] text-white/90 hover:text-white border-white/[0.08] hover:border-white/15"
      )}
      title={isFav ? "Bấm để xóa khỏi danh sách yêu thích" : "Bấm để thêm vào danh sách yêu thích"}
    >
      <Heart
        className={cn(
          "w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0",
          isFav
            ? "fill-brand-green text-brand-green"
            : "text-white/60 group-hover:text-brand-green"
        )}
      />
      <span>{isFav ? "Đã Thêm Vào Yêu Thích" : "Thêm Vào Phim Yêu Thích"}</span>
    </button>
  );

  const actionButtons = (
    <div className="w-full flex items-center justify-center gap-2 max-w-[360px] mx-auto">
      {favoriteButton}
      <button
        type="button"
        onClick={() => {
          if (!checkAuthOrPrompt("báo lỗi tập phim")) return;
          setShowReportModal(true);
        }}
        className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/90 hover:text-amber-400 border border-white/[0.08] hover:border-amber-400/30 flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
        title="Báo lỗi tập phim này đến quản trị viên"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">Báo lỗi tập</span>
        <span className="sm:hidden">Báo lỗi</span>
      </button>
    </div>
  );

  const getEpisodeProgressKey = useCallback((serverIndex: number, episodeIndex: number) => {
    return `watchProgress_${movie.slug}_${serverIndex}_${episodeIndex}`;
  }, [movie.slug]);

  const markEpisodeCompleted = useCallback((serverIndex: number, episodeIndex: number) => {
    if (typeof window === "undefined" || !movie?.slug) return;
    localStorage.setItem(`completedEp_${movie.slug}_${serverIndex}_${episodeIndex}`, "true");
    setCompletedEpisodes((prev) => ({ ...prev, [episodeIndex]: true }));
    const key = getEpisodeProgressKey(serverIndex, episodeIndex);
    localStorage.removeItem(key);
  }, [movie?.slug, getEpisodeProgressKey]);

  // Load completed episodes from storage on server change
  useEffect(() => {
    if (typeof window === "undefined" || !movie?.slug || !currentServerData) return;
    const serverIndex = currentEpisodeIndex?.server || 0;
    const episodes = currentServerData[serverIndex]?.server_data || [];
    const completedMap: Record<number, boolean> = {};
    episodes.forEach((_: any, idx: number) => {
      if (localStorage.getItem(`completedEp_${movie.slug}_${serverIndex}_${idx}`) === "true") {
        completedMap[idx] = true;
      }
    });
    setCompletedEpisodes(completedMap);
  }, [movie?.slug, currentServerData, currentEpisodeIndex?.server]);

  const clearEpisodeProgress = useCallback((serverIndex: number, episodeIndex: number) => {
    localStorage.removeItem(getEpisodeProgressKey(serverIndex, episodeIndex));
  }, [getEpisodeProgressKey]);

  const handleSelectEpisode = useCallback((
    link: string,
    serverIndex: number,
    episodeIndex: number
  ) => {
    const isEmbedLink = !link.includes('.m3u8') || link.includes('embed') || link.includes('streamc') || link.includes('player.phimapi.com');
    const epData = currentServerData?.[serverIndex]?.server_data?.[episodeIndex];

    if (isEmbedLink) {
      setPlayerMode('embed');
    } else if (playerMode === 'embed' && epData?.link_m3u8 === link) {
      setPlayerMode('m3u8');
    }

    setCurrentEpisodeUrl(link);
    setCurrentEpisodeIndex({ server: serverIndex, episode: episodeIndex });

    // Look up saved resume time for this specific episode
    const epKey = getEpisodeProgressKey(serverIndex, episodeIndex);
    const savedEpProgress = Number(localStorage.getItem(epKey) || 0);
    const newResumeTime = Number.isFinite(savedEpProgress) && savedEpProgress > 0 ? savedEpProgress : 0;
    setResumeTime(newResumeTime);

    const epName = epData?.name || `Tập ${episodeIndex + 1}`;
    const epSlug = epData?.slug || "";

    // Synchronize browser URL
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("ep", String(episodeIndex + 1));
        if (newResumeTime > 5) {
          url.searchParams.set("t", String(Math.floor(newResumeTime)));
        } else {
          url.searchParams.delete("t");
        }
        window.history.replaceState(null, "", url.toString());

        // Save last watched episode
        localStorage.setItem(`lastWatchedEpisode_${movie.slug}`, JSON.stringify({
          serverIndex,
          episodeIndex,
          episodeName: epName,
          episodeSlug: epSlug,
          currentTime: newResumeTime,
        }));
      } catch {}
    }

    // Update watch history
    const updated = updateHistoryProgress(movie.slug, {
      serverIndex,
      episodeIndex,
      episodeName: epName,
      episodeSlug: epSlug,
      currentTime: newResumeTime,
    });
    if (user && Array.isArray(updated) && updated.length > 0) {
      updateServerData({ history: updated });
    }
  }, [currentServerData, movie?.slug, getEpisodeProgressKey, updateHistoryProgress, updateServerData, user, playerMode]);

  const handleServerChange = (serverIndex: number) => {
    const epIndex = 0;
    if (currentServerData && currentServerData[serverIndex]?.server_data?.length > 0) {
      const firstEpisode = currentServerData[serverIndex].server_data[0];
      const hasM3u8 = Boolean(firstEpisode?.link_m3u8 && firstEpisode.link_m3u8.trim() !== "");
      const hasEmbed = Boolean(firstEpisode?.link_embed && firstEpisode.link_embed.trim() !== "");

      let targetMode: 'm3u8' | 'embed' = playerMode;
      let targetLink = "";

      if (targetMode === 'm3u8') {
        if (hasM3u8) {
          targetLink = firstEpisode.link_m3u8;
        } else if (hasEmbed) {
          targetMode = 'embed';
          targetLink = firstEpisode.link_embed;
        }
      } else {
        if (hasEmbed) {
          targetLink = firstEpisode.link_embed;
        } else if (hasM3u8) {
          targetMode = 'm3u8';
          targetLink = firstEpisode.link_m3u8;
        }
      }

      setPlayerMode(targetMode);
      if (targetLink) {
        handleSelectEpisode(targetLink, serverIndex, epIndex);
      }
    }
  };

  // Real-time episode check in background for ongoing series
  const lastSyncCheckRef = useRef<number>(Date.now());
  const isSyncingRef = useRef<boolean>(false);

  const isSeriesOngoing = movie?.status === "ongoing" && movie?.type !== "single" && movie?.episode_total !== 1;

  const checkNewEpisodes = useCallback(async () => {
    if (!movie?.slug || isSyncingRef.current || !isSeriesOngoing) return;
    isSyncingRef.current = true;
    try {
      const res = await fetch(`/api/phim?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}`);
      if (!res.ok) return;
      const data = await res.json();
      const freshServers = data?.episodes || [];
      if (Array.isArray(freshServers) && freshServers.length > 0) {
        const curServerIdx = currentEpisodeIndex?.server || 0;
        const currentEpCount = currentServerData[curServerIdx]?.server_data?.length || 0;
        const freshEpCount = freshServers[curServerIdx]?.server_data?.length || 0;

        if (freshEpCount > currentEpCount) {
          setCurrentServerData(freshServers);
          const newIndices: Record<number, boolean> = {};
          for (let i = currentEpCount; i < freshEpCount; i++) {
            newIndices[i] = true;
          }
          setNewestEpisodeIndices(newIndices);

          const newestEp = freshServers[curServerIdx]?.server_data?.[freshEpCount - 1];
          const newEpName = newestEp?.name || `Tập ${freshEpCount}`;
          toast.success(`🎉 Đã có ${newEpName} mới!`, {
            description: "Danh sách tập đã tự động cập nhật.",
            action: {
              label: "Xem ngay",
              onClick: () => {
                const link = (playerMode === 'm3u8' && newestEp?.link_m3u8) ? newestEp.link_m3u8 : (newestEp?.link_embed || newestEp?.link_m3u8);
                if (link) {
                  handleSelectEpisode(link, curServerIdx, freshEpCount - 1);
                }
              },
            },
            duration: 9000,
          });
        }
      }
    } catch {
      // Non-blocking background sync
    } finally {
      isSyncingRef.current = false;
      lastSyncCheckRef.current = Date.now();
    }
  }, [movie?.slug, isSeriesOngoing, currentServerData, currentEpisodeIndex?.server, playerMode, handleSelectEpisode]);

  // Periodic check only for ONGOING series every 30 minutes (eliminates thousands of useless Vercel invocations)
  useEffect(() => {
    if (!isSeriesOngoing) return;

    const SYNC_INTERVAL = 1800_000; // 30 minutes
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkNewEpisodes();
      }
    }, SYNC_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSyncCheckRef.current > SYNC_INTERVAL) {
        checkNewEpisodes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkNewEpisodes, isSeriesOngoing]);

  // Client-side synchronization on initial load (URL query or local storage)
  useEffect(() => {
    if (typeof window === "undefined" || !serverData || serverData.length === 0 || !movie?.slug) return;
    if (initialResolvedRef.current) return;
    initialResolvedRef.current = true;

    const resolved = resolveInitialWatchState(movie.slug, serverData, playerMode);
    setCurrentEpisodeIndex({ server: resolved.serverIndex, episode: resolved.episodeIndex });
    if (resolved.episodeUrl) {
      setCurrentEpisodeUrl(resolved.episodeUrl);
    }
    if (resolved.resumeTime > 0) {
      setResumeTime(resolved.resumeTime);
    }

    // Sync URL if missing ep query param
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (!url.searchParams.has("ep") && resolved.episodeIndex >= 0) {
        url.searchParams.set("ep", String(resolved.episodeIndex + 1));
        changed = true;
      }
      if (!url.searchParams.has("t") && resolved.resumeTime > 5) {
        url.searchParams.set("t", String(Math.floor(resolved.resumeTime)));
        changed = true;
      }
      if (changed) {
        window.history.replaceState(null, "", url.toString());
      }
    } catch {}
  }, [movie?.slug, serverData, playerMode]);

  // Dispatch active movie info for global header & floating bars
  useEffect(() => {
    if (typeof window !== "undefined" && movie?.name) {
      window.dispatchEvent(
        new CustomEvent("active-movie-change", {
          detail: { movieName: movie.name, movieSlug: movie.slug },
        })
      );
    }
  }, [movie?.name, movie?.slug]);

  // Cloud Resume Playback: Synchronize watch progress from Neon DB / User Account across devices
  useEffect(() => {
    if (typeof window === "undefined" || !user || !movie?.slug || !serverData || cloudSyncedRef.current) return;

    // If the URL explicitly specified ep or t query params, respect user's explicit link
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("ep") && urlParams.has("t")) {
      cloudSyncedRef.current = true;
      return;
    }

    const cloudHistory = user.history;
    if (!Array.isArray(cloudHistory) || cloudHistory.length === 0) return;

    const cloudItem = cloudHistory.find((item: any) => item.slug === movie.slug);
    if (!cloudItem) return;

    const epCandidate = typeof cloudItem.episodeIndex === "number" && cloudItem.episodeIndex >= 0 ? cloudItem.episodeIndex : 0;
    const sv0Episodes = serverData[0]?.server_data || [];
    let sv = 0;
    if (epCandidate < sv0Episodes.length) {
      sv = 0;
    } else if (typeof cloudItem.serverIndex === "number" && cloudItem.serverIndex >= 0 && cloudItem.serverIndex < serverData.length) {
      sv = cloudItem.serverIndex;
    }
    const episodes = serverData[sv]?.server_data || [];
    const epIdx = epCandidate < episodes.length ? epCandidate : 0;
    const cloudTime = typeof cloudItem.currentTime === "number" && cloudItem.currentTime > 0
      ? cloudItem.currentTime
      : 0;

    // Compare with local device progress
    let localTime = 0;
    try {
      const localProgress = Number(localStorage.getItem(`watchProgress_${movie.slug}_${sv}_${epIdx}`) || 0);
      if (Number.isFinite(localProgress) && localProgress > 0) localTime = localProgress;
    } catch {}

    // If cloud has valid progress and local is empty or cloud is ahead by >10s
    if (cloudTime > 5 && (!localTime || cloudTime > localTime + 10)) {
      cloudSyncedRef.current = true;
      const targetEp = episodes[epIdx];
      const link = playerMode === 'm3u8' 
        ? (targetEp?.link_m3u8 || targetEp?.link_embed || "") 
        : (targetEp?.link_embed || targetEp?.link_m3u8 || "");
      
      if (link) {
        setCurrentEpisodeIndex({ server: sv, episode: epIdx });
        setCurrentEpisodeUrl(link);
        setResumeTime(cloudTime);
        
        try {
          localStorage.setItem(`watchProgress_${movie.slug}_${sv}_${epIdx}`, String(Math.floor(cloudTime)));
        } catch {}

        const minutes = Math.floor(cloudTime / 60);
        const seconds = Math.floor(cloudTime % 60);
        const timeStr = minutes > 0 ? `${minutes}p${seconds.toString().padStart(2, '0')}s` : `${seconds}s`;
        const epLabel = targetEp?.name ? `Tập ${targetEp.name}` : `Tập ${epIdx + 1}`;
        
        toast.success(`☁️ Tiếp tục xem từ tài khoản: ${epLabel} (${timeStr})`, {
          duration: 4500,
        });
      }
    }
  }, [user, movie?.slug, serverData, playerMode]);

  // Immediate flush of latest progress to Cloud on tab switch / window leave
  useEffect(() => {
    if (!user || !movie?.slug) return;
    const flushToCloud = () => {
      const curTime = lastSavedProgressRef.current;
      if (curTime > 5 && currentEpisodeIndex && serverData) {
        const { server, episode } = currentEpisodeIndex;
        const epData = serverData[server]?.server_data?.[episode];
        const epName = epData?.name || `Tập ${episode + 1}`;
        const epSlug = epData?.slug || "";

        const updated = updateHistoryProgress(movie.slug, {
          serverIndex: server,
          episodeIndex: episode,
          episodeName: epName,
          episodeSlug: epSlug,
          currentTime: curTime,
        });
        if (Array.isArray(updated) && updated.length > 0) {
          updateServerData({ history: updated });
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushToCloud();
      }
    };

    window.addEventListener("beforeunload", flushToCloud);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", flushToCloud);
      document.removeEventListener("visibilitychange", handleVisibility);
      flushToCloud();
    };
  }, [user, movie?.slug, currentEpisodeIndex, serverData, updateHistoryProgress, updateServerData]);

  // Save movie to recently watched only for authenticated account
  useEffect(() => {
    if (typeof window === "undefined" || !movie?.slug || !user) return;
    try {
      const serverIdx = currentEpisodeIndex?.server || 0;
      const episodeIdx = currentEpisodeIndex?.episode || 0;
      const currentEp = serverData?.[serverIdx]?.server_data?.[episodeIdx];
      const epName = currentEp?.name || `Tập ${episodeIdx + 1}`;
      const epSlug = currentEp?.slug || "";

      const updated = addToHistory({
        slug: movie.slug,
        name: movie.name,
        origin_name: movie.origin_name,
        poster_url: movie.poster_url || "",
        thumb_url: movie.thumb_url || "",
        quality: movie.quality,
        year: movie.year,
        episode_current: epName || movie.episode_current,
        episodeIndex: episodeIdx,
        episodeName: epName,
        episodeSlug: epSlug,
        serverIndex: serverIdx,
        tmdb: movie.tmdb,
        imdb: movie.imdb,
        currentTime: resumeTime || 0,
        duration: 0,
      });
      if (Array.isArray(updated) && updated.length > 0) {
        updateServerData({ history: updated });
      }
    } catch (e) {
      console.error("Failed to add to watch history:", e);
    }
  }, [movie?.slug, user?.id, currentEpisodeIndex?.server, currentEpisodeIndex?.episode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update episode URL and sync playerMode on changes
  useEffect(() => {
    if (!currentEpisodeIndex || !serverData) return;
    const currentEpisode = serverData[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode];
    if (currentEpisode) {
      const hasM3u8 = Boolean(currentEpisode.link_m3u8 && currentEpisode.link_m3u8.trim() !== "");
      const hasEmbed = Boolean(currentEpisode.link_embed && currentEpisode.link_embed.trim() !== "");

      if (playerMode === 'm3u8') {
        if (hasM3u8) {
          setCurrentEpisodeUrl(currentEpisode.link_m3u8);
        } else if (hasEmbed) {
          setPlayerMode('embed');
          setCurrentEpisodeUrl(currentEpisode.link_embed);
        }
      } else {
        if (hasEmbed) {
          setCurrentEpisodeUrl(currentEpisode.link_embed);
        } else if (hasM3u8) {
          setPlayerMode('m3u8');
          setCurrentEpisodeUrl(currentEpisode.link_m3u8);
        }
      }
    }
  }, [playerMode, currentEpisodeIndex, serverData]);

  // Resume progress on server/episode change
  useEffect(() => {
    if (typeof window === "undefined" || !currentEpisodeIndex || playerMode !== 'm3u8') {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const urlTime = parseInt(urlParams.get('t') || '');
    if (!isNaN(urlTime) && urlTime > 0) {
      setResumeTime(urlTime);
      return;
    }
    const key = getEpisodeProgressKey(currentEpisodeIndex.server, currentEpisodeIndex.episode);
    const savedProgress = Number(localStorage.getItem(key) || 0);
    setResumeTime(Number.isFinite(savedProgress) ? savedProgress : 0);
  }, [currentEpisodeIndex, playerMode, getEpisodeProgressKey]);

  const handleProgress = useCallback((currentTime: number, duration: number) => {
    if (isUserBanned) return;
    if (!currentEpisodeIndex || playerMode !== 'm3u8') return;
    const { server, episode } = currentEpisodeIndex;
    const key = getEpisodeProgressKey(server, episode);

    // Episode is considered completed when watched >= 90% or within last 20 seconds of a video with duration >= 30s
    if (duration >= 30 && (currentTime >= duration * 0.9 || currentTime >= duration - 20)) {
      markEpisodeCompleted(server, episode);
    } else {
      const nowInt = Math.floor(currentTime);
      if (nowInt > 5 && Math.abs(nowInt - lastSavedProgressRef.current) >= 5) {
        lastSavedProgressRef.current = nowInt;
        localStorage.setItem(key, String(nowInt));
        
        const epData = serverData?.[server]?.server_data?.[episode];
        const epName = epData?.name || `Tập ${episode + 1}`;
        const epSlug = epData?.slug || "";

        // Save last watched episode
        localStorage.setItem(`lastWatchedEpisode_${movie.slug}`, JSON.stringify({
          serverIndex: server,
          episodeIndex: episode,
          episodeName: epName,
          episodeSlug: epSlug,
          currentTime: nowInt,
          duration: Math.floor(duration),
        }));

        // Update master continue watching list throttled to every 5s
        updateProgress({
          slug: movie.slug,
          name: movie.name,
          poster_url: movie.poster_url,
          thumb_url: movie.thumb_url,
          serverIndex: server,
          episodeIndex: episode,
          episodeName: epName,
          currentTime: nowInt,
          duration: Math.floor(duration),
        });

        // Also update watch history with current episode and timestamp!
        const updated = updateHistoryProgress(movie.slug, {
          serverIndex: server,
          episodeIndex: episode,
          episodeName: epName,
          episodeSlug: epSlug,
          currentTime: nowInt,
          duration: Math.floor(duration),
        });

        // Throttled sync to server for authenticated user (every 15s)
        if (user && Array.isArray(updated) && nowInt % 15 === 0) {
          updateServerData({ history: updated });
        }
      }
    }

    // Background Prefetch next episode at 70% duration
    if (duration > 0 && currentTime > duration * 0.7 && currentServerData && currentEpisodeIndex) {
      const nextEp = currentServerData[server]?.server_data?.[episode + 1];
      if (nextEp?.link_m3u8 && prefetchedNextRef.current !== nextEp.link_m3u8) {
        prefetchedNextRef.current = nextEp.link_m3u8;
        fetch(nextEp.link_m3u8, { mode: 'no-cors' }).catch(() => {});
      }
    }
  }, [currentEpisodeIndex, playerMode, getEpisodeProgressKey, markEpisodeCompleted, updateProgress, updateHistoryProgress, updateServerData, movie, currentServerData, user, isUserBanned]);

  const handleNextEpisode = useCallback(() => {
    if (!currentServerData || !currentEpisodeIndex) return;
    clearEpisodeProgress(currentEpisodeIndex.server, currentEpisodeIndex.episode);
    const { server, episode } = currentEpisodeIndex;
    const currentServer = currentServerData[server];
    if (!currentServer) return;
    let nextEpisodeIndex = episode + 1;
    let nextServerIndex = server;
    if (nextEpisodeIndex >= currentServer.server_data.length) {
      nextServerIndex = server + 1;
      nextEpisodeIndex = 0;
      if (nextServerIndex >= currentServerData.length) return;
    }
    const nextServer = currentServerData[nextServerIndex];
    if (!nextServer || !nextServer.server_data) return;
    const nextEpisode = nextServer.server_data[nextEpisodeIndex];
    if (nextEpisode) {
      const hasM3u8 = Boolean(nextEpisode.link_m3u8 && nextEpisode.link_m3u8.trim() !== "");
      const hasEmbed = Boolean(nextEpisode.link_embed && nextEpisode.link_embed.trim() !== "");
      const link = playerMode === 'm3u8' 
        ? (hasM3u8 ? nextEpisode.link_m3u8 : nextEpisode.link_embed)
        : (hasEmbed ? nextEpisode.link_embed : nextEpisode.link_m3u8);
      if (link) {
        handleSelectEpisode(link, nextServerIndex, nextEpisodeIndex);
        toast.info(`Đã chuyển sang ${nextEpisode.name}`);
      }
    }
  }, [currentServerData, currentEpisodeIndex, clearEpisodeProgress, playerMode, handleSelectEpisode]);

  const handlePrevEpisode = useCallback(() => {
    if (!currentServerData || !currentEpisodeIndex) return;
    const { server, episode } = currentEpisodeIndex;
    if (episode > 0) {
      const prevEpisode = currentServerData[server]?.server_data?.[episode - 1];
      if (prevEpisode) {
        const hasM3u8 = Boolean(prevEpisode.link_m3u8 && prevEpisode.link_m3u8.trim() !== "");
        const hasEmbed = Boolean(prevEpisode.link_embed && prevEpisode.link_embed.trim() !== "");
        const link = playerMode === 'm3u8'
          ? (hasM3u8 ? prevEpisode.link_m3u8 : prevEpisode.link_embed)
          : (hasEmbed ? prevEpisode.link_embed : prevEpisode.link_m3u8);
        if (link) {
          handleSelectEpisode(link, server, episode - 1);
          toast.info(`Đã chuyển sang ${prevEpisode.name}`);
        }
      }
    } else if (server > 0) {
      const prevServer = currentServerData[server - 1];
      if (prevServer?.server_data?.length > 0) {
        const lastIdx = prevServer.server_data.length - 1;
        const prevEpisode = prevServer.server_data[lastIdx];
        if (prevEpisode) {
          const hasM3u8 = Boolean(prevEpisode.link_m3u8 && prevEpisode.link_m3u8.trim() !== "");
          const hasEmbed = Boolean(prevEpisode.link_embed && prevEpisode.link_embed.trim() !== "");
          const link = playerMode === 'm3u8'
            ? (hasM3u8 ? prevEpisode.link_m3u8 : prevEpisode.link_embed)
            : (hasEmbed ? prevEpisode.link_embed : prevEpisode.link_m3u8);
          if (link) {
            handleSelectEpisode(link, server - 1, lastIdx);
            toast.info(`Đã chuyển sang ${prevEpisode.name}`);
          }
        }
      }
    }
  }, [currentServerData, currentEpisodeIndex, playerMode, handleSelectEpisode]);

  // Global hotkeys for N (Next) and P (Prev)
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleNextEpisode();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrevEpisode();
      }
    };
    window.addEventListener("keydown", handleGlobalHotkeys);
    return () => window.removeEventListener("keydown", handleGlobalHotkeys);
  }, [handleNextEpisode, handlePrevEpisode]);

  const hasNextEpisode = () => {
    if (!currentServerData || !currentEpisodeIndex) return false;
    const { server, episode } = currentEpisodeIndex;
    const currentServer = currentServerData[server];
    if (!currentServer || !currentServer.server_data) return false;
    
    if (episode + 1 < currentServer.server_data.length) return true;
    if (server + 1 < currentServerData.length && currentServerData[server + 1]?.server_data?.length > 0) return true;
    return false;
  };

  const hasPrevEpisode = () => {
    if (!currentServerData || !currentEpisodeIndex) return false;
    const { server, episode } = currentEpisodeIndex;
    if (episode > 0) return true;
    if (server > 0 && currentServerData[server - 1]?.server_data?.length > 0) return true;
    return false;
  };

  const handleSwitchToM3u8 = useCallback(() => {
    setPlayerMode('m3u8');
    if (currentEpisodeIndex && currentServerData) {
      const currentEpisode = currentServerData[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode];
      if (currentEpisode?.link_m3u8) setCurrentEpisodeUrl(currentEpisode.link_m3u8);
    }
    toast.info("Đã chuyển sang Máy chủ Mặc định (HLS)");
  }, [currentEpisodeIndex, currentServerData]);

  const handleSwitchToEmbed = useCallback(() => {
    setPlayerMode('embed');
    if (currentEpisodeIndex && currentServerData) {
      const currentEpisode = currentServerData[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode];
      if (currentEpisode?.link_embed) setCurrentEpisodeUrl(currentEpisode.link_embed);
    }
    toast.info("Đã chuyển sang Máy chủ Dự phòng (VIP Embed)");
  }, [currentEpisodeIndex, currentServerData]);

  const handleEnded = useCallback(() => {
    if (currentEpisodeIndex) {
      markEpisodeCompleted(currentEpisodeIndex.server, currentEpisodeIndex.episode);
    }
  }, [currentEpisodeIndex, markEpisodeCompleted]);

  const isTrailerStatus = Boolean(
    movie?.episode_current?.toLowerCase().includes("trailer") ||
    movie?.status === "trailer" ||
    movie?.episode_current?.toLowerCase().includes("sắp chiếu")
  );

  const hasPlayableStream = Boolean(
    currentEpisodeUrl && currentEpisodeUrl.trim() !== ""
  );

  // Unreleased when either it's explicitly a trailer/upcoming movie OR there is no stream available
  const isUnreleasedMovie = isTrailerStatus || !hasPlayableStream;

  const rawEpName =
    currentEpisodeIndex &&
    currentServerData?.[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode]?.name;

  const currentEpName = rawEpName?.trim()
    ? rawEpName
    : (isTrailerStatus ? "Trailer" : "");

  if (!movie || !movie.slug) return null;

  return (
    <div className="w-full flex flex-col gap-3.5 sm:gap-6 z-10 relative">
      
      {/* Standalone Cinema Header */}
      {!isPlayerFullscreen && (
        <WatchHeader
          movieName={movie.name}
          movieSlug={movie.slug}
          currentEpName={currentEpName}
          currentTime={lastSavedProgressRef.current || resumeTime || 0}
          episodeIndex={currentEpisodeIndex?.episode ?? 0}
        />
      )}

      {/* 2-Column Cinema Layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start w-full max-w-[1600px] mx-auto pt-1 sm:pt-2">
        
        {/* Left Primary Stage: Video Player — sticky on desktop */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-[60px]">
          
          {/* Video Player Container */}
          <div className={cn("relative group/player w-full", isPlayerFullscreen && "static z-[99999]")}>
            <Card className={cn(
              "border border-white/10 w-full rounded-2xl lg:rounded-3xl bg-black relative shadow-none",
              isPlayerFullscreen 
                ? "z-[99999] overflow-visible border-0 rounded-none static aspect-auto" 
                : "overflow-hidden z-10",
              isUserBanned ? "min-h-[430px] sm:min-h-[500px]" : isUnreleasedMovie ? "min-h-[380px] sm:min-h-[480px] aspect-video" : "aspect-video"
            )}>
              <CardContent className={cn("p-0 h-full w-full", isPlayerFullscreen && "static")}>
                {isUserBanned ? (
                  <div className="w-full min-h-[430px] sm:min-h-[500px] flex flex-col items-center justify-center p-5 sm:p-10 text-center bg-[#160d0d] border border-red-500/20 select-none">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#2a1515] border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
                      <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-white mb-3 tracking-tight leading-tight">
                      {isUserPermanentlyBanned ? "Tài Khoản Đang Bị Khóa Vĩnh Viễn" : "Tạm Khóa Quyền Xem Phim"}
                    </h3>
                    <div className="max-w-md w-full mb-4 bg-[#241313] border border-red-500/25 px-4 py-3 rounded-lg text-center">
                      <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
                        <span className="font-bold text-red-400">Lý do: </span>
                        {user?.banReason || "Vi phạm quy định sử dụng hoặc điều khoản của website."}
                      </p>
                    </div>
                    {isUserTemporarilyBanned && user?.bannedUntil && (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-amber-200 bg-[#2b2413] border border-amber-500/25 px-4 py-3 rounded-lg mb-4 w-full max-w-md">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Mở khóa lúc: <strong>{new Date(user.bannedUntil).toLocaleString("vi-VN")}</strong></span>
                        {banRemainingTime && (
                          <span className="text-amber-400 font-mono font-bold bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
                            {banRemainingTime}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-white/60 max-w-sm mb-5 leading-relaxed">
                      Bạn tạm thời không thể tiếp tục phát video. Vui lòng liên hệ Quản trị viên nếu cần hỗ trợ.
                    </p>
                    <Link
                      href="/"
                      className="px-6 py-2.5 rounded-lg bg-[#302020] hover:bg-[#3b2727] text-white text-xs sm:text-sm font-bold transition-colors border border-white/15"
                    >
                      Quay Về Trang Chủ
                    </Link>
                  </div>
                ) : isUnreleasedMovie ? (
                  <UnreleasedMovieOverlay
                    movie={movie}
                    isFavorite={isFav}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ) : playerMode === 'm3u8' ? (
                  <SafePlayerErrorBoundary
                    onReset={() => {
                      setPlayerMode('m3u8');
                      const ep = currentServerData?.[currentEpisodeIndex?.server || 0]?.server_data?.[currentEpisodeIndex?.episode || 0];
                      if (ep?.link_m3u8) setCurrentEpisodeUrl(ep.link_m3u8);
                    }}
                  >
                    <VideoPlayer
                      videoUrl={currentEpisodeUrl}
                      autoplay={true}
                      poster={normalizeImageUrl(movie.thumb_url || movie.poster_url)}
                      initialTime={resumeTime}
                      movieName={movie.name}
                      episodeName={currentServerData?.[currentEpisodeIndex?.server || 0]?.server_data?.[currentEpisodeIndex?.episode || 0]?.name}
                      movieSlug={movie.slug}
                      onProgress={handleProgress}
                      hasNextEpisode={hasNextEpisode()}
                      onNextEpisode={handleNextEpisode}
                      onEnded={handleEnded}
                      onFullscreenChange={setIsPlayerFullscreen}
                      hasAlternativeServer={false}
                      onReportError={() => setShowReportModal(true)}
                    />
                  </SafePlayerErrorBoundary>
                ) : (
                  <EmbedPlayer
                    videoUrl={
                      (currentEpisodeIndex && currentServerData?.[currentEpisodeIndex.server]?.server_data?.[currentEpisodeIndex.episode]?.link_embed) ||
                      (currentEpisodeUrl.includes('.m3u8')
                        ? `https://player.phimapi.com/player/?url=${encodeURIComponent(currentEpisodeUrl)}`
                        : currentEpisodeUrl)
                    }
                    onReportError={() => setShowReportModal(true)}
                    movieName={movie.name}
                    episodeName={currentServerData?.[currentEpisodeIndex?.server || 0]?.server_data?.[currentEpisodeIndex?.episode || 0]?.name}
                    hasAlternativeServer={false}
                  />
                )}
              </CardContent>
            </Card>
          </div>



          {/* Mobile Server Selector & Episode List (Directly after player & toolbar on mobile/tablet) */}
          <div className="w-full lg:hidden">
            <Episode
              serverData={currentServerData}
              currentServerIndex={currentEpisodeIndex?.server || 0}
              currentEpisodeIndex={currentEpisodeIndex?.episode || 0}
              onSelectEpisode={handleSelectEpisode}
              onServerChange={handleServerChange}
              thumb_url={movie.thumb_url}
              playerMode={playerMode}
              onPlayerModeChange={(mode) => setPlayerMode(mode)}
              movieSlug={movie.slug}
              completedEpisodes={completedEpisodes}
              newestEpisodeIndices={newestEpisodeIndices}
            >
              {actionButtons}
            </Episode>
          </div>
        </div>

        {/* Desktop Right Sidebar Episode List */}
        <div className="hidden lg:flex w-full lg:w-[380px] 2xl:w-[420px] shrink-0 flex-col gap-4">
          <Episode
            serverData={currentServerData}
            currentServerIndex={currentEpisodeIndex?.server || 0}
            currentEpisodeIndex={currentEpisodeIndex?.episode || 0}
            onSelectEpisode={handleSelectEpisode}
            onServerChange={handleServerChange}
            thumb_url={movie.thumb_url}
            playerMode={playerMode}
            onPlayerModeChange={(mode) => setPlayerMode(mode)}
            movieSlug={movie.slug}
            completedEpisodes={completedEpisodes}
            newestEpisodeIndices={newestEpisodeIndices}
          >
            {actionButtons}
          </Episode>
        </div>

      </div>

      {/* Broken Episode Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        movieSlug={movie.slug}
        movieName={movie.name}
        episodeName={currentEpName}
        serverName={currentServerData?.[currentEpisodeIndex?.server || 0]?.server_name}
      />
    </div>
  );
}
