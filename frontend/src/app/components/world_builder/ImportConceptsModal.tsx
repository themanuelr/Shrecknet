"use client";

import { useEffect, useState } from "react";
import ModalContainer from "../template/modalContainer";
import { useWorlds } from "@/app/lib/userWorlds";
import { getConcepts, createConcept } from "@/app/lib/conceptsAPI";
import { getCharacteristics, createCharacteristic, getCharacteristicsForConcept } from "@/app/lib/characteristicsAPI";
import { useAuth } from "@/app/components/auth/AuthProvider";
import Image from "next/image";

export default function ImportConceptsModal({ currentWorld, existingConcepts, onClose, onImport }) {
  const { token } = useAuth();
  const { worlds } = useWorlds(token);

  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [availableConcepts, setAvailableConcepts] = useState([]);
  const [selectedConcepts, setSelectedConcepts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  

  useEffect(() => {
    async function fetchConcepts() {
      if (!selectedWorldId) return;
      try {
        const existingNames = new Set(existingConcepts.map(c => c.name.toLowerCase()));
        const allConcepts = await getConcepts(token, { gameworld_id: selectedWorldId });
        const filtered = allConcepts.filter(c => !existingNames.has(c.name.toLowerCase()));
        setAvailableConcepts(filtered);
      } catch (err) {
        console.error("Failed to fetch concepts", err);
      } 
    }
    fetchConcepts();
  }, [selectedWorldId, token]);

  async function handleImport() {
    setIsLoading(true);
    try {
      const allChars = await getCharacteristics(token, { gameworld_id: currentWorld.id });
      const allCharNames = new Map(allChars.map(c => [c.name.toLowerCase(), c]));

      for (const concept of selectedConcepts) {
        const links = await getCharacteristicsForConcept(concept.id, token);
        const characteristic_links = [];

        for (const link of links) {
          let targetChar = allCharNames.get(link.name.toLowerCase());

          if (!targetChar) {
            targetChar = await createCharacteristic({
              name: link.name,
              type: link.type,
              is_list: link.is_list,
              logo: link.logo,
              ref_concept_id: link.ref_concept_id,
              gameworld_id: currentWorld.id,
            }, token);
            allCharNames.set(link.name.toLowerCase(), targetChar);
          }

          characteristic_links.push({
            characteristic_id: targetChar.id,
            order: link.order ?? 0,
            display_type: link.display_type || "body",
          });
        }

        await createConcept({
          name: concept.name,
          description: concept.description || "",
          logo: concept.logo,
          group: concept.group,
          display_on_world: concept.display_on_world ?? true,
          gameworld_id: currentWorld.id,
          characteristic_links,
        }, token);
      }

      onImport();
      onClose();
    } catch (err) {
      console.error("Import failed", err);
    }
    setIsLoading(false);
  }

  return (
    <ModalContainer title="Import Concepts" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="text-sm font-semibold text-[var(--primary)]">Select World</label>
        <select
          value={selectedWorldId || ""}
          onChange={(e) => setSelectedWorldId(Number(e.target.value))}
          className="border px-4 py-2 rounded-xl bg-[var(--surface-variant)] text-[var(--foreground)]"
        >
          <option value="">-- Choose a world --</option>
          {worlds.filter(w => w.id !== currentWorld.id).map(w => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {selectedWorldId && (
          <div className="flex items-center gap-2 mt-1">
            <Image
              src={worlds.find(w => w.id === selectedWorldId)?.logo || "/images/worlds/new_game.png"}
              alt="World logo"
              className="w-10 h-10 rounded border border-[var(--primary)] object-cover"
              width={400}
              height={400}
            />
            <span className="text-[var(--primary)] font-semibold">
              {worlds.find(w => w.id === selectedWorldId)?.name || ""}
            </span>
          </div>
        )}

        {availableConcepts.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-[var(--primary)] mb-1 block">Select Concepts to Import</label>
            <div className="max-h-60 overflow-y-auto border rounded-xl p-2 bg-[var(--surface-variant)]">
              {availableConcepts.map(concept => (
                <label key={concept.id} className="block mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedConcepts.includes(concept)}
                    onChange={() => {
                      if (selectedConcepts.includes(concept)) {
                        setSelectedConcepts(selectedConcepts.filter(c => c !== concept));
                      } else {
                        setSelectedConcepts([...selectedConcepts, concept]);
                      }
                    }}
                  />
                  {concept.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={selectedConcepts.length === 0 || isLoading}
          className="mt-4 bg-[var(--primary)] text-white px-5 py-2 rounded-xl hover:bg-[var(--accent)] disabled:opacity-50"
        >
          {isLoading ? "Importing..." : "Import Selected"}
        </button>
      </div>
    </ModalContainer>
  );
}
