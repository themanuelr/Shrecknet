"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import AuthGuard from "../../../components/auth/AuthGuard";
import { useAuth } from "../../../components/auth/AuthProvider";
import { usePageById } from "../../../lib/usePageById";
import { useAgentById } from "../../../lib/useAgentById";
import { analyzePageWithAgent, generatePagesWithAgent } from "../../../lib/agentAPI";
import { updatePage, createPage, getPagesForConcept, getPage } from "../../../lib/pagesAPI";
import { usePages } from "../../../lib/usePage";
import { Combobox } from "@headlessui/react";
import { useConcepts } from "../../../lib/useConcept";
import { useWorld } from "../../../lib/useWorld";
import CreatePageForm from "../../../components/create_page/CreatePageForm";
import Image from "next/image";
import { Loader2 } from "lucide-react";

// Personality flavor for agents!
const AGENT_PERSONALITIES: Record<string, string> = {
  "Lorekeeper Lyra": "“Every story is a new star in the night sky. Let’s light up your world!”",
  "Archivist Axion": "“Where words end, legends begin. Let us chronicle them together.”",
  "default": "“I am your humble scribe. Let’s bring new tales to your world!”"
};

// Steps for the wizard/ritual
const STEPS = [
  { label: "Review Lore" },
  { label: "Scribe’s Suggestions" },
  { label: "Choose Legends" },
  { label: "Finalize Chronicle" },
];

// AGENT speech bubble component
function AgentBubble({ agent, children, loading = false }: { agent: any, children: any, loading?: boolean }) {
  return (
    <div className="flex items-start gap-4 mb-4">
      <div className="relative">
        <Image src={agent.logo || "/images/default/avatars/logo.png"} alt={agent.name} width={56} height={56}
          className={`rounded-full object-cover border-2 border-[var(--primary)] shadow-md ${loading ? "animate-pulse" : ""}`} />
        {loading && (
          <span className="absolute -bottom-1 -right-1 bg-[var(--primary)] rounded-full w-4 h-4 flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </span>
        )}
      </div>
      <div className="relative">
        <div className="bg-[var(--card)] border border-[var(--primary)] rounded-2xl px-4 py-3 shadow-sm text-[var(--foreground)] max-w-lg text-md">
          <span className="block">{children}</span>
        </div>
        <div className="absolute left-2 -bottom-3 w-4 h-4 bg-[var(--card)] border-l border-b border-[var(--primary)] rounded-bl-full"></div>
      </div>
    </div>
  );
}

