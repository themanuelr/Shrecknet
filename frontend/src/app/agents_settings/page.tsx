"use client";
import Link from "next/link";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { Bot, BookOpenText, Book, Users2 } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

const agentTypes = [
  { path: "agent_conversational", labelKey: "conversationalists", icon: <Bot className="w-8 h-8" /> },
  { path: "agent_writer", labelKey: "page_writers", icon: <BookOpenText className="w-8 h-8" /> },
  { path: "agent_novelist", labelKey: "story_novelists", icon: <Book className="w-8 h-8" /> },
  { path: "agent_specialist", labelKey: "specialists", icon: <Users2 className="w-8 h-8" /> },
];

export default function AgentsSettingsIndex() {
  const { t } = useTranslation();
  return (
    <AuthGuard>
      <DashboardLayout>
        <div
          className="min-h-screen w-full px-4 py-12 flex flex-col items-center"          
        >
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-extrabold text-[var(--primary)] mb-2 text-center drop-shadow">
              {t('agent_settings')}
            </h1>
            <p className="text-md text-[var(--foreground)] mb-8 text-center">
              {t('agent_settings_desc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {agentTypes.map((obj) => (
                <Link
                  key={obj.path}
                  href={`/agents_settings/${obj.path}`}
                  className="transition-all group flex items-center gap-4 p-6 rounded-2xl bg-[var(--card)] border-2 border-[var(--primary)] shadow-xl hover:scale-105 hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 focus-visible:ring-4 focus-visible:ring-[var(--primary)]"
                  style={{ minHeight: 96 }}
                >
                  <div className="rounded-full bg-[var(--primary)]/10 flex items-center justify-center w-14 h-14 border border-[var(--primary)] shadow-inner group-hover:bg-[var(--accent)]/20 transition-all">
                    {obj.icon}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-[var(--primary)] group-hover:text-[var(--accent)] drop-shadow">
                      {t(obj.labelKey)}
                    </div>
                    <div className="text-xs text-[var(--foreground)] opacity-60 mt-1">
                      {getAgentTypeDescription(obj.path, t)}
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
function getAgentTypeDescription(type: string, t: (key: string) => string) {
  switch (type) {
    case "agent_conversational":
      return t('desc_agent_conversational');
    case "agent_writer":
      return t('desc_agent_writer');
    case "agent_novelist":
      return t('desc_agent_novelist');
    case "agent_specialist":
      return t('desc_agent_specialist');
    default:
      return "";
  }
}
