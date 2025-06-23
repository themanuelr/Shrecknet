"use client";
import { useTranslation } from "../hooks/useTranslation";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  return (
    <select
      className="absolute top-2 right-2 z-50 px-2 py-1 rounded-md text-black"
      value={locale}
      onChange={(e) => setLocale(e.target.value as any)}
    >
      <option value="en">English</option>
      <option value="pt">Português</option>
      <option value="it">Italiano</option>
    </select>
  );
}
