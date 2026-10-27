"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    const isInputOrAdmin = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || Boolean(target?.isContentEditable);
      const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      return isInput || isAdmin;
    };

    // 1. Chặn click chuột phải (Context Menu) - Cho phép trong input và trang Admin
    const handleContextMenu = (e: MouseEvent) => {
      if (isInputOrAdmin(e)) return;
      e.preventDefault();
    };

    // Chặn Copy / Cut - Cho phép trong input và trang Admin
    const handleCopy = (e: ClipboardEvent) => {
      if (isInputOrAdmin(e)) return;
      e.preventDefault();
    };

    // 2. Chặn các phím bộ công cụ Developer Tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+U / Cmd+U (View Source Code)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u" || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Chặn Ctrl+S / Cmd+S (Save Webpage / Video)
      if ((e.ctrlKey || e.metaKey) && (e.key === "S" || e.key === "s" || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Chặn Ctrl+P / Cmd+P (Print / PDF Extract)
      if ((e.ctrlKey || e.metaKey) && (e.key === "P" || e.key === "p" || e.keyCode === 80)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3. Chặn thao tác Drag & Drop mọi thứ
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. In cảnh báo Console & Thông cáo bản quyền sở hữu trí tuệ
    const runConsoleWarning = () => {
      try {
        console.log(
          "%c🎬 HI PHIM - THÔNG CÁO BẢN QUYỀN & SỞ HỮU TRÍ TUỆ",
          "color: #22c55e; font-size: 20px; font-weight: 900; padding: 8px; background: #000; border: 2px solid #22c55e; border-radius: 6px;"
        );
        console.log(
          "%c© 2025 - 2026 Bản quyền tác giả & Quyền sở hữu trí tuệ thuộc về: Kim Đình Phương.\nNghiêm cấm mọi hành vi sao chép, trích xuất, đảo ngược mã nguồn (reverse engineering) hoặc sử dụng trái phép khi chưa có sự đồng ý bằng văn bản của tác giả.",
          "color: #94a3b8; font-size: 13px; font-weight: bold; line-height: 1.6;"
        );
        console.log(
          "%cDừng lại!",
          "color: red; font-size: 40px; font-weight: bold; text-shadow: 2px 2px 0 #000;"
        );
        console.log(
          "%cĐây là tính năng dành cho nhà phát triển. Nếu ai đó bảo bạn sao chép đoạn mã vào đây để 'bật tính năng' hoặc 'hack', thì đó là lừa đảo có thể làm lộ thông tin của bạn.",
          "font-size: 14px; color: #ef4444;"
        );
      } catch {}
    };

    runConsoleWarning();

    // 5. Chặn triệt để và triệt tiêu tiện ích download bên ngoài (IDM, Cốc Cốc, FetchV, CocoCut...)
    const isDownloaderElement = (el: HTMLElement) => {
      const id = (el.id || "").toLowerCase();
      const cls = typeof el.className === "string" ? el.className.toLowerCase() : "";
      return (
        id.includes("idm") ||
        id.includes("coccoc") ||
        id.includes("download-helper") ||
        id.includes("fetchv") ||
        id.includes("cococut") ||
        cls.includes("idm") ||
        cls.includes("coccoc") ||
        cls.includes("download-helper") ||
        cls.includes("fetchv") ||
        cls.includes("cococut")
      );
    };

    const purgeDownloaderElements = () => {
      try {
        const suspicious = document.querySelectorAll(
          '#__idm_frm__, #__idm_rpc__, #idm_net_panel, #idm_net_panel_bar, .idm_net_panel, [id*="idm_net_panel"], [class*="idm_net_panel"], [id^="__idm_"], div[id^="idm_"], iframe[id^="__idm_"], .coccoc-video-downloader, [class*="coccoc-download"], [id*="coccoc-download"], [class*="video-download-helper"], [class*="fetchv-"], [class*="cococut-"]'
        );
        suspicious.forEach((node) => {
          try {
            node.remove();
          } catch {
            (node as HTMLElement).style.setProperty("display", "none", "important");
            (node as HTMLElement).style.setProperty("visibility", "hidden", "important");
            (node as HTMLElement).style.setProperty("pointer-events", "none", "important");
          }
        });
      } catch {}
    };

    purgeDownloaderElements();

    const domObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === 1) {
              const el = node as HTMLElement;
              if (isDownloaderElement(el)) {
                try {
                  el.remove();
                } catch {
                  el.style.setProperty("display", "none", "important");
                  el.style.setProperty("visibility", "hidden", "important");
                  el.style.setProperty("pointer-events", "none", "important");
                }
              }
            }
          }
        }
      }
    });

    try {
      domObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch {}

    const intervalTimer = setInterval(purgeDownloaderElements, 1200);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);

    return () => {
      domObserver.disconnect();
      clearInterval(intervalTimer);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
    };
  }, []);

  return null;
}
