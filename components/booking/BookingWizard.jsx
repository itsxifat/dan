"use client";

import { useState, useEffect, useCallback, useTransition, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Cormorant_Garamond } from "next/font/google";
import { getProperties } from "@/actions/accommodation/propertyActions";
import { getCategoriesByProperty } from "@/actions/accommodation/categoryActions";
import { getAvailableRooms } from "@/actions/accommodation/roomActions";
import { checkAvailability, createPendingBooking } from "@/actions/accommodation/bookingActions";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

// ─── Utilities ────────────────────────────────────────────────────────────────

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function dateStr(d) {
  if (!(d instanceof Date)) return d;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function tomorrowStr() { const d = todayDate(); d.setDate(d.getDate() + 1); return dateStr(d); }
function afterTomorrowStr() { const d = todayDate(); d.setDate(d.getDate() + 2); return dateStr(d); }
function diffDays(a, b) { return Math.ceil((new Date(b) - new Date(a)) / 86400000); }
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1];
const slideIn = (dir = 1) => ({
  initial:    { x: dir * 40, opacity: 0 },
  animate:    { x: 0, opacity: 1 },
  exit:       { x: dir * -40, opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 },
});
const fadeUp = {
  initial:    { y: 16, opacity: 0 },
  animate:    { y: 0, opacity: 1 },
  exit:       { y: -8, opacity: 0 },
  transition: { type: "spring", stiffness: 360, damping: 28 },
};
const stagger = { animate: { transition: { staggerChildren: 0.055 } } };
const cardItem = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 340, damping: 26 } },
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Choose Room",   sub: "Property & dates"  },
  { label: "Guest Details", sub: "Who's staying"     },
  { label: "Confirm & Pay", sub: "Review & payment"  },
];

