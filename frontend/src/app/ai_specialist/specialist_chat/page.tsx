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
  downloadSource,
} from "../../lib/specialistAPI";
import type { ChatMessage } from "../../lib/specialistAPI";
import { useSpecialistSources } from "../../lib/useSpecialistSources";
import { downloadBlob } from "../../lib/importExportAPI";
import { motion } from "framer-motion";
import { BookOpen, Download, Link2, File } from "lucide-react";
import ModalContainer from "../../components/template/modalContainer";
import { clearSpecialistHistory } from "../../lib/specialistAPI";
import { getPage } from "../../lib/pagesAPI";
import type { SourceLink } from "../../lib/agentAPI";


const QUICK_REPLIES = [
  "Tell me more!",
  "Show your sources.",
  "Can you summarize that?",
  "What's the next step?",
  "How did you know that?",
];

// --- Typewriter Effect ---
function Typewriter({ text, done, speed = 18 }: { text: string; done: () => void; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    let cancelled = false;
    function type() {
      if (cancelled) return;
      setDisplayed(text.slice(0, i + 1));
      if (i < text.length - 1) {
        i++;
        setTimeout(type, speed);
      } else {
        done?.();
      }
    }
    type();
    return () => { cancelled = true; };
  }, [text]);
  return <span dangerouslySetInnerHTML={{ __html: displayed }} />;
}

function AgentAnimatedAvatar({ logo, emote = "normal" }: { logo?: string; emote?: string }) {
  // Basic: pulse or blink animation based on emote (expand with more later!)
  let animClass = "";
  if (emote === "thinking") animClass = "animate-pulse";
  if (emote === "happy") animClass = "animate-bounce";
  if (emote === "surprised") animClass = "animate-shake";
  return (
    <motion.div
      className={`relative w-14 h-14 rounded-full border-4 border-indigo-300 shadow-lg bg-white ${animClass}`}
      initial={{ scale: 0.85 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 10 }}
    >
      <Image
        src={logo || "/images/default/avatars/logo.png"}
        alt="agent"
        width={56}
        height={56}
        className="w-14 h-14 rounded-full object-cover"
        priority
      />
      {/* Emote badge: add more SVGs/emojis for different moods! */}
      <span
        className={`absolute -bottom-1 -right-1 bg-white border rounded-full px-1 text-xl ${
          emote === "happy"
            ? "text-yellow-400"
            : emote === "thinking"
            ? "text-blue-400"
            : emote === "surprised"
            ? "text-pink-600"
            : "text-indigo-400"
        }`}
      >
        {emote === "happy" ? "😃" : emote === "thinking" ? "🤔" : emote === "surprised" ? "😲" : "🧙"}
      </span>
    </motion.div>
  );
}

function TomeCard({ src, onDownload }: any) {
  // fancier type/preview/tooltip logic can be added here!
  return (
    <motion.div
      className="bg-white border-2 border-fuchsia-300 rounded-xl shadow flex flex-col items-center p-2 hover:scale-105 hover:shadow-lg transition-all cursor-pointer"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ scale: 1.07, boxShadow: "0 4px 16px #a78bfa44" }}
    >
      <div className="mb-1 flex items-center gap-1">
        {src.type === "file" ? (
          <File className="w-5 h-5 text-fuchsia-600" />
        ) : (
          <Link2 className="w-5 h-5 text-indigo-600" />
        )}
        <span className="font-bold text-indigo-700">{src.name}</span>
      </div>
      <span className="text-xs text-indigo-400">{src.path ? src.path.split("/").pop() : src.url}</span>
      {src.type === "file" ? (
        <button
          className="mt-2 text-xs text-white bg-fuchsia-600 hover:bg-fuchsia-700 px-2 py-1 rounded"
          onClick={() => onDownload(src.id!, src.path?.split("/").pop() || "source")}
        >
          <Download className="w-4 h-4 inline" /> Download
        </button>
      ) : src.url ? (
        <a
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-indigo-700 underline flex items-center gap-1"
        >
          <BookOpen className="w-4 h-4" />
          Visit
        </a>
      ) : null}
    </motion.div>
  );
}

