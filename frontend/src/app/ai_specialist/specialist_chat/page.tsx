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
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Download, Link2, File } from "lucide-react";

const RPG_BACKGROUNDS = [
  "bg-gradient-to-br from-fuchsia-100 to-indigo-50",
  "bg-[url('/images/rpg-parchment.png')] bg-cover bg-center",
  "bg-gradient-to-tr from-purple-100 to-white",
];
const getRandomBackground = () =>
  RPG_BACKGROUNDS[Math.floor(Math.random() * RPG_BACKGROUNDS.length)];

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLorebook, setShowLorebook] = useState(true);
  const [bg, setBg] = useState(getRandomBackground());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For RPG "emote" effect
  const [agentEmote, setAgentEmote] = useState<"normal" | "thinking" | "happy" | "surprised">("normal");

  useEffect(() => {
    if (!agentId) return;
    getSpecialistHistory(agentId, token || "")
      .then((msgs) => setMessages(msgs as ChatMessage[]))
      .catch(() => setMessages([]));
  }, [agentId, token]);

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSend(e: FormEvent, quick?: string) {
    e?.preventDefault();
    if ((!input.trim() && !quick) || !agentId) return;
    const userMsg = quick || input.trim();
    const newMsg: ChatMessage = { role: "user", content: userMsg };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");
    scrollToBottom();
    setLoading(true);
    setAgentEmote("thinking");
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    try {
      const { answer, sources } = await chatWithSpecialist(agentId, updated, token || "");
      setMessages((m) => {
        const arr = [...m];
        arr[arr.length - 1] = { role: "assistant", content: answer, sources };
        return arr;
      });
      setAgentEmote("happy");
      scrollToBottom();
    } catch {
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
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
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {msg.sources.map((s, i) => (
              <motion.div
                key={i}
                className="flex items-center px-2 py-1 rounded-lg bg-fuchsia-50 border border-fuchsia-300 mr-2 mb-1 text-xs gap-1 cursor-pointer hover:bg-fuchsia-100 transition"
                initial={{ scale: 0.7, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.07, boxShadow: "0 2px 8px #a78bfa22" }}
                onClick={() =>
                  s.type === "file"
                    ? handleDownload(s.id!, s.path?.split("/").pop() || "source")
                    : window.open(s.url, "_blank")
                }
                title={s.type === "file" ? "Download source" : "Open link"}
              >
                {s.type === "file" ? <File className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                <span className="font-semibold text-fuchsia-700">{s.name}</span>
              </motion.div>
            ))}
          </div>
        )}
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
        <div
          className={`min-h-screen w-full flex flex-col items-center px-1 sm:px-6 py-6 transition-all duration-700 ${bg}`}
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
            <button
              className="ml-5 text-xs text-fuchsia-500 hover:underline hidden sm:inline"
              onClick={() => setBg(getRandomBackground())}
              title="Change ambience"
            >
              Change background
            </button>
          </div>

          <div className="w-full flex gap-5 justify-center">
            {/* Lorebook (Sources) */}
            <AnimatePresence>
              {showLorebook && (
                <motion.div
                  className="hidden lg:flex flex-col w-56 border border-fuchsia-200 rounded-2xl bg-white/90 shadow-lg p-3 h-fit"
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-fuchsia-700" />
                    <h3 className="font-semibold text-fuchsia-700">Lorebook Tomes</h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    {sources.map((src) => (
                      <TomeCard key={src.id} src={src} onDownload={handleDownload} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 max-w-2xl w-full flex flex-col border border-fuchsia-200 rounded-2xl bg-white/90 shadow-lg p-4">
              {/* Toggle Lorebook on mobile */}
              <div className="mb-2 flex items-center gap-2">
                <button
                  className="block lg:hidden px-2 py-1 rounded bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-700 text-xs"
                  onClick={() => setShowLorebook((s) => !s)}
                >
                  {showLorebook ? "Hide Lorebook" : "Show Lorebook"}
                </button>
              </div>
              {/* Chat Window */}
              <div className="flex-1 overflow-y-auto space-y-5 pb-2">
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
              {/* RPG Quick Replies */}
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
              {/* Input */}
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
