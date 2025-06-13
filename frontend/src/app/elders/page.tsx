"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useAgents } from "../lib/useAgents";
import { useWorlds } from "../lib/userWorlds";
import Image from "next/image";
import Link from "next/link";

export default function EldersPage() {
  const { agents, isLoading } = useAgents();
  const { worlds } = useWorlds();

  const conversational = agents.filter(a => a.task === "conversational");
  const worldName = (id: number) => worlds.find(w => w.id === id)?.name || "";

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[var(--primary)] mb-2 tracking-tight">
            The Elders
          </h1>
          <p className="text-base md:text-lg text-[var(--foreground)]/70 max-w-2xl">
            Step into the council chamber of Shrecknet and meet its wisest beings. Each Elder guards the lore of a unique world and is eager to share their knowledge with you.
          </p>
        </div>
        {isLoading ? (
          <div className="text-center text-lg text-[var(--primary)]">Loading elders...</div>
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
                  Speak with this Elder
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
