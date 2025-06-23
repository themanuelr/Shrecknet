"use client";
import { useTranslation } from "../hooks/useTranslation";
import { MdTranslate } from "react-icons/md";

export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={`relative ${className}`}>
      <MdTranslate
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/80 pointer-events-none"
        size={20}
      />
      <select
        className="appearance-none pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-variant)] text-[var(--foreground)] border border-[var(--primary)]/70 focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] font-semibold text-sm"
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
        aria-label="Select language"
      >
        <option value="en">EN</option>
        <option value="pt">PT</option>
        <option value="it">IT</option>
      </select>
    </div>
  );
}
