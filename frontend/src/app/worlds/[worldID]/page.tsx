"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "../../components/auth/AuthProvider";
// import EditableContent from "../../components/editor/EditableContent";
import { updateGameWorld } from "../../lib/gameworldsAPI";
import { useWorld } from "../../lib/useWorld";
import { useWorlds } from "../../lib/userWorlds";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { useConcepts } from "../../lib/useConcept";
import { useAgents } from "../../lib/useAgents";
import WorldFormModal from "../../components/worlds/WorldFormModal";
import { FaSearch } from "react-icons/fa";
import Link from "next/link";
import WorldBreadcrumb from "@/app/components/worlds/WorldBreadCrump";
import ModalContainer from "../../components/template/modalContainer";
import { useUsers } from "@/app/lib/useUsers";
import { HiOutlineDocumentText } from "react-icons/hi2";
import Image from "next/image";
import { FaRegObjectGroup } from "react-icons/fa6"; // or FaUserFriends, FaRegObjectGroup, etc.
import { FaUsers } from "react-icons/fa6"; // or FaUserFriends, FaRegObjectGroup, etc.

export default function WorldDetailPage({ params }) {
  const { worldID } = use(params);
  const { user, token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const router = useRouter();

  const { world, mutate: mutateWorld, isLoading: worldLoading } = useWorld(Number(worldID));
  const { worlds, isLoading: worldsLoading } = useWorlds();
  const { users, isLoading: usersLoading } = useUsers();
  const { concepts, isLoading: conceptsLoading } = useConcepts(Number(worldID));
  const { agents, isLoading: agentsLoading } = useAgents(Number(worldID));

  const loading = worldLoading || worldsLoading || usersLoading || conceptsLoading;
  const [saving, setSaving] = useState(false);
  

  async function handleSaveContent(newContent) {
    if (!worldID || !token) return;
    
    try {
      await updateGameWorld(Number(worldID), { content: newContent }, token);
      mutateWorld();
    } finally {
      
    }
  }

  async function handleSaveWorld(updatedData) {
    if (!worldID || !token) return;
    setSaving(true);
    try {
      await updateGameWorld(Number(worldID), updatedData, token);
      mutateWorld();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) return <div>Loading world...</div>;
  if (!world) return <div>World not found.</div>;

  const canEditWorld = user && (user.role === "world builder" || user.role === "system admin");
  const highlightConcepts = concepts.filter(c => !c.group && c.display_on_world);
  const highlightGroups = Array.from(new Set(concepts.filter(c => c.group).map(c => c.group)));
  const conversationalAgents = agents.filter(a => a.task === "conversational");
  const specialistAgents = agents.filter(a => a.task === "specialist");

  const creator =
  users && users.length
    ? users.find((u) => u.id === world.created_by)
    : null;

  return (
    <AuthGuard>
      <WorldBreadcrumb
        world={world}
        allWorlds={worlds}
        onWorldSelect={(w) => router.push(`/worlds/${w.id}`)}
      />
      <DashboardLayout>
        <div className="pt-0 w-full min-h-screen bg-[var(--background)] text-[var(--foreground)] py-0 px-0">

        {/* HEADER */}

        <div
      className="relative w-full  mx-auto rounded-2xl md:rounded-3xl -mt-3 mb-14 p-4 md:p-2 shadow-2xl border border-white/20 backdrop-blur-[14px] bg-gradient-to-br from-[#29196620] via-[#7b2ff25] to-[#36205a15] bg-white/15"

      style={{ boxShadow: "0 6px 40px 0 #7b2ff225, 0 1.5px 8px #2e205933" }}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 w-full">
        <div className="relative flex-shrink-0" onClick={() => setZoomOpen && setZoomOpen(true)}>
          <Image
            width={400}
            height={400}
            src={world.logo || "/images/default/worlds/logo.png"}
            alt={world.name}
            className="w-28 h-28 md:w-48 md:h-48 rounded-2xl object-cover border-2 border-[var(--primary)] shadow-xl cursor-pointer hover:scale-105 transition duration-200"
          />
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3 flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--primary)] tracking-tight drop-shadow">
            {world.name}
          </h1>
          <p className="text-base md:text-lg text-black/90 leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: world.description || "" }} />
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2 text-xs font-semibold">
            <span className="bg-[var(--primary)]/10 rounded-full px-3 py-1 border border-[var(--primary)]/20 text-[var(--primary)] shadow-sm">
              System: {world.system}
            </span>
            <span className="bg-[var(--primary)]/10 rounded-full px-3 py-1 border border-[var(--primary)]/20 text-[var(--primary)] shadow-sm">
              Created by: {creator ? creator.nickname || creator.email : world.created_by}
            </span>
            <span className="bg-[var(--primary)]/10 rounded-full px-3 py-1 border border-[var(--primary)]/20 text-[var(--primary)] shadow-sm">
              Created on: {new Date(world.created_at).toLocaleDateString()}
            </span>
            <span className="bg-[var(--primary)]/10 rounded-full px-3 py-1 border border-[var(--primary)]/20 text-[var(--primary)] shadow-sm">
              Edited on: {world.edited_at ? new Date(world.edited_at).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>



        {/* Highlight Concepts */}
        <div className="max-w-6xl mx-auto px-4 md:px-0 mb-10">
  <h2 className="text-xl font-bold text-[var(--primary)] mb-4">Explore This World</h2>
  <div  
    className="
      grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
      gap-6 justify-items-center
    "
  >
    {highlightConcepts.map((concept) => (
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
          w-full max-w-[220px] min-h-[260px]
          flex flex-col items-center justify-start
          transition-all duration-200
          hover:shadow-[0_6px_28px_0_rgba(123,47,242,0.17)]
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
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-white/20 border border-[var(--primary)]/40 shadow-md mb-3 mt-2 overflow-hidden">
          <Image
            width={80}
            height={80}
            src={concept.logo || "/images/default/concepts/logo.png"}
            alt={concept.name}
            className="object-cover w-36 h-36 rounded-full"
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-[var(--primary)]/40 pointer-events-none" />
        </div>
        {/* Concept Name */}
        <span
          className="
            font-bold text-base text-center text-[var(--primary)]/90 max-w-[90%] truncate block
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
    ))}
  </div>
</div>

<div className="max-w-6xl mx-auto px-4 md:px-0 mb-14">
  <h2 className="text-lg font-bold text-[var(--primary)] mb-8 flex items-center gap-2">
    <FaUsers className="text-[var(--primary)]" /> Looking for something specific?
  </h2>
  <div className="flex flex-wrap gap-4">
    {highlightGroups.map((group) => (
      <Link href={`/worlds/${world.id}/group/${group}`} key={group}>
        <div
          className="
            flex items-center gap-2
            rounded-full
            bg-white/10
            border border-white/20
            shadow-lg
            px-5 py-2.5
            text-[var(--primary)]
            font-semibold
            text-base
            cursor-pointer
            transition-all duration-150
            hover:bg-[var(--primary)]/15
            hover:border-[var(--primary)]/50
            hover:text-white
            hover:scale-[1.04]
            active:scale-100
            select-none
            backdrop-blur-[5px]
          "
          title="View group"
          tabIndex={0}
          style={{
            minWidth: "120px",
            letterSpacing: ".01em",
            boxShadow: "0 3px 12px 0 #7b2ff224",
          }}
        >
          <FaRegObjectGroup className="w-5 h-5 opacity-80" />
          <span className="truncate">{group}</span>
        </div>
      </Link>
    ))}
  </div>
</div>

{/* Agents Section */}
<div className="max-w-6xl mx-auto px-4 md:px-0 mb-14">
  <div
    className="relative overflow-hidden rounded-2xl md:rounded-3xl mb-8 p-6 shadow-2xl border border-white/20 backdrop-blur-[14px] bg-gradient-to-br from-[#29196620] via-[#7b2ff25] to-[#36205a15] bg-white/15 flex flex-col items-center text-center"
    style={{ boxShadow: "0 6px 40px 0 #7b2ff225, 0 1.5px 8px #2e205933" }}
  >
    <Image
      src="/images/default/avatars/logo.png"
      alt="Agents"
      width={120}
      height={120}
      className="w-24 h-24 rounded-full object-cover border-2 border-[var(--primary)] shadow-xl mb-4"
    />
    <h2 className="text-2xl md:text-3xl font-bold text-[var(--primary)] mb-2">
      Meet the Agents of {world.name}
    </h2>
    <p className="text-base md:text-lg text-[var(--foreground)]/80 max-w-xl">
      Speak with knowledgeable Elders or consult a Specialist dedicated to this world.
    </p>
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute left-4 top-4 w-24 h-24 bg-[var(--primary)]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute right-10 bottom-6 w-32 h-32 bg-[var(--accent)]/20 rounded-full blur-3xl" />
    </div>
  </div>

  {agentsLoading ? (
    <div className="text-center text-[var(--primary)]">Loading agents...</div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
      {[...conversationalAgents, ...specialistAgents].map(agent => (
        <Link
          key={agent.id}
          href={agent.task === "specialist" ? `/ai_specialist/specialist_chat?agent=${agent.id}` : `/elders/${agent.id}`}
          className="group bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 flex flex-col items-center w-full max-w-[240px] hover:scale-105 hover:border-[var(--primary)]/60 transition"
        >
          <Image
            src={agent.logo || "/images/default/avatars/logo.png"}
            alt={agent.name}
            width={200}
            height={200}
            className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-[var(--primary)]"
          />
          <h3 className="text-lg font-bold text-[var(--primary)] text-center mb-1 truncate w-full">
            {agent.name}
          </h3>
          <p className="text-xs text-[var(--foreground)]/70">
            {agent.task === "specialist" ? `Specialist on ${world.system}` : "Elder"}
          </p>
        </Link>
      ))}
    </div>
  )}
</div>

          {/* Full Width Editable Content */}
          
          {/* <EditableContent
            id="world-content-editor"
            content={world.content}
            canEdit={canEditWorld}
            onSaveContent={handleSaveContent}            
            pageType="worlds"
            pageName={world.name}
            className="w-full min-h-[300px] text-base md:text-lg prose prose-invert max-w-none"          
          />             */}
      

          <WorldFormModal
            open={modalOpen}
            initialData={world}
            onSubmit={handleSaveWorld}
            loading={saving}
            worlds={[]}
            onClose={() => setModalOpen(false)}
          />

          {zoomOpen && (
            <ModalContainer title={world.name} onClose={() => setZoomOpen(false)}>
              <Image
                      width={400}
                      height={400}                   
                src={world.logo || "/images/worlds/new_game.png"}
                alt="Zoomed Logo"
                className="w-full h-auto rounded-xl border border-[var(--primary)] object-contain"
              />
            </ModalContainer>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
