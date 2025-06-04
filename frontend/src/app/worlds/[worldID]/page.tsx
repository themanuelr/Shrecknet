"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/auth/AuthProvider";
import EditableContent from "../../components/editor/EditableContent";
import { getGameWorld, updateGameWorld, getGameWorlds } from "../../lib/gameworldsAPI";
import DashboardLayout from "../../components/DashboardLayout";
import AuthGuard from "../../components/auth/AuthGuard";
import { getConcepts } from "../../lib/conceptsAPI";
import WorldFormModal from "../../components/worlds/WorldFormModal";
import { FaSearch } from "react-icons/fa";
import Link from "next/link";
import WorldBreadcrumb from "@/app/components/worlds/WorldBreadCrump";
import ModalContainer from "../../components/template/modalContainer";
import { getUsers } from "@/app/lib/usersApi";
import Image from "next/image";


export default function WorldDetailPage({ params }) {
  const { worldID } = use(params);
  const { user, token } = useAuth();
  const [world, setWorld] = useState(null);
  const [concepts, setConcepts] = useState([]);  
  const [loading, setLoading] = useState(true);  
  const [modalOpen, setModalOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [worlds, setWorlds] = useState([]);
  const [users, setUsers] = useState([]);
  const router = useRouter();
  
  useEffect(() => {
    if (!worldID || !token) return;
    async function load() {
      try {
        const [single, all] = await Promise.all([
          getGameWorld(Number(worldID), token),
          getGameWorlds(token),
        ]);
        setWorld(single);
        setWorlds(all);
      } catch (err) {
        console.error("Failed to load world or worlds", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [worldID, token]);

  useEffect(() => {
    if (!token) return;
    getUsers(token)
      .then(setUsers)
      .catch((err) => console.error("User fetch error:", err));
  }, [token]);

  useEffect(() => {
    if (!worldID || !token) return;
    getConcepts(token, { gameworld_id: worldID })
      .then(setConcepts)
      .catch((err) => console.error("Concept fetch error:", err));


  }, [worldID, token]);

  async function handleSaveContent(newContent) {
    if (!worldID || !token) return;
    
    try {
      const updated = await updateGameWorld(Number(worldID), { content: newContent }, token);
      setWorld(updated);
    } finally {
      
    }
  }

  async function handleSaveWorld(updatedData) {
    if (!worldID || !token) return;
    setLoading(true);
    try {
      const updated = await updateGameWorld(Number(worldID), updatedData, token);
      setWorld(updated);
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <div>Loading world...</div>;
  if (!world) return <div>World not found.</div>;

  const canEditWorld = user && (user.role === "world builder" || user.role === "system admin");
  const highlightConcepts = concepts.filter(c => !c.group && c.display_on_world);
  const highlightGroups = Array.from(new Set(concepts.filter(c => c.group).map(c => c.group)));

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
        <div className="pt-2 w-full min-h-screen bg-[var(--background)] text-[var(--foreground)] py-0 px-0">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-3 mb-12">
            <div className="relative">
              <Image
                      width={400}
                      height={400}                   
                src={world.logo || "/images/default/worlds/logo.png"}
                alt={world.name}
                onClick={() => setZoomOpen(true)}
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-2 border-[var(--primary)] shadow-md cursor-pointer hover:scale-105 transition"
              />
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--primary)] tracking-tight">{world.name}</h1>
            <p className="text-sm text-[var(--foreground)]/80" dangerouslySetInnerHTML={{ __html: world.description || "" }} />
            <div className="flex flex-wrap justify-center gap-2 mt-2 text-[10px] md:text-xs font-semibold">
              <span className="bg-[var(--primary)]/10 rounded-full px-2 py-0.5 border border-[var(--primary)]/20 text-[var(--primary)]">
                System: {world.system}
              </span>
              <span className="bg-[var(--primary)]/10 rounded-full px-2 py-0.5 border border-[var(--primary)]/20 text-[var(--primary)]">
                Created by: {creator ? creator.nickname || creator.email : world.created_by}
              </span>
              <span className="bg-[var(--primary)]/10 rounded-full px-2 py-0.5 border border-[var(--primary)]/20 text-[var(--primary)]">
                Created: {new Date(world.created_at).toLocaleDateString()}
              </span>
              <span className="bg-[var(--primary)]/10 rounded-full px-2 py-0.5 border border-[var(--primary)]/20 text-[var(--primary)]">
                Edited: {world.edited_at ? new Date(world.edited_at).toLocaleDateString() : "-"}
              </span>
            </div>
          </div>

        {/* Highlight Concepts */}
        {highlightConcepts.length > 0 && (
  <div className="max-w-6xl mx-auto px-4 md:px-0 mb-10">
    <h2 className="text-xl font-bold text-[var(--primary)] mb-3">Explore This World</h2>
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 gap-y-5"
      style={{ justifyItems: "center" }}
    >
            {highlightConcepts.map((concept) => (
              <Link href={`/worlds/${world.id}/concept/${concept.id}`} key={concept.id}>
                <div
                  className={`
                    rounded-3xl
                    bg-[var(--surface-variant)]/30 
                    border border-[var(--primary)]/10
                    shadow-[0_2px_12px_0_rgba(90,60,150,0.06)]
                    p-2.5 flex flex-col items-center
                    transition
                    cursor-pointer
                    hover:shadow-[0_4px_24px_0_rgba(123,47,242,0.16)]
                    hover:border-[var(--primary)]/50
                    hover:bg-[var(--primary)]/10
                    active:shadow-[0_2px_12px_0_rgba(123,47,242,0.10)]
                    min-w-[150px] max-w-[180px] w-[94%] md:w-[90%] lg:w-[85%]
                  `}
                  style={{
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                  }}
                >
                  <Image
                      width={400}
                      height={400}                       
                    src={concept.logo || "/images/default/concepts/logo.png"}
                    alt={concept.name}
                    className=""
                    style={{
                      transition: "box-shadow 0.2s, border 0.2s",
                    }}
                  />
                  <span className="text-base text-center font-semibold text-[var(--primary)] break-words mt-2 mb-1 px-1.5" style={{
                    letterSpacing: ".01em"
                  }}>
                    {concept.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

        {highlightGroups.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 md:px-0 mb-14">
            <h2 className="text-lg font-bold text-[var(--primary)] mb-3 flex items-center gap-2">
              <FaSearch className="text-[var(--primary)]" /> Looking for something specific?
            </h2>
            <div className="flex flex-wrap gap-3">
              {highlightGroups.map((group) => (
                <Link href={`/worlds/${world.id}/group/${group}`} key={group}>
                  <div
                    className={`
                      rounded-2xl
                      bg-[var(--surface-variant)]/25
                      border border-[var(--primary)]/10
                      shadow-[0_2px_12px_0_rgba(123,47,242,0.05)]
                      px-5 py-2
                      text-[var(--primary)]
                      font-semibold
                      text-base
                      cursor-pointer
                      transition
                      hover:bg-[var(--primary)]/10
                      hover:border-[var(--primary)]/40
                      hover:shadow-[0_4px_24px_0_rgba(123,47,242,0.10)]
                      focus-visible:ring-2 focus-visible:ring-[var(--primary)]
                      backdrop-blur-sm
                      select-none
                    `}
                    style={{
                      minWidth: "110px",
                      textAlign: "center",
                      letterSpacing: ".01em",
                      WebkitBackdropFilter: "blur(4px)",
                      backdropFilter: "blur(4px)",
                    }}
                    tabIndex={0}
                  >
                    {group}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

          {/* Full Width Editable Content */}
          
          <EditableContent
            id="world-content-editor"
            content={world.content}
            canEdit={canEditWorld}
            onSaveContent={handleSaveContent}            
            pageType="worlds"
            pageName={world.name}
            className="w-full min-h-[300px] text-base md:text-lg prose prose-invert max-w-none"          
          />            
      

          <WorldFormModal
            open={modalOpen}
            initialData={world}
            onSubmit={handleSaveWorld}
            loading={loading}
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
