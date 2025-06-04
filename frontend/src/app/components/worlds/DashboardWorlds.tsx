"use client";
import { useState } from "react";
import { useWorlds } from "@/app/lib/userWorlds";
import { hasRole } from "@/app/lib/roles";
import {
  createGameWorld,
  updateGameWorld,
  deleteGameWorld,
} from "@/app/lib/gameworldsAPI";
import { useAuth } from "../auth/AuthProvider";
import WorldFormModal from "./WorldFormModal";
import ImportWorldModal from "../importexport/ImportWorldModal";
import { ConfirmDeleteWorldModal } from "../template/ConfirmModal";
import { FaEdit, FaTrash } from "react-icons/fa";
import Image from "next/image";


export default function DashboardWorlds({
  titleText = "",
  showEdit = true,
  showCreateButton = true,
  linkURL = "worlds",
}) {
  const { user, token } = useAuth();
  const { worlds, mutate, isLoading, error } = useWorlds(token);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWorld, setEditingWorld] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deletingWorld, setDeletingWorld] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showSuccess, setShowSuccess] = useState("");

  // CREATE world
  async function handleCreateWorld(data) {
    setLoading(true);
    setFormError("");
    try {
      await createGameWorld(data, token);
      setCreateModalOpen(false);
      setShowSuccess("World created!");
      setTimeout(() => setShowSuccess(""), 1800);
      mutate();
    } catch (err) {
      setFormError(err?.detail || err?.message || "Failed to create world");
    }
    setLoading(false);
  }

  // EDIT world
  async function handleEditWorld(data) {
    setLoading(true);
    setFormError("");
    try {
      await updateGameWorld(editingWorld.id, data, token);
      setEditModalOpen(false);
      setEditingWorld(null);
      setShowSuccess("World updated!");
      setTimeout(() => setShowSuccess(""), 1800);
      mutate();
    } catch (err) {
      setFormError(err?.detail || err?.message || "Failed to update world");
    }
    setLoading(false);
  }

  // DELETE world
  async function handleDeleteWorld() {
    if (!deletingWorld) return;
    setLoading(true);
    try {
      await deleteGameWorld(deletingWorld.id, token);
      setDeletingWorld(null);
      setShowSuccess("World deleted!");
      setTimeout(() => setShowSuccess(""), 1800);
      mutate();
    } catch (err) {
      setFormError(err?.detail || err?.message || "Failed to delete world");
    }
    setLoading(false);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <span className="text-lg text-[var(--primary)] animate-pulse">Loading worlds...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <span className="text-lg text-red-500">Error loading worlds. Please try again.</span>
      </div>
    );
  }

  
  
  if (!worlds || worlds.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center my-20 opacity-80">
        <span className="text-6xl mb-2">✨</span>
        <h3 className="text-xl font-bold mb-1">No worlds yet!</h3>
        <p className="mb-3 text-sm">Create your first universe to begin your adventure.</p>
        {hasRole(user?.role, "world builder") && (
          <div className="flex gap-3">
            <button
              className="px-6 py-2 rounded-xl font-bold shadow bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)] border border-[var(--primary)]/30 transition"
              onClick={() => setCreateModalOpen(true)}
            >
              + Create World
            </button>
            <button
              className="px-6 py-2 rounded-xl font-semibold shadow bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--surface-variant)] transition"
              onClick={() => setImportModalOpen(true)}
            >
              ⬆ Import World
            </button>
          </div>
        )}


      <WorldFormModal
        open={createModalOpen}
        initialData={null}
        onSubmit={handleCreateWorld}
        loading={loading}
        error={formError}
        worlds={worlds}
        onClose={() => {
          setCreateModalOpen(false);
          setFormError("");
        }}
      />

    
      <ImportWorldModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          setImportModalOpen(false);
          mutate();
        }}
      />

      </div>

      
    );

    
  }

  return (
    <div className="relative w-full">
      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-4 rounded-xl shadow-lg z-[1000] text-lg animate-fade-in-out">
          {showSuccess}
        </div>
      )}

      {/* Error */}
      {formError && (
        <div className="w-full text-center bg-red-100 text-red-700 rounded-lg py-2 px-6 mb-4">
          {formError}
        </div>
      )}

      {/* ACTION BAR (desktop only) */}
      {hasRole(user?.role, "world builder") && (
        <div className="hidden md:flex items-center justify-end gap-3 mb-8">
          <button
            className="px-6 py-2 rounded-xl font-bold shadow bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] hover:text-[var(--primary)] border border-[var(--primary)]/30 transition"
            onClick={() => setCreateModalOpen(true)}
          >
            + Create World
          </button>
          <button
            className="px-6 py-2 rounded-xl font-semibold shadow bg-transparent border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--surface-variant)] transition"
            onClick={() => setImportModalOpen(true)}
          >
            ⬆ Import World
          </button>
        </div>
      )}

      {/* Worlds grid */}
      <div className="w-full flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-center text-[var(--primary)] mb-8 tracking-wide">
          {titleText}
        </h1>
        <div className="grid gap-10 sm:gap-12 md:gap-14 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center w-full">
          {worlds.map((world) => (
            <div
              key={world.id}
              className="
                group relative w-[260px] sm:w-[330px] md:w-[380px] max-w-full
                bg-[var(--card-bg)]/95 rounded-3xl shadow-2xl border border-[var(--border)]
                flex flex-col items-center p-0 overflow-hidden
                hover:shadow-3xl hover:scale-105 hover:border-[var(--primary)]/60
                transition-all duration-200
              "
              style={{
                backdropFilter: "blur(5px) saturate(1.1)",
              }}
            >
              {/* Edit/Delete floating top-right */}
              {showEdit && hasRole(user?.role, "world builder") && (
                <div className="absolute right-5 top-5 z-30 flex flex-col gap-3 items-center">
                  {/* Edit */}
                  <button
                    className="p-3 bg-white/70 border border-[var(--primary)] rounded-xl shadow hover:bg-[var(--primary)]/20 hover:scale-110 transition"
                    title="Edit"
                    onClick={() => {
                      setEditingWorld(world);
                      setEditModalOpen(true);
                    }}
                  >
                    <FaEdit className="text-[var(--primary)]" />
                  </button>
                  {/* Delete */}
                  <button
                    className="p-3 bg-white/70 border border-red-300 rounded-xl shadow hover:bg-red-100 hover:scale-110 transition"
                    title="Delete"
                    onClick={() => setDeletingWorld(world)}
                  >
                    <FaTrash className="text-red-500" />
                  </button>
                </div>
              )}
              <a href={`/${linkURL}/${world.id}`} className="w-full block group">
                <div className="relative w-full h-[220px] sm:h-[320px] md:h-[250px] overflow-hidden rounded-t-3xl">
                  <Image
                    src={world.logo || "/images/worlds/new_game.png"}
                    alt={world.name}
                    className="w-full h-full object-cover object-center rounded-t-3xl transition"
                    width={400}
                    height={400}
                  />
                  <div className="
                    absolute bottom-0 left-0 w-full
                    bg-[var(--background)]/55 backdrop-blur-xl
                    py-4 px-3 flex items-center justify-center
                    rounded-b-3xl z-10
                    "
                  >
                    <span className="text-xl font-bold text-[var(--primary)] text-center drop-shadow">
                      {world.name}
                    </span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Create FAB for mobile */}
      {showCreateButton && hasRole(user?.role, "world builder") && (
        <button
          className="fixed bottom-8 right-8 bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-3 px-6 rounded-full shadow-lg hover:bg-[var(--accent)] hover:text-[var(--background)] border border-[var(--primary)]/30 transition md:hidden"
          onClick={() => setCreateModalOpen(true)}
        >
          + Create World
        </button>
      )}

      {/* Modals */}
    
      <WorldFormModal
        open={createModalOpen}
        initialData={null}
        onSubmit={handleCreateWorld}
        loading={loading}
        error={formError}
        worlds={worlds}
        onClose={() => {
          setCreateModalOpen(false);
          setFormError("");
        }}
      />

      
      <WorldFormModal
        open={editModalOpen}
        initialData={editingWorld}
        onSubmit={handleEditWorld}
        loading={loading}
        error={formError}
        worlds={worlds}
        onClose={() => {
          setEditModalOpen(false);
          setEditingWorld(null);
          setFormError("");
        }}
      />

      <ImportWorldModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          setImportModalOpen(false);
          mutate();
        }}
      />

      <ConfirmDeleteWorldModal
        world={deletingWorld}
        open={!!deletingWorld}
        loading={loading}
        onConfirm={handleDeleteWorld}
        onCancel={() => setDeletingWorld(null)}
      /> 
    </div>
  );
}
