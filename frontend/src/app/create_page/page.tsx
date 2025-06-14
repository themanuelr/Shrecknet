"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth/AuthProvider";
import DashboardLayout from "@/app/components/DashboardLayout";
import AuthGuard from "@/app/components/auth/AuthGuard";
import { useWorlds } from "@/app/lib/userWorlds";
import { useConcepts } from "@/app/lib/useConcept";
import CreatePageForm from "../components/create_page/CreatePageForm";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";


export default function CreatePage() {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { worlds } = useWorlds(token);
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [step, setStep] = useState(1);

  // Reset form if route is hit again
  useEffect(() => {
    const handleRouteChange = () => {
      setSelectedWorld(null);
      setSelectedConcept(null);
      setStep(1);
    };

    router.prefetch("/create");
    handleRouteChange();
  }, [pathname, router]);

  // Detect world from URL path (e.g., /worlds/1/...)
  useEffect(() => {
    const match = pathname?.match(/\/worlds\/(\d+)/);
    const worldId = match ? Number(match[1]) : null;
    if (worldId && worlds.length > 0) {
      const found = worlds.find((w) => w.id === worldId);
      if (found) setSelectedWorld(found);
    }
  }, [pathname, worlds]);

  const { concepts } = useConcepts(selectedWorld?.id);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="w-full min-h-screen px-4 py-6 text-[var(--foreground)]">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-extrabold text-[var(--primary)] mb-6 text-center">
              Create a New Page
            </h1>

            {/* Stepper Control */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition
                    ${step === s ? "bg-[var(--primary)] text-white" : "bg-[var(--primary)]/20 text-[var(--primary)]"}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Choose a World</h2>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {worlds.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setSelectedWorld(w);
                          setStep(2);
                        }}
                        className={`border rounded-xl p-4 flex flex-col items-center hover:shadow-lg transition
                          ${selectedWorld?.id === w.id ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)]"}`}
                      >
                        <Image
                          width={400}
                          height={400}
                          src={w.logo || "/images/worlds/new_game.png"}
                          alt={w.name}
                          className="w-20 h-20 object-cover rounded-lg border border-[var(--primary)] mb-2"
                        />
                        <span className="font-bold text-[var(--primary)]">{w.name}</span>
                        <span className="text-xs opacity-70">{w.system}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Choose a Concept</h2>
                  <div className="flex flex-col sm:flex-row justify-between mb-4">
                    <p className="text-sm text-[var(--foreground)]/80 max-w-xl">
                      Pages are based on concepts – they define the structure and characteristics of your content.
                    </p>
                    <button
                      className="text-sm text-[var(--primary)] hover:underline mt-2 sm:mt-0"
                      onClick={() => setStep(1)}
                    >
                      ← Change World
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {concepts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedConcept(c);
                          setStep(3);
                        }}
                        className={`border rounded-xl p-4 flex flex-col items-center hover:shadow-md transition
                          ${selectedConcept?.id === c.id ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)]"}`}
                      >
                        <Image
                          width={400}
                          height={400}                        
                          src={c.logo || "/images/pages/concept/concept.png"}
                          alt={c.name}
                          className="w-16 h-16 object-cover rounded border border-[var(--primary)] mb-2"
                        />
                        <span className="font-semibold text-[var(--primary)] text-sm text-center">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

                {step === 3 && selectedWorld && selectedConcept && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6 text-right">
                      <button
                        onClick={() => setStep(2)}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        ← Change Concept
                      </button>
                    </div>

                    {/* Add this summary section below */}
                    <div className="flex items-center gap-6 mb-8 justify-center">
                      {/* World */}
                      <div className="flex items-center gap-3 bg-[var(--surface-variant)]/60 border border-[var(--primary)]/10 px-4 py-2 rounded-xl shadow">
                        <Image
                          width={400}
                          height={400}                        
                          src={selectedWorld.logo || "/images/worlds/new_game.png"}
                          alt={selectedWorld.name}
                          className="w-12 h-12 object-cover rounded-lg border border-[var(--primary)]"
                        />
                        <span className="font-bold text-[var(--primary)] text-lg">{selectedWorld.name}</span>
                      </div>
                      <span className="mx-1 text-[var(--primary)] text-2xl font-black opacity-50">—</span>
                      {/* Concept */}
                      <div className="flex items-center gap-3 bg-[var(--surface-variant)]/60 border border-[var(--primary)]/10 px-4 py-2 rounded-xl shadow">
                        <Image
                          width={400}
                          height={400}                        
                          src={selectedConcept.logo || "/images/pages/concept/concept.png"}
                          alt={selectedConcept.name}
                          className="w-10 h-10 object-cover rounded border border-[var(--primary)]"
                        />
                        <span className="font-semibold text-[var(--primary)] text-base">{selectedConcept.name}</span>
                      </div>
                    </div>

                    {/* Your CreatePageForm here */}
                    <CreatePageForm
                      selectedWorld={selectedWorld}
                      selectedConcept={selectedConcept}
                      onSuccess={(page) => {
                        router.push(`/worlds/${selectedWorld.id}/concept/${selectedConcept.id}/page/${page.id}`);
                      }}
                      token={token}
                      mode="create"
                    />
                  </motion.div>
                )}



            </AnimatePresence>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
