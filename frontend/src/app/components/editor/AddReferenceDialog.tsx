import React, { useState, useEffect } from "react";
import ModalContainer from "../template/modalContainer";
import { getGameWorlds } from "@/app/lib/gameworldsAPI";
import { getPages } from "@/app/lib/pagesAPI";
import Image from "next/image";


export default function AddReferenceDialog({
  open,
  input,
  closeDialog,
  token,
  onInsert
}) {
  const [loading, setLoading] = useState(false);
  const [worlds, setWorlds] = useState([]);
  const [pages, setPages] = useState([]);
  const [search, setSearch] = useState(input || "");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getGameWorlds(token),
      getPages(token)
    ]).then(([ws, ps]) => {
      setWorlds(ws);
      setPages(ps);
      setLoading(false);
    });
  }, [open, token]);

  useEffect(() => {
    // Filter by search string (case-insensitive, page name or world name)
    if (!pages.length || !worlds.length) return setFiltered([]);
    const q = search.toLowerCase();
    setFiltered(
      pages.filter(page => {
        const world = worlds.find(w => w.id === page.gameworld_id);
        return (
          page.name.toLowerCase().includes(q) ||
          (world && world.name.toLowerCase().includes(q))
        );
      })
    );
  }, [search, pages, worlds]);

  if (!open) return null;

  return (
    <ModalContainer title="Add Reference" onClose={closeDialog}>
      <input
        autoFocus
        type="text"
        placeholder="Search for a page or world..."
        className="w-full border rounded px-2 py-1 mb-2"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div className="text-[var(--primary)] py-4">Loading…</div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
          {filtered.map(page => {
            const world = worlds.find(w => w.id === page.gameworld_id);
            return (
              <button
                key={page.id}
                className="flex items-center gap-3 bg-[var(--surface-variant)] hover:bg-[var(--primary)]/15 border border-[var(--primary)]/15 rounded-lg px-2 py-1 transition w-full text-left"
                onClick={() => onInsert({ page, world, label: search || page.name })}
              >
                
                <Image
                  src={world?.logo || "/images/worlds/new_game.png"}
                  alt={world?.name}
                  className="w-7 h-7 object-cover rounded-full border border-[var(--primary)]"   
                  width={400}               
                  height={400}
                />

                
                <div className="flex-1">
                  <span className="block font-bold text-[var(--primary)] text-base leading-tight">{page.name}</span>
                  <span className="block text-xs text-[var(--primary)]/70 font-normal">
                    {world?.name}
                  </span>
                </div>                
                <Image
                  width={400}
                  height={400}
                  src={page.logo || "/images/pages/concept/concept.png"}
                  alt={page.name}
                  className="w-8 h-8 object-cover rounded-md border border-[var(--primary)]"
                />
              </button>
            );
          })}
          {!loading && !filtered.length && (
            <div className="text-[var(--primary)]/60 py-6 text-center">No results</div>
          )}
        </div>
      )}
    </ModalContainer>
  );
}
