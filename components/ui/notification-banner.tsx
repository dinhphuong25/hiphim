"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";

export default function NotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    
    // Only show banner if user hasn't dismissed it and hasn't decided yet
    const wasDismissed = localStorage.getItem("notif_banner_dismissed");
    if (!wasDismissed && Notification.permission === "default") {
      setDismissed(false);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        // Register for push if granted
        showTestNotification();
      }
      setDismissed(true);
      localStorage.setItem("notif_banner_dismissed", "true");
    } catch {
      setDismissed(true);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("notif_banner_dismissed", "true");
  };

  const showTestNotification = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("🎬 Hi Phim", {
          body: "Bạn sẽ nhận được thông báo khi có phim mới cập nhật!",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "welcome",
        });
      });
    }
  };

  if (dismissed || permission === "unsupported" || permission === "granted") return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-1">Bật thông báo phim mới?</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Nhận thông báo ngay khi có phim mới cập nhật, không bỏ lỡ bộ phim nào!
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={requestPermission}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-black text-xs font-bold rounded-full hover:bg-primary/90 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                Bật ngay
              </button>
              <button
                onClick={dismiss}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 text-white/60 text-xs font-medium rounded-full hover:bg-white/10 transition-all"
              >
                <BellOff className="w-3.5 h-3.5" />
                Để sau
              </button>
            </div>
          </div>
          <button onClick={dismiss} aria-label="Đóng thông báo" className="text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
