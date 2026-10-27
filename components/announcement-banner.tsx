"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, AlertTriangle, CheckCircle2, X, ExternalLink, ArrowRight } from "lucide-react";

export interface AnnouncementData {
  enabled: boolean;
  text: string;
  link?: string;
  type: "info" | "warning" | "success";
}

interface AnnouncementBannerProps {
  initialAnnouncement?: AnnouncementData;
}

export default function AnnouncementBanner({ initialAnnouncement }: AnnouncementBannerProps) {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<AnnouncementData | undefined>(initialAnnouncement);
  const [dismissed, setDismissed] = useState(true); // Default true to avoid SSR hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // If initialAnnouncement is provided, check dismissal
    if (initialAnnouncement && initialAnnouncement.enabled && initialAnnouncement.text.trim()) {
      const dismissedText = localStorage.getItem("hiphim_dismissed_announcement");
      if (dismissedText === initialAnnouncement.text.trim()) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
      setAnnouncement(initialAnnouncement);
    } else {
      // Fallback: fetch client-side if not supplied or disabled
      fetchAnnouncement();
    }
  }, [initialAnnouncement]);

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch("/api/announcement", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.announcement && data.announcement.enabled && data.announcement.text.trim()) {
          const dismissedText = localStorage.getItem("hiphim_dismissed_announcement");
          if (dismissedText !== data.announcement.text.trim()) {
            setAnnouncement(data.announcement);
            setDismissed(false);
          }
        }
      }
    } catch {
      // Silent fail
    }
  };

  const handleDismiss = () => {
    if (announcement?.text) {
      localStorage.setItem("hiphim_dismissed_announcement", announcement.text.trim());
    }
    setDismissed(true);
  };

  if (pathname?.startsWith("/admin") || !mounted || dismissed || !announcement || !announcement.enabled || !announcement.text.trim()) {
    return null;
  }

  const typeConfig = {
    warning: {
      bg: "bg-gradient-to-r from-amber-950/90 via-zinc-950/95 to-amber-950/90 border-amber-500/30 text-amber-100",
      badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />,
      label: "LƯU Ý",
      btn: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30",
    },
    success: {
      bg: "bg-gradient-to-r from-emerald-950/90 via-zinc-950/95 to-teal-950/90 border-emerald-500/30 text-emerald-100",
      badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      label: "THÔNG BÁO",
      btn: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30",
    },
    info: {
      bg: "bg-gradient-to-r from-zinc-900/95 via-[#0c1813]/95 to-zinc-900/95 border-emerald-500/25 text-zinc-100",
      badge: "bg-brand-green/20 text-brand-green border-brand-green/30",
      icon: <Megaphone className="w-4 h-4 text-brand-green shrink-0 animate-bounce" />,
      label: "TIN MỚI",
      btn: "bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border-brand-green/30",
    },
  }[announcement.type || "info"];

  const hasLink = Boolean(announcement.link && announcement.link.trim());
  const isExternal = hasLink && (announcement.link!.startsWith("http://") || announcement.link!.startsWith("https://"));

  return (
    <aside
      aria-label="Thông báo hệ thống"
      className={`relative z-[95] w-full border-b px-4 py-2.5 sm:py-2 transition-colors duration-300 shadow-lg ${typeConfig.bg}`}
    >
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Left / Center: Icon + Badge + Text */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {typeConfig.icon}
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeConfig.badge}`}
            >
              {typeConfig.label}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed truncate sm:whitespace-normal">
            {announcement.text}
          </p>
        </div>

        {/* Right: Action Link & Close */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {hasLink && (
            isExternal ? (
              <a
                href={announcement.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${typeConfig.btn}`}
              >
                <span>Xem ngay</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <Link
                href={announcement.link!}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${typeConfig.btn}`}
              >
                <span>Xem ngay</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )
          )}

          <button
            onClick={handleDismiss}
            aria-label="Đóng thông báo"
            className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
