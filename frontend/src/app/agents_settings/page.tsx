"use client";
import Link from "next/link";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { Bot, BookOpenText, Book, Users2 } from "lucide-react";

const agentTypes = [
  { path: "agent_conversational", label: "Conversationalists", icon: <Bot className="w-8 h-8" /> },
  { path: "agent_writer", label: "Page Writers", icon: <BookOpenText className="w-8 h-8" /> },
  { path: "agent_novelist", label: "Story Novelists", icon: <Book className="w-8 h-8" /> },
  { path: "agent_specialist", label: "Specialists", icon: <Users2 className="w-8 h-8" /> },
];

export default function AgentsSettingsIndex() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div
          className="min-h-screen w-full px-4 py-12 flex flex-col items-center"          
        >
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-extrabold text-[var(--primary)] mb-2 text-center drop-shadow">
              Agent Settings
            </h1>
            <p className="text-md text-[var(--foreground)] mb-8 text-center">
              Manage, personalize, and tune the behavior of each of your AI agents.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {agentTypes.map((t) => (
                <Link
                  key={t.path}
                  href={`/agents_settings/${t.path}`}
                  className="transition-all group flex items-center gap-4 p-6 rounded-2xl bg-[var(--card)] border-2 border-[var(--primary)] shadow-xl hover:scale-105 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 focus-visible:ring-4 focus-visible:ring-[var(--primary)]"
                  style={{ minHeight: 96 }}
                >
                  <div className="rounded-full bg-[var(--primary)]/10 flex items-center justify-center w-14 h-14 border border-[var(--primary)] shadow-inner group-hover:bg-[var(--accent)]/20 transition-all">
                    {t.icon}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[var(--primary)] group-hover:text-[var(--accent)] drop-shadow">
                      {t.label}
                    </div>
                    <div className="text-xs text-[var(--foreground)] opacity-60 mt-1">
                      {getAgentTypeDescription(t.path)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

// Helper for pretty descriptions
function getAgentTypeDescription(type) {
  switch (type) {
    case "agent_conversational":
      return "Chat with your world’s rules, lore, and personalities.";
    case "agent_writer":
      return "Automate and review page creation, linking, and summaries.";
    case "agent_novelist":
      return "Generate adventure hooks, session logs, and dramatic retellings.";
    case "agent_specialist":
      return "Niche agents for specific game mechanics or moderation.";
    default:
      return "";
  }
}
