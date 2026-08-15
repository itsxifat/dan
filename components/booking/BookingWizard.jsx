"use client";

import {
  useState, useEffect, useCallback, useTransition, useRef, useMemo, useId
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";
import { getProperties } from "@/actions/accommodation/propertyActions";
import { getCategoriesByProperty } from "@/actions/accommodation/categoryActions";
import { getAvailableRoomsForBooking } from "@/actions/accommodation/bookingActions";
import { createPendingBooking } from "@/actions/accommodation/bookingActions";
import { getActiveDayLongPackages } from "@/actions/accommodation/dayLongPackageActions";
import { validateCoupon, getActiveOffers } from "@/actions/discount/discountActions";
import {
  LOCK_WARNING_MS,
  formatCountdown,
  getLockSessionId,
  releaseLock,
} from "@/lib/bookingLock";
import {
  DOCS_UPLOAD_NOW,
  DOCS_AT_CHECKIN,
  DOC_COPY,
  isChildGuest,
  evaluateRoom,
  validateGuestDocs,
  summariseBookingDocs,
  docNoticeLines,
  docNoticeHeadline,
} from "@/lib/guestDocs";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ─── Utilities ────────────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2, "0"); }
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isSameDay(a, b) { return a === b; }
// Child classification comes from lib/guestDocs so the capacity counters here
// agree with the document rules the server enforces.
const guestIsChild = (g, maxFCA) => isChildGuest(g, maxFCA);

const EASE = [0.16, 1, 0.3, 1];

// ─── Premium SVG Icons (no emojis) ────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, className = "" }) {
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState(null);
  const btnRef            = useRef(null);
  const selected          = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  }

  const dropdown = open && rect && createPortal(
    <div
      style={{
        position: "fixed",
        top:      rect.bottom + 4,
        left:     rect.left,
        width:    rect.width,
        zIndex:   9999,
      }}
      className="bg-white border border-[#EDE5F0] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
    >
      {options.map((o) => (
        <button key={o.value} type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onChange(o.value); setOpen(false); }}
          className={`w-full text-left px-3.5 py-2 text-[12.5px] transition-colors
            ${o.value === value ? "bg-[#F0E8F4] text-[#7A2267] font-semibold" : "text-[#1a1a1a] hover:bg-[#FAF7FC]"}`}>
          {o.label}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className={`relative ${className}`}>
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="w-full flex items-center justify-between gap-1.5 border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12.5px] text-[#1a1a1a] bg-white outline-none focus:border-[#7A2267]/40 transition-all hover:border-[#C4B3CE]">
        <span>{selected.label}</span>
        <svg viewBox="0 0 10 6" width="9" height="6" fill="none" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" stroke="#C4B3CE" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {dropdown}
    </div>
  );
}

