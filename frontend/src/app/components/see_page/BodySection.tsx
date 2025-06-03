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
      <div className="flex flex-col gap-6 w-full">
       
       
        {values.map(({ characteristic, value }, idx) => {
          const key = `${characteristic.id}-${idx}`;

          // List value
          if (Array.isArray(value)) {
            // For page_ref, show as grid of cards
            if (characteristic.type === "page_ref") {
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 w-full"
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => handleAccordionToggle(key)}
                    className="flex items-center justify-between w-full mb-2 focus:outline-none"
                  >
                    <span className="text-lg font-semibold text-[var(--primary)]">
                      {characteristic.name}
                    </span>
                    {openAccordions[key] ? (
                      <ChevronUp className="text-[var(--primary)]" size={22} />
                    ) : (
                      <ChevronDown className="text-[var(--primary)]" size={22} />
                    )}
                  </button>
                  <AnimatePresence>
                    {openAccordions[key] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                          {value.map((v, i) => (
                            <PageValueRenderer
                              key={i}
                              characteristic={characteristic}
                              value={v}  // pass a single value
                              worldId={worldId}
                              conceptid={conceptid}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            }
            // Generic list value
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 w-full"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => handleAccordionToggle(key)}
                  className="flex items-center justify-between w-full mb-2 focus:outline-none"
                >
                  <span className="text-lg font-semibold text-[var(--primary)]">
                    {characteristic.name}
                  </span>
                  {openAccordions[key] ? (
                    <ChevronUp className="text-[var(--primary)]" size={22} />
                  ) : (
                    <ChevronDown className="text-[var(--primary)]" size={22} />
                  )}
                </button>
                <AnimatePresence>
                  {openAccordions[key] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                          {value.map((v, i) => (
                            <li
                              key={i}
                              className="bg-[var(--surface-variant)]/30 rounded-xl border border-[var(--primary)]/10 px-4 py-2 shadow text-sm text-[var(--foreground)]"
                            >
                              {v}
                            </li>
                          ))}
                        </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          }

          // Non-list values
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 w-full"
            >
              <h3 className="text-lg font-semibold text-[var(--primary)] mb-2">
                {characteristic.name}
              </h3>

              <PageValueRenderer characteristic={characteristic} value={value} worldId={worldId} conceptid={conceptid} />
              
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
