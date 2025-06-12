"use client";

import { use } from "react";

import React from "react";
import { useAuth } from "../../../../components/auth/AuthProvider";
import { useWorld } from "../../../../lib/useWorld";
import { useWorlds } from "../../../../lib/userWorlds";
import DashboardLayout from "../../../../components/DashboardLayout";
import AuthGuard from "../../../../components/auth/AuthGuard";
import WorldBreadcrumb from "../../../../components/worlds/WorldBreadCrump";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import CardScroller from "@/app/components/template/CardScroller";
import Link from "next/link";
import Image from "next/image";
import { useConcepts } from "@/app/lib/useConcept";
import { HiOutlineDocumentText } from "react-icons/hi2";
export default function GroupPage({ params }) {


  const { worldID, groupID } = use(params);
  const { token } = useAuth();

  const router = useRouter();

  const { world, isLoading: worldLoading } = useWorld(Number(worldID));
  const { worlds, isLoading: worldsLoading } = useWorlds();
  const { concepts, isLoading: conceptsLoading } = useConcepts(Number(worldID));

  const loading = worldLoading || worldsLoading || conceptsLoading;



  const filteredConcepts = concepts
  .filter(c => c.group === groupID)
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const groups = [...new Set(concepts.filter(c => !!c.group).map(c => c.group))];


  if (loading || !world) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-[var(--primary)] text-lg">
        Loading group...
      </div>
    );
  }

  return (
    <AuthGuard>
      <WorldBreadcrumb
        world={world}
        allWorlds={worlds}
        currentGroup={groupID}
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

      <DashboardLayout>
        <div className="pt-6 pb-10 px-4 md:px-12 text-[var(--foreground)]">
          
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
          {/* Left: Icon */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <BookOpen className="text-[var(--primary)] w-12 h-12 mb-2 drop-shadow" />
          </div>

          {/* Right: Info */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--primary)] mb-1">
              Pages about <span className="underline">{groupID}</span>
            </h1>
            <p className="text-base text-black/90 max-w-lg leading-relaxed">
              Dive into the stories and lore grouped under <strong>{groupID}</strong>. These dominions represent a shared theme in your world.
            </p>
          </div>
        </div>


          
          <div className="max-w-5xl mx-auto">          
            <div className="grid gap-y-7 gap-x-2 mt-8 justify-items-center">
 

            <CardScroller
              items={filteredConcepts}
              cardWidth={150}
              cardMaxWidth={200}
              gridCols={4}
              renderCard={concept => (
                <Link
                  href={`/worlds/${world.id}/concept/${concept.id}`}
                  key={concept.id}
                  className="
                    group
                    rounded-2xl
                    bg-white/10
                    border border-white/20
                    shadow-2xl
                    backdrop-blur-xl
                    w-full max-w-[240px] min-h-[210px]
                    flex flex-col items-center justify-start
                    transition-all duration-200
                    hover:shadow-[0_8px_32px_0_rgba(123,47,242,0.17)]
                    hover:border-[var(--primary)]/50
                    hover:bg-[var(--primary)]/10
                    hover:scale-[1.035]
                    relative
                    p-4
                    cursor-pointer
                  "
                  style={{
                    boxShadow: "0 3px 18px 0 #7b2ff232, 0 2px 8px #36205a22",
                  }}
                  title={concept.description || concept.name}
                >
                  {/* Logo in glass circle */}
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white/20 border border-[var(--primary)]/40 shadow-md mb-3 mt-1 overflow-hidden">
                    <Image
                      width={80}
                      height={80}
                      src={concept.logo || "/images/default/concepts/logo.png"}
                      alt={concept.name}
                      className="object-cover w-16 h-16 rounded-full"
                    />
                    <div className="absolute inset-0 rounded-full ring-2 ring-[var(--primary)]/30 pointer-events-none" />
                  </div>
                  {/* Concept Name */}
                  <span
                    className="
                      font-bold text-base text-center text-[var(--primary)]/90 max-w-[92%] truncate block
                      group-hover:text-[var(--primary)] transition
                      mb-2
                    "
                    title={concept.name}
                  >
                    {concept.name}
                  </span>
                  {/* Page count badge */}
                  <span
                    className={`
                      flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--primary)]/15
                      text-[var(--primary)] text-xs font-semibold
                      shadow-sm
                      mb-1
                      ${concept.pages_count > 0 ? "ring-2 ring-[var(--primary)]/40" : ""}
                    `}
                  >
                    <HiOutlineDocumentText className="w-4 h-4" />
                    {concept.pages_count || 0} page{concept.pages_count === 1 ? "" : "s"}
                  </span>
                </Link>
              )}
            />


            </div>


          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