function SpecialistChatPageContent() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const agentId = parseInt(searchParams.get("agent") || "0");
  const { agent } = useAgentById(agentId);
  const { sources } = useSpecialistSources(agentId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

  interface SourceInfo { title: string; url?: string; logo?: string }
  const [sourceInfos, setSourceInfos] = useState<SourceInfo[]>([]);

  // For RPG "emote" effect
  const [agentEmote, setAgentEmote] = useState<"normal" | "thinking" | "happy" | "surprised">("normal");

  async function updateSourceInfos(sources: SourceLink[] = []) {
    if (!sources.length) {
      setSourceInfos([]);
      return;
    }
    const infos: SourceInfo[] = await Promise.all(
      sources.map(async (s) => {
        const src: any = s;
        let title = src.title || src.name || "";
        let url: string | undefined = src.url;
        let logo: string | undefined;
        if (url) {
          const match = url.match(/page\/(\d+)/);
          if (match) {
            try {
              const page = await getPage(Number(match[1]), token || "");
              title = page.name;
              logo = page.logo;
            } catch {}
          }
        }
        return { title, url, logo };
      })
    );
    setSourceInfos(infos);
  }

  useEffect(() => {
    if (!agentId) return;
    getSpecialistHistory(agentId, token || "", 10)
      .then((msgs) => {
        setAllMessages(msgs as ChatMessage[]);
        setMessages((msgs as ChatMessage[]).slice(-10));
        const last = [...msgs as ChatMessage[]].reverse().find(m => m.role === "assistant" && m.sources);
        if (last && last.sources) updateSourceInfos(last.sources);
      })
      .catch(() => {
        setAllMessages([]);
        setMessages([]);
        setSourceInfos([]);
      });
  }, [agentId, token]);

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSend(e: FormEvent, quick?: string) {
    e?.preventDefault();
    if ((!input.trim() && !quick) || !agentId) return;
    const userMsg = quick || input.trim();
    const newMsg: ChatMessage = { role: "user", content: userMsg };
    const updatedAll = [...allMessages, newMsg];
    setAllMessages(updatedAll);
    const display = [...messages, newMsg].slice(-10);
    setMessages(display);
    setInput("");
    scrollToBottom();
    setLoading(true);
    setAgentEmote("thinking");
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    try {
      const { answer, sources } = await chatWithSpecialist(agentId, updatedAll, token || "");
      setAllMessages((m) => [...m, { role: "assistant", content: answer, sources }]);
      setMessages((m) => {
        const arr = [...m];
        arr[arr.length - 1] = { role: "assistant", content: answer, sources };
        return arr.slice(-10);
      });
      updateSourceInfos(sources);
      setAgentEmote("happy");
      scrollToBottom();
    } catch {
      setAllMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", content: "Sorry, something went wrong." },
      ].slice(-10));
      updateSourceInfos([]);
      setAgentEmote("surprised");
    }
    setTimeout(() => setAgentEmote("normal"), 2200);
    setLoading(false);
  }

  async function handleDownload(sourceId: number, filename: string) {
    try {
      const blob = await downloadSource(agentId, sourceId, token || "");
      downloadBlob(blob, filename);
    } catch (err) {
      // You can trigger an emote or show a toast here!
      setAgentEmote("surprised");
      console.error("Failed to download source", err);
    }
  }

  async function handleClearChat() {
    if (!agentId) return;
    if (!confirm("Delete entire chat history?")) return;
    try {
      await clearSpecialistHistory(agentId, token || "");
      setMessages([]);
      setAllMessages([]);
      setSourceInfos([]);
      setToastMsg("Chat history cleared");
    } catch (err) {
      setToastMsg("Failed to clear history");
      console.error(err);
    } finally {
      setTimeout(() => setToastMsg(""), 3000);
    }
  }

  async function handleOpenHistory() {
    if (!agentId) return;
    try {
      const full = await getSpecialistHistory(agentId, token || "", 1000);
      setAllMessages(full as ChatMessage[]);
      setShowHistoryModal(true);
    } catch {
      setShowHistoryModal(true);
    }
  }

  function renderMessageContent(msg: ChatMessage, idx: number, isAssistant: boolean) {
    // If last assistant message and loading, use typewriter
    if (isAssistant && loading && idx === messages.length - 1) {
      return (
        <Typewriter
          text={msg.content}
          done={() => {
            /* Optionally auto-scroll etc */
          }}
        />
      );
    }
    return (
      <>
        <span dangerouslySetInnerHTML={{ __html: msg.content }} />
      </>
    );
  }

  if (!agentId) {
    return (
      <div className="p-10 text-lg text-center font-bold text-fuchsia-800">
        No specialist selected
      </div>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {toastMsg && (
          <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-fuchsia-600 text-white px-4 py-2 rounded-xl shadow-lg z-[1000] text-sm animate-fade-in-out">
            {toastMsg}
          </div>
        )}
        <div
          className={`min-h-screen w-full flex flex-col items-center px-1 sm:px-6 py-6 transition-all duration-700`}
        >
          {/* Topbar: Agent Presence */}
          <div className="flex items-center gap-3 mb-5 drop-shadow-xl">
            <AgentAnimatedAvatar logo={agent?.logo} emote={agentEmote} />
            <div>
              <h2 className="text-2xl font-bold text-fuchsia-700 tracking-wide flex gap-1 items-center">
                {agent?.name || "Specialist"}
                <span className="text-base ml-2 px-2 py-1 rounded bg-fuchsia-100 border border-fuchsia-300 text-fuchsia-700 font-mono">
                  NPC
                </span>
              </h2>
              <div className="text-sm text-fuchsia-500 italic">
                {agentEmote === "thinking"
                  ? "is pondering your request..."
                  : agentEmote === "happy"
                  ? "is excited to help!"
                  : agentEmote === "surprised"
                  ? "is startled!"
                  : "ready for your next question"}
              </div>
            </div>

          </div>

          <div className="w-full sm:w-[80%] mx-auto flex flex-col h-[calc(100vh-160px)]">
            <div className="flex items-center gap-2 mb-2">
              <button
                className="ml-auto text-xs text-fuchsia-600 underline"
                onClick={handleOpenHistory}
              >
                See chat history
              </button>
              <button
                className="text-xs text-red-600 underline"
                onClick={handleClearChat}
              >
                Clear chat
              </button>
            </div>

            <div className="mb-3 overflow-x-auto flex gap-3 pb-2">
              {sources.map((src) => (
                <TomeCard key={src.id} src={src} onDownload={handleDownload} />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 mb-2 border border-fuchsia-200 rounded-2xl bg-white/90 shadow-lg p-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex w-full ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <AgentAnimatedAvatar logo={agent?.logo} emote={agentEmote} />
                  )}
                    <motion.div
                      className={`${
                        m.role === "user"
                          ? "bg-fuchsia-600 text-white rounded-br-lg rounded-tl-2xl rounded-tr-2xl"
                          : "bg-fuchsia-50 text-fuchsia-900 rounded-bl-lg rounded-tr-2xl rounded-tl-2xl"
                      } px-4 py-2 shadow-md max-w-[78%] ml-2 mr-2 font-medium relative`}
                      initial={{ scale: 0.93, y: 14, opacity: 0.7 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    >
                      {renderMessageContent(m, idx, m.role === "assistant")}
                    </motion.div>
                    {m.role === "user" && user?.image_url && (
                      <motion.div
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 rounded-full border border-fuchsia-300 shadow-lg ml-2"
                      >
                        <Image
                          src={user.image_url}
                          alt="me"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

            {sourceInfos.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-fuchsia-600" />
                  <span className="font-semibold text-fuchsia-700 text-base">Relevant Sources</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sourceInfos.map((s) => (
                    s.url ? (
                      <motion.a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-fuchsia-50 border border-fuchsia-300 hover:bg-fuchsia-100"
                        whileHover={{ scale: 1.05 }}
                      >
                        {s.logo && (
                          <Image src={s.logo} alt={s.title} width={32} height={32} className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-sm font-semibold text-fuchsia-700">{s.title}</span>
                      </motion.a>
                    ) : (
                      <motion.div
                        key={s.title}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg bg-fuchsia-50 border border-fuchsia-300"
                        whileHover={{ scale: 1.05 }}
                      >
                        {s.logo && (
                          <Image src={s.logo} alt={s.title} width={32} height={32} className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-sm font-semibold text-fuchsia-700">{s.title}</span>
                      </motion.div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_REPLIES.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                    className="bg-fuchsia-200 hover:bg-fuchsia-300 text-fuchsia-700 px-3 py-1 rounded-xl text-xs shadow transition"
                    onClick={(e) => handleSend(e as any, q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
            </div>

            <form onSubmit={handleSend} className="mt-3 flex gap-2">
              <textarea
                className="flex-1 rounded-xl border border-fuchsia-300 p-2 bg-white text-fuchsia-900 resize-y shadow-sm"
                rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    loading
                      ? "The specialist is thinking..."
                      : "Type your message or choose a quick reply..."
                  }
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-fuchsia-600 text-white font-bold shadow-md hover:bg-fuchsia-700 disabled:opacity-60"
                  disabled={loading || !input.trim()}
                >
                  Send
                </button>
              </form>
          </div>
        </div>
        {showHistoryModal && (
          <ModalContainer title="Full Chat History" onClose={() => setShowHistoryModal(false)} className="max-w-3xl">
            <div className="space-y-4">
              {allMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-xl shadow max-w-[80%] ${m.role === "user" ? "bg-fuchsia-200" : "bg-fuchsia-50"} text-fuchsia-900`}
                  >
                    {renderMessageContent(m, idx, m.role === "assistant")}
                  </div>
                </div>
              ))}
            </div>
          </ModalContainer>
        )}
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
