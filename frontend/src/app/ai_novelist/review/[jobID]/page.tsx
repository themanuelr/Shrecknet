"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/DashboardLayout";
import AuthGuard from "@/app/components/auth/AuthGuard";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useEffect, useState } from "react";
import { getNovelistJob } from "@/app/lib/agentAPI";
import { useAgentById } from "@/app/lib/useAgentById";
import { useWorld } from "@/app/lib/useWorld";
import { useConcepts } from "@/app/lib/useConcept";
import CreatePageForm from "@/app/components/create_page/CreatePageForm";
import EditableContent from "@/app/components/editor/EditableContent";
import Image from "next/image";

const STEPS = [
  { label: "Review Text" },
  { label: "Choose Concept" },
  { label: "Create Page" },
];

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {STEPS.map((s, idx) => (
        <div className="flex items-center gap-1" key={s.label}>
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all ${
              step === idx
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] scale-110 shadow"
                : step > idx
                ? "bg-[var(--accent)]/70 text-white border-[var(--accent)]"
                : "bg-[var(--muted)] text-gray-400 border-gray-300"
            } font-bold`}
          >
            {idx + 1}
          </div>
          <div className={`text-xs font-semibold mt-2 text-center ${step === idx ? "text-[var(--primary)]" : "text-gray-400"}`}>{s.label}</div>
          {idx < STEPS.length - 1 && <span className="w-6 h-1 bg-gradient-to-r from-[var(--primary)]/40 to-[var(--accent)]/30 rounded"></span>}
        </div>
      ))}
    </div>
  );
}

function AgentBubble({ agent, children }: any) {
  if (!agent) return null;
  return (
    <div className="flex items-start gap-4 mb-4">
      <div className="relative">
        <Image
          src={agent.logo || "/images/default/avatars/logo.png"}
          alt={agent.name}
          width={56}
          height={56}
          className="rounded-full object-cover border-2 border-[var(--primary)] shadow-md"
        />
      </div>
      <div className="relative">
        <div className="bg-[var(--card)] border border-[var(--primary)] rounded-2xl px-4 py-3 shadow-sm text-[var(--foreground)] max-w-lg text-md">
          <span className="block">{children}</span>
        </div>
        <div className="absolute left-2 -bottom-3 w-4 h-4 bg-[var(--card)] border-l border-b border-[var(--primary)] rounded-bl-full" />
      </div>
    </div>
  );
}

export default function ReviewNovelPage() {
  const { jobID } = useParams();
  const searchParams = useSearchParams();
  const agentId = Number(searchParams.get("agent") || 0);
  const router = useRouter();
  const { token } = useAuth();
  const { agent } = useAgentById(agentId);
  const { world } = useWorld(agent?.world_id);
  const { concepts } = useConcepts(agent?.world_id);

  const [job, setJob] = useState<any>(null);
  const [conceptId, setConceptId] = useState<number | null>(null);
  const [novelText, setNovelText] = useState<string>("");
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!jobID || !token) return;
    getNovelistJob(jobID as string, token)
      .then(setJob)
      .catch(() => {});
  }, [jobID, token]);

  useEffect(() => {
    if (job && job.novel) {
      setNovelText(job.novel);
    }
  }, [job]);

  if (!job || job.status !== "done")
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6 text-[var(--foreground)]">Generating novel...</div>
        </DashboardLayout>
      </AuthGuard>
    );

  const selectedConcept = concepts?.find(c => c.id === conceptId);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen w-full text-indigo-900 px-2 sm:px-6 py-10">
          <div className="mx-auto max-w-3xl flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-indigo-700 mb-4">AI Novelist Review</h1>
            {agent && (
              <div className="flex flex-col items-center gap-2 mb-3">
                <div className="flex items-center gap-4">
                  <Image src={agent.logo || "/images/default/avatars/logo.png"} alt={agent.name} width={64} height={64} className="rounded-full border-2 border-[var(--primary)] shadow-lg" />
                  <div>
                    <h2 className="text-2xl font-extrabold text-[var(--primary)]">{agent.name}</h2>
                  </div>
                </div>
                <div className="w-full mt-6"><Stepper step={step} /></div>
              </div>
            )}

            {step === 0 && (
              <>
                <AgentBubble agent={agent}>
                  <b>Step 1:</b> Review and edit the generated story.
                </AgentBubble>
                <EditableContent
                  content={novelText}
                  canEdit
                  onSaveContent={setNovelText}
                  className="w-full"
                  pageType="novel"
                  pageName="Novel"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold shadow hover:bg-[var(--accent)] transition"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <AgentBubble agent={agent}>
                  <b>Step 2:</b> Choose which concept this page belongs to.
                </AgentBubble>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {concepts?.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setConceptId(c.id);
                        setStep(2);
                      }}
                      className={`border rounded-xl p-4 flex flex-col items-center hover:shadow-md transition ${conceptId === c.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)]'}`}
                    >
                      <Image width={64} height={64} src={c.logo || '/images/pages/concept/concept.png'} alt={c.name} className="w-16 h-16 object-cover rounded border border-[var(--primary)] mb-2" />
                      <span className="font-semibold text-[var(--primary)] text-sm text-center">{c.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setStep(0)}
                    className="px-4 py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-bold shadow hover:bg-[var(--accent)]/30 transition"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {step === 2 && selectedConcept && world && (
              <>
                <AgentBubble agent={agent}>
                  <b>Step 3:</b> Finalize the page details.
                </AgentBubble>
                <CreatePageForm
                  selectedWorld={world}
                  selectedConcept={selectedConcept}
                  token={token || ""}
                  initialValues={{ autogenerated_content: novelText }}
                  onSuccess={(page) => {
                    router.push(`/worlds/${world.id}/concept/${selectedConcept.id}/page/${page.id}`);
                  }}
                />
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-bold shadow hover:bg-[var(--accent)]/30 transition"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
