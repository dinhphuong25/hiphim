"use client";

import { ReactNode } from "react";

interface SmoothTransitionProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export default function SmoothTransition({
  children,
  delay = 0,
  duration = 500,
}: SmoothTransitionProps) {
  return (
    <>
      <div
        className="animate-fade-in"
        style={{
          animationDelay: `${delay}ms`,
          animationDuration: `${duration}ms`,
        } as any}
      >
        {children}
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in forwards ease-out;
        }
      `}</style>
    </>
  );
}
