"use client";
import CharacteristicForm from "./CharacteristicsForm";

export default function CharacteristicFormModal({
  open,
  initialData,
  onSubmit,
  loading,
  onClose,
  concepts,
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/40
      "
      onClick={onClose}
      style={{
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="
          relative w-full max-w-5xl
          rounded-2xl shadow-lg border
          p-8 bg-[var(--background)] text-[var(--foreground)]
          flex flex-col
          max-h-[96vh] overflow-y-auto
        "
        style={{
          borderColor: "var(--primary)",
          minWidth: "0",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          className="
            absolute right-5 top-5 text-[var(--primary)] hover:text-[var(--accent)]
            text-2xl rounded-full z-10 transition
          "
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
          style={{ background: "none", border: "none" }}
        >
          ×
        </button>
        {/* Modal Title */}
        <h2 className="text-2xl font-bold mb-6 text-[var(--primary)] text-center font-serif tracking-tight">
          {initialData ? "Edit Characteristic" : "Create a New Characteristic"}
        </h2>
        {/* CharacteristicForm fields */}
        <CharacteristicForm
          initialData={initialData}
          onSubmit={onSubmit}
          loading={loading}
          onCancel={onClose}
          concepts={concepts || []}
        />
      </div>
    </div>
  );
}
