"use client";

import React, { useEffect } from "react";
import { Lock, LucideIcon, ArrowRight, UserPlus } from "lucide-react";
import { useUserAuth } from "@/context/user-auth-context";

interface AuthGateProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function AuthGate({ title, description, icon: Icon }: AuthGateProps) {
  const { openAuthModal } = useUserAuth();

  return (
    <div className="w-full max-w-lg lg:max-w-xl mx-auto py-8 sm:py-16 px-4 text-center select-none animate-in fade-in zoom-in-95 duration-300">
      {/* Icon Badge */}
      <div className="relative inline-flex items-center justify-center mb-5 sm:mb-6">
        <div className="absolute inset-0 rounded-2xl bg-brand-green/15 blur-xl scale-125 pointer-events-none" />
        <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-[#121915] border border-brand-green/30 flex items-center justify-center text-brand-green shadow-[0_0_30px_rgba(32,214,107,0.2)]">
          <Icon className="w-7 h-7 sm:w-9 sm:h-9 stroke-[1.8]" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-brand-green text-cinema-bg flex items-center justify-center shadow-md border-2 border-[#121915]">
            <Lock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Text Info */}
      <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-2 sm:mb-3 leading-snug px-2">
        {title}
      </h2>
      <p className="text-[13px] sm:text-base text-white/60 leading-relaxed max-w-md mx-auto mb-6 sm:mb-8 font-normal px-2">
        {description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 max-w-[340px] sm:max-w-none mx-auto">
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="flex-1 sm:flex-none h-10 sm:h-11 px-2 sm:px-7 rounded-xl bg-brand-green hover:bg-brand-green-hover text-cinema-bg font-bold text-[13px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(32,214,107,0.25)] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <span>Đăng nhập</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          type="button"
          onClick={() => openAuthModal("register")}
          className="flex-1 sm:flex-none h-10 sm:h-11 px-2 sm:px-7 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-brand-green/40 text-white/90 font-semibold text-[13px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green/80" />
          <span>Tạo tài khoản</span>
        </button>
      </div>
    </div>
  );
}

