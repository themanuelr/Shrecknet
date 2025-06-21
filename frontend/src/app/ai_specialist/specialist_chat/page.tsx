"use client";
export const dynamic = "force-dynamic";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef, FormEvent } from "react";
import Image from "next/image";
import { useAuth } from "../../components/auth/AuthProvider";
import { useAgentById } from "../../lib/useAgentById";
import {
  chatWithSpecialist,
  getSpecialistHistory,
} from "../../lib/specialistAPI";
import type { ChatMessage } from "../../lib/specialistAPI";

function SpecialistChatPageContent() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const agentId = parseInt(searchParams.get("agent") || "0");
  const { agent } = useAgentById(agentId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentId) return;
    getSpecialistHistory(agentId, token || "")
      .then(msgs => setMessages(msgs as ChatMessage[]))
      .catch(() => setMessages([]));
  }, [agentId, token]);

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !agentId) return;
    const newMsg: ChatMessage = { role: "user", content: input.trim() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    scrollToBottom();
    setLoading(true);
    setMessages(m => [...m, { role: "assistant", content: "" }]);
    try {
      const { answer, sources } = await chatWithSpecialist(agentId, updated, token || "");
      setMessages(m => {
        const arr = [...m];
        arr[arr.length - 1] = { role: "assistant", content: answer, sources };
        return arr;
      });
      scrollToBottom();
    } catch {
      setMessages(m => [...m.slice(0, -1), { role: "assistant", content: "Sorry, something went wrong." }]);
    }
    setLoading(false);
  }

  function renderMessageContent(msg: ChatMessage) {
    return (
      <>
        <span dangerouslySetInnerHTML={{ __html: msg.content }} />
        {msg.sources && msg.sources.length > 0 && (
          <ul className="mt-1 text-xs text-purple-700">
            {msg.sources.map((s, i) => (
              <li key={i}>📖 {s.name}</li>
            ))}
          </ul>
        )}
      </>
    );
  }

  if (!agentId) {
    return <div className="p-10 text-lg text-center">No specialist selected</div>;
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full flex flex-col items-center text-indigo-900 px-2 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            {agent?.logo && (
              <Image src={agent.logo} alt={agent.name} width={48} height={48} className="w-12 h-12 rounded-full border" />
            )}
            <h2 className="text-2xl font-bold">{agent?.name || "Specialist"}</h2>
          </div>
          <div className="w-full max-w-2xl flex flex-col flex-1 border border-indigo-200 rounded-2xl bg-white/80 shadow p-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-2">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && agent?.logo && (
                    <Image src={agent.logo} alt="agent" width={32} height={32} className="w-8 h-8 rounded-full mr-2" />
                  )}
                  <div className={`${m.role === "user" ? "bg-fuchsia-600 text-white" : "bg-purple-50 text-purple-900"} rounded-xl px-3 py-2 shadow max-w-[80%]`}>
                    {renderMessageContent(m)}
                  </div>
                  {m.role === "user" && user?.image_url && (
                    <Image src={user.image_url} alt="me" width={32} height={32} className="w-8 h-8 rounded-full ml-2" />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-indigo-300 p-2 bg-white text-indigo-900"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function SpecialistChatPage() {
  return (
    <Suspense>
      <SpecialistChatPageContent />
    </Suspense>
  );
}
