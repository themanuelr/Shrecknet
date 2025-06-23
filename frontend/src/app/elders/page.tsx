"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useAgents } from "../lib/useAgents";
import { useWorlds } from "../lib/userWorlds";
import { useTranslation } from "../hooks/useTranslation";
import Image from "next/image";
import Link from "next/link";

export default function EldersPage() {
  const { agents, isLoading } = useAgents();
  const { worlds } = useWorlds();
  const { t } = useTranslation();

  const conversational = agents.filter(a => a.task === "conversational");
  const worldName = (id: number) => worlds.find(w => w.id === id)?.name || "";

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--primary)] mb-2 tracking-tight">
            {t("elders_title")}
          </h1>
          <p className="text-base md:text-lg text-[var(--foreground)]/70 max-w-2xl">
            {t("elders_description")}
          </p>
        </div>
        {isLoading ? (
          <div className="text-center text-lg text-[var(--primary)]">{t("loading_elders")}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {conversational.map(agent => (
              <Link
                href={`/elders/${agent.id}`}
                key={agent.id}
                className="group bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 flex flex-col items-center w-full max-w-[240px] hover:scale-105 hover:border-[var(--primary)]/60 transition"
              >
                <Image
                  src={agent.logo || "/images/default/avatars/logo.png"}
                  alt={agent.name}
                  width={200}
                  height={200}
                  className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-[var(--primary)]"
                />
                <h3 className="text-lg font-bold text-[var(--primary)] text-center mb-1 truncate w-full">
                  {agent.name}
                </h3>
                <p className="text-sm text-[var(--foreground)]/70 mb-1">
                  {worldName(agent.world_id)}
                </p>
                <p className="text-xs text-center text-[var(--foreground)]/60 group-hover:text-[var(--primary)]">
                  {t("speak_with_elder")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
