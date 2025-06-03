"use client";
import { useState } from "react";
import { Plus, Download, Trash2 } from "lucide-react";

export default function ConceptListSidebar({
  items = [],
  type = "concepts",
  selectedId,
  onSelect,
  onNew,
  onImport,
  onDelete, // ✅ shared delete handler for both types
  loading,
  emptyText = "No items found.",
}) {
  const [filter, setFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = !filter
    ? items
    : items.filter(i =>
        i.name.toLowerCase().includes(filter.toLowerCase())
      );

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <aside className="flex flex-col h-full min-h-0 w-full">
      {/* Top bar */}
      <div className="flex flex-col gap-2 p-4 border-b border-[var(--primary)]/10">
        {type === "concepts" && onImport && (
          <button
            onClick={onImport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-variant)] text-[var(--primary)] hover:bg-[var(--primary)]/10 transition font-semibold border border-[var(--primary)]/20"
            title="Import from Other World"
          >
            <Download className="w-5 h-5" />
            <span>Import Concepts</span>
          </button>
        )}
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--primary)]/20 bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-base transition"
            placeholder={`Filter ${type}...`}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            autoFocus
          />
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition font-bold shadow"
            title={`New ${type.slice(0, -1)}`}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {selectedItem && onDelete && (
          <div className="flex justify-end mt-2">
            {confirmDelete ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-red-300">Confirm delete?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onDelete(selectedItem);
                      setConfirmDelete(false);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1 bg-gray-200 text-[var(--primary)] rounded-md text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                title={`Delete selected ${type.slice(0, -1)}`}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {loading ? (
          <div className="text-center text-[var(--primary)] py-10">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[var(--primary)]/60 pt-8">{emptyText}</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelect(item)}
                  className={`
                    group flex w-full items-center px-3 py-3 rounded-lg transition
                    ${selectedId === item.id
                      ? "bg-[var(--primary)]/15 border-l-4 border-[var(--primary)] font-bold"
                      : "hover:bg-[var(--primary)]/10 border-l-4 border-transparent"}
                    text-left
                  `}
                  style={{ fontWeight: selectedId === item.id ? 600 : 500 }}
                >
                  <span className={`truncate w-full ${selectedId === item.id ? "text-[var(--primary)]" : "text-[var(--primary)]/90"}`}>
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
