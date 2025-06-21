"use client";
import Link from "next/link";
import AuthGuard from "../components/auth/AuthGuard";
import DashboardLayout from "../components/DashboardLayout";
import { Bot, BookOpenText, Book, Users2 } from "lucide-react";

const agentTypes = [
  {
    path: "agent_conversational",
    label: "Conversationalists",
    icon: <Bot className="w-6 h-6" />,
  },
  {
    path: "agent_writers",
    label: "Page Writers",
    icon: <BookOpenText className="w-6 h-6" />,
  },
  {
    path: "agent_novelist",
    label: "Story Novelists",
    icon: <Book className="w-6 h-6" />,
  },
  {
    path: "agent_specialists",
    label: "Specialists",
    icon: <Users2 className="w-6 h-6" />,
  },
];

export default function AgentsSettingsIndex() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full text-indigo-900 px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Agent Settings</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
            {agentTypes.map((t) => (
              <Link
                key={t.path}
                href={`/agents_settings/${t.path}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-indigo-200 shadow hover:bg-indigo-50"
              >
                {t.icon}
                <span className="font-semibold text-indigo-800">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
