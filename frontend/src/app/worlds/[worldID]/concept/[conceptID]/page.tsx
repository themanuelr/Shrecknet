"use client";
import { use } from "react";
import React, { useState } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useWorld } from "@/app/lib/useWorld";
import { useWorlds } from "@/app/lib/userWorlds";
import { useConceptById } from "@/app/lib/useConceptById";
import { usePagesForConcept } from "@/app/lib/usePagesForConcept";
import DashboardLayout from "@/app/components/DashboardLayout";
import AuthGuard from "@/app/components/auth/AuthGuard";
import WorldBreadcrumb from "@/app/components/worlds/WorldBreadCrump";
import { useRouter } from "next/navigation";
import { useConcepts } from "@/app/lib/useConcept";
import { FaSearch } from "react-icons/fa";
import ModalContainer from "@/app/components/template/modalContainer";
import CardScroller from "@/app/components/template/CardScroller";
import Image from "next/image";
export default function ConceptPage({ params }) {
  const { conceptID } = use(params);
  const { token } = useAuth();

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);

  const { concept, isLoading: conceptLoading } = useConceptById(Number(conceptID));
  const { world, isLoading: worldLoading } = useWorld(concept?.gameworld_id);
  const { worlds, isLoading: worldsLoading } = useWorlds();
  const { pages, isLoading: pagesLoading } = usePagesForConcept(Number(conceptID));
  const { concepts } = useConcepts(world?.id);

  const loading = conceptLoading || worldLoading || worldsLoading || pagesLoading;

  const filteredPages = pages
  .filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const groups = [...new Set(concepts.filter(c => !!c.group).map(c => c.group))];

  if (loading || !concept || !world) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-[var(--primary)] text-lg">
        Loading concept...
      </div>
    );
  }

  return (
    <AuthGuard>
      {world && concept && concepts.length > 0 && worlds.length > 0 && (
        <WorldBreadcrumb
            world={world}
            allWorlds={worlds}
            currentConcept={concept}
            concepts={concepts}
            groups={groups}
            onWorldSelect={(w) => router.push(`/worlds/${w.id}`)}
            onConceptGroupSelect={(type, value) => {
              if (type === "concept") {
                router.push(`/worlds/${world.id}/concept/${value.id}`);
              } else {
                router.push(`/worlds/${world.id}/group/${value}`);
              }
            }}
          />
          )}
      <DashboardLayout>
       
          
    
        <div className="pt-4 pb-10 px-4 md:px-12 text-[var(--foreground)]">
          <div className="max-w-5xl mx-auto">
            
            <div className="flex flex-col items-center justify-center text-center">

            {concept.logo && (
                <>
                  <Image
                      width={400}
                      height={400}                       
                    src={concept.logo}
                    alt={concept.name}
                    className="w-32 h-40 rounded-2xl border border-[var(--primary)] object-cover mb-4 shadow-md cursor-pointer hover:scale-105 transition"
                    onClick={() => setZoomOpen(true)}
                    style={{ background: "#fff" }}
                  />
                  {zoomOpen && (
                    <ModalContainer title={concept.name} onClose={() => setZoomOpen(false)}>
                      <Image
                      width={400}
                      height={400}                           
                        src={concept.logo}
                        alt={concept.name}
                        className="max-w-full max-h-[70vh] rounded-3xl border-2 border-[var(--primary)] shadow-xl object-contain mx-auto"
                      />
                    </ModalContainer>
                  )}
                </>
              )}
              <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">
                {concept.name}
              </h1>
              <p className="text-sm text-[var(--foreground)]/80 max-w-xl">
                {concept.description}
              </p>
            </div>

            {/* Search bar */}
            <div className="flex items-center justify-between mt-10 mb-6">
              <h2 className="text-xl font-bold">Pages ({filteredPages.length})</h2>
              <div className="flex items-center gap-2">
                <FaSearch className="text-[var(--primary)]" />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] focus:outline-none focus:ring focus:border-[var(--primary)]"
                />
              </div>
            </div>

            {/* Pages grid */}
            <div className="grid gap-y-7 gap-x-2 mt-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
            <CardScroller
              items={filteredPages}
              cardWidth={200}
              cardMaxWidth={250}
              gridCols={4}
              renderCard={page => (
                <a
                  href={`/worlds/${world.id}/concept/${concept.id}/page/${page.id}`}
                  className="flex flex-col items-center text-center w-full h-full"
                  style={{ textDecoration: 'none' }}
                >
                  {page.logo && (
                    <Image
                      width={400}
                      height={400}                      
                      src={page.logo}
                      alt={page.name}
                      className="w-100 h-40 rounded-2xl border border-[var(--primary)]/20 object-cover mb-1 mt-1 bg-white/70 shadow-sm group-hover:scale-105 transition"
                    />
                  )}
                  <div className="w-full flex flex-col items-center">
                    <h3 className="text-[var(--primary)] font-bold text-base mt-2 mb-0.5 break-words px-2">
                      {page.name}
                    </h3>                   
                  </div>
                </a>
              )}
            />  
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
