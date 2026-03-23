"use client";

import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

/**
 * AdminSelect — premium custom dropdown for the admin panel.
 *
 * Props:
 *   options     – Array<{ value: string, label: string, sub?: string }>
 *   value       – currently selected value
 *   onChange    – (value: string) => void
 *   placeholder – string shown when nothing is selected
 *   disabled    – boolean
 *   className   – wrapper class
 *   size        – "sm" | "md" (default "md")
 */
export default function AdminSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  className = "",
  size = "md",
}) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const wrapRef  = useRef(null);
  const searchId = useId();

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.sub ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close + clear search on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (e.key === "Escape") { setOpen(false); setSearch(""); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  function select(val) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  const showSearch = options.length > 6;

  const triggerH = size === "sm"
    ? "px-3 py-2 text-[11.5px]"
    : "px-3.5 py-2.5 text-[12.5px]";

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        className={`w-full flex items-center justify-between gap-2
          bg-white/[0.04] border rounded-xl text-left
          transition-all duration-200 focus:outline-none select-none
          ${triggerH}
          ${open
            ? "border-[#7A2267]/60 bg-white/[0.06] shadow-[0_0_0_3px_rgba(122,34,103,0.12)]"
            : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]"
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {/* Label */}
        <span className={selected ? "text-white" : "text-white/25"}>
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron */}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          viewBox="0 0 10 6" width="9" height="9" fill="none"
          className="shrink-0 text-white/30"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      {/* ── Dropdown panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200]
              bg-[#141414] border border-white/10 rounded-2xl
              shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {/* Search */}
            {showSearch && (
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <svg viewBox="0 0 14 14" width="11" height="11" fill="none"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <input
                    id={searchId}
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-white/5 border border-white/8 rounded-xl pl-7 pr-3 py-2
                      text-[11.5px] text-white placeholder-white/20 focus:outline-none
                      focus:border-[#7A2267]/50 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className={`overflow-y-auto ${showSearch ? "max-h-52" : "max-h-64"} py-1.5`}>
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-[11.5px] text-white/25 text-center">
                  No options found
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => select(opt.value)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5
                        text-left transition-colors duration-100
                        ${isSelected
                          ? "bg-[#7A2267]/20 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[12px] font-medium truncate leading-tight">
                          {opt.label}
                        </span>
                        {opt.sub && (
                          <span className={`text-[10px] truncate ${isSelected ? "text-white/45" : "text-white/25"}`}>
                            {opt.sub}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <svg viewBox="0 0 10 8" width="10" height="10" fill="none" className="shrink-0 text-[#c05aae]">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.4"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Subtle top edge gleam */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
