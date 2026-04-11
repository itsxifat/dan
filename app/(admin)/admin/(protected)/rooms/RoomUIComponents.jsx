"use client";

import { useState, useRef, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

// ─── MiniCalendar (internal) ──────────────────────────────────────────────────
function MiniCalendar({ value, onChange, minDate, maxDate }) {
  const parsed = value ? new Date(value + "T00:00:00") : null;

  const [view, setView] = useState(() => {
    const base = parsed || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minD = minDate ? new Date(minDate + "T00:00:00") : null;
  const maxD = maxDate ? new Date(maxDate + "T00:00:00") : null;

  const { year, month } = view;

  // Monday-first grid
  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function isSel(d)  {
    if (!d || !parsed) return false;
    return parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === d;
  }
  function isTod(d) {
    if (!d) return false;
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  }
  function isDis(d) {
    if (!d) return true;
    const dt = new Date(year, month, d);
    if (minD && dt < minD) return true;
    if (maxD && dt > maxD) return true;
    return false;
  }

  function pick(d) {
    if (!d || isDis(d)) return;
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    onChange(`${year}-${mm}-${dd}`);
  }

  function prevM() {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }
  function nextM() {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  return (
    <div className="bg-[#111] border border-white/[0.1] rounded-2xl p-4 w-[248px] shadow-2xl shadow-black/60 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevM}
          className="w-7 h-7 flex items-center justify-center rounded-lg
            text-white/35 hover:text-white/80 hover:bg-white/[0.07] transition-colors">
          <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
            <path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button type="button"
            className="text-[12px] font-semibold text-white/80 hover:text-white transition-colors">
            {MONTHS[month]}
          </button>
          <button type="button"
            className="text-[12px] font-semibold text-white/40 hover:text-white/80 transition-colors">
            {year}
          </button>
        </div>

        <button type="button" onClick={nextM}
          className="w-7 h-7 flex items-center justify-center rounded-lg
            text-white/35 hover:text-white/80 hover:bg-white/[0.07] transition-colors">
          <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
            <path d="M3.5 1.5L7 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-semibold text-white/18 uppercase py-1 tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          const sel = isSel(d);
          const tod = isTod(d);
          const dis = isDis(d);
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(d)}
              disabled={!d || dis}
              className={[
                "relative text-center text-[11px] h-7 rounded-lg transition-colors",
                !d ? "invisible pointer-events-none" : "",
                sel  ? "bg-[#7A2267] text-white font-semibold shadow-lg shadow-[#7A2267]/30" : "",
                tod && !sel ? "text-[#c05aae] font-semibold" : "",
                !sel && !dis && d ? "text-white/50 hover:bg-white/[0.08] hover:text-white/90 cursor-pointer" : "",
                dis && d ? "text-white/15 cursor-not-allowed" : "",
              ].filter(Boolean).join(" ")}
            >
              {d || ""}
              {/* today dot */}
              {tod && !sel && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2
                  w-[3px] h-[3px] rounded-full bg-[#7A2267]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex gap-2">
        <button type="button" onClick={() => {
          const t = today;
          const mm = String(t.getMonth() + 1).padStart(2, "0");
          const dd = String(t.getDate()).padStart(2, "0");
          const val = `${t.getFullYear()}-${mm}-${dd}`;
          if (!isDis(t.getDate()) || view.year !== t.getFullYear() || view.month !== t.getMonth()) {
            setView({ year: t.getFullYear(), month: t.getMonth() });
            onChange(val);
          }
        }}
          className="text-[9px] font-medium text-white/35 hover:text-white/65
            hover:bg-white/[0.05] px-2 py-1 rounded-md transition-colors uppercase tracking-wider">
          Today
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")}
            className="text-[9px] font-medium text-white/25 hover:text-red-400
              hover:bg-red-500/10 px-2 py-1 rounded-md transition-colors uppercase tracking-wider">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DatePickerInput (exported) ───────────────────────────────────────────────
export function DatePickerInput({
  label, value, onChange, minDate, maxDate,
  placeholder = "Select date", required, half, className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function down(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "";

  const wrapClass = half ? "col-span-1" : "col-span-2";

  return (
    <div ref={ref} className={`relative ${wrapClass} ${className}`}>
      {label && (
        <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={[
          "w-full flex items-center justify-between border rounded-xl px-3 py-2.5",
          "text-[12px] transition-all duration-150 text-left group",
          open
            ? "border-[#7A2267]/60 bg-[#7A2267]/8 shadow-[0_0_0_3px_rgba(122,34,103,0.1)]"
            : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]",
          value ? "text-white/80" : "text-white/25",
        ].join(" ")}
      >
        <span>{displayValue || placeholder}</span>
        {/* Calendar icon */}
        <svg viewBox="0 0 14 14" width="13" height="13" fill="none"
          className={`shrink-0 transition-colors ${open ? "text-[#c05aae]" : "text-white/22 group-hover:text-white/45"}`}>
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="4.5" cy="9" r="0.8" fill="currentColor" />
          <circle cx="7" cy="9" r="0.8" fill="currentColor" />
          <circle cx="9.5" cy="9" r="0.8" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[200]">
          <MiniCalendar
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            onChange={(v) => { onChange(v); setOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

// ─── CustomSelect (exported) ──────────────────────────────────────────────────
// options: Array of { value: string, label: string, dot?: string (tailwind bg class) }
export function CustomSelect({
  label, value, onChange, options,
  placeholder = "Select…", required,
  half, fullWidth, className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function down(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const wrapClass = fullWidth ? "w-full" : half ? "col-span-1" : "col-span-2";

  return (
    <div ref={ref} className={`relative ${wrapClass} ${className}`}>
      {label && (
        <label className="block text-[10px] font-medium text-white/35 mb-1.5 tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={[
          "w-full flex items-center justify-between border rounded-xl px-3 py-2.5",
          "text-[12px] transition-all duration-150 text-left group",
          open
            ? "border-[#7A2267]/60 bg-[#7A2267]/8 shadow-[0_0_0_3px_rgba(122,34,103,0.1)]"
            : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]",
          selected ? "text-white/80" : "text-white/25",
        ].join(" ")}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.dot && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selected.dot}`} />
          )}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        {/* Chevron */}
        <svg viewBox="0 0 10 10" width="9" height="9" fill="none"
          className={`shrink-0 transition-all duration-200
            ${open ? "rotate-180 text-[#c05aae]" : "text-white/22 group-hover:text-white/45"}`}>
          <path d="M1.5 3.5L5 7l3.5-3.5" stroke="currentColor"
            strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-[200] min-w-full max-h-56 overflow-y-auto
          bg-[#111] border border-white/[0.1] rounded-xl py-1
          shadow-2xl shadow-black/60">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 text-[11px]",
                  "transition-colors text-left",
                  active
                    ? "text-[#c05aae] bg-[#7A2267]/12"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
                ].join(" ")}
              >
                {opt.dot && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                )}
                <span className="flex-1 truncate">{opt.label}</span>
                {active && (
                  <svg viewBox="0 0 10 10" width="9" height="9" fill="none" className="shrink-0">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
