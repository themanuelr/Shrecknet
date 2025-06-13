"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import AuthGuard from "../../../components/auth/AuthGuard";
import { useAuth } from "../../../components/auth/AuthProvider";
import { usePageById } from "../../../lib/usePageById";
import { useAgentById } from "../../../lib/useAgentById";
import { analyzePageWithAgent, generatePagesWithAgent } from "../../../lib/agentAPI";
import { useConcepts } from "../../../lib/useConcept";
import { useWorld } from "../../../lib/useWorld";
import CreatePageForm from "../../../components/create_page/CreatePageForm";
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"content" | "suggestions">("content");
  const { concepts } = useConcepts(agent?.world_id);
  const { world } = useWorld(agent?.world_id);
  const [generatedPages, setGeneratedPages] = useState<any[]>([]);
  const [activeGen, setActiveGen] = useState(0);

  async function handleAnalyze() {
    if (!agentID || !pageID || !token) return;
    setActiveTab("suggestions");
    setLoading(true);
    try {
      const data = await analyzePageWithAgent(Number(agentID), Number(pageID), token);
      setResult(data);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze page");
    }
    setLoading(false);
  }

  function handleConceptChange(idx: number, conceptId: number) {
    const concept = concepts?.find((c: any) => c.id === conceptId);
    setSuggestions((s) => {
      const copy = [...s];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], concept_id: conceptId, concept: concept?.name || "" };
      }
      return copy;
    });
  }

  function handleRemove(idx: number) {
    setSuggestions((s) => s.filter((_, i) => i !== idx));
  }

  async function handleGenerate() {
    if (!agentID || !pageID || !token) return;
    const pages = suggestions.map((s) => ({ name: s.name, concept_id: s.concept_id })).filter(Boolean);
    if (pages.length === 0) return;
    setLoading(true);
    try {
      const data = await generatePagesWithAgent(Number(agentID), Number(pageID), pages, token);
      setGeneratedPages(data.pages || []);
      setActiveGen(0);
    } catch (err) {
      console.error(err);
      alert("Failed to generate pages");
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
                <p>Now, this is the content you want me to read? Once you are ready, ask me to read it and I will prepare the new content suggestions!</p>
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
                        <h3 className="font-semibold mb-2">Suggestions</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-[var(--primary)]">
                                <th className="py-1">Page Name</th>
                                <th className="py-1">Concept</th>
                                <th className="py-1">Status</th>
                                <th className="py-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {suggestions.map((s: any, idx: number) => (
                                <tr key={idx} className="border-b border-[var(--border)]">
                                  <td className="py-1 font-semibold">{s.name}</td>
                                  <td className="py-1">
                                    <select
                                      className="px-2 py-1 rounded border border-[var(--primary)] bg-[var(--surface)] text-[var(--foreground)]"
                                      value={s.concept_id}
                                      onChange={(e) => handleConceptChange(idx, Number(e.target.value))}
                                    >
                                      {concepts?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-1 text-xs text-[var(--foreground)]/70">
                                    {s.exists ? `Update existing` : `New`} ({agent?.name} suggestion)
                                  </td>
                                  <td className="py-1 text-right">
                                    <button
                                      onClick={() => handleRemove(idx)}
                                      className="text-red-500 hover:underline text-xs"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {suggestions.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-2">No suggestions.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 text-right">
                          <button
                            onClick={handleGenerate}
                            className="px-3 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)]"
                          >
                            {`Ask ${agent?.name} to proceed with the suggestions!`}
                          </button>
                        </div>

                        {generatedPages.length > 0 && (
                          <div className="mt-6">
                            <TabMenu
                              activeTab={String(activeGen)}
                              onTabChange={(t) => setActiveGen(Number(t))}
                              tabs={generatedPages.map((p: any, idx: number) => ({ value: String(idx), label: p.name }))}
                            />
                            <div className="mt-4">
                              <CreatePageForm
                                selectedWorld={world}
                                selectedConcept={concepts?.find((c: any) => c.id === generatedPages[activeGen].concept_id)}
                                token={token}
                                initialValues={generatedPages[activeGen]}
                                onSuccess={() => {
                                  setGeneratedPages((g) => g.filter((_, i) => i !== activeGen));
                                  setActiveGen(0);
                                }}
                              />
                              {generatedPages[activeGen].autogenerated_content && (
                                <div className="prose prose-invert mt-4" dangerouslySetInnerHTML={{ __html: generatedPages[activeGen].autogenerated_content }} />
                              )}
                              <div className="text-right mt-2">
                                <button
                                  onClick={() => {
                                    setGeneratedPages((g) => g.filter((_, i) => i !== activeGen));
                                    setActiveGen(0);
                                  }}
                                  className="text-red-500 text-sm hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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