// Stepper/progress bar
function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {STEPS.map((s, idx) => (
        <div className="flex items-center gap-1" key={s.label}>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all
            ${step === idx
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] scale-110 shadow"
            : step > idx
              ? "bg-[var(--accent)]/70 text-white border-[var(--accent)]"
              : "bg-[var(--muted)] text-gray-400 border-gray-300"
            } font-bold`}>
            {idx + 1}
          </div>
          <div className={`text-xs font-semibold mt-2 text-center ${step === idx ? "text-[var(--primary)]" : "text-gray-400"}`}>{s.label}</div>
          {idx < STEPS.length - 1 && <span className="w-6 h-1 bg-gradient-to-r from-[var(--primary)]/40 to-[var(--accent)]/30 rounded"></span>}
        </div>
      ))}
    </div>
  );
}

export default function PageAnalyze() {
  const { agentID, pageID } = useParams();
  const { token } = useAuth();
  const { page } = usePageById(Number(pageID));
  const { agent } = useAgentById(Number(agentID));
  const [step, setStep] = useState(0); // 0: Review, 1: Suggestions, 2: Choose, 3: Finalize
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<any[]>([]);
  const [generatedPages, setGeneratedPages] = useState<any[]>([]);
  const [activeGen, setActiveGen] = useState(0);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [pageFilters, setPageFilters] = useState<Record<number, string>>({});

  const { concepts } = useConcepts(agent?.world_id);
  const { world } = useWorld(agent?.world_id);
  const { pages: allPages } = usePages(agent?.world_id ? { gameworld_id: agent.world_id } : {});

  // Helper: flavor text
  function getPersonality() {
    return AGENT_PERSONALITIES[agent?.name] || AGENT_PERSONALITIES.default;
  }

  // --- Ritual Step 1: Review Lore (show the page, go next) ---
  // --- Ritual Step 2: Scribe's Suggestions (agent analyzes page) ---
  // --- Ritual Step 3: Choose Legends (select new/updated pages, assign concepts) ---
  // --- Ritual Step 4: Finalize Chronicle (review/create/update) ---

  // Step 2: Ask agent to analyze page
  async function handleAnalyze() {
    if (!agentID || !pageID || !token) return;
    setLoading(true);
    try {
      const data = await analyzePageWithAgent(Number(agentID), Number(pageID), token);
      setResult(data);
      let suggs: any[] = data.suggestions || [];
      // Set concept names for updated pages
      suggs = await Promise.all(suggs.map(async (s: any) => {
        if (s.exists) {
          const pages = await getPagesForConcept(s.concept_id, token);
          const existing = pages.find((p: any) => p.name.toLowerCase() === s.name.toLowerCase());
          if (existing) {
            s.concept_id = existing.concept_id;
            const c = concepts?.find((c: any) => c.id === existing.concept_id);
            if (c) s.concept = c.name;
          }
        }
        return s;
      }));
      suggs.sort((a, b) => (a.exists === b.exists ? 0 : a.exists ? -1 : 1));
      setSuggestions(suggs);
      setSelectedSuggestions(suggs); // All selected by default
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze page");
    }
    setLoading(false);
  }

  // Assign concept for new pages
  function handleConceptChange(idx: number, conceptId: number) {
    const concept = concepts?.find((c: any) => c.id === conceptId);
    setSelectedSuggestions((s) => {
      const copy = [...s];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], concept_id: conceptId, concept: concept?.name || "", target_page_id: undefined };
      }
      return copy;
    });
  }

  function handleModeChange(idx: number, mode: string) {
    setSelectedSuggestions((s) => {
      const copy = [...s];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], mode, target_page_id: undefined };
      }
      return copy;
    });
  }

  function handleTargetPageChange(idx: number, pageId: number) {
    setSelectedSuggestions((s) => {
      const copy = [...s];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], target_page_id: pageId };
      }
      return copy;
    });
  }

  // Remove a suggestion
  function handleRemove(idx: number) {
    setSelectedSuggestions((s) => s.filter((_, i) => i !== idx));
    setPageFilters((f) => {
      const copy = { ...f };
      delete copy[idx];
      return copy;
    });
  }

  // Step 4: Generate final pages
  async function handleGenerate() {
    if (!agentID || !pageID || !token) return;
  
    setLoading(true);
    try {
      // Split into new and existing
      const newPages = selectedSuggestions.filter((s) => !s.exists && s.mode !== "update")
        .map((s) => ({ name: s.name, concept_id: s.concept_id }))
        .filter(Boolean);
      const updatePages = selectedSuggestions.filter((s) => s.exists || s.mode === "update")
        .map((s) => ({ name: s.name, concept_id: s.concept_id, target_page_id: s.target_page_id }))
        .filter(Boolean);
      
       let generatedNewPages = [];
      let generatedUpdateSuggestions = [];
  
      // 1. Generate content for new pages (as before)
      if (newPages.length > 0) {
        
        const data = await generatePagesWithAgent(Number(agentID), Number(pageID), newPages, token);
        
        generatedNewPages = data.pages || [];
        
      }
  
      // 2. Generate updated content for existing pages
      if (updatePages.length > 0) {

        const data = await generatePagesWithAgent(
          Number(agentID),
          Number(pageID),
          updatePages.map((u) => ({ name: u.name, concept_id: u.concept_id })),
          token
        );
        
        generatedUpdateSuggestions = data.pages;
        // console.log("Generated old: "+generatedUpdateSuggestions)
      }
  
      // 3. Fetch current page data and append agent content for each updated page
      let generatedExistingPages = [];
      for (const upd of updatePages) {
        // Get agent's generated suggestion for this page (from latest call)
        const agentSuggestion = generatedUpdateSuggestions.find((sg: any) =>
          sg.name === upd.name && sg.autogenerated_content
        );
        
        // Fetch the actual current page data
        let existing: any = null;
        if (upd.target_page_id) {
          existing = await getPage(upd.target_page_id, token);
        } else {
          const pages = await getPagesForConcept(upd.concept_id, token);
          existing = pages.find((p: any) => p.name.toLowerCase() === upd.name.toLowerCase());
        }

        
        if (existing) {
          let mergedAutogen = existing.autogenerated_content || "";
          if (agentSuggestion?.autogenerated_content) {
            // Avoid duplicate appending
            if (!mergedAutogen.includes(agentSuggestion.autogenerated_content)) {
              const dateStr = new Date().toLocaleDateString();
              const analyzedName = page?.name || "Unknown Page";
              mergedAutogen += `${mergedAutogen ? "\n\n---\n\n" : ""}<h2>Notes from ${analyzedName} Added on ${dateStr}</h2>\n${agentSuggestion.autogenerated_content}`;
            }
          }
          generatedExistingPages.push({
            ...existing,
            autogenerated_content: mergedAutogen,
          });
        }
      }
  
      // New pages first, then existing/updates
      setGeneratedPages([...generatedNewPages, ...generatedExistingPages]);
      setActiveGen(0);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to generate pages");
    }
    setLoading(false);
  }

  // Edit/update for existing pages: NO edit button as per your request
  // Only allow edit for new pages

  // --- Main Render ---
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] px-2 sm:px-6 py-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Hero Section + Stepper */}
            {agent && (
              <div className="flex flex-col items-center gap-2 mb-3">
                <div className="flex items-center gap-4">
                  <Image src={agent.logo || "/images/default/avatars/logo.png"} alt={agent.name} width={64} height={64} className="rounded-full border-2 border-[var(--primary)] shadow-lg" />
                  <div>
                    <h1 className="text-2xl font-extrabold text-[var(--primary)]">{agent.name}, Scribe of {world?.name}</h1>
                    <div className="italic text-md text-[var(--accent)]">{getPersonality()}</div>
                  </div>
                </div>
                <div className="w-full mt-6">
                  <Stepper step={step} />
                </div>
              </div>
            )}

            {/* Ritual Step 1: Review Lore */}
            {step === 0 && (
              <>
                <AgentBubble agent={agent} loading={false}>
                  <span>
                    <b>Step 1: Review the Old Tome</b>
                    <br />
                    “Let us read the ancient page together. Peruse its content, and once you are satisfied, command me to work my magic and discover new stories within.”
                  </span>
                </AgentBubble>
                {page && (
                  <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow max-w-3xl mx-auto">
                    <h2 className="text-lg font-bold mb-2">{page.name}</h2>
                    <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
                  </div>
                )}
                <div className="flex justify-end mt-6">
                <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow hover:bg-[var(--accent)] transition disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> The Scribe is reading...
                      </span>
                    ) : (
                      "I am ready, Scribe!"
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Ritual Step 2: Scribe's Suggestions (analyzing...) */}
            {step === 1 && (
              <>
                <AgentBubble agent={agent} loading={loading}>
                  <span>
                    <b>Step 2: The Scribe’s Magic</b>
                    <br />
                    “Now, let me work my magic. I shall read your page and seek out the seeds of new legends and old tales to refine...” <span className="animate-pulse inline-block ml-1">✨🪶</span>
                  </span>
                </AgentBubble>
                <div className="flex flex-col items-center py-20">
                  <Loader2 className="w-16 h-16 text-[var(--primary)] animate-spin mb-4" />
                  <span className="text-[var(--primary)] font-bold text-lg">The Scribe is studying your lore...</span>
                </div>
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleAnalyze}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow hover:bg-[var(--accent)] transition"
                  >
                    Begin Scribe's Analysis
                  </button>
                </div>
              </>
            )}

            {/* Ritual Step 3: Choose Legends */}
            {step === 2 && (
              <>
                <AgentBubble agent={agent} loading={false}>
                  <span>
                    <b>Step 3: Choose Which Legends to Inscribe</b>
                    <br />
                    “I have uncovered these potential new and updated pages. As Editor-in-Chief, decide which legends shall become part of your world! For new stories, assign their proper Concept.”
                  </span>
                </AgentBubble>
                <div className="overflow-x-auto bg-[var(--card)] rounded-xl border border-[var(--border)] shadow mb-6">
  <table className="min-w-full text-sm">
    <thead>
      <tr className="text-left text-[var(--primary)]">
        <th className="py-1 px-2">
          <input
            type="checkbox"
            checked={selectedRows.length === selectedSuggestions.length && selectedSuggestions.length > 0}
            onChange={e => {
              setSelectedRows(
                e.target.checked
                  ? selectedSuggestions.map((_, idx) => idx)
                  : []
              );
            }}
          />
        </th>
        <th className="py-1 px-2">Page Name</th>
        <th className="py-1 px-2">Concept</th>
        <th className="py-1 px-2">Status</th>
        <th className="py-1 px-2">Action</th>
        <th className="py-1 px-2 text-right">
          <button
            disabled={selectedRows.length === 0}
            className="px-2 py-1 rounded bg-red-500/80 text-white font-semibold text-xs hover:bg-red-700 transition disabled:opacity-40"
            onClick={() => {
              setSelectedSuggestions(selectedSuggestions.filter((_, idx) => !selectedRows.includes(idx)));
              setSelectedRows([]);
            }}
          >
            Remove Selected
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      {selectedSuggestions.map((s: any, idx: number) => (
        <tr key={idx} className="border-b border-[var(--border)]">
          <td className="py-1 px-2">
            <input
              type="checkbox"
              checked={selectedRows.includes(idx)}
              onChange={e => {
                setSelectedRows(rows =>
                  e.target.checked
                    ? [...rows, idx]
                    : rows.filter(i => i !== idx)
                );
              }}
            />
          </td>
          <td className="py-1 px-2 font-semibold">{s.name}</td>
          <td className="py-1 px-2">
            {s.exists ? (
              <span>{s.concept}</span>
            ) : (
              <select
                className="px-2 py-1 rounded border border-[var(--primary)] bg-[var(--surface)] text-[var(--foreground)]"
                value={s.concept_id}
                onChange={e => handleConceptChange(idx, Number(e.target.value))}
              >
                {concepts?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </td>
          <td className="py-1 px-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                s.exists
                  ? "bg-blue-500/20 text-blue-200 border-blue-500/30"
                  : "bg-green-500/20 text-green-200 border-green-500/30"
              }`}
            >
              {s.exists ? "Update" : "New"}
            </span>
          </td>
          <td className="py-1 px-2">
            {s.exists ? (
              <span className="text-xs">Update Existing</span>
            ) : (
              <div className="flex flex-col gap-1">
                <select
                  className="px-2 py-1 rounded border border-[var(--primary)] bg-[var(--surface)] text-[var(--foreground)]"
                  value={s.mode || "create"}
                  onChange={e => handleModeChange(idx, e.target.value)}
                >
                  <option value="create">Create New</option>
                  <option value="update">Add Updates</option>
                </select>
                {s.mode === "update" && (
                  <Combobox value={s.target_page_id ?? ""} onChange={val => handleTargetPageChange(idx, val)}>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full rounded border border-[var(--primary)] px-2 py-1 bg-[var(--surface)] text-[var(--foreground)]"
                        placeholder="Search page..."
                        onChange={e => setPageFilters(f => ({ ...f, [idx]: e.target.value }))}
                        displayValue={(id: number) => {
                          const p = allPages.find(p => p.id === id);
                          return p ? p.name : "";
                        }}
                      />
                      <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-[var(--surface)] shadow-lg z-20 border border-[var(--primary)]">
                        {allPages
                          .filter(p => p.concept_id === s.concept_id && p.name.toLowerCase().includes((pageFilters[idx] || "").toLowerCase()))
                          .map(page => (
                            <Combobox.Option key={page.id} value={page.id} className="px-2 py-1 cursor-pointer hover:bg-[var(--accent)]/20">
                              {page.name}
                            </Combobox.Option>
                          ))}
                      </Combobox.Options>
                    </div>
                  </Combobox>
                )}
              </div>
            )}
          </td>
          <td className="py-1 px-2 text-right">
            <button
              onClick={() => {
                setSelectedSuggestions(selectedSuggestions.filter((_, i) => i !== idx));
                setSelectedRows(selectedRows.filter(i => i !== idx));
              }}
              className="text-red-500 hover:underline text-xs"
            >
              Remove
            </button>
          </td>
        </tr>
      ))}
      {selectedSuggestions.length === 0 && (
        <tr><td colSpan={6} className="text-center py-2">No legends remain. Go back and review!</td></tr>
      )}
    </tbody>
  </table>
