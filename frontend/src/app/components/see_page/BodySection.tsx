"use client";

import PageValueRenderer from "./PageValueRenderer";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react"; // or use any icon lib

export default function BodySection({ values, worldId, conceptid }) {
  // State to manage which accordions are open (by characteristic id)
  const [openAccordions, setOpenAccordions] = useState({});

  if (!values.length) return null;

  const handleAccordionToggle = (id) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="w-full mb-0">
      <div className="flex flex-col gap-7 w-full mb-5">
        {values.map(({ characteristic, value }, idx) => {
          const key = `${characteristic.id}-${idx}`;

          return (
            <div key={key} className="w-full">
              {/* Characteristic name above card */}
              <h3 className="text-base md:text-lg font-medium text-[var(--primary)]/100 mb-5 px-1 select-none">
                {characteristic.name}
              </h3>

              {/* Glassy value card (but soft and blended) */}
              <div
                className="
                  w-full
                  rounded-xl
                  bg-white/5
                  border border-white/50
                  shadow-sm
                  backdrop-blur-[6px]
                  px-4 py-3
                  transition
                  text-[var(--foreground)]/90
                "
              >
                {/* Render lists or single values */}
                {Array.isArray(value) ? (
                  <div className="flex flex-wrap  gap-3">
                    {value.length > 0 ? (
                      value.map((v, i) =>
                        characteristic.type === "page_ref" ? (
                          <PageValueRenderer
                            key={i}
                            characteristic={characteristic}
                            value={v}
                            worldId={worldId}
                            conceptid={conceptid}
                          />
                        ) : (
                          <div
                            key={i}
                            className="px-3 py-1 text-sm"
                          >
                            {v}
                          </div>
                        )
                      )
                    ) : (
                      <span className="text-sm text-[var(--foreground)]/50 italic">None</span>
                    )}
                  </div>
                ) : (
                  <PageValueRenderer characteristic={characteristic} value={value} worldId={worldId} conceptid={conceptid} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
