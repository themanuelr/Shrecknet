"use client";
import { useState } from "react";
import RichEditor from "./RichEditor";
import { FaEdit } from "react-icons/fa";
import HTMLRenderer from "./HTMLRenderer";

export default function EditableContent({
  content,
  canEdit = false,
  onSaveContent,  
  className = "",
  pageType = "",
  pageName = "",
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  function handleEdit() {
    setError("");
    setEditing(true);
  }
  function handleCancel() {
    setEditing(false);
    setError("");
  }
  async function handleSave(newContent) {
    if ((newContent || "").replace(/<[^>]+>/g, " ").trim().length === 0) {
      setError("Content can't be empty!");
      return;
    }
    try {
      await onSaveContent(newContent);
      setEditing(false);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to save content.");
    }
  }

  // Edit mode
  if (editing) {
    return (
      <section className={`relative w-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-md ${className}`}>
        <FancyHeader canEdit={false} />
        <div className="px-1 sm:px-2 pt-2 pb-10">
          <RichEditor
            value={content}               
            onChange={() => {}}           
            onSave={handleSave}           
            onCancel={handleCancel}
            pageType={pageType}
            pageName={pageName}
            maxWords={4000}
          />
          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-100 px-3 py-2 rounded">{error}</div>
          )}
        </div>
      </section>
    );
  }

  // Display mode
  return (
    <section
      className={`relative w-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-md ${className}`}
      style={{
        minHeight: 80,
        padding: 0,
        margin: 0,
        boxShadow: "0 2px 18px 0 rgba(85,50,180,0.06)",
      }}
    >
      <FancyHeader canEdit={canEdit} onEdit={handleEdit} />
      <div className="w-full sm:px-10 py-2 md3-markdown">
        {content?.trim()
          ? <HTMLRenderer content={content} />
          : <em className="opacity-60">No content yet.</em>
        }
      </div>
    </section>
  );
}
// --- Fancy Header Component ---
function FancyHeader({ canEdit, onEdit }) {
  return (
    <header
      className="flex items-center justify-between px-3 sm:px-4 pt-2 pb-1 border-b border-[var(--border)] bg-transparent"
      style={{
        minHeight: 36,
      }}
    >
      <span
        className="flex items-center gap-2 font-semibold tracking-wider uppercase text-[13px] sm:text-[15px]"
        style={{
          letterSpacing: ".16em",
          color: "var(--primary)",
          opacity: 0.85,
          fontFamily: "'Cinzel', serif"
        }}
      >
        <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="16" rx="4" fill="var(--primary)" fillOpacity={0.08}/>
          <rect x="6.5" y="7.5" width="11" height="3" rx="1.5" fill="var(--primary)" fillOpacity={0.2}/>
          <rect x="6.5" y="12.5" width="6" height="2" rx="1" fill="var(--primary)" fillOpacity={0.18}/>
        </svg>
        Page Content
      </span>
      {canEdit && (
        <button
          className="ml-auto flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-[var(--primary)] bg-[var(--surface-variant)] shadow-sm hover:bg-[var(--primary)]/15 transition"
          onClick={onEdit}
          aria-label="Edit Content"
        >
          <FaEdit className="text-[var(--primary)] text-lg" />
        </button>
      )}
    </header>
  );
}