</div>
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setStep(0)}
                    className="px-4 py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-bold shadow hover:bg-[var(--accent)]/30 transition"
                  >
                    Back to Review
                  </button>
                  <button
                      onClick={handleGenerate}
                      disabled={loading || selectedSuggestions.some(s => s.mode === "update" && !s.target_page_id)}
                      className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow hover:bg-[var(--accent)] transition disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          The Scribe is inscribing new legends...
                        </span>
                      ) : (
                        "Inscribe Legends!"
                      )}
                    </button>
                </div>
              </>
            )}

            {/* Ritual Step 4: Finalize Chronicle (create/update pages) */}
            {step === 3 && (
              <>
                <AgentBubble agent={agent} loading={false}>
                  <span>
                    <b>Final Step: Review and Approve</b>
                    <br />
                    “Here are the drafts, ready for your seal of approval! One by one, review these chronicles and let me know which ones shall be added or updated in your world.”
                  </span>
                </AgentBubble>
                {generatedPages.length > 0 ? (
                  <>
                    <div className="mb-2">
                      <div className="flex gap-2 items-center mb-2">
                        {generatedPages.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveGen(idx)}
                            className={`px-3 py-1 rounded-xl font-semibold text-sm border
                              ${activeGen === idx
                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                                : "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--primary)]/10"
                              } transition`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] shadow">
                    {generatedPages[activeGen].autogenerated_content && (
                        <div className="bg-yellow-200/20 border-l-4 border-yellow-500 p-4 rounded mt-4">
                          <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: generatedPages[activeGen].autogenerated_content }} />
                        </div>
                      )}

                    {concepts && (
                        (() => {
                          const c = concepts.find((con: any) => con.id === generatedPages[activeGen].concept_id);
                          return c ? (
                            <div className="flex items-center gap-3 mb-4">
                              <Image
                                src={c.logo || "/images/default/concepts/logo.png"}
                                alt={c.name}
                                width={48}
                                height={48}
                                className="rounded border border-[var(--primary)] object-cover"
                              />
                              <span className="font-semibold text-lg text-[var(--primary)]">{c.name}</span>
                            </div>
                          ) : null;
                        })()
                      )}

                    <CreatePageForm
                        selectedWorld={world}
                        selectedConcept={concepts?.find((c: any) => c.id === generatedPages[activeGen].concept_id)}
                        token={token}
                        initialValues={generatedPages[activeGen]}
                        // mode: edit if page has an id (i.e., is existing), create otherwise
                        mode={generatedPages[activeGen]?.id ? "edit" : "create"}
                        onSubmit={async (payload) => {
                          if (!token) return;
                          if (generatedPages[activeGen]?.id) {
                            // Existing page: update
                            await updatePage(generatedPages[activeGen].id, {
                              ...payload,
                              autogenerated_content: generatedPages[activeGen].autogenerated_content,
                              updated_by_agent_id: Number(agentID),
                            }, token);
                          } else {
                            // New page: create
                            const created = await createPage(payload, token);
                            await updatePage(created.id, {
                              autogenerated_content: generatedPages[activeGen].autogenerated_content,
                              updated_by_agent_id: Number(agentID),
                            }, token);
                          }
                          setGeneratedPages((g) => g.filter((_, i) => i !== activeGen));
                          setActiveGen(0);
                        }}
                      />

                      <div className="text-right mt-2">
                        <button
                          onClick={() => {
                            setGeneratedPages((g) => g.filter((_, i) => i !== activeGen));
                            setActiveGen(0);
                          }}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remove This Chronicle
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-sm py-6">All chronicles have been reviewed and added. Your world is richer!</div>
                )}
              </>
            )}

          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
