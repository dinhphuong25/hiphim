"use client";

import { useEffect } from "react";

/**
 * Speculation Rules API - Tối ưu hóa tốc độ phản hồi 0ms (Prerendering)
 * Công nghệ này giúp trình duyệt tải trước và dựng sẵn trang khi người dùng hover vào link.
 */
export default function SpeculationRules() {
  useEffect(() => {
    // Kiểm tra xem trình duyệt có hỗ trợ Speculation Rules không
    if (
      typeof HTMLScriptElement !== "undefined" &&
      HTMLScriptElement.supports &&
      HTMLScriptElement.supports("speculationrules")
    ) {
      const specScript = document.createElement("script");
      specScript.type = "speculationrules";
      
      // Định nghĩa các quy tắc: Prerender tức thì 0ms cho các tab chính và trang phim
      const rules = {
        prerender: [
          {
            source: "list",
            urls: ["/", "/recently", "/favorites"],
            eagerness: "eager"
          },
          {
            source: "document",
            where: {
              or: [
                { href_matches: "/phim/*" },
                { href_matches: "/watch\\?slug=*" }
              ]
            },
            eagerness: "moderate"
          }
        ],
        prefetch: [
          {
            source: "list",
            urls: ["/", "/recently", "/favorites"],
            eagerness: "eager"
          },
          {
            source: "document",
            where: {
              or: [
                { href_matches: "/phim/*" },
                { href_matches: "/watch\\?slug=*" }
              ]
            },
            eagerness: "moderate"
          }
        ]
      };

      specScript.textContent = JSON.stringify(rules);
      document.head.appendChild(specScript);
    }
  }, []);

  return null;
}
