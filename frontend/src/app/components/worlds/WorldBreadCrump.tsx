"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, BookOpen } from "lucide-react";
import Image from "next/image";
export default function WorldBreadcrumb({
  world = {},
  allWorlds = [],
  concepts = [],
  groups = [],
  currentConcept = null,
  currentGroup = null,
  currentPageName = null,
  onWorldSelect = () => {},
  onConceptGroupSelect = () => {},
}) {
  const [conceptOpen, setConceptOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);

  console.log("INside breadcrum: "+world)
  console.log("INside breadcrum: "+allWorlds)
  useEffect(() => {
    const close = () => {
      setConceptOpen(false);
      setWorldOpen(false);
    };
    window.addEventListener("scroll", close);
    return () => window.removeEventListener("scroll", close);
  }, []);

  const matchedConcept =
    currentConcept?.id && concepts.find((c) => c.id === currentConcept.id);

  return (
    <nav className="sticky top-[64px] z-[5] ml-0 md:ml-[256px] bg-[var(--surface-variant)] shadow-md border-b border-[var(--primary)]/10">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm md:text-base font-medium">
        {/* WORLD SELECTOR */}
        <div className="relative flex items-center">
          <button
            onClick={() => setWorldOpen(!worldOpen)}
            className="flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-[var(--primary)]/10 transition"
          >
            {world.logo && (
              <Image
                src={world.logo}
                alt={world.name}
                width={400}
                height={400}
                className="w-6 h-6 rounded object-cover border border-[var(--primary)]"
              />
            )}
            <span className="truncate max-w-[140px] font-bold">{world.name}</span>
            <ChevronDown className="w-4 h-4 opacity-60" />
          </button>
          {worldOpen && (
            <div className="absolute left-0 mt-2 bg-[var(--background)] border border-[var(--primary)]/20 rounded-xl shadow-lg w-64 z-50 overflow-y-auto max-h-[320px]">
              {allWorlds.map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setWorldOpen(false);
                    onWorldSelect(w);
                  }}
                  className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-[var(--primary)]/10"
                >
                  {w.logo && (
                    <Image
                      src={w.logo}
                      alt={w.name}
                      width={400}
                      height={400}
                      className="w-5 h-5 rounded object-cover border border-[var(--primary)]"
                    />
                  )}
                  <span className="truncate">{w.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONCEPT/GROUP SELECTOR */}
        {(matchedConcept || currentGroup) && (
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 opacity-40" />
            <div className="relative">
              <button
                onClick={() => setConceptOpen(!conceptOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-[var(--primary)]/10 transition"
              >
                {matchedConcept?.logo && (
                  <Image
                    src={matchedConcept.logo}
                    alt={matchedConcept.name}
                    width={400}
                    height={400}
                    className="w-5 h-5 rounded object-cover border border-[var(--primary)]"
                  />
                )}
                <span className="truncate max-w-[120px] font-semibold">
                  {matchedConcept?.name || currentGroup}
                </span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </button>
              {conceptOpen && (
                <div className="absolute left-0 mt-2 bg-[var(--background)] border border-[var(--primary)]/20 rounded-xl shadow-lg w-64 z-50 overflow-y-auto max-h-[320px]">
                  {concepts.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-xs text-[var(--primary)]/70 uppercase font-bold">Concepts</div>
                      {concepts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setConceptOpen(false);
                            onConceptGroupSelect("concept", c);
                          }}
                          className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-[var(--primary)]/10 rounded-lg"
                        >
                          {c.logo && (
                            <Image
                              src={c.logo}
                              alt={c.name}
                              width={400}
                              height={400}
                              className="w-5 h-5 rounded object-cover border border-[var(--primary)]"
                            />
                          )}
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {groups.length > 0 && (
                    <div className="p-2 border-t border-[var(--primary)]/10">
                      <div className="px-2 py-1 text-xs text-[var(--primary)]/70 uppercase font-bold">Groups</div>
                      {groups.map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            setConceptOpen(false);
                            onConceptGroupSelect("group", g);
                          }}
                          className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-[var(--primary)]/10 rounded-lg"
                        >
                          <span className="truncate">{g}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE NAME */}
        {currentPageName && (
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 opacity-40" />
            <div className="flex items-center gap-1 px-2 py-1 text-[var(--primary)]/90">
              <BookOpen className="w-4 h-4" />
              <span className="truncate max-w-[140px] font-medium">{currentPageName}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