function StepIndicator({ step }) {
  return (
    <div className="relative flex items-start w-full mb-10">
      {STEPS.map(({ label, sub }, i) => {
        const n = i + 1;
        const done   = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex-1 flex flex-col items-center relative">
            {/* Left connector */}
            {n > 1 && (
              <motion.div
                className="absolute top-[18px] right-1/2 left-0 h-px"
                animate={{ backgroundColor: done ? "#7A2267" : "#E4DAE8" }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            )}
            {/* Right connector */}
            {n < 3 && (
              <motion.div
                className="absolute top-[18px] left-1/2 right-0 h-px"
                animate={{ backgroundColor: n < step ? "#7A2267" : "#E4DAE8" }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            )}
            {/* Circle */}
            <motion.div
              animate={{
                backgroundColor: done ? "#7A2267" : active ? "#fff" : "#F3EDF5",
                borderColor:     active ? "#7A2267" : done ? "#7A2267" : "#D8CAE0",
                scale:           active ? 1.12 : 1,
                boxShadow:       active ? "0 0 0 5px rgba(122,34,103,0.10), 0 2px 14px rgba(122,34,103,0.15)" : "none",
              }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
              className="w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 relative shrink-0"
            >
              {done ? (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }}
                  viewBox="0 0 12 12" width="12" height="12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              ) : (
                <span className={`text-[12px] font-semibold ${active ? "text-[#7A2267]" : "text-[#B8A4C2]"}`}>{n}</span>
              )}
            </motion.div>
            {/* Labels */}
            <div className="mt-2.5 text-center px-1">
              <p className={`text-[10.5px] font-semibold transition-colors duration-300
                ${active ? "text-[#1C1C1C]" : done ? "text-[#7A2267]/55" : "text-[#B8A4C2]"}`}>
                {label}
              </p>
              <p className={`text-[10px] mt-0.5 hidden sm:block transition-colors duration-300
                ${active ? "text-[#7A2267]" : "text-[#C9B8D4]"}`}>
                {sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────

function CustomSelect({ value, onChange, options, placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((v) => !v);
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full bg-[#FEFCF9] border border-[#E4DAE8] rounded-xl px-4 py-3 text-[13.5px]
          text-left flex items-center justify-between gap-3 focus:outline-none
          focus:border-[#7A2267]/50 transition-all duration-200 hover:border-[#7A2267]/30"
      >
        <span className={selected ? "text-[#1C1C1C]" : "text-[#C4B3CE]"}>{selected?.label ?? placeholder}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          viewBox="0 0 10 6" width="10" height="10" fill="none" className="shrink-0 text-[#9B8BAB]">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && typeof window !== "undefined" && createPortal(
          <motion.div
            ref={dropRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
            className="bg-white border border-[#E4DAE8] rounded-xl shadow-[0_8px_32px_rgba(122,34,103,0.14)] overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors duration-150 flex items-center justify-between
                  ${opt.value === value ? "bg-[#7A2267]/6 text-[#7A2267] font-semibold" : "text-[#1C1C1C] hover:bg-[#F5EDF5]"}`}
              >
                {opt.label}
                {opt.value === value && (
                  <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#7A2267" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Custom Date Range Picker ─────────────────────────────────────────────────

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function DateRangePicker({ checkIn, checkOut, onCheckIn, onCheckOut }) {
  const today = todayDate();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [picking,   setPicking]   = useState("in"); // "in" | "out"
  const [hoverDay,  setHoverDay]  = useState(null);

  const ciDate = checkIn  ? new Date(checkIn)  : null;
  const coDate = checkOut ? new Date(checkOut) : null;
  if (ciDate) ciDate.setHours(0, 0, 0, 0);
  if (coDate) coDate.setHours(0, 0, 0, 0);

  // Build days grid
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startPad     = firstOfMonth.getDay(); // 0=Sun

  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(viewYear, viewMonth, d);
    day.setHours(0, 0, 0, 0);
    days.push(day);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleDayClick(day) {
    if (day < today) return;
    if (picking === "in") {
      onCheckIn(dateStr(day));
      onCheckOut("");
      setPicking("out");
    } else {
      if (ciDate && day <= ciDate) {
        // New start
        onCheckIn(dateStr(day));
        onCheckOut("");
        setPicking("out");
      } else {
        onCheckOut(dateStr(day));
        setPicking("in");
      }
    }
  }

  const effectiveEnd = picking === "out" && hoverDay && ciDate && hoverDay > ciDate ? hoverDay : coDate;

  function getDayState(day) {
    if (!day) return "pad";
    if (day < today) return "past";
    if (isSameDay(day, ciDate)) return "start";
    if (isSameDay(day, coDate)) return "end";
    if (ciDate && effectiveEnd && day > ciDate && day < effectiveEnd) return "range";
    return "normal";
  }

  return (
    <div className="select-none">
      {/* Tab selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { key: "in",  label: "Check-in",  val: checkIn  },
          { key: "out", label: "Check-out", val: checkOut },
        ].map(({ key, label, val }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPicking(key)}
            className={`rounded-xl px-3 py-2.5 text-left transition-all duration-200 border-2
              ${picking === key
                ? "border-[#7A2267] bg-[#7A2267]/5"
                : "border-[#E4DAE8] hover:border-[#7A2267]/30 bg-white"
              }`}
          >
            <p className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-0.5
              ${picking === key ? "text-[#7A2267]" : "text-[#9B8BAB]"}`}>
              {label}
            </p>
            <p className={`text-[13px] font-semibold ${val ? "text-[#1C1C1C]" : "text-[#C4B3CE]"}`}>
              {val ? fmtDate(val) : "Select date"}
            </p>
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9B8BAB]
            hover:bg-[#F3EDF5] hover:text-[#7A2267] transition-all duration-150"
        >
          <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[13px] font-semibold text-[#1C1C1C]">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9B8BAB]
            hover:bg-[#F3EDF5] hover:text-[#7A2267] transition-all duration-150"
        >
          <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
            <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <p key={d} className="text-[10px] text-center font-semibold text-[#C4B3CE] py-1">{d}</p>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const state = getDayState(day);
          if (state === "pad") return <div key={`p${i}`} className="h-9" />;

          const isStart = state === "start";
          const isEnd   = state === "end";
          const inRange = state === "range";
          const isPast  = state === "past";
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={`relative flex items-center justify-center h-9
                ${inRange ? "bg-[#7A2267]/8" : ""}
                ${isStart && coDate ? "rounded-l-full" : ""}
                ${isEnd   && ciDate ? "rounded-r-full" : ""}
                ${inRange && i % 7 === 0 ? "rounded-l-full" : ""}
                ${inRange && (i + 1) % 7 === 0 ? "rounded-r-full" : ""}
              `}
              onMouseEnter={() => day >= today && setHoverDay(day)}
              onMouseLeave={() => setHoverDay(null)}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => handleDayClick(day)}
                className={`relative z-10 w-8 h-8 rounded-full text-[12.5px] font-medium transition-all duration-150
                  ${isStart || isEnd
                    ? "bg-[#7A2267] text-white shadow-[0_2px_10px_rgba(122,34,103,0.35)]"
                    : inRange
                      ? "text-[#7A2267] font-semibold hover:bg-[#7A2267]/15"
                      : isPast
                        ? "text-[#D8CAE0] cursor-not-allowed"
                        : isToday
                          ? "text-[#7A2267] font-bold ring-1 ring-[#7A2267]/40 hover:bg-[#7A2267]/8"
                          : "text-[#1C1C1C] hover:bg-[#F3EDF5] hover:text-[#7A2267]"
                  }`}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      <p className="text-[10.5px] text-[#B8A4C2] text-center mt-3">
        {picking === "in" ? "Select your check-in date" : "Now select your check-out date"}
      </p>
    </div>
  );
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

const FI = "w-full bg-[#FEFCF9] border border-[#E4DAE8] rounded-xl px-4 py-3 text-[13.5px] text-[#1C1C1C] placeholder-[#C4B3CE] focus:outline-none focus:border-[#7A2267]/50 focus:ring-2 focus:ring-[#7A2267]/8 transition-all duration-200";
const FL = "block text-[9.5px] uppercase tracking-[0.14em] text-[#9B8BAB] font-semibold mb-1.5";

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_2px_20px_rgba(122,34,103,0.05)] border border-[#EDE5F0] ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[9.5px] uppercase tracking-[0.16em] text-[#9B8BAB] font-semibold mb-4">{children}</p>;
}

function Spinner({ label = "Loading…" }) {
  return (
    <motion.div {...fadeUp} className="flex flex-col items-center gap-3 py-16">
      <motion.div
        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 rounded-full border-2 border-[#E4DAE8] border-t-[#7A2267]"
      />
      <p className="text-[12px] text-[#9B8BAB]">{label}</p>
    </motion.div>
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────
// Clicking always opens the detail panel. Selection happens inside the panel.

function RoomCard({ room, selected, onDetail }) {
  return (
    <button
      type="button"
      onClick={() => onDetail(room)}
      className={`relative w-full rounded-2xl border-2 overflow-hidden transition-all duration-200 text-left
        ${selected
          ? "border-[#7A2267] shadow-[0_4px_20px_rgba(122,34,103,0.20)]"
          : "border-[#EDE5F0] hover:border-[#7A2267]/40 active:scale-[0.97]"
        }`}
      style={{ aspectRatio: "1/1" }}
    >
      {room.coverImage ? (
        <>
          <img src={room.coverImage} alt={`Room ${room.roomNumber}`} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-2">
            <p className="text-white font-bold text-[1rem] font-mono leading-none">{room.roomNumber}</p>
            <p className="text-white/60 text-[9px]">Floor {room.floor}</p>
          </div>
        </>
      ) : (
        <div className={`w-full h-full flex flex-col items-center justify-center p-2
          ${selected ? "bg-[#7A2267]/6" : "bg-[#FEFCF9]"}`}>
          <p className={`text-[1.3rem] font-bold font-mono leading-none ${selected ? "text-[#7A2267]" : "text-[#1C1C1C]"}`}>
            {room.roomNumber}
          </p>
          <p className={`text-[9px] mt-0.5 ${selected ? "text-[#7A2267]/70" : "text-[#9B8BAB]"}`}>
            Fl. {room.floor}
          </p>
          {room.variant && (
            <p className={`text-[8px] mt-0.5 truncate max-w-full px-1 ${selected ? "text-[#7A2267]/60" : "text-[#C4B3CE]"}`}>
              {room.variant.name}
            </p>
          )}
          {(() => {
            const ep = room.pricePerNight > 0 ? room.pricePerNight : room.variant?.pricePerNight;
            return ep > 0 ? (
              <p className={`text-[8.5px] mt-0.5 font-semibold ${selected ? "text-[#7A2267]" : "text-[#9B8BAB]"}`}>
                ৳{ep.toLocaleString()}
              </p>
            ) : null;
          })()}
        </div>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-[#7A2267]
          flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Tap hint */}
      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/80 backdrop-blur-sm
        border border-white/60 flex items-center justify-center">
        <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
          <circle cx="5" cy="5" r="4" stroke="#7A2267" strokeWidth="1.2" />
          <path d="M5 4v3M5 3v.3" stroke="#7A2267" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  );
}

// ─── Room Detail Panel ────────────────────────────────────────────────────────
// Click-triggered, persistent. Closes only via X or backdrop.
// Includes Select / Deselect button so mobile users can book from here.

function RoomDetailPanel({ room, category, selected, onSelect, onClose }) {
  if (!room) return null;

  const isSelected = selected?._id === room._id;

  function handleSelect() {
    onSelect(isSelected ? null : room);
    onClose();
  }

  return (
    <>
      {/* Backdrop — both mobile and desktop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel ─ bottom sheet on mobile, right-side card on sm+ */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="fixed z-50 bg-white
          bottom-0 left-0 right-0 rounded-t-3xl
          sm:bottom-6 sm:right-6 sm:left-auto sm:w-80 sm:rounded-2xl
          sm:[transform:none]
          overflow-hidden shadow-[0_-4px_40px_rgba(122,34,103,0.15)]
          sm:shadow-[0_8px_40px_rgba(122,34,103,0.20)]
          max-h-[88vh] sm:max-h-[80vh] flex flex-col"

      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#E4DAE8]" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Hero image or header */}
          {room.coverImage ? (
            <div className="relative h-52 sm:h-44 overflow-hidden shrink-0">
              <img src={room.coverImage} alt={`Room ${room.roomNumber}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="text-white font-bold text-2xl font-mono leading-none">#{room.roomNumber}</p>
                <p className="text-white/65 text-xs mt-0.5">Floor {room.floor}</p>
              </div>
              <button onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm
                  flex items-center justify-center hover:bg-black/60 transition-colors">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F3EDF5] shrink-0">
              <div>
                <p className="font-bold text-2xl font-mono text-[#1C1C1C] leading-none">#{room.roomNumber}</p>
                <p className="text-sm text-[#9B8BAB] mt-0.5">Floor {room.floor}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F3EDF5] hover:bg-[#EDE5F0] flex items-center justify-center transition-colors">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="#7A2267" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Category / Variant badges */}
            {(category || room.variant) && (
              <div className="flex flex-wrap gap-1.5">
                {room.variant && (
                  <span className="text-[11px] text-[#7A2267] bg-[#7A2267]/6 px-3 py-1 rounded-full border border-[#7A2267]/15 font-semibold">
                    {room.variant.name}
                  </span>
                )}
                {(room.variant?.bedType ?? category?.bedType) && (
                  <span className="text-[11px] text-[#7A2267]/70 bg-[#7A2267]/6 px-3 py-1 rounded-full border border-[#7A2267]/15">
                    {room.variant?.bedType ?? category.bedType} bed
                  </span>
                )}
                {category?.size && (
                  <span className="text-[11px] text-[#9B8BAB] bg-[#F3EDF5] px-3 py-1 rounded-full border border-[#EDE5F0]">
                    {category.size}
                  </span>
                )}
                {(room.variant?.maxAdults ?? category?.maxAdults) && (
                  <span className="text-[11px] text-[#9B8BAB] bg-[#F3EDF5] px-3 py-1 rounded-full border border-[#EDE5F0]">
                    Up to {room.variant?.maxAdults ?? category.maxAdults} adults
                  </span>
                )}
                {(() => {
                  const ep = room.pricePerNight > 0
                    ? room.pricePerNight
                    : (room.variant?.pricePerNight ?? category?.pricePerNight);
                  return ep > 0 ? (
                    <span className="text-[11px] text-[#7A2267] bg-[#7A2267]/6 px-3 py-1 rounded-full border border-[#7A2267]/15 font-semibold">
                      ৳{ep.toLocaleString()}/night
                      {room.pricePerNight > 0 && <span className="text-[9px] ml-1 opacity-70">(room rate)</span>}
                    </span>
                  ) : null;
                })()}
              </div>
            )}

            {/* Room description */}
            {room.description && (
              <p className="text-[13px] text-[#6B5B7A] leading-relaxed">{room.description}</p>
            )}

            {/* Action buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Select / Deselect */}
              <button
                type="button"
                onClick={handleSelect}
                className={`w-full py-3.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200
                  ${isSelected
                    ? "bg-[#F3EDF5] border-2 border-[#7A2267]/30 text-[#7A2267]"
                    : "bg-[#7A2267] text-white hover:bg-[#8e2878] shadow-[0_4px_16px_rgba(122,34,103,0.25)]"
                  }`}
              >
                {isSelected ? "✓ Room Selected — Change?" : "Select This Room"}
              </button>

              {/* View full profile */}
              <Link
                href={`/rooms/${room._id}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                  border border-[#EDE5F0] text-[#9B8BAB] text-[12.5px] font-medium
                  hover:border-[#7A2267]/30 hover:text-[#7A2267] transition-colors duration-150"
              >
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                  <path d="M2 12L12 2M8 2h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View Full Room Profile
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ preselect, onNext }) {
  const [view,    setView]    = useState("listing");
  const [navDir,  setNavDir]  = useState(1);

  const [properties,     setProperties]     = useState([]);
  const [selProperty,    setSelProperty]    = useState(null);
  const [categories,     setCategories]     = useState([]);
  const [selCategory,    setSelCategory]    = useState(null);
  const [availableRooms, setAvailableRooms] = useState(null);
  const [selRoom,        setSelRoom]        = useState(null);

  const [checkIn,    setCheckIn]    = useState("");
  const [checkOut,   setCheckOut]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [detailRoom, setDetailRoom] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getProperties({ onlyActive: true, limit: 50 });
        setProperties(res.properties);
        if (preselect?.propertyId) {
          const prop = res.properties.find((p) => p._id === preselect.propertyId);
          if (prop) await selectProperty(prop);
        }
      } finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProperty = useCallback(async (prop) => {
    setSelProperty(prop);
    setSelCategory(null);
    setAvailableRooms(null);
    setSelRoom(null);
    setError("");
    if (prop.type === "building") {
      setLoading(true);
      setNavDir(1);
      try {
        const cats = await getCategoriesByProperty(prop._id);
        setCategories(cats);
        if (preselect?.categoryId) {
          const cat = cats.find((c) => c._id === preselect.categoryId);
          if (cat) { setSelCategory(cat); setView("datepick"); return; }
        }
        setView("categories");
      } finally { setLoading(false); }
    } else {
      setNavDir(1);
      setView("datepick");
    }
  }, [preselect]);

  function goBack() {
    setNavDir(-1);
    setError("");
    setAvailableRooms(null);
    setSelRoom(null);
    if (view === "datepick" && selProperty?.type === "building") {
      setView("categories");
    } else {
      setSelProperty(null);
      setView("listing");
    }
  }

  async function handleCheckDates() {
    const nights = diffDays(checkIn, checkOut);
    if (nights < 1) { setError("Check-out must be at least 1 night after check-in."); return; }
    setError("");
    setLoading(true);
    setAvailableRooms(null);
    setSelRoom(null);
    try {
      if (selCategory) {
        const rooms = await getAvailableRooms(selCategory._id, checkIn, checkOut);
        setAvailableRooms(rooms);
        if (rooms.length === 0) setError("No rooms available for these dates. Try different dates.");
      } else {
        const { available } = await checkAvailability({ propertyId: selProperty._id, checkIn, checkOut });
        if (!available) {
          setError("This cottage is not available for these dates. Try different dates.");
        } else {
          setAvailableRooms([]);
        }
      }
    } finally { setLoading(false); }
  }

  function handleConfirm() {
    if (selCategory && !selRoom) { setError("Please select a room to continue."); return; }
    const nights    = diffDays(checkIn, checkOut);
    const basePrice = (selRoom?.pricePerNight > 0 ? selRoom.pricePerNight : null)
      ?? selRoom?.variant?.pricePerNight
      ?? (selCategory ? selCategory.pricePerNight : (selProperty.pricePerNight || 0));
    onNext({ checkIn, checkOut, nights, basePrice, selProperty, selCategory, selRoom,
      bookingType: selCategory ? "room" : "cottage" });
  }

  const canConfirm = availableRooms !== null &&
    (selProperty?.type === "cottage" || (availableRooms.length > 0 && selRoom));

  return (
    <div>
      {/* Breadcrumb */}
      <AnimatePresence>
        {view !== "listing" && (
          <motion.div {...fadeUp} className="flex items-center gap-2 mb-5">
            <button onClick={() => { setNavDir(-1); setSelProperty(null); setView("listing"); }}
              className="text-[11.5px] text-[#7A2267] hover:underline">All Properties</button>
            {selProperty && (
              <>
                <span className="text-[#D4C0DC]">/</span>
                {view === "datepick" && selProperty.type === "building"
                  ? <button onClick={() => { setNavDir(-1); setView("categories"); }}
                      className="text-[11.5px] text-[#7A2267] hover:underline">{selProperty.name}</button>
                  : <span className="text-[11.5px] text-[#9B8BAB]">{selProperty.name}</span>
                }
              </>
            )}
            {selCategory && view === "datepick" && (
              <>
                <span className="text-[#D4C0DC]">/</span>
                <span className="text-[11.5px] text-[#9B8BAB]">{selCategory.name}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" custom={navDir}>
        {/* ── Property Listing ── */}
        {view === "listing" && (
          <motion.div key="listing" custom={navDir} {...slideIn(navDir)}>
            <p className={`text-[1.6rem] font-light text-[#1C1C1C] mb-1 ${cormorant.className}`}>
              Where would you like to stay?
            </p>
            <p className="text-[12.5px] text-[#9B8BAB] mb-6">
              Choose from our curated collection of rooms and private cottages.
            </p>
            {loading ? <Spinner label="Loading properties…" /> : (
              <motion.div variants={stagger} initial="initial" animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((prop) => (
                  <motion.button
                    key={prop._id}
                    variants={cardItem}
                    whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(122,34,103,0.10)" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectProperty(prop)}
                    className="text-left bg-white border border-[#EDE5F0] rounded-2xl overflow-hidden
                      shadow-[0_2px_16px_rgba(122,34,103,0.04)] transition-all duration-300 group"
                  >
                    <div className="relative h-44 overflow-hidden bg-[#F3EDF5]">
                      {prop.coverImage ? (
                        <img src={prop.coverImage} alt={prop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                            <path d="M5 35V17L20 5l15 12v18" stroke="#C9B8D4" strokeWidth="1.5" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                      <span className={`absolute top-3 left-3 text-[9px] uppercase tracking-wider font-semibold
                        px-2.5 py-1 rounded-full backdrop-blur-sm
                        ${prop.type === "building"
                          ? "bg-[#7A2267]/20 text-[#E8B8E2] border border-[#7A2267]/30"
                          : "bg-white/15 text-white/80 border border-white/25"
                        }`}>
                        {prop.type}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className={`text-[1.1rem] font-medium text-[#1C1C1C] leading-tight ${cormorant.className}`}>
                        {prop.name}
                      </p>
                      {prop.location && (
                        <p className="text-[11.5px] text-[#9B8BAB] flex items-center gap-1.5 mt-1">
                          <svg viewBox="0 0 10 14" width="7" height="9" fill="none">
                            <path d="M5 1a4 4 0 0 1 4 4c0 3-4 8-4 8S1 8 1 5a4 4 0 0 1 4-4Z"
                              stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="5" cy="5" r="1.2" fill="currentColor" />
                          </svg>
                          {prop.location}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {prop.type === "building"
                          ? <span className="text-[11px] text-[#9B8BAB]">
                              {prop.roomStats?.available ?? 0} rooms available
                            </span>
                          : <span className="text-[13px] font-semibold text-[#1C1C1C]">
                              {prop.pricePerNight > 0 ? `৳${prop.pricePerNight.toLocaleString()}/night` : "Enquire"}
                            </span>
                        }
                        <span className="text-[11.5px] text-[#7A2267] font-medium flex items-center gap-1">
                          Select
                          <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                            <path d="M1 4h5M4 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Category Listing ── */}
        {view === "categories" && (
          <motion.div key="categories" custom={navDir} {...slideIn(navDir)}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className={`text-[1.6rem] font-light text-[#1C1C1C] ${cormorant.className}`}>{selProperty?.name}</p>
                <p className="text-[12px] text-[#9B8BAB] mt-0.5">Choose a room category to see availability.</p>
              </div>
              <button onClick={goBack}
                className="shrink-0 flex items-center gap-1.5 text-[11.5px] text-[#9B8BAB] hover:text-[#7A2267] transition-colors mt-1">
                <svg viewBox="0 0 8 8" width="9" height="9" fill="none">
                  <path d="M6 7.5 2 4l4-3.5" stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            </div>

            {loading ? <Spinner label="Loading categories…" /> : (
              <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
                {categories.map((cat) => (
                  <motion.button
                    key={cat._id}
                    variants={cardItem}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelCategory(cat);
                      setNavDir(1);
                      setView("datepick");
                      setAvailableRooms(null);
                      setSelRoom(null);
                    }}
                    disabled={cat.roomStats?.total === 0}
                    className={`w-full text-left flex gap-4 p-4 bg-white border rounded-2xl
                      shadow-[0_2px_12px_rgba(122,34,103,0.04)] transition-all duration-200 group
                      ${cat.roomStats?.total === 0
                        ? "border-[#EDE5F0] opacity-40 cursor-not-allowed"
                        : "border-[#EDE5F0] hover:border-[#7A2267]/30 hover:shadow-[0_4px_20px_rgba(122,34,103,0.08)]"
                      }`}
                  >
                    {cat.coverImage && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#F3EDF5]">
                        <img src={cat.coverImage} alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[1.15rem] font-medium text-[#1C1C1C] leading-tight ${cormorant.className}`}>
                          {cat.name}
                        </p>
                        <div className="text-right shrink-0">
                          {cat.variants?.length > 0 && (() => {
                            const prices = cat.variants.map((v) => v.pricePerNight).filter(Boolean);
                            const min = Math.min(...prices);
                            const max = Math.max(...prices);
                            return (
                              <>
                                <p className="text-[15px] font-bold text-[#1C1C1C]">
                                  ৳{min.toLocaleString()}
                                  {max !== min && <span className="text-[11px] font-normal text-[#9B8BAB]"> – ৳{max.toLocaleString()}</span>}
                                </p>
                                <p className="text-[10px] text-[#9B8BAB]">per night</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cat.variants?.length > 0 && (
                          [...new Set(cat.variants.map((v) => v.bedType).filter(Boolean))].map((bt) => (
                            <span key={bt} className="text-[10px] text-[#7A2267]/70 bg-[#7A2267]/5 px-2 py-0.5 rounded-full border border-[#7A2267]/15">
                              {bt}
                            </span>
                          ))
                        )}
                        {cat.size && (
                          <span className="text-[10px] text-[#9B8BAB] bg-[#F3EDF5] px-2 py-0.5 rounded-full border border-[#EDE5F0]">
                            {cat.size}
                          </span>
                        )}
                        {cat.maxAdults && (
                          <span className="text-[10px] text-[#9B8BAB] bg-[#F3EDF5] px-2 py-0.5 rounded-full border border-[#EDE5F0]">
                            {cat.maxAdults} adults
                          </span>
                        )}
                      </div>
                      <p className={`mt-2 text-[11px] font-semibold
                        ${cat.roomStats?.available > 0 ? "text-emerald-600" : "text-[#7A2267]/60"}`}>
                        {cat.roomStats?.available > 0
                          ? `${cat.roomStats.available} rooms free`
                          : "Check dates for availability"}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Date & Room Picker ── */}
        {view === "datepick" && (
          <motion.div key="datepick" custom={navDir} {...slideIn(navDir)} className="space-y-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className={`text-[1.6rem] font-light text-[#1C1C1C] ${cormorant.className}`}>
                  {selCategory ? selCategory.name : selProperty?.name}
                </p>
                <p className="text-[12.5px] text-[#9B8BAB] mt-0.5">
                  {selCategory?.variants?.length > 0
                    ? (() => {
                        const prices = selCategory.variants.map((v) => v.pricePerNight).filter(Boolean);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return `৳${min.toLocaleString()}${max !== min ? ` – ৳${max.toLocaleString()}` : ""} per night`;
                      })()
                    : selProperty?.pricePerNight > 0
                      ? `৳${selProperty.pricePerNight?.toLocaleString()} per night`
                      : ""}
                </p>
              </div>
              <button onClick={goBack}
                className="shrink-0 flex items-center gap-1.5 text-[11.5px] text-[#9B8BAB] hover:text-[#7A2267] transition-colors mt-1">
                <svg viewBox="0 0 8 8" width="9" height="9" fill="none">
                  <path d="M6 7.5 2 4l4-3.5" stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            </div>

            {/* Custom calendar */}
            <Card className="p-5">
              <SectionLabel>Select Your Dates</SectionLabel>
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckIn={(v) => { setCheckIn(v); setAvailableRooms(null); setSelRoom(null); setError(""); }}
                onCheckOut={(v) => { setCheckOut(v); setAvailableRooms(null); setSelRoom(null); setError(""); }}
              />

              {/* Nights + price summary */}
              <AnimatePresence>
                {checkIn && checkOut && diffDays(checkIn, checkOut) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-between bg-[#7A2267]/5 border border-[#7A2267]/15
                      rounded-xl px-4 py-2.5 mt-4"
                  >
                    <span className="text-[12.5px] text-[#5A1F4F]">
                      {diffDays(checkIn, checkOut)} night{diffDays(checkIn, checkOut) !== 1 ? "s" : ""}
                    </span>
                    {(() => {
                      // For category rooms: only show price after room is selected
                      // For cottage: show property price immediately
                      if (selCategory) {
                        if (!selRoom) {
                          return (
                            <span className="text-[11px] text-[#9B8BAB] italic">
                              Select a room to see price
                            </span>
                          );
                        }
                        const ep = (selRoom.pricePerNight > 0 ? selRoom.pricePerNight : null)
                          ?? selRoom.variant?.pricePerNight
                          ?? selCategory.pricePerNight
                          ?? 0;
                        return (
                          <span className="text-[14px] font-bold text-[#7A2267]">
                            ৳{(ep * diffDays(checkIn, checkOut)).toLocaleString()}
                          </span>
                        );
                      }
                      // Cottage
                      const ep = selProperty?.pricePerNight ?? 0;
                      return ep > 0 ? (
                        <span className="text-[14px] font-bold text-[#7A2267]">
                          ৳{(ep * diffDays(checkIn, checkOut)).toLocaleString()}
                        </span>
                      ) : null;
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleCheckDates}
                disabled={loading || diffDays(checkIn, checkOut) < 1}
                className="w-full py-3.5 rounded-xl bg-[#1C1C1C] text-white text-[12.5px] font-semibold
                  tracking-wide hover:bg-[#7A2267] disabled:opacity-40 transition-colors duration-300 mt-4"
              >
                {loading ? "Checking availability…" : "Check Availability"}
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[12px] text-[#7A2267] bg-[#7A2267]/5 border border-[#7A2267]/15
                      px-4 py-2.5 rounded-xl text-center mt-3">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </Card>

            {/* Room grid */}
            <AnimatePresence>
              {availableRooms !== null && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}>
                  <Card className="p-5">
                    {selCategory && availableRooms.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <SectionLabel>Select Your Room</SectionLabel>
                          <span className="text-[11px] text-emerald-600 font-semibold -mt-4">
                            {availableRooms.length} available
                          </span>
                        </div>

                        {(() => {
                          // Sort by price asc
                          const sorted = [...availableRooms].sort((a, b) => {
                            const pA = a.variant?.pricePerNight ?? selCategory?.pricePerNight ?? 0;
                            const pB = b.variant?.pricePerNight ?? selCategory?.pricePerNight ?? 0;
                            return pA - pB;
                          });

                          const hasBlocks = sorted.some((r) => r.block);
                          const hasRows   = sorted.some((r) => r.row);

                          // group: block → floor → row
                          const grouped = {};
                          for (const room of sorted) {
                            const bk = room.block || (hasBlocks ? "Other" : "");
                            const fk = String(room.floor);
                            const rk = room.row || "";
                            if (!grouped[bk])     grouped[bk] = {};
                            if (!grouped[bk][fk]) grouped[bk][fk] = {};
                            if (!grouped[bk][fk][rk]) grouped[bk][fk][rk] = [];
                            grouped[bk][fk][rk].push(room);
                          }

                          return (
                            <div className="space-y-5">
                              {Object.keys(grouped).map((block) => (
                                <div key={block}>
                                  {hasBlocks && block && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-[9.5px] uppercase tracking-wider font-semibold text-[#7A2267] bg-[#7A2267]/8 border border-[#7A2267]/20 px-2.5 py-1 rounded-full">
                                        {block}
                                      </span>
                                      <div className="flex-1 h-px bg-[#EDE5F0]" />
                                    </div>
                                  )}
                                  {Object.keys(grouped[block]).sort((a, b) => Number(a) - Number(b)).map((floor) => (
                                    <div key={floor} className="mb-3">
                                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#C4B3CE] font-semibold mb-2 flex items-center gap-2">
                                        Floor {floor}
                                        <span className="flex-1 h-px bg-[#F0EAF3]" />
                                      </p>
                                      {Object.keys(grouped[block][floor]).map((rowKey) => (
                                        <div key={rowKey} className="mb-2">
                                          {hasRows && rowKey && (
                                            <p className="text-[8.5px] uppercase tracking-wider text-[#D4C0DC] font-medium mb-1.5">
                                              {rowKey}
                                            </p>
                                          )}
                                          <motion.div variants={stagger} initial="initial" animate="animate"
                                            className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {grouped[block][floor][rowKey].map((room) => (
                                              <motion.div key={room._id} variants={cardItem}>
                                                <RoomCard
                                                  room={room}
                                                  selected={selRoom?._id === room._id}
                                                  onDetail={setDetailRoom}
                                                />
                                              </motion.div>
                                            ))}
                                          </motion.div>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        <p className="text-[10.5px] text-[#C9B8D4] text-center mt-4">
                          Tap a room to view details &amp; select
                        </p>
                      </>
                    ) : selProperty?.type === "cottage" ? (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200
                          flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.7"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-emerald-800">Cottage is available!</p>
                          <p className="text-[12px] text-emerald-600 mt-0.5">Your dates are free. Continue below.</p>
                        </div>
                      </div>
                    ) : null}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue */}
            <AnimatePresence>
              {canConfirm && (
                <motion.button
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 28px rgba(122,34,103,0.22)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="w-full py-4 rounded-xl bg-[#7A2267] text-white text-[13px] font-semibold
                    tracking-wide transition-all duration-200"
                >
                  Continue to Guest Details →
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room detail panel */}
      <AnimatePresence>
        {detailRoom && (
          <RoomDetailPanel
            key={detailRoom._id}
            room={detailRoom}
            category={selCategory}
            selected={selRoom}
            onSelect={setSelRoom}
            onClose={() => setDetailRoom(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Doc Upload ───────────────────────────────────────────────────────────────

function DocUpload({ label, hint, value, onChange, error }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");

    if (file.size > 1024 * 1024) { setUploadErr("File must be under 1 MB."); return; }
    const ok = ["image/jpeg","image/jpg","image/png","image/webp","application/pdf"];
    if (!ok.includes(file.type)) { setUploadErr("Only JPG, PNG, WebP or PDF allowed."); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch("/api/upload-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      onChange(data.url);
    } catch (err) {
      setUploadErr(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const displayErr = uploadErr || error;

  return (
    <div>
      <label className={FL}>{label} *</label>
      {hint && <p className="text-[10.5px] text-[#B8A4C2] mb-2 -mt-1">{hint}</p>}

      {value ? (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border
          ${displayErr ? "border-red-300 bg-red-50" : "border-[#7A2267]/25 bg-[#7A2267]/4"}`}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" className="shrink-0">
            <path d="M3 2h7l4 4v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#7A2267" strokeWidth="1.3"/>
            <path d="M10 2v4h4" stroke="#7A2267" strokeWidth="1.3"/>
          </svg>
          <span className="text-[12px] text-[#7A2267] flex-1 truncate min-w-0">
            {value.split("/").pop()}
          </span>
          <button type="button" onClick={() => onChange("")}
            className="text-[11px] text-red-400 hover:text-red-600 transition-colors shrink-0">
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`w-full border-2 border-dashed rounded-xl py-4 px-4 flex items-center justify-center
            gap-2 text-[12.5px] transition-all duration-200 disabled:opacity-60
            ${displayErr
              ? "border-red-300 text-red-400 bg-red-50/50"
              : "border-[#E4DAE8] text-[#9B8BAB] hover:border-[#7A2267]/40 hover:text-[#7A2267]"
            }`}
        >
          {uploading ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-[#E4DAE8] border-t-[#7A2267]" />
              Uploading…
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
                <path d="M8 11V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Tap to upload · JPG, PNG, WebP or PDF · Max 1 MB
            </>
          )}
        </button>
      )}

      <input ref={inputRef} type="file" className="hidden"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={handleFile} />

      {displayErr && (
        <p className="text-[11px] text-red-500 mt-1.5">{displayErr}</p>
      )}
    </div>
  );
}

// ─── Step 2: Guest Info ───────────────────────────────────────────────────────

const BLANK_GUEST = { name: "", age: "", gender: "male" };
const GENDER_OPTIONS = [
  { value: "male",   label: "Male"   },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other"  },
];

// Bed types that can be a "couple room"
const COUPLE_BED_TYPES = ["Double", "Queen", "King"];

// Validation helpers
function validEmail(v) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test((v || "").trim());
}
function validBDPhone(v) {
  const c = (v || "").replace(/[\s\-()+.]/g, "");
  return /^(\+?880|0)1[3-9]\d{8}$/.test(c);
}
function validIntlPhone(v) {
  if (!v || !v.trim()) return true; // optional
  const c = v.replace(/[\s\-()+.]/g, "");
  return /^\+?[1-9]\d{6,14}$/.test(c);
}

function Step2({ settings, datesData, onNext, onBack }) {
  const selCategory    = datesData?.selCategory ?? null;
  const maxFreeChildAge = settings?.maxFreeChildAge ?? 12;
  const maxAdults      = selCategory?.maxAdults   ?? 2;
  const maxChildren    = selCategory?.maxChildren ?? 1;
  const totalCapacity  = maxAdults + maxChildren; // including primary guest

  const [primary, setPrimary] = useState({
    name: "", email: "", phone: "", whatsapp: "", gender: "male", age: "",
  });
  const [guests,          setGuests]          = useState([]);
  const [nidUrl,          setNidUrl]          = useState("");
  const [nidMethod,       setNidMethod]       = useState("upload"); // "upload" | "desk"
  const [marriageCertUrl, setMarriageCertUrl] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [errors,          setErrors]          = useState({});

  // ── Auto couple detection ─────────────────────────────────────────────────
  const isCoupleBooking = useMemo(() => {
    const bedType = datesData?.selRoom?.variant?.bedType ?? selCategory?.bedType;
    if (!COUPLE_BED_TYPES.includes(bedType)) return false;
    const all = [
      { gender: primary.gender, age: Number(primary.age) || 0 },
      ...guests.map((g) => ({ gender: g.gender, age: Number(g.age) || 0 })),
    ];
    const adults = all.filter((g) => g.age > maxFreeChildAge);
    if (adults.length !== 2) return false;
    return adults.some((g) => g.gender === "male") && adults.some((g) => g.gender === "female");
  }, [primary.gender, primary.age, guests, datesData?.selRoom?.variant?.bedType, selCategory?.bedType, maxFreeChildAge]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setPri = (k) => (e) => {
    setPrimary((p) => ({ ...p, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: "" }));
  };
  const canAddGuest = (1 + guests.length) < totalCapacity;

  function addGuest() {
    if (!canAddGuest) return;
    setGuests((g) => [...g, { ...BLANK_GUEST }]);
  }
  function removeGuest(i) { setGuests((p) => p.filter((_, j) => j !== i)); }
  function updateGuest(i, k, v) {
    setGuests((p) => p.map((g, j) => j === i ? { ...g, [k]: v } : g));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!primary.name.trim())          e.name     = "Full name is required.";
    if (!primary.email)                e.email    = "Email is required.";
    else if (!validEmail(primary.email)) e.email  = "Enter a valid email address (e.g. you@example.com).";
    if (!primary.phone)                e.phone    = "Phone number is required.";
    else if (!validBDPhone(primary.phone)) e.phone = "Enter a valid BD mobile number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX).";
    if (primary.whatsapp && !validIntlPhone(primary.whatsapp))
      e.whatsapp = "Enter a valid phone number (e.g. +8801XXXXXXXXX).";
    if (!primary.age)                  e.age      = "Age is required.";
    else if (Number(primary.age) < 18) e.age      = "Primary guest must be at least 18 years old.";
    if (nidMethod === "upload" && !nidUrl) e.nid    = "Please upload your NID / passport.";
    if (isCoupleBooking && !marriageCertUrl)
      e.cert = "Marriage certificate is required for couple bookings.";
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onNext({
      primaryGuest:      { ...primary, age: Number(primary.age) },
      guests:            guests.map((g) => ({ ...g, age: Number(g.age) })),
      isCoupleBooking,
      coupleDocumentUrl: marriageCertUrl,
      coupleDocMethod:   marriageCertUrl ? "uploaded" : "",
      nidUrl,
      nidMethod,
      specialRequests,
    });
  }

  // ── Field renderer with inline error ─────────────────────────────────────
  function FieldErr({ name }) {
    return errors[name]
      ? <p className="text-[11px] text-red-500 mt-1">{errors[name]}</p>
      : null;
  }

  return (
    <motion.div key="step2" {...fadeUp} className="space-y-4">

      {/* Primary guest */}
      <Card className="p-5 space-y-4">
        <SectionLabel>Primary Guest</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className={FL}>Full Name *</label>
            <input
              className={`${FI} ${errors.name ? "border-red-300 focus:border-red-400" : ""}`}
              value={primary.name} onChange={setPri("name")} placeholder="As on NID / Passport"
            />
            <FieldErr name="name" />
          </div>

          <div>
            <label className={FL}>Email *</label>
            <input
              type="email"
              className={`${FI} ${errors.email ? "border-red-300 focus:border-red-400" : ""}`}
              value={primary.email} onChange={setPri("email")} placeholder="you@example.com"
            />
            <FieldErr name="email" />
          </div>

          <div>
            <label className={FL}>Phone *</label>
            <input
              className={`${FI} ${errors.phone ? "border-red-300 focus:border-red-400" : ""}`}
              value={primary.phone} onChange={setPri("phone")} placeholder="01XXXXXXXXX"
            />
            <FieldErr name="phone" />
          </div>

          <div>
            <label className={FL}>WhatsApp <span className="normal-case text-[#C4B3CE]">(optional)</span></label>
            <input
              className={`${FI} ${errors.whatsapp ? "border-red-300 focus:border-red-400" : ""}`}
              value={primary.whatsapp} onChange={setPri("whatsapp")} placeholder="+8801XXXXXXXXX"
            />
            <FieldErr name="whatsapp" />
          </div>

          <div>
            <label className={FL}>Age *</label>
            <input
              type="number"
              className={`${FI} ${errors.age ? "border-red-300 focus:border-red-400" : ""}`}
              value={primary.age} onChange={setPri("age")} min="18" placeholder="18+"
            />
            <FieldErr name="age" />
          </div>

          <div>
            <label className={FL}>Gender *</label>
            <CustomSelect
              value={primary.gender}
              onChange={(v) => { setPrimary((p) => ({ ...p, gender: v })); }}
              options={GENDER_OPTIONS}
            />
          </div>
        </div>

        {/* NID method selector */}
        <div>
          <label className={FL}>NID / Passport *</label>
          <div className="flex gap-2 mb-3">
            {[["upload","Upload Now"],["desk","Bring to Desk"]].map(([v, label]) => (
              <button key={v} type="button" onClick={() => { setNidMethod(v); if (v === "desk") { setNidUrl(""); setErrors(p => ({...p, nid: ""})); } }}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border-2 transition-all duration-200
                  ${nidMethod === v ? "bg-[#7A2267]/6 border-[#7A2267]/40 text-[#7A2267]" : "border-[#E4DAE8] text-[#9B8BAB] hover:border-[#7A2267]/25"}`}>
                {label}
              </button>
            ))}
          </div>
          {nidMethod === "upload" && (
            <DocUpload
              label="NID / Passport Scan"
              hint="A clear photo or scan of your national ID or passport."
              value={nidUrl}
              onChange={(url) => { setNidUrl(url); setErrors((p) => ({ ...p, nid: "" })); }}
              error={errors.nid}
            />
          )}
          {nidMethod === "desk" && (
            <p className="text-[11.5px] text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
              Please bring your original NID / Passport to the front desk at check-in.
            </p>
          )}
        </div>
      </Card>

      {/* Additional guests */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Additional Guests</SectionLabel>
          <div className="flex items-center gap-3 -mt-4">
            <span className="text-[10.5px] text-[#C9B8D4]">
              {1 + guests.length} / {totalCapacity}
            </span>
            <button
              type="button"
              onClick={addGuest}
              disabled={!canAddGuest}
              className="text-[12px] text-[#7A2267] font-semibold hover:text-[#8e2878]
                transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Add Guest
            </button>
          </div>
        </div>

        {maxFreeChildAge > 0 && (
          <p className="text-[11px] text-[#9B8BAB] -mt-1">
            Children {maxFreeChildAge} and under are classified as child guests.
            Max {maxAdults} adults · {maxChildren} children for this room.
          </p>
        )}

        <AnimatePresence>
          {guests.map((g, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-[#EDE5F0] rounded-xl p-4 space-y-3 overflow-hidden bg-[#FEFCF9]">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] font-semibold text-[#6B5B7A]">Guest {i + 1}</p>
                <button onClick={() => removeGuest(i)}
                  className="text-[11px] text-red-400 hover:text-red-600 transition-colors">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className={FL}>Name</label>
                  <input className={FI} value={g.name}
                    onChange={(e) => updateGuest(i, "name", e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className={FL}>Age</label>
                  <input type="number" className={FI} value={g.age}
                    onChange={(e) => updateGuest(i, "age", e.target.value)} min="0" />
                </div>
                <div>
                  <label className={FL}>Gender</label>
                  <CustomSelect
                    value={g.gender}
                    onChange={(v) => updateGuest(i, "gender", v)}
                    options={GENDER_OPTIONS}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>

      {/* Auto couple booking notice + cert upload */}
      <AnimatePresence>
        {isCoupleBooking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          >
            <Card className="p-5 space-y-4 border-[#7A2267]/25">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7A2267]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-[#7A2267]">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M8 5v3.5M8 11v.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#1C1C1C]">Couple Booking Detected</p>
                  <p className="text-[12px] text-[#9B8BAB] mt-0.5 leading-relaxed">
                    This is a double-bed room with one male and one female adult guest.
                    A valid marriage certificate must be uploaded to proceed.
                  </p>
                </div>
              </div>

              <DocUpload
                label="Marriage Certificate"
                hint="Upload a clear photo or scan. Max 1 MB — JPG, PNG or PDF."
                value={marriageCertUrl}
                onChange={(url) => { setMarriageCertUrl(url); setErrors((p) => ({ ...p, cert: "" })); }}
                error={errors.cert}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special requests */}
      <Card className="p-5">
        <label className={FL + " mb-2"}>Special Requests <span className="normal-case text-[#C4B3CE]">(optional)</span></label>
        <textarea className={`${FI} resize-none`} rows={3} value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requirements or preferences…" />
      </Card>

      {/* Global error summary */}
      <AnimatePresence>
        {Object.keys(errors).length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-center">
            Please fix the errors above before continuing.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-3 pt-1">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border-2 border-[#E4DAE8] text-[#6B5B7A] text-[12.5px]
            font-semibold hover:bg-[#F5EDF5] transition-all duration-200">
          ← Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.015, boxShadow: "0 8px 28px rgba(122,34,103,0.22)" }}
          whileTap={{ scale: 0.985 }}
          onClick={handleNext}
          className="flex-[2] py-3.5 rounded-xl bg-[#7A2267] text-white text-[13px] font-semibold
            tracking-wide transition-all duration-200">
          Review &amp; Pay →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Payment ──────────────────────────────────────────────────────────

function Step3({ datesData, guestData, settings, onBack }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState("sslcommerz");
  const [isPending, startTransition]      = useTransition();
  const [error, setError] = useState("");

  const { checkIn, checkOut, nights, basePrice, selProperty, selCategory, selRoom, bookingType } = datesData;
  const subtotal    = basePrice * nights;
  const taxes       = Math.round((subtotal * (settings?.taxPercent ?? 0)) / 100);
  const totalAmount = subtotal + taxes;

  const advancePct    = settings?.advancePaymentPercent ?? 30;
  const advanceAmount = Math.ceil((totalAmount * advancePct) / 100);
  const balanceDue    = totalAmount - advanceAmount;

  function handlePay() {
    setError("");
    startTransition(async () => {
      try {
        const bookingData = {
          propertyId:        selProperty._id,
          categoryId:        selCategory?._id  ?? null,
          roomId:            selRoom?._id       ?? null,
          bookingType,
          checkIn, checkOut, nights,
          primaryGuest:      guestData.primaryGuest,
          guests:            guestData.guests,
          isCoupleBooking:   guestData.isCoupleBooking,
          coupleDocumentUrl: guestData.coupleDocumentUrl,
          coupleDocMethod:   guestData.coupleDocMethod,
          nidUrl:            guestData.nidUrl,
          nidMethod:         guestData.nidMethod,
          specialRequests:   guestData.specialRequests,
          basePrice,
          paymentMethod,
        };

        const result = await createPendingBooking(bookingData);
        if (!result.success) throw new Error("Failed to create booking.");

        const res  = await fetch("/api/ssl/initiate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ bookingId: result.bookingId }),
        });
        const data = await res.json();
        if (!data.GatewayPageURL) throw new Error(data.error || "Payment gateway error. Please try again.");
        window.location.href = data.GatewayPageURL;
      } catch (err) {
        setError(err.message || "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <motion.div key="step3" {...fadeUp} className="space-y-4">
      {/* Booking summary */}
      <Card className="overflow-hidden">
        {selProperty?.coverImage && (
          <div className="relative h-32 overflow-hidden">
            <img src={selProperty.coverImage} alt={selProperty.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-[#1C1C1C]/70 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 px-5 py-3">
              <p className={`text-white text-[1.3rem] font-light ${cormorant.className}`}>{selProperty.name}</p>
            </div>
          </div>
        )}
        <div className="p-5 space-y-3">
          {!selProperty?.coverImage && <SectionLabel>Booking Summary</SectionLabel>}
          <dl className="text-[13px] space-y-2.5">
            {[
              ["Property",  selProperty?.name],
              ["Category",  selCategory?.name],
              ["Room",      selRoom ? `#${selRoom.roomNumber}${selRoom.variant ? ` · ${selRoom.variant.name}` : ""} · Floor ${selRoom.floor}` : null],
              ["Check-in",  fmtDate(checkIn)],
              ["Check-out", fmtDate(checkOut)],
              ["Duration",  `${nights} night${nights !== 1 ? "s" : ""}`],
              ["Guest",     guestData.primaryGuest.name],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} className="flex justify-between items-center">
                <dt className="text-[#9B8BAB]">{label}</dt>
                <dd className="font-medium text-[#1C1C1C] text-right max-w-[55%] truncate">{val}</dd>
              </div>
            ))}
          </dl>
          {/* Price breakdown */}
          <div className="border-t border-[#EDE5F0] pt-3.5 space-y-2 text-[12.5px]">
            <div className="flex justify-between text-[#9B8BAB]">
              <span>{nights} night{nights !== 1 ? "s" : ""} × ৳{basePrice.toLocaleString()}</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
            {taxes > 0 && (
              <div className="flex justify-between text-[#9B8BAB]">
                <span>Tax ({settings?.taxPercent}%)</span>
                <span>৳{taxes.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2.5 border-t border-[#EDE5F0]">
              <span className="text-[15px] font-semibold text-[#1C1C1C]">Total</span>
              <span className={`text-[22px] font-bold text-[#7A2267] ${cormorant.className}`}>
                ৳{totalAmount.toLocaleString()}
              </span>
            </div>
            {/* Advance payment note */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-[#7A2267]/5 border border-[#7A2267]/15 rounded-xl px-4 py-3 mt-1 space-y-0.5"
            >
              <div className="flex justify-between text-[12px]">
                <span className="text-[#7A2267] font-semibold">Advance due now ({advancePct}%)</span>
                <span className="text-[#7A2267] font-bold">৳{advanceAmount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#9B8BAB]">
                Remaining ৳{balanceDue.toLocaleString()} to be paid at check-in.
              </p>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Payment method */}
      <Card className="p-5 space-y-3">
        <SectionLabel>Payment Method</SectionLabel>
        <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[#7A2267]/50 bg-[#7A2267]/5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#7A2267]/10">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <rect x="1" y="4" width="18" height="12" rx="2" stroke="#7A2267" strokeWidth="1.5" />
              <path d="M1 8h18" stroke="#7A2267" strokeWidth="1.5" />
              <path d="M5 13h3M13 13h2" stroke="#7A2267" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-[#1C1C1C]">Pay Online</p>
            <p className="text-[11px] text-[#9B8BAB] mt-0.5">Card, bKash, Nagad via SSLCommerz — secure redirect</p>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-[#7A2267] shrink-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#7A2267]" />
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#7A2267]/5 border border-[#7A2267]/20 text-[#7A2267] text-[12.5px] px-4 py-3 rounded-xl">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onBack} disabled={isPending}
          className="flex-1 py-3.5 rounded-xl border-2 border-[#E4DAE8] text-[#6B5B7A] text-[12.5px]
            font-semibold hover:bg-[#F5EDF5] disabled:opacity-40 transition-all duration-200">
          ← Back
        </motion.button>
        <motion.button
          whileHover={!isPending ? { scale: 1.015, boxShadow: "0 8px 28px rgba(122,34,103,0.25)" } : {}}
          whileTap={!isPending ? { scale: 0.985 } : {}}
          onClick={handlePay} disabled={isPending}
          className="flex-[2] py-3.5 rounded-xl bg-[#7A2267] text-white text-[13px] font-semibold
            tracking-wide disabled:opacity-60 transition-all duration-200 relative overflow-hidden"
        >
          {isPending && (
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/3 bg-white/10 skew-x-[-15deg]"
            />
          )}
          <span className="relative z-10">
            {isPending
              ? "Processing…"
              : `Pay ৳${advanceAmount.toLocaleString()} Advance →`}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function BookingWizard({ settings, preselect }) {
  const [step,      setStep]      = useState(1);
  const [stepDir,   setStepDir]   = useState(1);
  const [datesData, setDatesData] = useState(null);
  const [guestData, setGuestData] = useState(null);

  function goStep(n) {
    setStepDir(n > step ? 1 : -1);
    setStep(n);
  }

  return (
    <div className="w-full">
      <StepIndicator step={step} />
      <AnimatePresence mode="wait" custom={stepDir}>
        {step === 1 && (
          <motion.div key="s1" custom={stepDir} {...slideIn(stepDir)}>
            <Step1
              preselect={preselect}
              onNext={(data) => { setDatesData(data); goStep(2); }}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" custom={stepDir} {...slideIn(stepDir)}>
            <Step2
              settings={settings}
              datesData={datesData}
              onNext={(data) => { setGuestData(data); goStep(3); }}
              onBack={() => goStep(1)}
            />
          </motion.div>
        )}
        {step === 3 && datesData && guestData && (
          <motion.div key="s3" custom={stepDir} {...slideIn(stepDir)}>
            <Step3
              datesData={datesData}
              guestData={guestData}
              settings={settings}
              onBack={() => goStep(2)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
