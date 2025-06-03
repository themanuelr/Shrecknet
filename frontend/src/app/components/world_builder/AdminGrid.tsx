"use client";
import React from "react";

/**
 * AdminGrid: Modular grid for concepts/characteristics.
 * Props:
 *  - items: Array of objects to display
 *  - renderCard: Function(item) => JSX card
 *  - title: "Concept" or "Characteristic"
 *  - filter: filter value (string)
 *  - setFilter: setFilter function
 *  - onCreate: function for create button
 *  - createLabel: e.g. "New Concept"
 *  - columns: grid columns string (optional)
 *  - emptyMessage: (optional)
 */
export default function AdminGrid({
  items,
  renderCard,
  title,
  filter,
  setFilter,
  onCreate,
  createLabel,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
  emptyMessage = "No items found.",
}) {
  return (
    <div>
      {/* Filter and Create Button */}
      <div className="flex flex-row justify-end gap-3 mb-6">
        <input
          type="text"
          placeholder={`Filter by ${title.toLowerCase()} name...`}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-[var(--primary)] px-4 py-2 bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--primary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base min-w-[180px] transition"
          style={{ maxWidth: 230 }}
        />
        <button
          className="bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl px-4 py-2 text-base font-bold shadow hover:bg-[var(--accent)] transition-all"
          onClick={onCreate}
        >
          + {createLabel}
        </button>
      </div>
      {/* Grid */}
      <div className="w-full max-w-7xl mx-auto bg-[var(--foreground)]/5 border border-[var(--primary)]/10 rounded-3xl shadow-xl px-4 py-7 md:py-10 md:px-10 transition">
        <div className={`grid gap-5 ${columns}`}>
          {items.length > 0
            ? items.map(renderCard)
            : (
              <div className="col-span-full text-center text-[var(--primary)]/70">{emptyMessage}</div>
            )}
        </div>
      </div>
    </div>
  );
}
