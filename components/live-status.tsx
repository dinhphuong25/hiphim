"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface LiveStatusProps {
    lastUpdated: Date | null;
    isRefreshing: boolean;
    onRefresh?: () => void;
}

export default function LiveStatus({ lastUpdated, isRefreshing, onRefresh }: LiveStatusProps) {
    const [timeAgo, setTimeAgo] = useState<string>("vừa xong");

    useEffect(() => {
        if (!lastUpdated) return;

        const updateTimeAgo = () => {
            const now = new Date();
            const diff = now.getTime() - lastUpdated.getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);

            if (minutes < 1) {
                setTimeAgo("vừa xong");
            } else if (minutes === 1) {
                setTimeAgo("1 phút trước");
            } else if (minutes < 60) {
                setTimeAgo(`${minutes} phút trước`);
            } else {
                const hours = Math.floor(minutes / 60);
                setTimeAgo(`${hours} giờ trước`);
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [lastUpdated]);

    return (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs text-white/75 shadow-sm transition-all duration-200">
            {isRefreshing ? (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                </span>
            ) : (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green/80 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                </span>
            )}
            <span className="font-medium tracking-tight">
                {isRefreshing ? "Đang đồng bộ..." : `Cập nhật trực tiếp • ${timeAgo}`}
            </span>
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="p-1 -mr-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-40"
                    title="Làm mới phim mới nhất"
                    aria-label="Làm mới dữ liệu"
                >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
                </button>
            )}
        </div>
    );
}

// Floating notification for new updates
interface NewUpdatesNotificationProps {
    hasNewContent: boolean;
    onRefresh: () => void;
}

export function NewUpdatesNotification({ hasNewContent, onRefresh }: NewUpdatesNotificationProps) {
    if (!hasNewContent) return null;

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
            >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Có nội dung mới!</span>
            </button>
        </div>
    );
}

// Auto-refresh countdown indicator
interface RefreshCountdownProps {
    secondsUntilRefresh: number;
}

export function RefreshCountdown({ secondsUntilRefresh }: RefreshCountdownProps) {
    const minutes = Math.floor(secondsUntilRefresh / 60);
    const seconds = secondsUntilRefresh % 60;

    return (
        <div className="text-xs text-gray-500">
            Tự động cập nhật sau: {minutes > 0 ? `${minutes}:` : ""}{seconds.toString().padStart(2, '0')}
        </div>
    );
}
