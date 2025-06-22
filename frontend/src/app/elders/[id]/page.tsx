"use client";
export const dynamic = "force-dynamic";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef, FormEvent } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { useAgentById } from "../../lib/useAgentById";
import { chatWithAgent, getChatHistory, clearChatHistory, ChatMessage, SourceLink } from "../../lib/agentAPI";
import { getPage } from "../../lib/pagesAPI";
import { useAuth } from "../../components/auth/AuthProvider";
import Image from "next/image";
import WikiLinkHoverCard from "../../components/editor/WikiLinkHoverCard";
import { Loader2 } from "lucide-react";

interface Message extends ChatMessage { time: Date }
interface SourceInfo { title: string; url: string; logo?: string }

export default function ElderChatPage() {
  const params = useParams();
  const id = Number(params?.id);
  const { user, token } = useAuth();
  const { agent } = useAgentById(id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [sourceInfos, setSourceInfos] = useState<SourceInfo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getChatHistory(id, token || "")
      .then((msgs) => {
        const withTime = (msgs as ChatMessage[]).map(m => ({ ...m, time: new Date() }));
        setMessages(withTime);
        const last = [...withTime].reverse().find(m => m.role === "assistant" && m.sources);
        if (last && last.sources) updateSourceInfos(last.sources);
        scrollToBottom();
      })
      .catch(() => setMessages([]));
  }, [id, token]);

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function updateSourceInfos(sources: SourceLink[] = []) {
    if (!sources.length) {
      setSourceInfos([]);
      return;
    }
    const infos: SourceInfo[] = await Promise.all(
      sources.map(async (s) => {
        let title = s.title;
        let logo: string | undefined = undefined;
        const match = s.url.match(/page\/(\d+)/);
        if (match) {
          try {
            const page = await getPage(Number(match[1]), token || "");
            title = page.name;
            logo = page.logo;
          } catch {}
        }
        return { title, url: s.url, logo };
      })
    );
    setSourceInfos(infos);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !id) return;
    const newMsg: Message = { role: "user", content: input.trim(), time: new Date() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    scrollToBottom();
    setLoading(true);
    setMessages(m => [...m, { role: "assistant", content: "", time: new Date() }]);
    try {
      const { answer, sources } = await chatWithAgent(
        id,
        updated.map(({ role, content }) => ({ role, content })),
        token || ""
      );
      setMessages(m => {
        const arr = [...m];
        arr[arr.length - 1] = { role: "assistant", content: answer, sources, time: new Date() };
        return arr;
      });
      updateSourceInfos(sources);
      scrollToBottom();
    } catch {
      setMessages(m => {
        const arr = [...m];
        arr[arr.length - 1] = { role: "assistant", content: "Sorry, something went wrong.", time: new Date() };
        return arr;
      });
      updateSourceInfos([]);
      scrollToBottom();
    }
    setLoading(false);
  }

  async function clearMessages() {
    if (!id) return;
    const confirmed = window.confirm(
      "This will permanently delete your chat history with this Elder. Continue?"
    );
    if (!confirmed) return;
    try {
      await clearChatHistory(id, token || "");
      setMessages([]);
      setSourceInfos([]);
    } catch (e) {
      console.error(e);
    }
  }

  function renderMessageContent(msg: ChatMessage) {
    const lines = msg.content.split(/\n/);
    return (
      <>
        {lines.map((l, i) => (
          <span key={i}>
            {l}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
        {msg.sources && msg.sources.length > 0 && (
          <ul className="mt-1 text-xs space-y-1">
            {msg.sources.map((s) => (
              <li key={s.url}>
                <WikiLinkHoverCard href={s.url}>
                  {`${s.title}`}
                </WikiLinkHoverCard>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] px-2 sm:px-6 py-8">
          <div className="w-full sm:w-[80%] mx-auto flex flex-col h-[calc(100vh-160px)]">
            <div className="flex items-center gap-3 mb-4">
              {agent && (
                <Image src={agent.logo || "/images/default/avatars/logo.png"} alt={agent.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-[var(--primary)]" />
              )}
              <h1 className="text-2xl font-serif font-bold text-[var(--primary)] flex-1 truncate">
                {agent ? agent.name : "..."}
              </h1>
              <button
                onClick={clearMessages}
                className="ml-auto px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Clear chat
              </button>
            </div>
            {sourceInfos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {sourceInfos.map((s) => (
                  <motion.a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--surface-variant)] border border-[var(--border)] hover:bg-[var(--surface)]"
                    whileHover={{ scale: 1.05 }}
                  >
                    {s.logo && (
                      <Image
                        src={s.logo}
                        alt={s.title}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {s.title}
                    </span>
                  </motion.a>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-4 mb-2 border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)]">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <Image src={agent?.logo || "/images/default/avatars/logo.png"} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover mr-2 self-end" />
                  )}
                  <div className={`${m.role === "user" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--surface-variant)]"} rounded-xl px-3 py-2 shadow max-w-[80%] whitespace-pre-wrap`}>
                    {loading && idx === messages.length - 1 && m.role === "assistant" && m.content === "" ? (
                      <span className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Thinking...</span>
                    ) : (
                      renderMessageContent(m)
                    )}
                    <div className="text-[10px] text-right text-[var(--foreground)]/50 mt-1">
                      {m.time.toLocaleTimeString()}
                    </div>
                  </div>
                  {m.role === "user" && (
                    <Image src={user?.image_url || "/images/avatars/default.png"} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover ml-2 self-end" />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-[var(--primary)] p-2 bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--primary)]/70 focus:outline-none"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
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
