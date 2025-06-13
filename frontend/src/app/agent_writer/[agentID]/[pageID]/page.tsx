"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import AuthGuard from "../../../components/auth/AuthGuard";
import { useAuth } from "../../../components/auth/AuthProvider";
import { usePageById } from "../../../lib/usePageById";
import { useAgentById } from "../../../lib/useAgentById";
import { analyzePageWithAgent } from "../../../lib/agentAPI";
import Image from "next/image";
import TabMenu from "../../../components/world_builder/TabMenu";
import { Loader2 } from "lucide-react";

export default function PageAnalyze() {
  const { agentID, pageID } = useParams();
  const { token } = useAuth();
  const { page } = usePageById(Number(pageID));
  const { agent } = useAgentById(Number(agentID));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"content" | "suggestions">("content");

  async function handleAnalyze() {
    if (!agentID || !pageID || !token) return;
    setActiveTab("suggestions");
    setLoading(true);
    try {
      const data = await analyzePageWithAgent(Number(agentID), Number(pageID), token);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze page");
    }
    setLoading(false);
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] px-2 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {agent && (
              <div className="flex items-center gap-3">
                <Image src={agent.logo || "/images/default/avatars/logo.png"} alt={agent.name} width={40} height={40} className="w-10 h-10 rounded object-cover" />
                <h1 className="text-xl font-bold text-[var(--primary)]">{agent.name}</h1>
              </div>
            )}
            {page && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">{page.name}</h2>
                <div className="flex items-center justify-between">
                  <TabMenu
                    activeTab={activeTab}
                    onTabChange={(t) => setActiveTab(t as "content" | "suggestions")}
                    tabs={[
                      { value: "content", label: "Content" },
                      { value: "suggestions", label: "Suggestions" },
                    ]}
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-3 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] disabled:opacity-50 ml-4"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading</span>
                    ) : (
                      `Ask ${agent?.name}`
                    )}
                  </button>
                </div>

                {activeTab === "content" && (
                  <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: page.content }} />
                )}

                {activeTab === "suggestions" && (
                  <div className="text-sm mt-2 min-h-[60px]">
                    {loading && (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                    )}
                    {!loading && result && (
                      <>
                        <h3 className="font-semibold mb-1">Suggestions</h3>
                        {result.suggestions?.map((s:any, idx:number) => (
                          <div key={idx} className="flex items-center justify-between border-b border-[var(--border)] py-1">
                            <span>{s.name} ({s.concept})</span>
                            <span className="text-xs text-[var(--foreground)]/70">{s.exists ? "existing" : "new"}</span>
                          </div>
                        ))}
                        {result.suggestions?.length === 0 && <div>No suggestions.</div>}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
