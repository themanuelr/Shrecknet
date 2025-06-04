"use client";
import { useState, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { FaTrash } from "react-icons/fa"; 

const DISPLAY_TYPES = ["title", "header", "body"] as const;
const getDisplayName = (type) =>
  type === "title" ? "Title" : type === "header" ? "Header" : "Body";

function ColumnAddDropdown({ available, onAdd, disabled }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef = useRef();

  const filtered = !filter
    ? available
    : available.filter((c) =>
        c.name.toLowerCase().includes(filter.toLowerCase())
      );

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (!inputRef.current || inputRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function handleEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <div className="mb-2 relative" ref={inputRef}>
      <button
        type="button"
        className={`
          w-full flex items-center justify-between
          rounded-xl border border-[var(--primary)] bg-[var(--card-bg)] px-4 py-2
          font-medium text-[var(--primary)]
          transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/70
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--accent)] cursor-pointer"}
        `}
        tabIndex={0}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span className="text-base">{open ? "Select characteristic..." : "Add characteristic..."}</span>
        <span className="ml-2 text-xl">+</span>
      </button>
      {open && (
        <div className="absolute z-30 bg-[var(--surface-variant)] border border-[var(--primary)]/40 rounded-xl w-full mt-2 shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-[var(--surface-variant)]">
            <input
              type="text"
              autoFocus
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search characteristics…"
              className="rounded-lg border border-[var(--primary)] px-3 py-2 w-full text-base bg-[var(--surface-variant)] text-[var(--foreground)]"
              disabled={disabled}
            />
          </div>
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-[var(--primary)]/70 text-sm italic">No options</div>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex items-center gap-2 px-4 py-3 w-full rounded-xl hover:bg-[var(--primary)]/10 text-[var(--primary)] text-base font-semibold transition text-left"
              onClick={() => {
                onAdd(c);
                setOpen(false);
                setFilter("");
              }}
              tabIndex={0}
            >
              <Image
                src={c.logo || "/images/default/characteristics/logo.png"}
                alt=""
                width={100}
                height={100}
                className="rounded-full border border-[var(--primary)] object-cover"
              />
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConceptCharacteristicsEditor({
  allCharacteristics,
  initialLinks,
  onChange,
  disabled = false,
}) {


  const [columns, setColumns] = useState({ title: [], header: [], body: [] });
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!initialized.current && initialLinks?.length > 0 && allCharacteristics?.length > 0) {
      const result = { title: [], header: [], body: [] };
      for (const link of initialLinks) {
        const char = allCharacteristics.find(c => c.id === link.characteristic_id);
        if (char && DISPLAY_TYPES.includes(link.display_type)) {
          result[link.display_type].push({ ...char, display_type: link.display_type });
        }
      }
      setColumns(result);
      initialized.current = true;
    }
  }, [initialLinks, allCharacteristics]);

  const [activeCol, setActiveCol] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const links = [];
    DISPLAY_TYPES.forEach((type) => {
      columns[type].forEach((char, order) => {
        links.push({
          characteristic_id: char.id,
          display_type: type,
          order,
        });
      });
    });
  if (onChange) onChange(links);
  }, [columns, onChange]);

  const usedIds = new Set(DISPLAY_TYPES.flatMap((col) => columns[col].map(c => c.id)));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragStart(event, col) {
    setActiveId(event.active.id);
    setActiveCol(col);
  }
  function handleDragEnd(event, col) {
    setActiveId(null);
    setActiveCol(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setColumns((prev) => {
      const newArr = [...prev[col]];
      const oldIdx = newArr.findIndex(c => c.id === active.id);
      const newIdx = newArr.findIndex(c => c.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return {
        ...prev,
        [col]: arrayMove(newArr, oldIdx, newIdx),
      };
    });
  }

  function handleAdd(col, char) {
    setColumns((prev) => ({
      ...prev,
      [col]: [...prev[col], { ...char, display_type: col }],
    }));
  }

  function handleRemove(col, charId) {
    setColumns((prev) => ({
      ...prev,
      [col]: prev[col].filter(c => c.id !== charId),
    }));
  }

  console.log(initialLinks)
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {DISPLAY_TYPES.map((col) => {
        const colItems = columns[col];
        const available = allCharacteristics.filter(
          (c) => !usedIds.has(c.id)
        );

        return (
          <div
            key={col}
            className="flex-1 min-w-[220px] bg-[var(--surface-variant)]/70 border border-[var(--primary)]/20 rounded-2xl p-3 shadow"
            style={{ minHeight: 350 }}
          >
            <div className="font-bold text-[var(--primary)] mb-2 text-center tracking-tight">
              {getDisplayName(col)}
            </div>
            <ColumnAddDropdown              
              available={available}
              onAdd={(char) => handleAdd(col, char)}
              disabled={disabled}
            />
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => handleDragStart(e, col)}
              onDragEnd={(e) => handleDragEnd(e, col)}
            >
              <SortableContext
                items={colItems.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2 min-h-[48px]">
                  {colItems.length === 0 && (
                    <div className="text-[var(--primary)]/50 text-xs italic text-center">
                      None
                    </div>
                  )}
                  {colItems.map((char) => (
                    <SortableCharacteristicRow
                      key={char.id}
                      id={char.id}
                      name={char.name}
                      logo={char.logo}
                      onRemove={() => handleRemove(col, char.id)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId && activeCol === col ? (
                  <OverlayCharacteristicRow
                    char={colItems.find((c) => c.id === activeId)}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
}

function SortableCharacteristicRow({ id, name, logo, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    cursor: "grab",
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="flex items-center justify-between bg-[var(--primary)]/10 rounded-xl px-3 py-2 shadow-sm border border-[var(--primary)]/20"
    >
      <span className="flex items-center gap-2">
        <Image
          src={logo || "/images/default/characteristics/logo.png"}
          alt=""
          width={50}
          height={50}
          className="rounded-full border border-[var(--primary)] object-cover"
        />
        <span className="text-[var(--primary)] font-semibold">{name}</span>
      </span>
      <button
        className="text-red-600 hover:text-red-700 rounded-full p-1 ml-2 transition"
        type="button"
        onClick={onRemove}
        tabIndex={-1}
        title="Remove characteristic"
      >
        <FaTrash />
      </button>
    </div>
  );
}

function OverlayCharacteristicRow({ char }) {
  if (!char) return null;
  return (
    <div className="flex items-center gap-2 bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-xl px-3 py-2 shadow-lg">
      <Image
        src={char.logo || "/images/default/characteristics/logo.png"}
        alt=""
        width={50}
        height={50}
        className="rounded-full border border-[var(--primary)] object-cover"
      />
      <span className="text-[var(--primary)] font-semibold">{char.name}</span>
    </div>
  );
}
