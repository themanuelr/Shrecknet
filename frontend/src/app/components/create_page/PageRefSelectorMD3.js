// PageRefSelectorMD3.js
"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import Image from "next/image";


/**
 * Drop-in selector for "page_ref" characteristics.
 * - options: [{id, name, logo}] (all possible selectable pages)
 * - value: array of ids (for multi) or string/number (for single)
 * - onChange: function(newValue)
 * - label: label for the field
 * - multiple: boolean, true for multi-select, false for single
 * - disabled: disable editing
 */
export default function PageRefSelectorMD3({
  options = [],
  value,
  onChange,
  label = "Related Pages",
  multiple = true,
  disabled = false,
  required = false,
}) {
  // Normalize value for internal logic
  const selectedIds = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value.map(String) : [];
    }
    return value ? [String(value)] : [];
  }, [multiple, value]);

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef();

  // Filtered, unselected options
  const filteredOptions = useMemo(
    () =>
      options
        .filter(o => !selectedIds.includes(String(o.id)))
        .filter(o => o.name.toLowerCase().includes(query.toLowerCase())),
    [options, selectedIds, query]
  );

  // Add to selection
  const handleAdd = (id) => {
    if (disabled) return;
    if (multiple) {
      onChange([...selectedIds, String(id)]);
    } else {
      onChange(String(id));
      setDropdownOpen(false);
    }
    setQuery("");
  };

  // Remove from selection
  const handleRemove = (id) => {
    if (disabled) return;
    if (multiple) {
      onChange(selectedIds.filter(sid => sid !== String(id)));
    } else {
      onChange("");
    }
  };

  // Keyboard: Enter to add first filtered option
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredOptions.length > 0) {
      handleAdd(filteredOptions[0].id);
      e.preventDefault();
    }
    if (e.key === "ArrowDown" && filteredOptions.length > 0) {
      setDropdownOpen(true);
      // focus on the dropdown
    }
    if (e.key === "Escape") setDropdownOpen(false);
  };

  // Auto-close dropdown on click away
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (inputRef.current && !inputRef.current.parentNode.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <div className="w-full relative">
      <label className="text-[var(--primary)] font-semibold text-sm mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {/* Chips for selected */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
        {selectedIds.length === 0 && (
          <span className="italic text-xs text-[var(--foreground)]/50">No pages selected</span>
        )}
        {selectedIds.map(id => {
          const p = options.find(o => String(o.id) === id);
          if (!p) return null;
          return (
            <span
              key={id}
              className="flex items-center gap-2 bg-[var(--surface-variant)]/50 border border-[var(--primary)]/10 rounded-xl px-2 py-1 shadow text-xs max-w-[160px]"
            >
              {p.logo && (

                <Image
                  width={400}
                  height={400}
                  src={p.logo}
                  alt={p.name}
                  className="w-5 h-5 rounded border object-cover bg-white"
                />


              )}
              <span className="truncate">{p.name}</span>
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 text-[var(--primary)] hover:text-red-500"
                  tabIndex={-1}
                  onClick={() => handleRemove(id)}
                  title="Remove"
                >
                  <X size={15} />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Search bar & dropdown */}
      <div className="flex items-stretch gap-2 relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setDropdownOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Search to add...`}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring focus:border-[var(--primary)]"
          disabled={disabled}
        />
        <button
          type="button"
          tabIndex={-1}
          className="flex items-center px-2"
          onClick={() => setDropdownOpen(v => !v)}
        >
          <ChevronDown className={`w-4 h-4 text-[var(--primary)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>
        {dropdownOpen && filteredOptions.length > 0 && (
          <div className="absolute z-30 top-full left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg mt-2 max-h-60 overflow-auto">
            {filteredOptions.slice(0, 10).map(opt => (
              <button
                type="button"
                key={opt.id}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--primary)]/10 text-left transition border-b last:border-b-0 border-[var(--border)]"
                onClick={() => handleAdd(opt.id)}
                disabled={disabled}
              >
                {opt.logo && (
                  <Image
                  width={400}
                  height={400}                  
                  src={opt.logo}
                  alt={opt.name}
                  className="w-6 h-6 rounded border object-cover bg-white"
                />


                )}
                <span className="truncate">{opt.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
