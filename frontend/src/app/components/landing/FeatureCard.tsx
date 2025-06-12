// FeatureCard.tsx — hero-style, glass, elevated look
"use client";
import { ReactNode } from "react";

export default function FeatureCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div
      className="
        flex flex-col items-center text-center
        px-5 py-6
        rounded-x5
        bg-white/10
        backdrop-blur-lg
        shadow-2xl border border-white/20
        hover:shadow-[0_4px_32px_0_rgba(123,47,242,0.13)]
        transition-all duration-200
        select-none
        animate-fadeIn
      "
      style={{ boxShadow: "0 2px 24px 0 rgba(122, 47, 242, 0.62), 0 2px 6pxrgb(54, 32, 90)" }}
    >
      <div className="mb-3 text-[var(--primary)] scale-110 drop-shadow-lg">{icon}</div>
      <div className="font-bold mb-2 text-lg tracking-wide text-white/95 drop-shadow">{title}</div>
      <div className="text-[15px] text-white/90 leading-relaxed font-medium max-w-[180px] mx-auto">
        {children}
      </div>
    </div>
  );
}
