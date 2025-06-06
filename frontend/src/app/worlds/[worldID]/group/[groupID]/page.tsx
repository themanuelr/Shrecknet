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
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center justify-center text-center">
              <BookOpen className="text-[var(--primary)] w-10 h-10 mb-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--primary)] mb-1">
                Pages about <span className="underline">{groupID}</span>
              </h1>
              <p className="text-sm text-[var(--foreground)]/80 max-w-lg">
                Dive into the stories and lore grouped under <strong>{groupID}</strong>. These dominions represent a shared theme in your world.
              </p>
            </div>

            <div className="grid gap-y-7 gap-x-2 mt-8 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
 

            <CardScroller
              items={filteredConcepts}
              cardWidth={150}
              cardMaxWidth={200}
              gridCols={4}
              renderCard={concept => (
                <Link
                  key={concept.id}
                  href={`/worlds/${world.id}/concept/${concept.id}`}
                  className="flex flex-col items-center text-center w-full h-full"
                  style={{ textDecoration: 'none' }}
                >
                  <Image
                      width={400}
                      height={400}                       
                    src={concept.logo || "/images/pages/concept/concept.png"}
                    alt={concept.name}
                    className="w-80 h-40 rounded-2xl border border-[var(--primary)]/20 object-cover mb-1 mt-1 bg-white/70 shadow-sm group-hover:scale-105 transition"
                    style={{
                      transition: "box-shadow 0.2s, border 0.2s",
                    }}
                  />
                  <div className="w-full flex flex-col items-center">
                  <h3 className="text-[var(--primary)] font-bold text-base mt-2 mb-0.5 break-words px-2">
                      {concept.name}
                    </h3>
                    <p className="text-xs text-[var(--foreground)]/70">
                      {concept.pages_count || 0} page{concept.pages_count === 1 ? "" : "s"}
                    </p>
                  </div>
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
