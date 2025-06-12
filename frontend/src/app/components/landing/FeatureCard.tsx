"use client";
import { ReactNode } from "react";

export default function FeatureCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-[var(--surface)]/70 backdrop-blur-md shadow-xl border border-[var(--border)] hover:shadow-2xl transition-all">
      <div className="mb-3 text-[var(--primary)]">{icon}</div>
      <div className="font-semibold mb-2 text-lg">{title}</div>
      <div className="text-sm text-[var(--foreground)]/80">{children}</div>
    </div>
  );
}
