"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Server, Film, Info } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EpisodeData {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

interface ServerData {
  server_name: string;
  server_data: EpisodeData[];
}

interface EpisodeProps {
  serverData: ServerData[];
  currentServerIndex: number;
  currentEpisodeIndex: number;
  onSelectEpisode: (
    link: string,
    serverIndex: number,
    episodeIndex: number
  ) => void;
  onServerChange: (serverIndex: number) => void;
  thumb_url?: string;
  playerMode: "m3u8" | "embed";
  onPlayerModeChange: (mode: "m3u8" | "embed") => void;
  movieSlug?: string;
  completedEpisodes?: Record<number, boolean>;
  newestEpisodeIndices?: Record<number, boolean>;
  children?: React.ReactNode;
}

const ITEMS_PER_RANGE = 50;

export default function Episode({
  serverData,
  currentServerIndex,
  currentEpisodeIndex,
  onSelectEpisode,
  onServerChange,
  playerMode,
  onPlayerModeChange,
  movieSlug,
  completedEpisodes,
  newestEpisodeIndices,
  children,
}: EpisodeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRangeIndex, setActiveRangeIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Automatically sync range tab when currentEpisodeIndex changes (hotkeys, next episode, or direct click)
  useEffect(() => {
    const requiredRange = Math.floor(currentEpisodeIndex / ITEMS_PER_RANGE);
    setActiveRangeIndex(requiredRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisodeIndex]);

  const handleServerChange = (index: number, mode: "m3u8" | "embed" = playerMode) => {
    const epIndex = currentServerIndex === index ? currentEpisodeIndex : 0;
    const targetEpisode = serverData[index]?.server_data?.[epIndex] || serverData[index]?.server_data?.[0];
    if (targetEpisode) {
      const hasM3u8 = Boolean(targetEpisode.link_m3u8 && targetEpisode.link_m3u8.trim() !== "");
      const hasEmbed = Boolean(targetEpisode.link_embed && targetEpisode.link_embed.trim() !== "");

      let effectiveMode: "m3u8" | "embed" = mode;
      let targetLink = "";

      if (effectiveMode === "m3u8") {
        if (hasM3u8) {
          targetLink = targetEpisode.link_m3u8;
        } else if (hasEmbed) {
          effectiveMode = "embed";
          targetLink = targetEpisode.link_embed;
        }
      } else {
        if (hasEmbed) {
          targetLink = targetEpisode.link_embed;
        } else if (hasM3u8) {
          effectiveMode = "m3u8";
          targetLink = targetEpisode.link_m3u8;
        }
      }

      onPlayerModeChange(effectiveMode);
      if (targetLink) {
        onSelectEpisode(targetLink, index, epIndex);
      }
    }
    onServerChange(index);
  };

  const currentServer = serverData?.[currentServerIndex];
  const allEpisodes = useMemo(() => currentServer?.server_data || [], [currentServer]);

  // Sort episodes logically
  const sortedEpisodes = useMemo(() => {
    return [...allEpisodes]
      .map((ep) => {
        const originalIndex = allEpisodes.findIndex((e) => e.name === ep.name);
        return { ...ep, originalIndex };
      })
      .sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || "0") || 0;
        const numB = parseInt(b.name.match(/\d+/)?.[0] || "0") || 0;
        return numA - numB;
      });
  }, [allEpisodes]);

  // Episode Range Tabs (e.g. 1-50, 51-100)
  const totalRanges = Math.ceil(sortedEpisodes.length / ITEMS_PER_RANGE);

  // Filtered episodes based on search or active range
  const displayedEpisodes = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return sortedEpisodes.filter(
        (ep) =>
          ep.name.toLowerCase().includes(query) ||
          ep.slug.toLowerCase().includes(query)
      );
    }
    const start = activeRangeIndex * ITEMS_PER_RANGE;
    return sortedEpisodes.slice(start, start + ITEMS_PER_RANGE);
  }, [sortedEpisodes, searchQuery, activeRangeIndex]);

  const handleEpisodeChange = (
    link: string,
    serverIndex: number,
    episodeIndex: number
  ) => {
    onSelectEpisode(link, serverIndex, episodeIndex);
  };

  if (!serverData || serverData.length === 0) {
    return (
      <div className="w-full p-4 text-center text-white/50">
        Không có tập phim nào
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-[#0b0e0c]/90 backdrop-blur-md rounded-2xl border border-white/[0.05] p-5 flex flex-col gap-5 relative shadow-lg">
        {/* Máy Chủ Phát Section */}
        <div className="space-y-3 min-w-0 z-10 relative">
          <h4 className="text-white/80 text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
            <Server className="w-3.5 h-3.5 text-brand-green shrink-0" />
            Máy chủ phát
          </h4>

          {/* Grid of Server Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {serverData.flatMap((server, index) => {
              const ep = server.server_data?.[0];
              const hasM3u8 = Boolean(ep?.link_m3u8 && ep.link_m3u8.trim() !== "");
              const hasEmbed = Boolean(ep?.link_embed && ep.link_embed.trim() !== "");

              const buttons = [];

              if (hasM3u8 || !hasEmbed) {
                buttons.push(
                  <button
                    key={`${index}-m3u8`}
                    onClick={() => {
                      onPlayerModeChange("m3u8");
                      handleServerChange(index, "m3u8");
                    }}
                    className={cn(
                      "w-full py-2.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all border cursor-pointer",
                      currentServerIndex === index && playerMode === "m3u8"
                        ? "bg-brand-green/[0.12] text-brand-green border-brand-green/35 shadow-[0_0_12px_rgba(32,214,107,0.15)]"
                        : "bg-white/[0.04] text-white/90 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[13.5px] leading-tight",
                        currentServerIndex === index && playerMode === "m3u8"
                          ? "text-brand-green font-black"
                          : "text-white font-bold"
                      )}
                    >
                      {server.server_name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-extrabold tracking-wider",
                        currentServerIndex === index && playerMode === "m3u8"
                          ? "text-brand-green/80"
                          : "text-white/60"
                      )}
                    >
                      Mặc định
                    </span>
                  </button>
                );
              }

              if (hasEmbed || !hasM3u8) {
                buttons.push(
                  <button
                    key={`${index}-embed`}
                    onClick={() => {
                      onPlayerModeChange("embed");
                      handleServerChange(index, "embed");
                    }}
                    className={cn(
                      "w-full py-2.5 px-2 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all border cursor-pointer",
                      currentServerIndex === index && playerMode === "embed"
                        ? "bg-brand-green/[0.12] text-brand-green border-brand-green/35 shadow-[0_0_12px_rgba(32,214,107,0.15)]"
                        : "bg-white/[0.04] text-white/90 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[13.5px] leading-tight",
                        currentServerIndex === index && playerMode === "embed"
                          ? "text-brand-green font-black"
                          : "text-white font-bold"
                      )}
                    >
                      {server.server_name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-extrabold tracking-wider",
                        currentServerIndex === index && playerMode === "embed"
                          ? "text-brand-green/80"
                          : "text-white/60"
                      )}
                    >
                      Dự phòng
                    </span>
                  </button>
                );
              }

              return buttons;
            })}
          </div>
        </div>

        {/* Divider between Server and Episode List */}
        <div className="h-[1px] bg-white/[0.08] w-full" />

        {/* Danh Sách Tập Section (Replacing Phím tắt) */}
        <div className="flex flex-col gap-3.5 min-w-0 z-10 relative">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-white/80 text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
              <Film className="w-3.5 h-3.5 text-brand-green shrink-0" />
              Danh sách tập
            </h4>
            <span className="text-white/70 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-white/[0.06] rounded-full border border-white/10">
              {allEpisodes.length === 1 && !allEpisodes[0]?.name?.trim() && !allEpisodes[0]?.link_m3u8 && !allEpisodes[0]?.link_embed ? "Trailer" : `${allEpisodes.length} tập`}
            </span>
          </div>

          {/* Search input for quick episode lookup */}
          {allEpisodes.length > 8 && (
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <Input
                type="text"
                placeholder="Tìm tập phim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 h-8 bg-white/[0.04] border-white/10 text-xs font-semibold text-white placeholder:text-white/40 rounded-xl focus:border-brand-green/40 focus:ring-brand-green/20"
              />
            </div>
          )}

          {/* Range Tabs for large series (50+ episodes) */}
          {totalRanges > 1 && !searchQuery && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
              {Array.from({ length: totalRanges }).map((_, rIdx) => {
                const startEp = rIdx * ITEMS_PER_RANGE + 1;
                const endEp = Math.min((rIdx + 1) * ITEMS_PER_RANGE, sortedEpisodes.length);
                const isSelected = rIdx === activeRangeIndex;

                return (
                  <button
                    key={rIdx}
                    onClick={() => setActiveRangeIndex(rIdx)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-extrabold rounded-lg border transition-all shrink-0",
                      isSelected
                        ? "bg-brand-green/[0.15] text-brand-green border-brand-green/35 shadow-sm"
                        : "bg-white/[0.04] text-white/80 border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    Tập {startEp}-{endEp}
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid of Episodes */}
          <div className="w-full">
            {displayedEpisodes.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 w-full">
                {displayedEpisodes.map((episode) => {
                  const originalIndex = episode.originalIndex;
                  const isActive = originalIndex === currentEpisodeIndex;

                  const isWatched = mounted && Boolean(completedEpisodes?.[originalIndex]);
                  const isNew = Boolean(newestEpisodeIndices?.[originalIndex]);
                  const rawEpName = episode.name?.trim();
                  const epDisplayName = rawEpName
                    ? rawEpName.replace(/(\d+)/g, (match) => String(parseInt(match, 10)))
                    : (allEpisodes.length === 1 ? "Trailer" : `Tập ${originalIndex + 1}`);

                  return (
                    <button
                      key={`${currentServerIndex}-${originalIndex}`}
                      onClick={() => {
                        const hasM3u8 = Boolean(episode.link_m3u8 && episode.link_m3u8.trim() !== "");
                        const hasEmbed = Boolean(episode.link_embed && episode.link_embed.trim() !== "");
                        let targetLink = "";

                        if (playerMode === "m3u8") {
                          if (hasM3u8) {
                            targetLink = episode.link_m3u8;
                          } else if (hasEmbed) {
                            onPlayerModeChange("embed");
                            targetLink = episode.link_embed;
                          }
                        } else {
                          if (hasEmbed) {
                            targetLink = episode.link_embed;
                          } else if (hasM3u8) {
                            onPlayerModeChange("m3u8");
                            targetLink = episode.link_m3u8;
                          }
                        }

                        if (targetLink) {
                          handleEpisodeChange(targetLink, currentServerIndex, originalIndex);
                        }
                      }}
                      className={cn(
                        "relative flex h-10 w-full items-center justify-center px-2 py-1.5 rounded-xl transition-all border group text-center",
                        isActive
                          ? "bg-brand-green/[0.15] text-brand-green border-brand-green/40 font-black shadow-[0_0_12px_rgba(32,214,107,0.18)]"
                          : isNew
                          ? "bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15 font-bold"
                          : isWatched
                          ? "bg-white/[0.02] text-brand-green/80 border-brand-green/20 hover:bg-white/[0.05] font-bold"
                          : "bg-white/[0.04] text-white/90 border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 hover:text-white font-bold"
                      )}
                      title={epDisplayName}
                    >
                      {/* Equalizer Playing Indicator for active episode */}
                      {isActive ? (
                        <div className="absolute top-1 right-1 flex items-end gap-[1.5px] h-2.5 opacity-90">
                          <span className="w-[1.5px] h-full bg-brand-green rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-[1.5px] h-full bg-brand-green rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-[1.5px] h-full bg-brand-green rounded-full animate-bounce" />
                        </div>
                      ) : isNew ? (
                        <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-emerald-500 text-black text-[7.5px] font-black rounded-full uppercase tracking-wider z-10">
                          MỚI
                        </span>
                      ) : isWatched ? (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand-green/20 border border-brand-green/40 text-brand-green rounded-full flex items-center justify-center text-[8px] font-black z-10">
                          ✓
                        </div>
                      ) : null}

                      <span
                        className={cn(
                          "font-extrabold text-xs leading-tight truncate w-full text-center transition-colors duration-200",
                          isActive
                            ? "text-brand-green font-black"
                            : isWatched
                            ? "text-brand-green/90 font-bold"
                            : "text-white/90 group-hover:text-white font-bold"
                        )}
                      >
                        {epDisplayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="col-span-full text-center py-6 text-white/60 font-semibold border border-dashed border-white/10 rounded-xl">
                <p className="text-xs">Không tìm thấy tập phù hợp</p>
              </div>
            )}
          </div>
        </div>

        {/* Action under episode list */}
        {children && (
          <div className="pt-2.5 border-t border-white/5 flex justify-center">
            {children}
          </div>
        )}

        {/* Ad Notice / Disclaimer */}
        <div className="pt-2.5 border-t border-white/[0.06] flex items-start gap-2 select-none">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-[11.5px] font-normal text-zinc-400/80 leading-relaxed text-justify">
            Quảng cáo trong video được nhúng cố định từ nguồn phát gốc. Đội ngũ kỹ thuật đã nỗ lực can thiệp để che chắn tối đa, rất mong mọi người thông cảm cho sự bất tiện này.
          </p>
        </div>
      </div>
    </div>
  );
}

// Keep export for backwards compatibility
export { Episode as EpisodeList };
