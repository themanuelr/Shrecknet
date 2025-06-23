"use client";
import DashboardWorlds from "../components/worlds/DashboardWorlds";
import DashboardLayout from "../components/DashboardLayout";
import { useTranslation } from "../hooks/useTranslation";

export default function WorldsPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-10">
        {/* Splash/Hero */}
        <div className="flex flex-col items-center mb-8">          
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--primary)] text-center mb-2 tracking-tight">
            {t("explore_worlds_title")}
          </h1>
          <p className="text-base md:text-lg text-[var(--foreground)]/70 text-center max-w-2xl">
            {t("explore_worlds_desc")}
          </p>
        </div>

        {/* Action bar is handled INSIDE DashboardWorlds (no duplicate logic here) */}

        <DashboardWorlds />

        {/* No modals, no hidden buttons, no state here! */}
      </div>
    </DashboardLayout>
  );
}