const GENDER_OPTIONS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
];
const GENDER_SHORT_OPTIONS = [
  { value: "male",   label: "M" },
  { value: "female", label: "F" },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEP_NAMES = ["Stay Type", "Dates", "Rooms", "Guests", "Payment"];

function StepIndicator({ step, total }) {
  return (
    <div className="mb-8 px-6 sm:px-8">
      <div className="flex items-start">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const done   = n < step;
          const active = n === step;
          return (
            <div key={n} className="flex items-start flex-1">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300
                  ${done
                    ? "bg-[#7A2267] text-white shadow-[0_2px_10px_rgba(122,34,103,0.35)]"
                    : active
                    ? "bg-[#7A2267] text-white shadow-[0_0_0_4px_rgba(122,34,103,0.18)]"
                    : "bg-[#F0E8F4] text-[#C4B3CE]"}`}>
                  {done ? (
                    <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                      <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : n}
                </div>
                <span className={`mt-1.5 text-[8.5px] font-semibold tracking-wide whitespace-nowrap transition-colors duration-300
                  ${active ? "text-[#7A2267]" : done ? "text-[#9B6B90]/60" : "text-[#D4C8DC]"}`}>
                  {STEP_NAMES[i]}
                </span>
              </div>
              {n < total && (
                <div className={`flex-1 h-px mt-4 mx-2 transition-all duration-500 ${done ? "bg-[#7A2267]" : "bg-[#EDE5F0]"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
function Calendar({ mode, selected, onSelect, minDate }) {
  const today = todayISO();
  const min   = minDate || today;
  const [month, setMonth] = useState(() => {
    const d = new Date((selected?.[0] || today) + "T00:00:00");
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  function cellISO(day) {
    return `${month.y}-${pad(month.m + 1)}-${pad(day)}`;
  }

  function handleClick(day) {
    if (!day) return;
    const iso = cellISO(day);
    if (iso < min) return;

    if (mode === "day_long") {
      // single day select
      onSelect([iso, addDays(iso, 1)]);
    } else {
      // range select
      if (!selected?.[0] || (selected[0] && selected[1])) {
        onSelect([iso, null]);
      } else {
        if (iso < selected[0]) {
          onSelect([iso, selected[0]]);
        } else if (iso === selected[0]) {
          onSelect([null, null]);
        } else {
          onSelect([selected[0], iso]);
        }
      }
    }
  }

  function cellClass(day) {
    if (!day) return "";
    const iso = cellISO(day);
    const isMin  = iso < min;
    const isToday = iso === today;

    if (isMin) return "text-[#D4C8DC] cursor-not-allowed";

    if (mode === "day_long") {
      // Only highlight the single selected day — checkOut is an internal +1 offset, not visually selected
      const isSel = selected?.[0] && isSameDay(iso, selected[0]);
      if (isSel) return "bg-[#7A2267] text-white rounded-lg font-bold cursor-pointer";
      if (isToday) return "border border-[#7A2267]/30 text-[#7A2267] font-semibold rounded-lg cursor-pointer hover:bg-[#7A2267]/10";
      return "text-[#1a1a1a] cursor-pointer hover:bg-[#F0E8F4] rounded-lg";
    }

    const isSel0  = selected?.[0] && isSameDay(iso, selected[0]);
    const isSel1  = selected?.[1] && isSameDay(iso, selected[1]);
    const inRange = selected?.[0] && selected?.[1] && iso > selected[0] && iso < selected[1];

    if (isSel0 || isSel1) return "bg-[#7A2267] text-white rounded-lg font-bold cursor-pointer";
    if (inRange) return "bg-[#7A2267]/12 text-[#7A2267] font-medium cursor-pointer";
    if (isToday) return "border border-[#7A2267]/30 text-[#7A2267] font-semibold rounded-lg cursor-pointer hover:bg-[#7A2267]/10";
    return "text-[#1a1a1a] cursor-pointer hover:bg-[#F0E8F4] rounded-lg";
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div className={`bg-white rounded-2xl border border-[#EDE5F0] p-4 ${josefin.className}`}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth((m) => {
          if (m.m === 0) return { y: m.y - 1, m: 11 };
          return { y: m.y, m: m.m - 1 };
        })} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F0E8F4] transition-colors">
          <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
            <path d="M7 1L1 7l6 6" stroke="#9B8BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="text-center">
          <span className="text-[13px] font-bold text-[#1a1a1a]">{MONTHS[month.m]}</span>
          <span className="text-[13px] font-normal text-[#9B8BAB] ml-1.5">{month.y}</span>
        </div>
        <button onClick={() => setMonth((m) => {
          if (m.m === 11) return { y: m.y + 1, m: 0 };
          return { y: m.y, m: m.m + 1 };
        })} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#F0E8F4] transition-colors">
          <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
            <path d="M1 1l6 6-6 6" stroke="#9B8BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] text-[#C4B3CE] font-bold uppercase tracking-wide py-1.5">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} onClick={() => handleClick(day)}
            className={`h-9 flex items-center justify-center text-[12.5px] font-medium transition-all duration-150 ${cellClass(day)}`}>
            {day}
          </div>
        ))}
      </div>
      {mode === "night_stay" && (
        <p className="text-[10px] text-[#C4B3CE] text-center mt-3 flex items-center justify-center gap-1">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <circle cx="6" cy="6" r="5.3" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 4v3M6 8.3v.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Select check-in, then check-out
        </p>
      )}
    </div>
  );
}

// ─── Guest Counter ─────────────────────────────────────────────────────────────
function Counter({ label, sub, value, min = 0, max = 10, onChange }) {
  return (
    <div className="bg-[#FAF7FC] border border-[#EDE5F0] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B8BAB] font-bold mb-3">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-xl bg-white border border-[#EDE5F0] flex items-center justify-center text-[#7A2267] text-xl font-light
            disabled:text-[#D4C8DC] disabled:border-[#F7F4F0] hover:bg-[#F0E8F4] hover:border-[#C4B3CE] transition-all shadow-sm">−</button>
        <div className="flex-1 text-center">
          <span className="text-[22px] font-bold text-[#1a1410]">{value}</span>
          {sub && <p className="text-[9.5px] text-[#C4B3CE] mt-0.5">{sub}</p>}
        </div>
        <button type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-xl bg-[#7A2267] flex items-center justify-center text-white text-xl font-light
            disabled:opacity-30 hover:bg-[#6d1d5c] transition-all shadow-[0_2px_8px_rgba(122,34,103,0.3)]">+</button>
      </div>
    </div>
  );
}

// ─── Room Card ─────────────────────────────────────────────────────────────────
function RoomCard({ room, bookingMode, selected, onToggle, cartCount }) {
  const price = bookingMode === "day_long" ? room.resolvedDayPrice : room.resolvedNightPrice;
  const isSelected = selected;

  return (
    <motion.div
      layout
      className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer
        ${isSelected ? "border-[#7A2267] shadow-[0_4px_20px_rgba(122,34,103,0.15)]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}
      onClick={onToggle}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center">
          <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
            <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {room.coverImage && (
        <div className="relative h-28 bg-[#F0E8F4]">
          <img src={room.coverImage} alt={`Room ${room.roomNumber}`} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[13px] font-bold text-[#1a1410]">Room {room.roomNumber}</p>
            <p className="text-[11px] text-[#9B8BAB]">Floor {room.floor}{room.block ? ` · ${room.block}` : ""}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[15px] font-bold text-[#7A2267]">৳{Number(price).toLocaleString()}</p>
            <p className="text-[9px] text-[#C4B3CE]">/{bookingMode === "day_long" ? "day" : "night"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] bg-[#F7F4F0] text-[#9B8BAB] px-2 py-0.5 rounded-full">{room.bedType || room.categoryName}</span>
          <span className="text-[10px] bg-[#F7F4F0] text-[#9B8BAB] px-2 py-0.5 rounded-full">Up to {room.maxAdults} adults</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fixed Bottom Navigation Bar ─────────────────────────────────────────────
function FixedBottomBar({ showBack, showNext, onBack, onNext, nextDisabled, nextLabel, contextInfo, barError, isLoading }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className={`${josefin.className} fixed bottom-0 inset-x-0 z-40`}>
      <AnimatePresence>
        {barError && (
          <motion.div
            key="bar-err"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-red-50 border-t border-red-200 overflow-hidden"
          >
            <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="shrink-0 text-red-500">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[11.5px] text-red-700 leading-snug line-clamp-2">{barError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-white/95 backdrop-blur-xl border-t border-[#EDE5F0] shadow-[0_-6px_32px_rgba(0,0,0,0.09)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Back button */}
          {showBack ? (
            <button onClick={onBack}
              className="h-11 px-4 rounded-xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px]
                hover:border-[#C4B3CE] hover:text-[#7A2267] transition-all shrink-0 flex items-center gap-1.5">
              <svg viewBox="0 0 16 10" width="13" height="9" fill="none">
                <path d="M5 1L1 5l4 4M1 5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <div className="h-11 w-4 shrink-0" />
          )}

          {/* Animated context chip */}
          <div className="flex-1 flex justify-center overflow-hidden px-1">
            <AnimatePresence mode="wait">
              {contextInfo && (
                <motion.div
                  key={contextInfo}
                  initial={{ opacity: 0, scale: 0.88, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#F0E8F4] to-[#FAF7FC]
                    border border-[#E0D5EA] text-[#7A2267] text-[11.5px] font-semibold
                    px-4 py-2 rounded-full max-w-full overflow-hidden shadow-sm">
                  <motion.div
                    animate={{ scale: [1, 1.35, 1] }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="w-1.5 h-1.5 rounded-full bg-[#7A2267] shrink-0" />
                  <span className="truncate">{contextInfo}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary action */}
          {showNext ? (
            <button onClick={onNext} disabled={nextDisabled || isLoading}
              className="h-11 px-6 rounded-xl bg-[#7A2267] hover:bg-[#6d1d5c] active:bg-[#5c1650] text-white font-semibold text-[13px]
                shadow-[0_4px_16px_rgba(122,34,103,0.35)] hover:shadow-[0_6px_22px_rgba(122,34,103,0.45)]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-200 shrink-0 flex items-center gap-1.5">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{nextLabel}</span>
                  <svg viewBox="0 0 16 10" width="13" height="9" fill="none">
                    <path d="M11 1l4 4-4 4M15 5H1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          ) : (
            <div className="h-11 w-4 shrink-0" />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main BookingWizard ───────────────────────────────────────────────────────
export default function BookingWizard({ settings, preselect }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  // ── Derive initial state from hero preselect ─────────────────────────────────
  // If mode + date(s) arrive from the hero card, skip steps 1 & 2 entirely.
  const _preselectMode = preselect?.mode === "day_long" || preselect?.mode === "night_stay"
    ? preselect.mode : null;
  const _preselectHasDates = _preselectMode === "day_long"
    ? !!preselect?.date
    : !!(preselect?.checkIn && preselect?.checkOut);

  // Steps: 1=mode, 2=dates+guests, 3=rooms, 4=guest-info, 5=payment
  const [step, setStep] = useState(() => {
    if (_preselectMode && _preselectHasDates) return 3; // skip steps 1 & 2
    if (_preselectMode) return 2;                       // skip step 1 only
    return 1;
  });
  const [bookingMode, setBookingMode] = useState(
    _preselectMode ?? "night_stay"
  );

  // Dates
  const [dateRange, setDateRange] = useState(() => {
    if (_preselectMode === "day_long" && preselect?.date) {
      return [preselect.date, addDays(preselect.date, 1)];
    }
    return [preselect?.checkIn || null, preselect?.checkOut || null];
  });
  const checkIn  = dateRange[0];
  const checkOut = dateRange[1];
  const nights   = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;

  // Guest counts — pre-filled from hero reserve card if provided
  const [adults,   setAdults]   = useState(preselect?.adults   ?? 2);
  const [children, setChildren] = useState(preselect?.children ?? 0);

  // Properties + Categories
  const [properties,  setProperties]  = useState([]);
  const [selectedProp, setSelectedProp] = useState(preselect?.propertyId || null);
  const [categories,  setCategories]  = useState([]);
  const [selectedCat, setSelectedCat] = useState(preselect?.categoryId  || null);

  // Derive the blocks for the selected property
  const selectedPropData = useMemo(
    () => properties.find((p) => p._id === selectedProp) || null,
    [properties, selectedProp]
  );
  const propertyBlocks = selectedPropData?.blocks || [];

  // Available rooms
  const [rooms,        setRooms]        = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Room detail preview (sidebar)
  const [previewRoom, setPreviewRoom] = useState(null);

  // Cart: Map<roomId, roomObject>
  const [cart, setCart] = useState(new Map());

  // Day long packages
  const [packages,       setPackages]       = useState([]);
  const [selectedEntry,  setSelectedEntry]  = useState(null);   // required entry service
  const [selectedAddons, setSelectedAddons] = useState([]);     // optional add-ons (array)

  // Step 3 sub-steps: 0=packages(daylong only), 1=property, 2=category, 3=rooms
  // If jumping straight to step 3 from hero, init correctly for the mode
  const [roomSubStep, setRoomSubStep] = useState(() => {
    if (_preselectMode && _preselectHasDates) {
      return _preselectMode === "day_long" ? 0 : 1;
    }
    return 1;
  });

  // Guest info per room: Map<roomId, { guests: [], ownChildDeclared, coupleDocumentUrl, coupleDocMethod }>
  // ownChildDeclared: the guests confirmed the child in the room is their own,
  // which waives the marriage certificate for a mixed-gender room.
  const [guestInfoMap, setGuestInfoMap] = useState(new Map());

  // Primary guest
  const [primaryGuest, setPrimaryGuest] = useState({
    name: "", email: "", phone: "", whatsapp: "", gender: "male", age: "",
  });
  const [nidUrl,    setNidUrl]    = useState("");
  const [nidMethod, setNidMethod] = useState("upload");
  const [nidNumber, setNidNumber] = useState("");
  const [specialReqs, setSpecialReqs] = useState("");

  // Identification handover: upload every adult's NID now, or present the
  // originals at the reception desk. Either way an explicit consent is required.
  const [guestDocsMethod,  setGuestDocsMethod]  = useState(DOCS_AT_CHECKIN);
  const [guestDocsConsent, setGuestDocsConsent] = useState(false);

  // Payment
  const [paymentType, setPaymentType] = useState("full");  // "full" | "partial"

  // Auto-offers (no code required)
  const [activeOffers,   setActiveOffers]   = useState([]);
  const [autoOffer,      setAutoOffer]      = useState(null); // best applicable offer

  // Coupon
  const [couponInput,   setCouponInput]   = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { id, name, discountAmount, code }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,   setCouponError]   = useState("");

  // Upload-prompt warnings (room._id or "nid" or null)
  const [uploadWarn, setUploadWarn] = useState(null); // "nid" | roomId string
  // Child→adult reclassification warnings: key = `${roomId}-${guestIdx}`
  const [childReclassifyMsg, setChildReclassifyMsg] = useState({});

  // Error
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Room hold ────────────────────────────────────────────────────────────────
  // Rooms are held from the moment checkout opens so two guests can never pay
  // for the same room. The hold is released the instant the guest leaves — the
  // countdown is only the outer limit, not a wait we impose on anyone else.
  const [hold, setHold]           = useState(null); // { rooms: string[], expiresAt: number }
  const [holdRemaining, setHoldRemaining] = useState(0);
  // holdRef mirrors `hold` so the unload handlers can read it without being
  // re-bound; it is updated at every site that changes the hold.
  const holdRef            = useRef(null);
  const lockSessionRef     = useRef("");
  const paymentRedirectRef = useRef(false);  // true while handing off to SSLCommerz

  const cartRooms = useMemo(() => Array.from(cart.values()), [cart]);
  const totalPrice = useMemo(() => {
    let sum = 0;
    for (const r of cartRooms) {
      sum += bookingMode === "day_long" ? r.resolvedDayPrice : r.resolvedNightPrice;
    }
    return sum * (bookingMode === "day_long" ? 1 : nights || 1);
  }, [cartRooms, bookingMode, nights]);

  const taxPercent      = settings?.taxPercent ?? 0;
  const dayLongSvcTotal = (selectedEntry?.price || 0) + selectedAddons.reduce((s, a) => s + (a.price || 0), 0);
  const dayLongDiscount = selectedAddons.reduce((sum, a) => {
    if (a.discountType === "percent") return sum + Math.round(((totalPrice + dayLongSvcTotal) * (a.discountValue || 0)) / 100);
    if (a.discountType === "fixed")   return sum + (a.discountValue || 0);
    return sum;
  }, 0);
  const subtotal      = totalPrice + dayLongSvcTotal;
  const taxes         = Math.round((subtotal * taxPercent) / 100);

  // Compute auto-offer discount based on order total after day-long discount
  const autoOfferDiscount = useMemo(() => {
    if (!autoOffer) return 0;
    const orderForOffer = subtotal + taxes - dayLongDiscount;
    if (orderForOffer <= 0) return 0;
    if (autoOffer.minOrderAmount > 0 && orderForOffer < autoOffer.minOrderAmount) return 0;
    let disc = 0;
    if (autoOffer.discountType === "percentage") {
      disc = Math.round((orderForOffer * autoOffer.discountValue) / 100);
      if (autoOffer.maxDiscountAmount > 0) disc = Math.min(disc, autoOffer.maxDiscountAmount);
    } else {
      disc = autoOffer.discountValue;
    }
    return Math.min(disc, orderForOffer);
  }, [autoOffer, subtotal, taxes, dayLongDiscount]);

  const couponDiscount = couponApplied?.discountAmount || 0;
  const total         = Math.max(0, subtotal + taxes - dayLongDiscount - autoOfferDiscount - couponDiscount);
  const partialPct    = settings?.advancePaymentPercent ?? 30;
  const partialAmt  = Math.round((total * partialPct) / 100);
  const partialRem  = total - partialAmt;
  const advancePct  = paymentType === "full" ? 100 : partialPct;
  const advanceAmt  = paymentType === "full" ? total : partialAmt;
  const remaining   = total - advanceAmt;

  // ── Minimum room requirement ─────────────────────────────────────────────────
  const totalPeople = adults + children;
  // cartCapacity: sum of maxAdults across all rooms in cart (variant-resolved)
  const cartCapacity = useMemo(
    () => cartRooms.reduce((sum, r) => sum + Math.max(1, r.maxAdults || 0), 0),
    [cartRooms]
  );
  // Children now need a listed row of their own, so the rooms must actually
  // have space for them — caught here rather than at the guest-details step.
  const cartChildCapacity = useMemo(
    () => cartRooms.reduce((sum, r) => sum + Math.max(0, r.maxChildren || 0), 0),
    [cartRooms]
  );
  // minRoomsNeeded: estimated minimum based on available rooms' capacities
  const minRoomsNeeded = useMemo(() => {
    if (!selectedCat) return null;
    const rep = rooms[0] || cartRooms[0];
    if (!rep) return null;
    const maxAdultsPerRoom = rep.maxAdults && rep.maxAdults > 0 ? rep.maxAdults : 1;
    return Math.max(1, Math.ceil(adults / maxAdultsPerRoom));
  }, [rooms, cartRooms, adults, selectedCat]);

  // ── Guest identification requirements ────────────────────────────────────────
  // Everything below is derived by lib/guestDocs so the wizard, the server,
  // the confirmation email and the invoice never disagree about who has to
  // bring what.
  const docOpts = useMemo(() => ({
    maxFreeChildAge:  settings?.maxFreeChildAge  ?? 5,
    requireCoupleDoc: settings?.requireCoupleDoc ?? true,
  }), [settings?.maxFreeChildAge, settings?.requireCoupleDoc]);

  const docRooms = useMemo(() => cartRooms.map((room) => {
    const info = guestInfoMap.get(room._id) || {};
    return {
      roomNumber:        room.roomNumber,
      guests:            info.guests || [],
      ownChildDeclared:  info.ownChildDeclared === true,
      coupleDocumentUrl: info.coupleDocumentUrl || "",
    };
  }), [cartRooms, guestInfoMap]);

  const docSummary = useMemo(
    () => summariseBookingDocs({ rooms: docRooms, guestDocsMethod }, docOpts),
    [docRooms, guestDocsMethod, docOpts]
  );

  const docErrors = useMemo(
    () => validateGuestDocs(
      {
        rooms: docRooms,
        guestDocsMethod,
        docsConsent: guestDocsConsent,
        expectedAdults:   adults,
        expectedChildren: children,
      },
      docOpts
    ),
    [docRooms, guestDocsMethod, guestDocsConsent, adults, children, docOpts]
  );

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getProperties({ onlyActive: true }).then((res) => {
      const props = res.properties || [];
      setProperties(props);
      // Auto-select if preselect or only one building property
      if (!preselect?.propertyId) {
        if (props.length === 1) setSelectedProp(props[0]._id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (bookingMode === "day_long") {
      getActiveDayLongPackages().then(setPackages).catch(() => {});
    }
  }, [bookingMode]);

  // Fetch active auto-offers whenever bookingMode changes
  useEffect(() => {
    getActiveOffers(bookingMode).then((offers) => {
      setActiveOffers(offers);
      // Pick the best offer: highest effective discount rate
      if (offers.length > 0) {
        const best = offers.reduce((prev, curr) => {
          const prevVal = prev.discountType === "percentage" ? prev.discountValue : 0;
          const currVal = curr.discountType === "percentage" ? curr.discountValue : 0;
          // For fixed, compare raw values
          const prevEff = prev.discountType === "percentage" ? prevVal : prev.discountValue;
          const currEff = curr.discountType === "percentage" ? currVal : curr.discountValue;
          return currEff > prevEff ? curr : prev;
        });
        setAutoOffer(best);
      } else {
        setAutoOffer(null);
      }
    }).catch(() => {});
  }, [bookingMode]);

  useEffect(() => {
    if (!selectedProp) return;
    getCategoriesByProperty(selectedProp, { onlyActive: true }).then((cats) => {
      const filtered = bookingMode === "day_long"
        ? cats.filter((c) => c.supportsDayLong)
        : cats;
      setCategories(filtered);
      if (filtered.length > 0 && !filtered.find((c) => c._id === selectedCat)) {
        setSelectedCat(filtered[0]._id);
      }
    }).catch(() => {});
  }, [selectedProp, bookingMode]);

  useEffect(() => {
    if (!selectedProp || !selectedCat || !checkIn || !checkOut) {
      setRooms([]);
      return;
    }
    setRoomsLoading(true);
    getAvailableRoomsForBooking({
      propertyId: selectedProp,
      categoryId: selectedCat,
      checkIn,
      checkOut,
      bookingMode,
    }).then(setRooms).catch(() => {}).finally(() => setRoomsLoading(false));
  }, [selectedProp, selectedCat, checkIn, checkOut, bookingMode]);

  // Clear cart when dates change while rooms are already selected
  useEffect(() => {
    if (cart.size > 0) {
      setCart(new Map());
      setPreviewRoom(null);
    }
  }, [checkIn, checkOut]);

  // Everyone's details are mandatory, so lay out an empty row per person as soon
  // as the guest reaches step 4 — spread across the booked rooms by capacity.
  // Rooms the guest has already started filling in are left untouched.
  useEffect(() => {
    if (step !== 4 || cartRooms.length === 0) return;

    setGuestInfoMap((prev) => {
      if (cartRooms.some((r) => (prev.get(r._id)?.guests?.length ?? 0) > 0)) return prev;

      let adultsLeft   = adults;
      let childrenLeft = children;
      const next = new Map(prev);

      for (const room of cartRooms) {
        const capAdults   = room.maxAdults   > 0 ? room.maxAdults   : 1;
        const capChildren = room.maxChildren > 0 ? room.maxChildren : 0;
        const takeAdults   = Math.min(adultsLeft,   capAdults);
        const takeChildren = Math.min(childrenLeft, capChildren);
        adultsLeft   -= takeAdults;
        childrenLeft -= takeChildren;

        const seeded = [
          ...Array.from({ length: takeAdults },   () => ({ name: "", age: "", gender: "male",  nidNumber: "", nidUrl: "", _intent: "adult" })),
          ...Array.from({ length: takeChildren }, () => ({ name: "", age: "", gender: "male",  nidNumber: "", nidUrl: "", _intent: "child" })),
        ];
        if (seeded.length === 0) continue;

        next.set(room._id, {
          ...(prev.get(room._id) || { ownChildDeclared: false, coupleDocumentUrl: "", coupleDocMethod: "at_desk" }),
          guests: seeded,
        });
      }
      return next;
    });
  }, [step, cartRooms, adults, children]);

  // ── Room hold lifecycle ──────────────────────────────────────────────────────

  /** Hand the rooms back right away. Safe to call when nothing is held. */
  const dropHold = useCallback((beacon = false) => {
    const current = holdRef.current;
    if (!current) return;
    releaseLock({ sessionId: lockSessionRef.current, rooms: current.rooms, beacon });
    holdRef.current = null;
    setHold(null);
    setHoldRemaining(0);
  }, []);

  // Take the hold when checkout opens; give it straight back on the way out.
  // The cleanup also covers navigating away from the wizard entirely.
  useEffect(() => {
    if (step !== 5 || cartRooms.length === 0 || !session?.user) return;

    let cancelled = false;
    const rooms = cartRooms.map((r) => r._id);
    const checkOutCalc = bookingMode === "day_long" && checkIn ? addDays(checkIn, 1) : checkOut;
    if (!lockSessionRef.current) lockSessionRef.current = getLockSessionId();

    (async () => {
      try {
        const res = await fetch("/api/booking/lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rooms, checkIn, checkOut: checkOutCalc, bookingMode,
            sessionId: lockSessionRef.current,
          }),
        });
        const data = await res.json();
        if (cancelled) {
          // Checkout was left before the hold landed — release it immediately
          // rather than letting it sit until the TTL.
          if (res.ok) releaseLock({ sessionId: lockSessionRef.current, rooms });
          return;
        }
        if (!res.ok) {
          setError(data.error || "Those rooms are no longer available. Please pick again.");
          setStep(3);
          return;
        }
        const next = { rooms, expiresAt: new Date(data.lockedUntil).getTime() };
        holdRef.current = next;
        setHold(next);
        setHoldRemaining(Math.max(0, next.expiresAt - Date.now()));
      } catch {
        if (!cancelled) setError("Could not reserve your rooms. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
      // Never release while the gateway hand-off is in flight — the guest is
      // about to pay for exactly these rooms.
      if (!paymentRedirectRef.current) dropHold();
    };
  }, [step, cartRooms, checkIn, checkOut, bookingMode, session?.user, dropHold]);

  // Tick the countdown; expiry releases the rooms and sends the guest back.
  useEffect(() => {
    if (!hold) return;
    const tick = () => {
      const left = hold.expiresAt - Date.now();
      setHoldRemaining(Math.max(0, left));
      if (left <= 0) {
        dropHold();
        setError("Your reservation hold expired and the rooms were released. Please choose your rooms again.");
        setStep(3);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hold, dropHold]);

  // Closing the tab or a hard navigation — sendBeacon is the only transport the
  // browser guarantees here. Skipped while handing off to the payment gateway,
  // which is also an unload but must keep the hold.
  useEffect(() => {
    const release = () => {
      if (paymentRedirectRef.current) return;
      dropHold(true);
    };
    // Coming back from the gateway (including out of the bfcache) means the
    // hand-off is over — clear the flag so leaving again does release the rooms.
    const restored = () => { paymentRedirectRef.current = false; };

    window.addEventListener("pagehide", release);
    window.addEventListener("beforeunload", release);
    window.addEventListener("pageshow", restored);
    return () => {
      window.removeEventListener("pagehide", release);
      window.removeEventListener("beforeunload", release);
      window.removeEventListener("pageshow", restored);
    };
  }, [dropHold]);

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  function toggleRoom(room) {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(room._id)) {
        next.delete(room._id);
      } else {
        next.set(room._id, room);
      }
      return next;
    });
    setError("");
  }

  // ── Guest info helpers ───────────────────────────────────────────────────────
  function getGuestInfo(roomId) {
    return guestInfoMap.get(roomId) || {
      guests: [],
      ownChildDeclared: false,
      coupleDocumentUrl: "",
      coupleDocMethod: "at_desk",
    };
  }

  function updateGuestInfo(roomId, update) {
    setGuestInfoMap((prev) => {
      const next = new Map(prev);
      next.set(roomId, { ...getGuestInfo(roomId), ...update });
      return next;
    });
  }

  function updateGuest(roomId, idx, field, value) {
    const info   = getGuestInfo(roomId);
    const guests = [...info.guests];
    const maxFCA = settings?.maxFreeChildAge ?? 5;
    let updatedGuest = { ...guests[idx], [field]: value };

    if (field === "age") {
      const numAge     = Number(value);
      const hasAge     = value !== "" && value !== null && !isNaN(numAge);
      const msgKey     = `${roomId}-${idx}`;

      if (guests[idx]._intent === "child" && hasAge && numAge > maxFCA) {
        // Child-intent guest's age exceeds threshold → auto-promote to adult
        updatedGuest._intent = "adult";
        const room       = cartRooms.find((r) => r._id === roomId);
        const otherAdults = guests.filter((g, i) => i !== idx && !guestIsChild(g, maxFCA)).length;
        if (room?.maxAdults > 0 && otherAdults + 1 > room.maxAdults) {
          setChildReclassifyMsg((prev) => ({
            ...prev,
            [msgKey]: `Age ${numAge} is above the child limit (${maxFCA}). This guest is now counted as an adult, but the room is at adult capacity. Please remove an adult to continue.`,
          }));
        } else {
          setChildReclassifyMsg((prev) => ({ ...prev, [msgKey]: null }));
        }
      } else {
        // Age back in child range, or no age yet — clear any prior warning
        setChildReclassifyMsg((prev) => ({ ...prev, [msgKey]: null }));
      }
    }

    guests[idx] = updatedGuest;
    updateGuestInfo(roomId, { guests });
  }

  function addGuest(roomId, type = "adult") {
    const room   = cartRooms.find((r) => r._id === roomId);
    const info   = getGuestInfo(roomId);
    const maxFCA = settings?.maxFreeChildAge ?? 5;
    const curAdults   = info.guests.filter((g) => !guestIsChild(g, maxFCA)).length;
    const curChildren = info.guests.filter((g) =>  guestIsChild(g, maxFCA)).length;
    if (type === "adult" && room?.maxAdults   > 0  && curAdults   >= room.maxAdults)   return;
    if (type === "child" && room?.maxChildren >= 0  && curChildren >= room.maxChildren) return;
    updateGuestInfo(roomId, {
      guests: [...info.guests, { name: "", age: "", gender: "male", nidNumber: "", nidUrl: "", _intent: type }],
    });
  }

  function removeGuest(roomId, idx) {
    const info = getGuestInfo(roomId);
    updateGuestInfo(roomId, {
      guests: info.guests.filter((_, i) => i !== idx),
    });
    // Clear any reclassification warning for the removed guest (and reindex subsequent ones)
    setChildReclassifyMsg((prev) => {
      const next = { ...prev };
      delete next[`${roomId}-${idx}`];
      // Shift down keys for guests after the removed index
      info.guests.forEach((_, i) => {
        if (i > idx && next[`${roomId}-${i}`] !== undefined) {
          next[`${roomId}-${i - 1}`] = next[`${roomId}-${i}`];
          delete next[`${roomId}-${i}`];
        }
      });
      return next;
    });
  }

  /**
   * Copy the contact details into this room's guest list. Reuses the first blank
   * adult row (the seeded ones) rather than pushing past the room's capacity.
   */
  function fillFromPrimaryGuest(roomId) {
    if (!primaryGuest.name) return;
    const info = getGuestInfo(roomId);
    const alreadyIn = info.guests.some(
      (g) => g.name && g.name.toLowerCase().trim() === primaryGuest.name.toLowerCase().trim()
    );
    if (alreadyIn) return;

    const maxFCA = settings?.maxFreeChildAge ?? 5;
    const primaryRow = {
      name:      primaryGuest.name,
      age:       primaryGuest.age || "",
      gender:    primaryGuest.gender || "male",
      nidNumber: "",
      nidUrl:    nidUrl || "",
      _intent:   "adult",
    };

    const blankAdultIdx = info.guests.findIndex(
      (g) => !String(g.name || "").trim() && !guestIsChild(g, maxFCA)
    );
    if (blankAdultIdx !== -1) {
      const guests = [...info.guests];
      guests[blankAdultIdx] = { ...guests[blankAdultIdx], ...primaryRow };
      updateGuestInfo(roomId, { guests });
      return;
    }

    const room = cartRooms.find((r) => r._id === roomId);
    const curAdults = info.guests.filter((g) => !guestIsChild(g, maxFCA)).length;
    const primaryIsAdult = !primaryGuest.age || Number(primaryGuest.age) > maxFCA;
    if (primaryIsAdult && room?.maxAdults > 0 && curAdults >= room.maxAdults) return;
    updateGuestInfo(roomId, { guests: [...info.guests, primaryRow] });
  }

  async function uploadDoc(file, onSuccess) {
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/upload-doc", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) onSuccess(data.url);
  }

  // ── Step validations ─────────────────────────────────────────────────────────
  function validateStep(n) {
    if (n === 2) {
      if (!checkIn || !checkOut) return "Please select your dates.";
      if (bookingMode === "night_stay" && nights < 1) return "Check-out must be after check-in.";
    }
    if (n === 3) {
      // For night stay: property + rooms are required
      if (bookingMode === "night_stay") {
        if (!selectedProp) return "Please select a property.";
        if (cart.size === 0) return "Please add at least one room to your cart.";
        if (cart.size > 0 && cartCapacity < adults) {
          return `Your selected room${cart.size > 1 ? "s" : ""} can accommodate ${cartCapacity} adult${cartCapacity !== 1 ? "s" : ""}, but you have ${adults}. Please add more rooms.`;
        }
        if (cart.size > 0 && children > 0 && cartChildCapacity < children) {
          return `Your selected room${cart.size > 1 ? "s" : ""} can accommodate ${cartChildCapacity} child${cartChildCapacity !== 1 ? "ren" : ""}, but you have ${children}. Please add more rooms or choose a category that allows children.`;
        }
      }
      // For day long: entry is required; rooms (and property) are fully optional
      if (bookingMode === "day_long") {
        if (!selectedEntry) return "Please select an entry service to continue.";
      }
    }
    if (n === 4) {
      if (!primaryGuest.name.trim())  return "Please enter the primary guest's full name.";
      if (!primaryGuest.email.trim()) return "Please enter a valid email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryGuest.email)) return "That email address doesn't look right. Please double-check it.";
      if (!primaryGuest.phone.trim()) return "Please enter a phone number.";
      if (!primaryGuest.age || isNaN(Number(primaryGuest.age))) return "Please enter the primary guest's age.";

      // Everyone's details and identification are mandatory — the same rules the
      // server re-checks on submit, so the guest sees them here first.
      if (cartRooms.length > 0 && docErrors.length > 0) return docErrors[0];
    }
    return null;
  }

  // Returns null if nothing is outstanding, otherwise the summary that must be
  // acknowledged before the guest can move on to payment.
  function checkUploadWarnings() {
    if (cartRooms.length === 0) return null;
    if (!docSummary.marriageCertPending && !docSummary.docsDeferred && docSummary.adultsMissingNid === 0) {
      return null;
    }
    return { type: "docs" };
  }

  function goNext() {
    setError("");
    setUploadWarn(null);
    const err = validateStep(step);
    if (err) { setError(err); return; }
    if (step === 4) {
      const warn = checkUploadWarnings();
      if (warn) { setUploadWarn(warn); return; }
    }
    if (step === 2) {
      // Initialize room sub-step when entering step 3
      setRoomSubStep(bookingMode === "day_long" ? 0 : 1);
    }
    setPreviewRoom(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError("");
    setUploadWarn(null);
    if (step === 3) {
      // Reset sub-step when leaving step 3
      setRoomSubStep(bookingMode === "day_long" ? 0 : 1);
    }
    setPreviewRoom(null);
    setStep((s) => s - 1);
  }

  // ── Bar navigation (handles sub-step routing so the fixed bar can own Back/Next) ─
  function barGoBack() {
    setError("");
    setUploadWarn(null);
    setPreviewRoom(null);
    if (step === 3) {
      if (roomSubStep === 3) { setRoomSubStep(2); return; }
      if (roomSubStep === 2) { setRoomSubStep(1); return; }
      if (roomSubStep === 1 && bookingMode === "day_long") { setRoomSubStep(0); return; }
    }
    goBack();
  }

  function barGoNext() {
    setError("");
    if (step === 3) {
      if (roomSubStep === 1) {
        if (selectedProp) setRoomSubStep(2);
        else setError("Please select a property to continue.");
        return;
      }
      if (roomSubStep === 2) {
        if (selectedCat) setRoomSubStep(3);
        else setError("Please select a room category to continue.");
        return;
      }
    }
    goNext();
  }

  // ── Submit booking ────────────────────────────────────────────────────────────
  async function handleSubmit(paymentMethod) {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    setError("");

    const roomBookingsData = cartRooms.map((room) => {
      const info = getGuestInfo(room._id);
      return {
        roomId:   room._id,
        categoryId: room.category,
        // Strip internal _intent field before sending to server
        guests:   info.guests.map(({ _intent, ...g }) => g),
        ownChildDeclared:  info.ownChildDeclared === true,
        coupleDocumentUrl: info.coupleDocumentUrl || "",
        coupleDocMethod:   info.coupleDocumentUrl ? "upload" : "at_desk",
      };
    });

    const checkOutCalc = bookingMode === "day_long" && checkIn
      ? addDays(checkIn, 1)
      : checkOut;

    startTransition(async () => {
      try {
        // Refresh the hold taken when checkout opened, reusing this browser's
        // hold identity so we extend our own reservation instead of colliding
        // with it. Skipped when there are no rooms (allowed for day long).
        if (cartRooms.length > 0) {
          if (!lockSessionRef.current) lockSessionRef.current = getLockSessionId();
          const rooms = cartRooms.map((r) => r._id);
          const lockRes = await fetch("/api/booking/lock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rooms,
              checkIn,
              checkOut: checkOutCalc,
              bookingMode,
              sessionId: lockSessionRef.current,
            }),
          });
          const ld = await lockRes.json().catch(() => ({}));
          if (!lockRes.ok) {
            setError(ld.error || "Could not lock rooms. Please try again.");
            return;
          }
          if (ld.lockedUntil) {
            const next = { rooms, expiresAt: new Date(ld.lockedUntil).getTime() };
            holdRef.current = next;
            setHold(next);
            setHoldRemaining(Math.max(0, next.expiresAt - Date.now()));
          }
        }

        const result = await createPendingBooking({
          bookingMode,
          propertyId: selectedProp,
          bookingType: "room",
          roomBookings: roomBookingsData,
          dayLongPackageId: selectedEntry?._id || null,
          dayLongAddonIds:  selectedAddons.map((a) => a._id),
          dayLongDiscount,
          checkIn,
          checkOut: checkOutCalc,
          nights: bookingMode === "day_long" ? 0 : nights,
          primaryGuest: { ...primaryGuest, age: Number(primaryGuest.age) },
          nidUrl,
          nidMethod,
          nidNumber,
          guestDocsMethod,
          guestDocsConsent,
          specialRequests: specialReqs,
          paymentMethod,
          advancePercent: advancePct,
          offerId:         autoOffer?._id || null,
          offerDiscount:   autoOfferDiscount,
          couponId:        couponApplied?.id       || null,
          couponCode:      couponApplied?.code      || "",
          couponDiscount:  couponApplied?.discountAmount || 0,
          termsAccepted,
        });

        if (!result.success) {
          setError("Failed to create booking. Please try again.");
          return;
        }


        // SSLCommerz payment
        const payRes = await fetch("/api/ssl/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId:   result.bookingId,
            amount:      result.advanceAmount,
            customerName:  primaryGuest.name,
            customerEmail: primaryGuest.email,
            customerPhone: primaryGuest.phone,
          }),
        });
        const payData = await payRes.json();
        if (payData.url) {
          // Leaving for the gateway is an unload too — flag it so the hold
          // survives the hand-off instead of being released underneath us.
          paymentRedirectRef.current = true;
          window.location.href = payData.url;
        } else {
          setError(payData.error || "Payment initiation failed. Please try again.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong. Please try again.");
      }
    });
  }

  // ── Format times ─────────────────────────────────────────────────────────────
  function fmt12(time24) {
    if (!time24) return "";
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h % 12 || 12;
    return `${h12}:${pad(m)} ${ampm}`;
  }

  const ciTime = bookingMode === "day_long" ? settings?.dayLongCheckInTime  : settings?.checkInTime;
  const coTime = bookingMode === "day_long" ? settings?.dayLongCheckOutTime : settings?.checkOutTime;

  // ── Apply coupon (clears auto-offer — only one discount allowed at a time) ────
  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const result = await validateCoupon({
        code:       couponInput,
        bookingMode,
        orderTotal: subtotal + taxes - dayLongDiscount,
        userId:     session?.user?.id,
      });
      // One discount at a time: coupon overrides auto-offer
      setAutoOffer(null);
      setCouponApplied(result);
      setCouponInput("");
    } catch (err) {
      setCouponError(err.message || "Invalid coupon.");
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  }

  // Restore best auto-offer when coupon is removed
  function removeCoupon() {
    setCouponApplied(null);
    if (activeOffers.length > 0) {
      const best = activeOffers.reduce((prev, curr) => {
        const prevEff = prev.discountType === "percentage" ? prev.discountValue : prev.discountValue;
        const currEff = curr.discountType === "percentage" ? curr.discountValue : curr.discountValue;
        return currEff > prevEff ? curr : prev;
      });
      setAutoOffer(best);
    }
  }

  // ── Price summary bar (shown at steps 3–5) ────────────────────────────────────
  const showPriceBar = step >= 3 && (totalPrice > 0 || dayLongSvcTotal > 0);

  function PriceBar() {
    if (!showPriceBar) return null;
    const hasDiscount = dayLongDiscount > 0 || autoOfferDiscount > 0 || couponDiscount > 0;
    return (
      <div className={`${josefin.className} bg-gradient-to-r from-[#FDFBFE] to-[#FAF7FC] border border-[#EDE5F0] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9.5px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold">Price Summary</p>
          {hasDiscount && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Discount applied!
            </span>
          )}
        </div>
        <div className="space-y-1 text-[12px]">
          {cartRooms.length > 0 && (
            <div className="flex justify-between">
              <span className="text-[#9B8BAB]">
                {cartRooms.length} room{cartRooms.length > 1 ? "s" : ""}
                {bookingMode === "night_stay" && nights > 0 ? ` × ${nights} night${nights > 1 ? "s" : ""}` : ""}
              </span>
              <span className="font-medium text-[#1a1410]">৳{totalPrice.toLocaleString()}</span>
            </div>
          )}
          {selectedEntry && (
            <div className="flex justify-between">
              <span className="text-[#9B8BAB]">{selectedEntry.name}</span>
              <span className="font-medium text-[#1a1410]">৳{selectedEntry.price.toLocaleString()}</span>
            </div>
          )}
          {selectedAddons.map((a) => (
            <div key={a._id} className="flex justify-between">
              <span className="text-[#9B8BAB] flex items-center gap-1">
                {a.name}
                {(a.discountType === "percent" || a.discountType === "percentage") && a.discountValue > 0 && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 rounded-full font-bold">{a.discountValue}% off</span>
                )}
                {a.discountType === "fixed" && a.discountValue > 0 && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 rounded-full font-bold">−৳{a.discountValue}</span>
                )}
              </span>
              <span className="font-medium text-[#1a1410]">৳{a.price.toLocaleString()}</span>
            </div>
          ))}
          {taxPercent > 0 && (
            <div className="flex justify-between text-[#9B8BAB]">
              <span>Tax ({taxPercent}%)</span>
              <span>৳{taxes.toLocaleString()}</span>
            </div>
          )}
          {dayLongDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Package discount</span>
              <span>−৳{dayLongDiscount.toLocaleString()}</span>
            </div>
          )}
          {autoOfferDiscount > 0 && autoOffer && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Offer</span>
                {autoOffer.name}
              </span>
              <span>−৳{autoOfferDiscount.toLocaleString()}</span>
            </div>
          )}
          {couponDiscount > 0 && couponApplied && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span className="flex items-center gap-1.5">
                Coupon <code className="text-[9px] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg font-mono">{couponApplied.code}</code>
              </span>
              <span>−৳{couponDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-[#F0E8F4]">
          <span className="text-[13px] font-bold text-[#1a1410]">Total</span>
          <div className="text-right">
            {hasDiscount && (
              <p className="text-[10.5px] text-[#C4B3CE] line-through">৳{(subtotal + taxes).toLocaleString()}</p>
            )}
            <p className="text-[18px] font-bold text-[#7A2267]">৳{total.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Bar computed values ───────────────────────────────────────────────────────
  const barNextDisabled =
    (step === 3 && bookingMode === "night_stay" && roomSubStep === 1 && !selectedProp) ||
    (step === 3 && bookingMode === "night_stay" && roomSubStep === 2 && !selectedCat) ||
    (step === 3 && roomSubStep === 3 && bookingMode === "night_stay" && cart.size === 0);

  const barNextLabel = step === 4 ? "Review & Pay" : "Continue";
  const barShowBack  = step > 1;
  const barShowNext  = step < 5;

  const barContextInfo = (() => {
    if (step === 1) return bookingMode === "night_stay" ? "Night Stay" : "Day Long";
    if (step === 2 && checkIn) {
      if (bookingMode === "day_long") return `Day Long · ${fmtDate(checkIn)}`;
      if (checkOut) return `${fmtDate(checkIn)} → ${fmtDate(checkOut)}${nights > 0 ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}`;
      return fmtDate(checkIn) + " → ?";
    }
    if (step >= 3) {
      const parts = [];
      if (selectedEntry) parts.push(selectedEntry.name);
      if (cart.size > 0) parts.push(`${cart.size} room${cart.size > 1 ? "s" : ""}`);
      const priceSum = totalPrice + dayLongSvcTotal;
      if (priceSum > 0) parts.push("৳" + priceSum.toLocaleString());
      return parts.length ? parts.join(" · ") : null;
    }
    return null;
  })();

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={`${josefin.className} pb-24`}>
      <StepIndicator step={step} total={5} />

      <FixedBottomBar
        showBack={barShowBack}
        showNext={barShowNext}
        onBack={barGoBack}
        onNext={barGoNext}
        nextDisabled={barNextDisabled}
        nextLabel={barNextLabel}
        contextInfo={barContextInfo}
        barError={error}
        isLoading={isPending}
      />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Mode Selection ── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
              <div className="p-6 sm:p-8">
                <h2 className={`text-[22px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>
                  How would you like to stay?
                </h2>
                <p className="text-[12.5px] text-[#9B8BAB] mb-7">Choose between a night stay or a full-day experience.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Night Stay */}
                  <button
                    onClick={() => setBookingMode("night_stay")}
                    className={`group relative rounded-2xl border-2 p-6 text-left transition-all duration-300 overflow-hidden
                      ${bookingMode === "night_stay"
                        ? "border-[#7A2267] bg-gradient-to-br from-[#7A2267]/[0.04] to-[#F0E8F4]/70 shadow-[0_8px_32px_rgba(122,34,103,0.2)]"
                        : "border-[#EDE5F0] bg-white hover:border-[#C4B3CE] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"}`}>
                    {/* Decorative orb */}
                    <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full transition-all duration-300
                      ${bookingMode === "night_stay" ? "bg-[#7A2267]/8" : "bg-[#F0E8F4]/50 group-hover:bg-[#EDE5F0]/80"}`} />
                    {bookingMode === "night_stay" && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow-sm z-10">
                        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200
                      ${bookingMode === "night_stay"
                        ? "bg-[#7A2267] text-white shadow-[0_4px_14px_rgba(122,34,103,0.4)]"
                        : "bg-[#F0E8F4] text-[#7A2267] group-hover:bg-[#E8DAF0]"}`}>
                      <MoonIcon />
                    </div>
                    <p className={`relative z-10 text-[17px] font-semibold text-[#1a1410] mb-1.5 ${lora.className}`}>Night Stay</p>
                    <p className="relative z-10 text-[12px] text-[#9B8BAB] leading-relaxed">Stay overnight — one or more nights of comfort.</p>
                    {ciTime && coTime && (
                      <div className="relative z-10 mt-4 pt-3 border-t border-[#F0E8F4] grid grid-cols-2 gap-2 text-[10.5px]">
                        <div>
                          <p className="text-[#C4B3CE] mb-0.5">Check-in</p>
                          <p className="font-semibold text-[#9B8BAB]">{fmt12(ciTime)}</p>
                        </div>
                        <div>
                          <p className="text-[#C4B3CE] mb-0.5">Check-out</p>
                          <p className="font-semibold text-[#9B8BAB]">{fmt12(coTime)}</p>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Day Long */}
                  <button
                    onClick={() => setBookingMode("day_long")}
                    className={`group relative rounded-2xl border-2 p-6 text-left transition-all duration-300 overflow-hidden
                      ${bookingMode === "day_long"
                        ? "border-[#7A2267] bg-gradient-to-br from-[#7A2267]/[0.04] to-[#F0E8F4]/70 shadow-[0_8px_32px_rgba(122,34,103,0.2)]"
                        : "border-[#EDE5F0] bg-white hover:border-[#C4B3CE] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"}`}>
                    <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full transition-all duration-300
                      ${bookingMode === "day_long" ? "bg-[#7A2267]/8" : "bg-[#F0E8F4]/50 group-hover:bg-[#EDE5F0]/80"}`} />
                    {bookingMode === "day_long" && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow-sm z-10">
                        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200
                      ${bookingMode === "day_long"
                        ? "bg-[#7A2267] text-white shadow-[0_4px_14px_rgba(122,34,103,0.4)]"
                        : "bg-[#F0E8F4] text-[#7A2267] group-hover:bg-[#E8DAF0]"}`}>
                      <SunIcon />
                    </div>
                    <p className={`relative z-10 text-[17px] font-semibold text-[#1a1410] mb-1.5 ${lora.className}`}>Day Long</p>
                    <p className="relative z-10 text-[12px] text-[#9B8BAB] leading-relaxed">A full-day resort experience from morning to evening.</p>
                    {settings?.dayLongCheckInTime && settings?.dayLongCheckOutTime && (
                      <div className="relative z-10 mt-4 pt-3 border-t border-[#F0E8F4] grid grid-cols-2 gap-2 text-[10.5px]">
                        <div>
                          <p className="text-[#C4B3CE] mb-0.5">Arrival</p>
                          <p className="font-semibold text-[#9B8BAB]">{fmt12(settings.dayLongCheckInTime)}</p>
                        </div>
                        <div>
                          <p className="text-[#C4B3CE] mb-0.5">Departure</p>
                          <p className="font-semibold text-[#9B8BAB]">{fmt12(settings.dayLongCheckOutTime)}</p>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Dates + Guests ── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">

              <div className="p-6 sm:p-8">
                <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>
                  {bookingMode === "day_long" ? "Select your date" : "Select your dates"}
                </h2>
                <p className="text-[12px] text-[#9B8BAB] mb-5">
                  {bookingMode === "day_long" ? "Pick the day of your visit." : "Choose your check-in and check-out dates."}
                </p>

                <Calendar mode={bookingMode} selected={dateRange} onSelect={setDateRange} />

                {/* Date summary */}
                {checkIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-3 text-[12.5px] text-[#1a1410] bg-gradient-to-r from-[#F0E8F4]/60 to-[#FAF7FC] border border-[#EDE5F0] rounded-xl px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-[#7A2267]/10 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                        <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="#7A2267" strokeWidth="1.3" />
                        <path d="M1 6h12M5 1.5v2M9 1.5v2" stroke="#7A2267" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="font-medium text-[#7A2267]">
                      {bookingMode === "day_long"
                        ? <>{fmtDate(checkIn)} · Day long</>
                        : <>{fmtDate(checkIn)} → {checkOut ? fmtDate(checkOut) : <span className="text-[#C4B3CE]">select check-out</span>}{nights > 0 ? <span className="text-[#9B8BAB] font-normal ml-1.5">· {nights} night{nights > 1 ? "s" : ""}</span> : ""}</>
                      }
                    </span>
                  </motion.div>
                )}

                {/* Timings reminder */}
                {ciTime && coTime && (
                  <div className="mt-3 flex gap-6 text-[11.5px] text-[#9B8BAB]">
                    <span>
                      <svg className="inline mr-1" viewBox="0 0 10 10" width="10" height="10" fill="none">
                        <circle cx="5" cy="5" r="4.3" stroke="#7A2267" strokeWidth="1.2" />
                        <path d="M5 3v2l1.3 1.3" stroke="#7A2267" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      Check-in: <strong>{fmt12(ciTime)}</strong>
                    </span>
                    <span>Check-out: <strong>{fmt12(coTime)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Guest counts */}
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
              <div className="p-6">
                <h3 className={`text-[16px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>How many guests?</h3>
                <p className="text-[11.5px] text-[#C4B3CE] mb-5">Rooms are assigned based on your group size.</p>
                <div className="grid grid-cols-2 gap-6">
                  <Counter label="Adults" value={adults} min={1} max={20}
                    sub={adults === 1 ? "adult" : "adults"} onChange={setAdults} />
                  <Counter label="Children" value={children} min={0} max={10}
                    sub={children === 0 ? "none" : children === 1 ? "child" : "children"}
                    onChange={setChildren} />
                </div>
                {settings?.maxFreeChildAge > 0 && (
                  <p className="text-[10.5px] text-[#C4B3CE] mt-3">
                    Children {settings.maxFreeChildAge} years and under stay free.
                  </p>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* ── STEP 3: Room Selection (3 sub-steps) ── */}
        {step === 3 && (() => {
          // Sub-step breadcrumb
          const subStepLabels = bookingMode === "day_long"
            ? ["Packages", "Property", "Category", "Rooms"]
            : ["Property", "Category", "Rooms"];
          const activeIndex = bookingMode === "day_long" ? roomSubStep : roomSubStep - 1;

          const SubBreadcrumb = () => (
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
              {subStepLabels.map((label, i) => {
                const done   = i < activeIndex;
                const active = i === activeIndex;
                return (
                  <div key={i} className="flex items-center gap-1 shrink-0">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200
                      ${active ? "bg-[#7A2267] text-white shadow-sm" : done ? "bg-[#7A2267]/12 text-[#7A2267]" : "bg-[#F0E8F4] text-[#C4B3CE]"}`}>
                      {done && (
                        <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                          <path d="M1.3 4L3 5.7 6.7 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {label}
                    </div>
                    {i < subStepLabels.length - 1 && (
                      <svg viewBox="0 0 6 10" width="5" height="9" fill="none" className="shrink-0">
                        <path d="M1 1l4 4-4 4" stroke="#C4B3CE" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          );

          // Shared ServiceCard for day long packages
          const ServiceCard = ({ svc, selected, onClick }) => {
            const hasDiscount = svc.discountType !== "none" && svc.discountValue > 0;
            const discountLabel = hasDiscount
              ? (svc.discountType === "percent" ? `${svc.discountValue}% OFF` : `৳${svc.discountValue} OFF`)
              : null;
            const discountNote = hasDiscount
              ? (svc.discountType === "percent" ? `Saves ${svc.discountValue}% off total` : `Saves ৳${svc.discountValue} off total`)
              : null;
            return (
              <button onClick={onClick}
                className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-150 group
                  ${selected ? "border-[#7A2267] shadow-[0_4px_20px_rgba(122,34,103,0.15)]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                {svc.image ? (
                  <div className="relative h-28 overflow-hidden bg-[#F0E8F4]">
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    {selected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow">
                        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                        {discountLabel}
                      </div>
                    )}
                  </div>
                ) : selected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow z-10">
                    <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                      <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className={`p-3 ${selected ? "bg-[#FAF7FC]" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-1.5 mb-0.5">
                    <p className="text-[12.5px] font-semibold text-[#1a1410] leading-tight">{svc.name}</p>
                    {hasDiscount && !svc.image && (
                      <span className="shrink-0 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                        {discountLabel}
                      </span>
                    )}
                  </div>
                  {svc.description && <p className="text-[10.5px] text-[#9B8BAB] mt-0.5 line-clamp-2 leading-snug">{svc.description}</p>}
                  <p className="text-[14px] font-bold text-[#7A2267] mt-1.5">৳{Number(svc.price).toLocaleString()}</p>
                  {hasDiscount && (
                    <p className="text-[9.5px] text-emerald-600 font-medium mt-0.5">{discountNote}</p>
                  )}
                </div>
              </button>
            );
          };

          // Room grid (shared by both modes in sub-step 3)
          const RoomGrid = () => {
            if (roomsLoading) return <div className="py-10 text-center text-[13px] text-[#C4B3CE]">Checking availability…</div>;
            if (rooms.length === 0) return <div className="py-10 text-center text-[13px] text-[#C4B3CE]">No rooms available for the selected dates and category.</div>;

            const roomBlocks = propertyBlocks.length > 0 ? propertyBlocks : [...new Set(rooms.map((r) => r.block || "").filter(Boolean))];
            const hasBlocks  = roomBlocks.length > 0 && rooms.some((r) => r.block);
            const blockKeys  = hasBlocks
              ? [...roomBlocks, ...rooms.filter((r) => r.block && !roomBlocks.includes(r.block)).map((r) => r.block)].filter((v, i, a) => a.indexOf(v) === i)
              : [""];

            return (
              <div className="space-y-5">
                {blockKeys.map((blockKey) => {
                  const blockRooms = blockKey === "" ? rooms.filter((r) => !r.block || r.block === "") : rooms.filter((r) => r.block === blockKey);
                  if (!blockRooms.length) return null;
                  const floors = [...new Set(blockRooms.map((r) => r.floor))].sort((a, b) => a - b);
                  return (
                    <div key={blockKey || "general"}>
                      {hasBlocks && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5 bg-[#7A2267]/8 border border-[#7A2267]/20 px-3 py-1.5 rounded-full">
                            <span className="text-[11px] font-bold text-[#7A2267] uppercase tracking-wider">{blockKey || "General"}</span>
                          </div>
                          <div className="flex-1 h-px bg-[#EDE5F0]" />
                          <span className="text-[10px] text-[#C4B3CE]">{blockRooms.length} available</span>
                        </div>
                      )}
                      <div className="space-y-3">
                        {floors.map((floor) => {
                          const floorRooms = blockRooms.filter((r) => r.floor === floor);
                          return (
                            <div key={floor}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#C4B3CE]">Floor {floor}</span>
                                <div className="flex-1 h-px bg-[#F0E8F4]" />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {floorRooms.map((room) => {
                                  const isSelected   = cart.has(room._id);
                                  const isPreviewing = previewRoom?._id === room._id;
                                  const displayPrice = bookingMode === "day_long" ? room.resolvedDayPrice : room.resolvedNightPrice;
                                  return (
                                    <button key={room._id}
                                      onClick={() => setPreviewRoom(isPreviewing ? null : room)}
                                      className={`relative rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 font-semibold text-[13px] px-2 py-2 min-w-[62px]
                                        ${isSelected ? "bg-[#7A2267] border-[#7A2267] text-white shadow-[0_2px_10px_rgba(122,34,103,0.3)]"
                                          : isPreviewing ? "bg-[#F0E8F4] border-[#7A2267] text-[#7A2267]"
                                          : "bg-white border-[#EDE5F0] text-[#1a1410] hover:border-[#C4B3CE] hover:bg-[#FAF7FC]"}`}>
                                      {isSelected && (
                                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                          <svg viewBox="0 0 8 8" width="7" height="7" fill="none">
                                            <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </div>
                                      )}
                                      <span>{room.roomNumber}</span>
                                      {(room.variantName || room.bedType) && (
                                        <span className={`text-[8px] font-medium leading-tight text-center max-w-[58px] truncate
                                          ${isSelected ? "text-white/70" : isPreviewing ? "text-[#7A2267]/60" : "text-[#9B8BAB]"}`}>
                                          {room.variantName || room.bedType}
                                        </span>
                                      )}
                                      <span className={`text-[8px] font-semibold leading-tight
                                        ${isSelected ? "text-white/80" : isPreviewing ? "text-[#7A2267]/70" : "text-[#C4B3CE]"}`}>
                                        ৳{Number(displayPrice).toLocaleString()}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          };

          return (
            <motion.div key={`step3-${roomSubStep}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}>

              <SubBreadcrumb />

              {/* ── Day Long Sub-step 0: Package Selection ── */}
              {bookingMode === "day_long" && roomSubStep === 0 && (() => {
                const entryServices = packages.filter((p) => p.type === "entry");
                const addonServices = packages.filter((p) => p.type === "addon");
                return (
                  <>
                    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
        
                      <div className="p-6 sm:p-8">
                        <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>Choose your day package</h2>
                        <p className="text-[12px] text-[#9B8BAB] mb-5">Select an entry option and any optional add-ons.</p>

                        {/* Entry — required */}
                        {entryServices.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold">Entry</p>
                              <span className="text-[9px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">Required</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {entryServices.map((svc) => (
                                <ServiceCard key={svc._id} svc={svc}
                                  selected={selectedEntry?._id === svc._id}
                                  onClick={() => setSelectedEntry(selectedEntry?._id === svc._id ? null : svc)} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add-ons — optional */}
                        {addonServices.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold">Add Services</p>
                              <span className="text-[9px] font-semibold bg-[#F0E8F4] text-[#9B8BAB] border border-[#EDE5F0] px-2 py-0.5 rounded-full">Optional</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {addonServices.map((svc) => {
                                const isOn = selectedAddons.some((a) => a._id === svc._id);
                                return (
                                  <ServiceCard key={svc._id} svc={svc} selected={isOn}
                                    onClick={() => setSelectedAddons((prev) =>
                                      isOn ? prev.filter((a) => a._id !== svc._id) : [...prev, svc]
                                    )} />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price summary replaces old package summary */}
                    {(selectedEntry || selectedAddons.length > 0) && <PriceBar />}

                    {/* Optional: add a day long room */}
                    <button onClick={() => setRoomSubStep(1)}
                      className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#C4B3CE] text-[#7A2267] font-semibold text-[13px]
                        hover:border-[#7A2267] hover:bg-[#FAF7FC] transition-all duration-200 flex items-center justify-center gap-2">
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                        <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M7 6v3M5.5 7.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      + Add a Day Long Room (Optional)
                    </button>
                  </>
                );
              })()}

              {/* ── Sub-step 1: Property Selection ── */}
              {roomSubStep === 1 && (
                <>
                  <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
      
                    <div className="p-6 sm:p-8">
                      <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>Choose your property</h2>
                      <p className="text-[12px] text-[#9B8BAB] mb-5">Select the property that fits your stay.</p>

                      {properties.length === 0 ? (
                        <p className="text-[13px] text-[#C4B3CE] text-center py-4">No properties available.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {properties.map((p) => (
                            <button key={p._id}
                              onClick={() => { setSelectedProp(p._id); setSelectedCat(null); setRooms([]); setCart(new Map()); setPreviewRoom(null); setRoomSubStep(2); }}
                              className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300
                                ${selectedProp === p._id
                                  ? "ring-2 ring-[#7A2267] ring-offset-2 shadow-[0_8px_36px_rgba(122,34,103,0.22)]"
                                  : "shadow-sm hover:shadow-xl hover:-translate-y-0.5"}`}>
                              <div className="relative aspect-[16/9] bg-gradient-to-br from-[#F0E8F4] to-[#E4D5F0] overflow-hidden">
                                {p.coverImage
                                  ? <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                                  : <div className="w-full h-full flex items-center justify-center">
                                      <svg viewBox="0 0 32 28" width="32" height="28" fill="none">
                                        <rect x="1" y="8" width="30" height="19" rx="2" stroke="#C4B3CE" strokeWidth="1.4"/>
                                        <path d="M8 8V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" stroke="#C4B3CE" strokeWidth="1.4"/>
                                        <path d="M13 16h6M16 13v6" stroke="#C4B3CE" strokeWidth="1.2" strokeLinecap="round"/>
                                      </svg>
                                    </div>
                                }
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                {selectedProp === p._id && (
                                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#7A2267] shadow-lg flex items-center justify-center">
                                    <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                                      <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-4">
                                  <p className={`text-white text-[16px] font-semibold leading-tight ${lora.className}`}>{p.name}</p>
                                  {p.tagline && <p className="text-white/60 text-[11px] mt-0.5 line-clamp-1">{p.tagline}</p>}
                                  {p.location && (
                                    <p className="text-white/45 text-[10px] mt-1 flex items-center gap-1">
                                      <svg viewBox="0 0 12 14" width="8" height="10" fill="none">
                                        <path d="M6 1C3.79 1 2 2.79 2 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.3"/>
                                        <circle cx="6" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                                      </svg>
                                      {p.location}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Sub-step 2: Category Selection ── */}
              {roomSubStep === 2 && (
                <>
                  <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
      
                    <div className="p-6 sm:p-8">
                      <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>Choose room category</h2>
                      <p className="text-[12px] text-[#9B8BAB] mb-5">Select the type of room you prefer.</p>

                      {categories.length === 0 ? (
                        <p className="text-[13px] text-[#C4B3CE]">No categories found for this property.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {categories.map((c) => (
                            <button key={c._id}
                              onClick={() => { setSelectedCat(c._id); setCart(new Map()); setPreviewRoom(null); setRoomSubStep(3); }}
                              className={`group relative rounded-xl overflow-hidden text-left transition-all duration-250
                                ${selectedCat === c._id
                                  ? "ring-2 ring-[#7A2267] ring-offset-1 shadow-[0_4px_18px_rgba(122,34,103,0.18)]"
                                  : "shadow-sm hover:shadow-md hover:-translate-y-0.5"}`}>
                              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#F0E8F4] to-[#E8D8F0]">
                                {c.coverImage
                                  ? <img src={c.coverImage} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                                  : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                      <svg viewBox="0 0 24 18" width="28" height="22" fill="none">
                                        <rect x="1" y="5" width="22" height="12" rx="1.5" stroke="#C4B3CE" strokeWidth="1.3"/>
                                        <path d="M7 5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" stroke="#C4B3CE" strokeWidth="1.3"/>
                                        <rect x="9" y="8" width="6" height="4" rx="0.5" stroke="#C4B3CE" strokeWidth="1.1"/>
                                      </svg>
                                    </div>
                                }
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                                {selectedCat === c._id && (
                                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#7A2267] flex items-center justify-center shadow-sm">
                                    <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                                      <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 p-2.5">
                                  <p className="text-white text-[12.5px] font-semibold leading-tight truncate">{c.name}</p>
                                  {c.description && (
                                    <p className="text-white/45 text-[9.5px] mt-0.5 line-clamp-1">{c.description}</p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Sub-step 3: Room Grid ── */}
              {roomSubStep === 3 && (
                <>
                  <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
      
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold">
                            {bookingMode === "day_long" ? "Day Long Rooms" : "Available Rooms"}
                          </p>
                          {bookingMode === "day_long" && (
                            <span className="text-[9px] font-semibold bg-[#F0E8F4] text-[#9B8BAB] border border-[#EDE5F0] px-2 py-0.5 rounded-full">Optional</span>
                          )}
                        </div>
                        {bookingMode === "night_stay" && cart.size > 0 && (
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full
                            ${cartCapacity >= adults ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {cartCapacity}/{adults} adults fit
                          </span>
                        )}
                        {bookingMode === "day_long" && cart.size > 0 && (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F0E8F4] text-[#7A2267]">
                            {cart.size} room{cart.size > 1 ? "s" : ""} selected
                          </span>
                        )}
                      </div>

                      {bookingMode === "day_long" && (
                        <div className="mb-4 px-3 py-2.5 rounded-xl text-[11.5px] font-medium flex items-center gap-2 bg-[#FAF7FC] text-[#7A2267] border border-[#EDE5F0]">
                          <svg viewBox="0 0 12 12" width="13" height="13" fill="none">
                            <circle cx="6" cy="6" r="5.3" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          Prices shown are day long rates. Room selection is optional.
                        </div>
                      )}

                      <RoomGrid />

                      {/* Room preview placeholder */}
                    </div>
                  </div>

                  {/* Price summary replaces old cart summary */}
                  {cart.size > 0 && <PriceBar />}

                </>
              )}

            </motion.div>
          );
        })()}

        {/* ── STEP 4: Guest Info (simplified) ── */}
        {step === 4 && (
          <motion.div key="step4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>

            {/* Stay summary — dates + guests, with edit options */}
            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
              <div className="p-4 sm:p-5">
                <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-3">Your Stay</p>
                <div className="flex flex-wrap gap-3">
                  {/* Dates block */}
                  <div className="flex-1 min-w-[140px] bg-[#FAF7FC] border border-[#EDE5F0] rounded-xl px-3.5 py-3">
                    <p className="text-[9.5px] text-[#C4B3CE] uppercase tracking-wide font-semibold mb-1">
                      {bookingMode === "day_long" ? "Date" : "Dates"}
                    </p>
                    <p className="text-[12.5px] font-semibold text-[#1a1410]">
                      {bookingMode === "day_long"
                        ? fmtDate(checkIn)
                        : `${fmtDate(checkIn)} → ${fmtDate(checkOut)}`}
                    </p>
                    {bookingMode === "night_stay" && nights > 0 && (
                      <p className="text-[10.5px] text-[#9B8BAB] mt-0.5">{nights} night{nights > 1 ? "s" : ""}</p>
                    )}
                    <button type="button"
                      onClick={() => { setCart(new Map()); setStep(2); }}
                      className="mt-1.5 text-[10px] font-semibold text-[#7A2267] underline underline-offset-2 hover:no-underline">
                      Change
                    </button>
                  </div>
                  {/* Guests block */}
                  <div className="flex-1 min-w-[120px] bg-[#FAF7FC] border border-[#EDE5F0] rounded-xl px-3.5 py-3">
                    <p className="text-[9.5px] text-[#C4B3CE] uppercase tracking-wide font-semibold mb-1">Guests</p>
                    <p className="text-[12.5px] font-semibold text-[#1a1410]">
                      {adults} adult{adults > 1 ? "s" : ""}
                      {children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}
                    </p>
                    <button type="button"
                      onClick={() => { setCart(new Map()); setStep(2); }}
                      className="mt-1.5 text-[10px] font-semibold text-[#7A2267] underline underline-offset-2 hover:no-underline">
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">

              <div className="p-6 sm:p-8">
                <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${lora.className}`}>Your details</h2>
                <p className="text-[12px] text-[#9B8BAB] mb-6">Just a few details to complete your reservation.</p>

                {/* Primary Guest */}
                <div className="mb-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-3">Your Contact Details</p>

                  {/* Row 1: Name + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[9.5px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">Full Name *</label>
                      <input placeholder="Your full name" value={primaryGuest.name}
                        onChange={(e) => setPrimaryGuest((p) => ({ ...p, name: e.target.value }))}
                        className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/50 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.08)] transition-all" />
                    </div>
                    <div>
                      <label className="block text-[9.5px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">Phone *</label>
                      <input placeholder="+880 1X..." value={primaryGuest.phone}
                        onChange={(e) => setPrimaryGuest((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/50 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.08)] transition-all" />
                    </div>
                  </div>

                  {/* Row 2: Email */}
                  <div className="mb-3">
                    <label className="block text-[9.5px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">Email *</label>
                    <input type="email" placeholder="name@example.com" value={primaryGuest.email}
                      onChange={(e) => setPrimaryGuest((p) => ({ ...p, email: e.target.value }))}
                      className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/50 focus:shadow-[0_0_0_3px_rgba(122,34,103,0.08)] transition-all" />
                  </div>

                  {/* Row 3: Age + Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9.5px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">Age *</label>
                      <input type="number" placeholder="Your age" min="1" max="120" value={primaryGuest.age}
                        onChange={(e) => setPrimaryGuest((p) => ({ ...p, age: e.target.value }))}
                        className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div>
                      <label className="block text-[9.5px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">Gender *</label>
                      <CustomSelect
                        value={primaryGuest.gender}
                        onChange={(v) => setPrimaryGuest((p) => ({ ...p, gender: v }))}
                        options={GENDER_OPTIONS} />
                    </div>
                  </div>
                </div>

                {/* NID — default: show at desk; "Upload online" button reveals upload field */}
                <div className="mb-5 bg-[#FAF7FC] border border-[#EDE5F0] rounded-xl px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2.5">
                      <svg viewBox="0 0 18 14" width="16" height="13" fill="none">
                        <rect x="1" y="1" width="16" height="12" rx="2" stroke="#9B8BAB" strokeWidth="1.2"/>
                        <circle cx="5.5" cy="5.5" r="1.8" stroke="#9B8BAB" strokeWidth="1.1"/>
                        <path d="M2.5 11c0-1.657 1.343-3 3-3M9 5h5M9 8h3" stroke="#9B8BAB" strokeWidth="1.1" strokeLinecap="round"/>
                      </svg>
                      <div>
                        <p className="text-[12px] font-semibold text-[#1a1410]">Your NID / Passport <span className="font-normal text-[#9B8BAB]">(booking holder)</span></p>
                        <p className="text-[10.5px] text-[#9B8BAB] mt-0.5">
                          {nidUrl ? "Document uploaded" : "Show original at check-in"}
                        </p>
                      </div>
                    </div>
                    {!nidUrl && (
                      <button type="button"
                        onClick={() => setNidMethod(nidMethod === "at_desk" ? "upload" : "at_desk")}
                        className="shrink-0 text-[10.5px] font-semibold text-[#7A2267] underline underline-offset-2 hover:no-underline transition-all">
                        {nidMethod === "at_desk" ? "Upload online" : "Cancel"}
                      </button>
                    )}
                    {nidUrl && (
                      <button type="button" onClick={() => { setNidUrl(""); setNidMethod("at_desk"); }}
                        className="shrink-0 text-[10.5px] font-semibold text-emerald-600 hover:text-red-500 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>

                  <input placeholder="NID / Passport number (optional)" value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value)}
                    className="mt-2.5 w-full border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12px] bg-white text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/40 transition-all" />

                  {/* Upload field — shown only when user clicks "Upload online" or after upload */}
                  {(nidMethod === "upload" || nidUrl) && (
                    <div className="mt-3">
                      {nidUrl ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                          <svg viewBox="0 0 12 12" width="13" height="13" fill="none">
                            <circle cx="6" cy="6" r="5.5" fill="#10b981"/>
                            <path d="M3.5 6L5 7.5 8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-[11.5px] text-emerald-700 font-medium flex-1">Uploaded successfully</span>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 border-2 border-dashed border-[#C4B3CE]/50 rounded-xl px-4 py-3 cursor-pointer hover:border-[#7A2267]/40 hover:bg-white/60 transition-all">
                          <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
                            <path d="M9 2v10M5.5 6L9 2l3.5 4" stroke="#7A2267" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 14v1.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V14" stroke="#7A2267" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          <span className="text-[12px] font-semibold text-[#7A2267]">Click to upload NID / Passport</span>
                          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, setNidUrl); }} />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Guest details & identification — mandatory for every person staying */}
                {cartRooms.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-3">
                      Guest Details &amp; Identification
                      <span className="ml-2 normal-case text-[#7A2267] font-semibold tracking-normal text-[11px]">(required for everyone)</span>
                    </p>

                    {/* Policy notice — the same rules the confirmation email repeats */}
                    <div className="mb-3 rounded-xl border border-[#E8D5F0] bg-[#FAF7FC] px-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <svg viewBox="0 0 18 14" width="16" height="13" fill="none" className="shrink-0 mt-0.5">
                          <rect x="1" y="1" width="16" height="12" rx="2" stroke="#7A2267" strokeWidth="1.2"/>
                          <circle cx="5.5" cy="5.5" r="1.8" stroke="#7A2267" strokeWidth="1.1"/>
                          <path d="M2.5 11c0-1.657 1.343-3 3-3M9 5h5M9 8h3" stroke="#7A2267" strokeWidth="1.1" strokeLinecap="round"/>
                        </svg>
                        <div className="flex-1">
                          <p className="text-[12px] font-semibold text-[#1a1410] mb-1.5">Everyone staying must be listed</p>
                          <ul className="space-y-1 text-[11px] text-[#5C4A6E] leading-relaxed">
                            <li>• Full name, age and gender are required for <strong>every</strong> person — adults and children.</li>
                            <li>• Every adult must present a <strong>NID or passport</strong>. Children need no documents at all.</li>
                            <li>• A room with both adult male and female guests needs a <strong>marriage certificate</strong> — unless a child of yours is staying with you.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* When will the documents be handed over? */}
                    <div className="mb-3 rounded-xl border border-[#EDE5F0] px-4 py-3.5">
                      <p className="text-[11.5px] font-semibold text-[#1a1410] mb-0.5">When will you provide the documents?</p>
                      <p className="text-[10.5px] text-[#9B8BAB] mb-2.5">You can attach them now, or bring the originals to the resort — either way, they are required.</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {[
                          [DOCS_UPLOAD_NOW, "Upload now", "Attach each adult's NID during booking"],
                          [DOCS_AT_CHECKIN, "Provide at check-in", "Bring the originals to the reception desk"],
                        ].map(([v, label, hint]) => (
                          <button key={v} type="button"
                            onClick={() => { setGuestDocsMethod(v); setGuestDocsConsent(false); setUploadWarn(null); }}
                            className={`flex-1 text-left px-3.5 py-2.5 rounded-xl border-2 transition-all
                              ${guestDocsMethod === v
                                ? "bg-[#7A2267] border-[#7A2267] text-white"
                                : "bg-white border-[#EDE5F0] text-[#5C4A6E] hover:border-[#7A2267]/40"}`}>
                            <span className="block text-[11.5px] font-semibold">{label}</span>
                            <span className={`block text-[10px] mt-0.5 ${guestDocsMethod === v ? "text-white/70" : "text-[#C4B3CE]"}`}>{hint}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {cartRooms.map((room) => {
                        const info   = getGuestInfo(room._id);
                        const maxFCA = settings?.maxFreeChildAge ?? 5;
                        const ev = evaluateRoom({
                          guests:            info.guests,
                          ownChildDeclared:  info.ownChildDeclared,
                          coupleDocumentUrl: info.coupleDocumentUrl,
                        }, docOpts);
                        const atAdultLimit = room.maxAdults   > 0 && ev.adultCount   >= room.maxAdults;
                        const atChildLimit = room.maxChildren >= 0 && ev.childCount  >= room.maxChildren;

                        return (
                          <div key={room._id} className="border border-[#EDE5F0] rounded-xl overflow-hidden">
                            {/* Room header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7FC]">
                              <div>
                                <p className="text-[11.5px] font-semibold text-[#1a1410]">Room {room.roomNumber}</p>
                                <p className="text-[10px] text-[#C4B3CE]">Up to {room.maxAdults} adults{room.maxChildren > 0 ? `, ${room.maxChildren} children` : ""}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {primaryGuest.name && (
                                  <button type="button" onClick={() => fillFromPrimaryGuest(room._id)}
                                    className="text-[10px] font-semibold text-[#7A2267] underline underline-offset-2 hover:no-underline">
                                    Use my details
                                  </button>
                                )}
                                <span className="text-[10px] text-[#9B8BAB]">{info.guests.length} listed</span>
                              </div>
                            </div>

                            <div className="p-4">
                              {/* Guest rows */}
                              {info.guests.length > 0 && (
                                <div className="space-y-2.5 mb-3">
                                  {info.guests.map((g, gi) => {
                                    const isChild = guestIsChild(g, maxFCA);
                                    const warnMsg = childReclassifyMsg[`${room._id}-${gi}`];
                                    return (
                                      <div key={gi} className="rounded-xl border border-[#F0E8F4] px-3 py-2.5">
                                        <div className="flex flex-wrap gap-2 items-center">
                                          <input placeholder="Full name (as on NID)" value={g.name || ""}
                                            onChange={(e) => updateGuest(room._id, gi, "name", e.target.value)}
                                            className="flex-1 min-w-[100px] border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-[#7A2267]/40 text-[#1a1a1a] placeholder:text-[#C4B3CE] transition-all" />
                                          <div className="relative w-[72px] shrink-0">
                                            <input type="number" placeholder="Age" min="0" max="120" value={g.age ?? ""}
                                              onChange={(e) => updateGuest(room._id, gi, "age", e.target.value === "" ? "" : Math.min(120, Math.max(0, Number(e.target.value))))}
                                              className={`w-full border rounded-xl px-2.5 py-2 text-[12.5px] outline-none text-center text-[#1a1a1a] placeholder:text-[#C4B3CE] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                                                ${warnMsg ? "border-amber-400" : "border-[#EDE5F0] focus:border-[#7A2267]/40"}`} />
                                            {isChild && g.age !== "" && (
                                              <span className="absolute -top-1.5 -right-1 text-[7.5px] font-bold bg-amber-400 text-white px-1 py-0.5 rounded-full leading-none pointer-events-none">C</span>
                                            )}
                                          </div>
                                          <div className="shrink-0 w-20">
                                            <CustomSelect value={g.gender || "male"}
                                              onChange={(v) => updateGuest(room._id, gi, "gender", v)}
                                              options={GENDER_OPTIONS} />
                                          </div>
                                          <button type="button" onClick={() => removeGuest(room._id, gi)}
                                            className="shrink-0 w-7 h-7 rounded-full bg-[#F0E8F4] flex items-center justify-center text-[#C4B3CE] hover:bg-red-100 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                                        </div>

                                        {/* Identification — adults only; children never need documents */}
                                        {isChild ? (
                                          <p className="mt-2 text-[10.5px] text-emerald-700">No NID or documents needed for children.</p>
                                        ) : (
                                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                                            <input placeholder={guestDocsMethod === DOCS_UPLOAD_NOW ? "NID / Passport number *" : "NID / Passport number (optional)"}
                                              value={g.nidNumber || ""}
                                              onChange={(e) => updateGuest(room._id, gi, "nidNumber", e.target.value)}
                                              className="flex-1 min-w-[140px] border border-[#EDE5F0] rounded-xl px-3 py-1.5 text-[11.5px] outline-none focus:border-[#7A2267]/40 text-[#1a1a1a] placeholder:text-[#C4B3CE] transition-all" />
                                            {g.nidUrl ? (
                                              <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5">
                                                Document added
                                                <button type="button" onClick={() => updateGuest(room._id, gi, "nidUrl", "")}
                                                  className="text-emerald-600 hover:text-red-500">×</button>
                                              </span>
                                            ) : (
                                              <label className="shrink-0 text-[10.5px] font-semibold text-[#7A2267] cursor-pointer underline underline-offset-2 hover:no-underline">
                                                Upload NID
                                                <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, (url) => updateGuest(room._id, gi, "nidUrl", url)); }} />
                                              </label>
                                            )}
                                          </div>
                                        )}

                                        {warnMsg && (
                                          <p className="text-[10.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">{warnMsg}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Add buttons */}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => addGuest(room._id, "adult")} disabled={atAdultLimit}
                                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-[#EDE5F0] text-[#7A2267] hover:border-[#7A2267]/40 hover:bg-[#FAF7FC] disabled:hover:bg-white disabled:hover:border-[#EDE5F0]">
                                  + Adult
                                </button>
                                {room.maxChildren > 0 && (
                                  <button type="button" onClick={() => addGuest(room._id, "child")} disabled={atChildLimit}
                                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-[#EDE5F0] text-amber-600 hover:border-amber-300 hover:bg-amber-50 disabled:hover:bg-white disabled:hover:border-[#EDE5F0]">
                                    + Child
                                  </button>
                                )}
                              </div>

                              {/* Marriage certificate rule — adult male + adult female in one room */}
                              {ev.isMixedGender && docOpts.requireCoupleDoc && (
                                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="text-amber-600 mt-0.5"><WarningIcon /></span>
                                    <div>
                                      <p className="text-[11.5px] font-semibold text-amber-800">Adult male &amp; female sharing this room</p>
                                      <p className="text-[11px] text-amber-700 mt-0.5">
                                        A marriage certificate is required — upload it now, or bring the original to check-in.
                                      </p>
                                    </div>
                                  </div>

                                  {/* The only exemption: your own child is staying with you */}
                                  {ev.hasChild ? (
                                    <label className="flex items-start gap-2.5 bg-white border border-amber-200 rounded-xl px-3 py-2.5 cursor-pointer mb-2">
                                      <input type="checkbox" checked={ev.ownChildDeclared}
                                        onChange={(e) => updateGuestInfo(room._id, { ownChildDeclared: e.target.checked })}
                                        className="mt-0.5 w-4 h-4 accent-[#7A2267] cursor-pointer shrink-0" />
                                      <span className="text-[11px] text-[#5C4A6E] leading-relaxed">
                                        We confirm the child staying in this room is <strong>our own child</strong>. We understand the child must be with us at check-in, and that no marriage certificate is then required.
                                      </span>
                                    </label>
                                  ) : (
                                    <p className="text-[10.5px] text-amber-700 bg-white border border-amber-200 rounded-xl px-3 py-2 mb-2">
                                      Travelling with your own child? Add them to this room and no marriage certificate will be required.
                                    </p>
                                  )}

                                  {ev.exemptByOwnChild ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                                      <svg viewBox="0 0 12 12" width="12" height="12" fill="none" className="shrink-0">
                                        <circle cx="6" cy="6" r="5.5" fill="#10b981"/>
                                        <path d="M3.5 6L5 7.5 8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <p className="text-[11px] text-emerald-700 flex-1">
                                        No marriage certificate needed. Please make sure your child is with you at check-in.
                                      </p>
                                    </div>
                                  ) : ev.marriageCertUploaded ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                      <svg viewBox="0 0 12 12" width="12" height="12" fill="none" className="shrink-0">
                                        <circle cx="6" cy="6" r="5.5" fill="#10b981"/>
                                        <path d="M3.5 6L5 7.5 8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span className="text-[11px] text-emerald-700 flex-1 font-medium">Marriage certificate uploaded</span>
                                      <button type="button" onClick={() => updateGuestInfo(room._id, { coupleDocumentUrl: "" })}
                                        className="text-[10px] text-emerald-600 hover:text-red-500 font-semibold">Remove</button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2.5">
                                      <p className="text-[11px] text-amber-700 flex-1">
                                        {guestDocsMethod === DOCS_UPLOAD_NOW
                                          ? "Upload the marriage certificate to continue."
                                          : "Please bring the original marriage certificate to check-in."}
                                      </p>
                                      <label className="shrink-0 text-[10px] font-semibold text-[#7A2267] cursor-pointer underline underline-offset-2 hover:no-underline">
                                        Upload
                                        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, (url) => updateGuestInfo(room._id, { coupleDocumentUrl: url, coupleDocMethod: "upload" })); }} />
                                      </label>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Consent — mandatory, wording follows the chosen handover method */}
                    <label className="mt-3 flex items-start gap-2.5 rounded-xl border-2 border-[#EDE5F0] px-4 py-3 cursor-pointer hover:border-[#7A2267]/30 transition-colors">
                      <input type="checkbox" checked={guestDocsConsent}
                        onChange={(e) => setGuestDocsConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#7A2267] cursor-pointer shrink-0" />
                      <span className="text-[11.5px] text-[#5C4A6E] leading-relaxed">
                        {guestDocsMethod === DOCS_UPLOAD_NOW
                          ? "I confirm the uploaded documents belong to the guests listed above, and that every adult will carry their original NID to check-in."
                          : "I understand every adult guest must bring their original NID to check-in"}
                        {guestDocsMethod !== DOCS_UPLOAD_NOW && docSummary.marriageCertRooms.length > 0 && (
                          <strong>, along with the marriage certificate for room{docSummary.marriageCertRooms.length > 1 ? "s" : ""} {docSummary.marriageCertRooms.join(", ")}</strong>
                        )}
                        {guestDocsMethod !== DOCS_UPLOAD_NOW && "."}{" "}
                        <span className="text-[#9B8BAB]">Guests who cannot produce these documents may be refused accommodation.</span>
                      </span>
                    </label>

                    {/* Live checklist of what is still missing */}
                    {docErrors.length > 0 && (
                      <div className="mt-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                        <p className="text-[11px] font-semibold text-amber-800 mb-1.5">Still needed before you can continue</p>
                        <ul className="space-y-1">
                          {docErrors.slice(0, 4).map((e, i) => (
                            <li key={i} className="text-[10.5px] text-amber-700 leading-relaxed">• {e}</li>
                          ))}
                          {docErrors.length > 4 && (
                            <li className="text-[10.5px] text-amber-600">…and {docErrors.length - 4} more.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Special requests */}
                <div>
                  <label className="block text-[9.5px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Special Requests <span className="normal-case font-normal text-[#C4B3CE]">(optional)</span></label>
                  <textarea rows={2} placeholder="Dietary requirements, accessibility needs, room preferences…" value={specialReqs}
                    onChange={(e) => setSpecialReqs(e.target.value)}
                    className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/40 resize-none transition-all" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5 mb-4">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" className="shrink-0 mt-0.5">
                  <circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="1.4"/>
                  <path d="M10 6v5M10 13.5v.5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Final acknowledgement — what must physically be carried to check-in */}
            {uploadWarn && uploadWarn.type === "docs" && (
              <div className="rounded-2xl overflow-hidden border border-amber-200 mb-4">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-200">
                  <span className="text-amber-600"><WarningIcon /></span>
                  <p className="text-[12px] font-bold text-amber-800">{DOC_COPY.heading}</p>
                </div>
                <div className="p-4 bg-[#FFFBF5]">
                  <p className="text-[11.5px] font-semibold text-amber-800 mb-2">{docNoticeHeadline(docSummary)}</p>
                  <ul className="space-y-1.5 mb-3">
                    {docNoticeLines(docSummary).map((l, i) => (
                      <li key={i} className="text-[11.5px] text-amber-700 leading-relaxed">• {l}</li>
                    ))}
                  </ul>
                  {docSummary.marriageCertRooms.length > 0 && (
                    <p className="text-[11px] text-amber-800 font-semibold mb-3">
                      Marriage certificate applies to room{docSummary.marriageCertRooms.length > 1 ? "s" : ""} {docSummary.marriageCertRooms.join(", ")}.
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button"
                      onClick={() => { setUploadWarn(null); setStep((s) => s + 1); }}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-[12px] font-semibold hover:bg-amber-700 transition-colors">
                      I understand — we will bring these
                    </button>
                    <button type="button"
                      onClick={() => { setGuestDocsMethod(DOCS_UPLOAD_NOW); setGuestDocsConsent(false); setUploadWarn(null); }}
                      className="flex-1 py-2.5 rounded-xl border-2 border-amber-200 text-amber-700 text-[12px] font-semibold hover:border-amber-400 transition-colors bg-white">
                      Go back and upload now
                    </button>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ── STEP 5: Payment ── */}
        {step === 5 && (
          <motion.div key="step5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>

            {/* Login gate */}
            {!session?.user && (
              <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4 p-6 sm:p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F0E8F4] flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#7A2267" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#7A2267" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className={`text-[18px] font-semibold text-[#1a1410] mb-2 ${lora.className}`}>Sign in to continue</h3>
                <p className="text-[12.5px] text-[#9B8BAB] mb-5">You need an account to complete your booking.</p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <Link href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/booking")}`}
                    className="w-full flex items-center justify-center gap-2.5 bg-white border-2 border-[#7A2267]/30 hover:border-[#7A2267]/70 py-3 rounded-xl transition-all font-semibold text-[13px] text-[#7A2267]">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Link>
                  <Link href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "/booking")}`}
                    className="w-full py-3 rounded-xl bg-[#7A2267] text-white font-semibold text-[13px] text-center hover:bg-[#8e2878] transition-colors">
                    Sign In with Email
                  </Link>
                </div>
              </div>
            )}

            {session?.user && (
              <>
                {/* Room hold countdown — the maximum time we keep these rooms
                    for you. Leaving this page hands them back immediately. */}
                {hold && cartRooms.length > 0 && (
                  <div className={`rounded-2xl border px-4 py-3 mb-4 flex items-center gap-3 transition-colors
                    ${holdRemaining <= LOCK_WARNING_MS
                      ? "bg-amber-50 border-amber-200"
                      : "bg-[#FAF7FC] border-[#E8D5F0]"}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="shrink-0"
                      stroke={holdRemaining <= LOCK_WARNING_MS ? "#D97706" : "#7A2267"} strokeWidth="1.6">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-semibold ${holdRemaining <= LOCK_WARNING_MS ? "text-amber-800" : "text-[#1a1410]"}`}>
                        Room{cartRooms.length > 1 ? "s" : ""} reserved for you —{" "}
                        <span className="font-mono tabular-nums">{formatCountdown(holdRemaining)}</span> left
                      </p>
                      <p className={`text-[10.5px] mt-0.5 ${holdRemaining <= LOCK_WARNING_MS ? "text-amber-700" : "text-[#9B8BAB]"}`}>
                        {holdRemaining <= LOCK_WARNING_MS
                          ? "Please complete your payment soon — the rooms are released when this runs out."
                          : "This is the maximum time we hold them. Leaving this page releases them right away."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Booking summary */}
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">

                  <div className="p-6">
                    <h2 className={`text-[18px] font-semibold text-[#1a1410] mb-4 ${lora.className}`}>Booking Summary</h2>

                    <div className="space-y-2 text-[13px] mb-4">
                      <div className="flex justify-between">
                        <span className="text-[#9B8BAB]">Stay Type</span>
                        <span className="font-medium text-[#1a1410] capitalize">{bookingMode.replace("_", " ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9B8BAB]">Date</span>
                        <span className="font-medium text-[#1a1410]">
                          {bookingMode === "day_long" ? fmtDate(checkIn) : `${fmtDate(checkIn)} → ${fmtDate(checkOut)}`}
                        </span>
                      </div>
                      {bookingMode === "night_stay" && (
                        <div className="flex justify-between">
                          <span className="text-[#9B8BAB]">Duration</span>
                          <span className="font-medium text-[#1a1410]">{nights} night{nights > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#9B8BAB]">Guests</span>
                        <span className="font-medium text-[#1a1410]">{adults} adult{adults > 1 ? "s" : ""}{children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#F0E8F4] pt-3 space-y-2 text-[13px]">
                      {cartRooms.map((r) => {
                        const price = bookingMode === "day_long" ? r.resolvedDayPrice : r.resolvedNightPrice * nights;
                        return (
                          <div key={r._id} className="flex justify-between">
                            <span className="text-[#9B8BAB]">Room {r.roomNumber}</span>
                            <span className="font-medium">৳{price.toLocaleString()}</span>
                          </div>
                        );
                      })}
                      {selectedEntry && (
                        <div className="flex justify-between">
                          <span className="text-[#9B8BAB]">{selectedEntry.name} <span className="text-[10px]">(Entry)</span></span>
                          <span className="font-medium">৳{selectedEntry.price.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedAddons.map((a) => (
                        <div key={a._id} className="flex justify-between">
                          <span className="text-[#9B8BAB]">{a.name} <span className="text-[10px]">(Add-on)</span></span>
                          <span className="font-medium">৳{a.price.toLocaleString()}</span>
                        </div>
                      ))}
                      {dayLongDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Package discount</span>
                          <span>−৳{dayLongDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {autoOfferDiscount > 0 && autoOffer && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Offer</span>
                            {autoOffer.name}
                          </span>
                          <span>−৳{autoOfferDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {couponDiscount > 0 && couponApplied && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span className="flex items-center gap-1.5">
                            Coupon
                            <code className="text-[9px] bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg font-mono">{couponApplied.code}</code>
                          </span>
                          <span>−৳{couponDiscount.toLocaleString()}</span>
                        </div>
                      )}
                      {taxPercent > 0 && (
                        <div className="flex justify-between text-[#9B8BAB]">
                          <span>Tax ({taxPercent}%)</span>
                          <span>৳{taxes.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-[14px] pt-2 border-t border-[#F0E8F4]">
                        <span className="text-[#1a1410]">Total</span>
                        <div className="text-right">
                          {(dayLongDiscount > 0 || autoOfferDiscount > 0 || couponDiscount > 0) && (
                            <p className="text-[10.5px] text-[#C4B3CE] line-through">৳{(subtotal + taxes).toLocaleString()}</p>
                          )}
                          <span className="text-[#7A2267]">৳{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-offer banner */}
                {autoOffer && autoOfferDiscount > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
                        <path d="M8 1L9.8 5.8H15L10.6 8.8L12.4 13.6L8 10.6L3.6 13.6L5.4 8.8L1 5.8H6.2L8 1Z" fill="#10b981"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-emerald-800">{autoOffer.name}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        {autoOffer.discountType === "percentage"
                          ? `${autoOffer.discountValue}% off`
                          : `৳${autoOffer.discountValue} off`
                        }
                        {autoOffer.maxDiscountAmount > 0 ? ` (up to ৳${autoOffer.maxDiscountAmount.toLocaleString()})` : ""}
                        {" · "}Saving <strong>৳{autoOfferDiscount.toLocaleString()}</strong>
                      </p>
                      <p className="text-[10px] text-emerald-500/70 mt-0.5">Applying a coupon code will replace this offer.</p>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide whitespace-nowrap">Applied</span>
                  </div>
                )}

                {/* Coupon code input */}
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9B8BAB] font-semibold mb-3">Have a coupon?</p>
                    {couponApplied ? (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                          <circle cx="7" cy="7" r="6" fill="#10b981"/>
                          <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="flex-1">
                          <p className="text-[12.5px] font-semibold text-emerald-700">{couponApplied.name}</p>
                          <p className="text-[11px] text-emerald-600">Saving ৳{couponDiscount.toLocaleString()}</p>
                        </div>
                        <button type="button" onClick={removeCoupon}
                          className="text-[10.5px] font-semibold text-emerald-600 hover:text-red-500 transition-colors">Remove</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            placeholder="Enter coupon code"
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                            className="flex-1 border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/40 transition-all uppercase tracking-wider font-mono" />
                          <button type="button" onClick={applyCoupon} disabled={!couponInput.trim() || couponLoading}
                            className="px-4 py-2.5 rounded-xl bg-[#7A2267] hover:bg-[#8e2878] text-white text-[12.5px] font-semibold transition-all disabled:opacity-50 whitespace-nowrap">
                            {couponLoading ? "…" : "Apply"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[11.5px] text-red-600 mt-2">{couponError}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* What must be carried to check-in — repeated verbatim in the
                    confirmation email and on the invoice */}
                {cartRooms.length > 0 && docNoticeLines(docSummary).length > 0 && (
                  <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
                    <div className="flex items-center gap-2.5 px-6 py-3.5 bg-amber-50 border-b border-amber-200">
                      <span className="text-amber-600"><WarningIcon /></span>
                      <div>
                        <p className="text-[12.5px] font-bold text-amber-800">{DOC_COPY.heading}</p>
                        <p className="text-[10.5px] text-amber-700 mt-0.5">{docNoticeHeadline(docSummary)}</p>
                      </div>
                    </div>
                    <div className="p-6 pt-4">
                      <ul className="space-y-1.5">
                        {docNoticeLines(docSummary).map((l, i) => (
                          <li key={i} className="text-[11.5px] text-[#5C4A6E] leading-relaxed">• {l}</li>
                        ))}
                      </ul>
                      {docSummary.marriageCertRooms.length > 0 && (
                        <p className="mt-2.5 text-[11px] font-semibold text-amber-800">
                          Marriage certificate applies to room{docSummary.marriageCertRooms.length > 1 ? "s" : ""} {docSummary.marriageCertRooms.join(", ")}.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment options */}
                <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.07)] overflow-hidden mb-4">
                  <div className="p-6">
                    <h3 className="text-[13px] font-semibold text-[#1a1410] mb-4">Payment Option</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      <button onClick={() => setPaymentType("full")}
                        className={`text-left rounded-xl border-2 p-4 transition-all
                          ${paymentType === "full" ? "border-[#7A2267] bg-[#FAF7FC]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                        <p className="text-[13px] font-semibold text-[#1a1410] mb-1">Full Payment</p>
                        <p className="text-[16px] font-bold text-[#7A2267]">৳{total.toLocaleString()}</p>
                        <p className="text-[10.5px] text-[#C4B3CE] mt-0.5">Pay the full amount now</p>
                      </button>
                      {settings?.advancePaymentPercent > 0 && settings.advancePaymentPercent < 100 && (
                        <button onClick={() => setPaymentType("partial")}
                          className={`text-left rounded-xl border-2 p-4 transition-all
                            ${paymentType === "partial" ? "border-[#7A2267] bg-[#FAF7FC]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                          <p className="text-[13px] font-semibold text-[#1a1410] mb-1">Partial Advance</p>
                          <p className="text-[16px] font-bold text-[#7A2267]">৳{partialAmt.toLocaleString()}</p>
                          <p className="text-[10.5px] text-[#C4B3CE] mt-0.5">{settings.advancePaymentPercent}% now · ৳{partialRem.toLocaleString()} at check-in</p>
                        </button>
                      )}
                    </div>

                    {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>}

                    {/* ── Terms & Conditions checkbox ── */}
                    <label className={`flex items-start gap-3 mb-4 p-3.5 rounded-xl border cursor-pointer
                      transition-all duration-200 select-none
                      ${termsAccepted
                        ? "bg-[#FAF7FC] border-[#7A2267]/30"
                        : "bg-[#FAFAFA] border-[#EDE5F0] hover:border-[#C4B3CE]"
                      }`}>
                      <div className="relative mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center
                          transition-all duration-150
                          ${termsAccepted
                            ? "bg-[#7A2267] border-[#7A2267]"
                            : "bg-white border-[#C4B3CE]"
                          }`}>
                          {termsAccepted && (
                            <svg viewBox="0 0 10 8" width="10" height="8" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`text-[12px] leading-[1.6] ${josefin.className}
                        ${termsAccepted ? "text-[#4a3a5a]" : "text-[#9B8BAB]"}`}>
                        I have read and agree to the{" "}
                        <Link href="/terms" target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#7A2267] underline underline-offset-2 hover:text-[#8e2878]
                            font-medium transition-colors duration-150">
                          Terms &amp; Conditions
                        </Link>
                        ,{" "}
                        <Link href="/privacy" target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#7A2267] underline underline-offset-2 hover:text-[#8e2878]
                            font-medium transition-colors duration-150">
                          Privacy Policy
                        </Link>
                        {" "}and{" "}
                        <Link href="/refund" target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#7A2267] underline underline-offset-2 hover:text-[#8e2878]
                            font-medium transition-colors duration-150">
                          Return &amp; Refund Policy
                        </Link>
                        {" "}of Dhali&apos;s Amber Nivaas.
                      </span>
                    </label>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleSubmit("sslcommerz")}
                        disabled={isPending || !termsAccepted}
                        className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                          py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                          disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing…
                          </>
                        ) : (
                          `Pay ৳${(paymentType === "partial" ? advanceAmt : total).toLocaleString()} Online`
                        )}
                      </button>
                    </div>

                    <p className="text-center text-[10.5px] text-[#C4B3CE] mt-4 flex items-center justify-center gap-1.5">
                      <ShieldIcon /> Secure payment via SSLCommerz · Rooms reserved for 60 seconds at checkout
                    </p>
                  </div>
                </div>
              </>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed floating room preview card (bottom-right on desktop, bottom sheet on mobile) ── */}
      <AnimatePresence>
        {previewRoom && (() => {
          const catFallbackImage = categories.find((c) => c._id === previewRoom.category)?.coverImage || "";
          const roomDisplayImage = previewRoom.coverImage || catFallbackImage;
          return (
          <motion.div
            key={previewRoom._id}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[340px]
              z-50 rounded-2xl overflow-hidden bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-[#EDE5F0]"
          >
            {/* Image section */}
            <div className="relative h-48 bg-gradient-to-br from-[#F0E8F4] to-[#E4D5F0]">
              {roomDisplayImage
                ? <img src={roomDisplayImage} alt={`Room ${previewRoom.roomNumber}`} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 24 18" width="36" height="28" fill="none">
                      <rect x="1" y="5" width="22" height="12" rx="1.5" stroke="#C4B3CE" strokeWidth="1.3"/>
                      <path d="M7 5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" stroke="#C4B3CE" strokeWidth="1.3"/>
                      <rect x="9" y="8" width="6" height="4" rx="0.5" stroke="#C4B3CE" strokeWidth="1.1"/>
                    </svg>
                  </div>
              }
              {roomDisplayImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
              {/* Close button */}
              <button onClick={() => setPreviewRoom(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm
                  flex items-center justify-center text-white hover:bg-black/55 transition-colors">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
              {/* Cart badge */}
              {cart.has(previewRoom._id) && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-[9.5px] font-semibold px-2.5 py-1 rounded-full">
                  <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                    <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Added to selection
                </div>
              )}
              {/* Room title on image */}
              {roomDisplayImage && (
                <div className="absolute bottom-0 inset-x-0 px-4 pb-3">
                  <p className={`text-white text-[18px] font-semibold ${lora.className}`}>Room {previewRoom.roomNumber}</p>
                  <p className="text-white/55 text-[11px] mt-0.5">
                    Floor {previewRoom.floor}{previewRoom.block ? ` · ${previewRoom.block}` : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-4">
              {!roomDisplayImage && (
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className={`text-[17px] font-semibold text-[#1a1410] ${lora.className}`}>Room {previewRoom.roomNumber}</p>
                    <p className="text-[11.5px] text-[#9B8BAB] mt-0.5">
                      Floor {previewRoom.floor}{previewRoom.block ? ` · ${previewRoom.block}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-[#7A2267]">
                      ৳{Number(bookingMode === "day_long" ? previewRoom.resolvedDayPrice : previewRoom.resolvedNightPrice).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#C4B3CE]">/{bookingMode === "day_long" ? "day" : "night"}</p>
                  </div>
                </div>
              )}

              {/* Price if image present */}
              {roomDisplayImage && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11.5px] text-[#9B8BAB]">Rate</span>
                  <div className="text-right">
                    <span className="text-[18px] font-bold text-[#7A2267]">
                      ৳{Number(bookingMode === "day_long" ? previewRoom.resolvedDayPrice : previewRoom.resolvedNightPrice).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#C4B3CE] ml-1">/{bookingMode === "day_long" ? "day" : "night"}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[10px] bg-[#FAF7FC] text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">
                  {previewRoom.categoryName}
                </span>
                {previewRoom.bedType && (
                  <span className="text-[10px] bg-[#FAF7FC] text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">
                    {previewRoom.bedType}
                  </span>
                )}
                <span className="text-[10px] bg-[#FAF7FC] text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">
                  Up to {previewRoom.maxAdults} adults
                </span>
                {previewRoom.maxChildren > 0 && (
                  <span className="text-[10px] bg-[#FAF7FC] text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">
                    {previewRoom.maxChildren} children
                  </span>
                )}
              </div>

              {/* Action button */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const wasSelected = cart.has(previewRoom._id);
                    toggleRoom(previewRoom);
                    if (!wasSelected) setPreviewRoom(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200
                    ${cart.has(previewRoom._id)
                      ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                      : "bg-[#7A2267] text-white shadow-[0_3px_14px_rgba(122,34,103,0.28)] hover:bg-[#8e2878]"}`}>
                  {cart.has(previewRoom._id) ? "Remove" : "Select Room"}
                </button>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
