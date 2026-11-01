"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkPosition = () => {
      const isScrolled = window.scrollY > 350;
      setVisible(isScrolled);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkPosition);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    checkPosition();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      title="Cuộn lên đầu trang"
      className={cn(
        "fixed right-5 sm:right-7 bottom-24 lg:bottom-10 z-40 p-3 rounded-full",
        "bg-brand-green text-black font-extrabold shadow-[0_4px_20px_rgba(32,214,107,0.45)]",
        "hover:bg-[#2ae074] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer",
        "border border-white/20 animate-in fade-in zoom-in-90 duration-200"
      )}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.8]" />
    </button>
  );
}

export { ScrollToTop as ScrollToTopFAB };
