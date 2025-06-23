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
import { useTranslation } from "../../../hooks/useTranslation";
export default function ConceptPage({ params }) {
  const { conceptID } = use(params);
  const { token } = useAuth();
  const { t } = useTranslation();

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
        {t("loading_concept")}
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
            
          <div
      className="
        rounded-2xl md:rounded-3xl -mt-3 mb-12 p-4 md:p-3
        shadow-2xl border border-white/20
        backdrop-blur-[14px]
        bg-gradient-to-br from-[#29196620] via-[#7b2ff25] to-[#36205a15] bg-white/15
        flex flex-col md:flex-row items-center gap-8
      "
      style={{ boxShadow: "0 6px 40px 0 #7b2ff225, 0 1.5px 8px #2e205933" }}
    >
      {/* Left: Concept logo */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center">
        {concept.logo && (
          <>
            <Image
              width={160}
              height={200}
              src={concept.logo}
              alt={concept.name}
              className="w-32 h-40 md:w-36 md:h-48 rounded-2xl border-2 border-[var(--primary)] object-cover mb-2 shadow-lg hover:scale-105 transition"              
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
      </div>

      {/* Right: Info */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-3 mb-30">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--primary)] tracking-tight drop-shadow">
          {concept.name}
        </h1>
        {concept.description && (
          <p className="text-base md:text-lg text-black/90 leading-relaxed font-normal max-w-2xl ">
            {concept.description}
          </p>
        )}
      </div>
    </div>

            {/* Search bar */}
            <div className="flex items-center justify-between mt-10 mb-6">
              <h2 className="text-xl font-bold">{t("pages_heading")} ({filteredPages.length})</h2>
              <div className="flex items-center gap-2">
                <FaSearch className="text-[var(--primary)]" />
                <input
                  type="text"
                  placeholder={t("search_pages_placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] focus:outline-none focus:ring focus:border-[var(--primary)]"
                />
              </div>
            </div>

            {/* Pages grid */}
            <div className="grid gap-y-7 gap-x-2 mt-8  justify-items-center">
            <CardScroller
              items={filteredPages}
              cardWidth={200}
              cardMaxWidth={250}
              gridCols={2}
              renderCard={page => (
                <a
                  href={`/worlds/${world.id}/concept/${concept.id}/page/${page.id}`}
                  className="flex flex-col items-center text-center w-full h-full group"
                  style={{ textDecoration: 'none' }}
                >
                  {page.logo && (
                    <div className="relative flex items-center justify-center w-full">
                      <Image
                        width={320}
                        height={160}
                        src={page.logo}
                        alt={page.name}
                        className="w-full h-36 sm:h-40 object-cover rounded-xl border border-[var(--primary)]/20 shadow-lg bg-white/50 transition group-hover:scale-105"
                      />
                      {/* Optional: Glass badge or icon in the top-right corner */}
                      {/* <span className="absolute top-2 right-2 bg-white/70 rounded-full p-1 shadow-sm"><HiOutlineDocumentText className="text-[var(--primary)] w-5 h-5" /></span> */}
                    </div>
                  )}
                  <div className="w-full flex flex-col items-center mt-2">
                    <h3 className="text-[var(--primary)] font-extrabold text-lg mb-1 px-2 break-words group-hover:text-white transition">
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
