"use client";

import {
  useState, useEffect, useCallback, useTransition, useRef, useMemo, useId
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Montserrat, Playfair_Display } from "next/font/google";
import { getProperties } from "@/actions/accommodation/propertyActions";
import { getCategoriesByProperty } from "@/actions/accommodation/categoryActions";
import { getAvailableRoomsForBooking } from "@/actions/accommodation/bookingActions";
import { createPendingBooking } from "@/actions/accommodation/bookingActions";
import { getActiveDayLongPackages } from "@/actions/accommodation/dayLongPackageActions";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair   = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

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
// True when a guest should be classified as a child.
// Age is authoritative when present; falls back to _intent when age is blank.
function guestIsChild(g, maxFCA) {
  if (g.age !== "" && g.age !== null && g.age !== undefined && !isNaN(Number(g.age))) {
    return Number(g.age) <= maxFCA;
  }
  return g._intent === "child";
}

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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-1.5 border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12.5px] text-[#1a1a1a] bg-white outline-none focus:border-[#7A2267]/40 transition-all hover:border-[#C4B3CE]">
        <span>{selected.label}</span>
        <svg viewBox="0 0 10 6" width="9" height="6" fill="none" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" stroke="#C4B3CE" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 left-0 mt-1 min-w-full bg-white border border-[#EDE5F0] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] overflow-hidden">
          {options.map((o) => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-[12.5px] transition-colors
                ${o.value === value ? "bg-[#F0E8F4] text-[#7A2267] font-semibold" : "text-[#1a1a1a] hover:bg-[#FAF7FC]"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
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
const STEPS_NIGHT = ["Stay Type", "Date & Guests", "Choose Rooms", "Guest Info", "Payment"];
const STEPS_DAY   = ["Stay Type", "Date & Guests", "Choose Rooms", "Guest Info", "Payment"];

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center w-full mb-8">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done   = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300
              ${done ? "bg-[#7A2267] text-white" : active ? "bg-[#7A2267] text-white shadow-[0_0_0_4px_rgba(122,34,103,0.15)]" : "bg-[#F0E8F4] text-[#C4B3CE]"}`}>
              {done ? (
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : n}
            </div>
            {n < total && (
              <div className={`flex-1 h-0.5 mx-1 transition-colors duration-300 ${done ? "bg-[#7A2267]" : "bg-[#EDE5F0]"}`} />
            )}
          </div>
        );
      })}
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
    <div className={`bg-white rounded-2xl border border-[#EDE5F0] p-4 ${montserrat.className}`}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setMonth((m) => {
          if (m.m === 0) return { y: m.y - 1, m: 11 };
          return { y: m.y, m: m.m - 1 };
        })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F0E8F4] transition-colors">
          <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
            <path d="M7 1L1 7l6 6" stroke="#9B8BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[12.5px] font-semibold text-[#1a1a1a]">{MONTHS[month.m]} {month.y}</span>
        <button onClick={() => setMonth((m) => {
          if (m.m === 11) return { y: m.y + 1, m: 0 };
          return { y: m.y, m: m.m + 1 };
        })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F0E8F4] transition-colors">
          <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
            <path d="M1 1l6 6-6 6" stroke="#9B8BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9.5px] text-[#C4B3CE] font-semibold uppercase py-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} onClick={() => handleClick(day)}
            className={`h-8 flex items-center justify-center text-[12px] transition-colors duration-150 ${cellClass(day)}`}>
            {day}
          </div>
        ))}
      </div>
      {mode === "night_stay" && (
        <p className="text-[10px] text-[#C4B3CE] text-center mt-2">Click to select check-in, then check-out date</p>
      )}
    </div>
  );
}

// ─── Guest Counter ─────────────────────────────────────────────────────────────
function Counter({ label, sub, value, min = 0, max = 10, onChange }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-xl bg-[#F0E8F4] flex items-center justify-center text-[#7A2267] text-xl font-light
            disabled:text-[#D4C8DC] disabled:bg-[#F7F4F0] hover:bg-[#E8DAF0] transition-colors">−</button>
        <div className="flex-1 text-center">
          <span className="text-[18px] font-bold text-[#1a1410]">{value}</span>
          {sub && <span className="text-[10px] text-[#C4B3CE] ml-1.5">{sub}</span>}
        </div>
        <button type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-xl bg-[#F0E8F4] flex items-center justify-center text-[#7A2267] text-xl font-light
            disabled:text-[#D4C8DC] disabled:bg-[#F7F4F0] hover:bg-[#E8DAF0] transition-colors">+</button>
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

  // Guest info per room: Map<roomId, { guests: [], groupType, coupleDocumentUrl, coupleDocMethod }>
  // groupType: null = not asked yet, "couple" = married/couple, "family" = relatives/family
  const [guestInfoMap, setGuestInfoMap] = useState(new Map());

  // Primary guest
  const [primaryGuest, setPrimaryGuest] = useState({
    name: "", email: "", phone: "", whatsapp: "", gender: "male", age: "",
  });
  const [nidUrl,    setNidUrl]    = useState("");
  const [nidMethod, setNidMethod] = useState("upload");
  const [specialReqs, setSpecialReqs] = useState("");

  // Payment
  const [paymentType, setPaymentType] = useState("full");  // "full" | "partial"

  // Upload-prompt warnings (room._id or "nid" or null)
  const [uploadWarn, setUploadWarn] = useState(null); // "nid" | roomId string
  // Child→adult reclassification warnings: key = `${roomId}-${guestIdx}`
  const [childReclassifyMsg, setChildReclassifyMsg] = useState({});

  // Error
  const [error, setError] = useState("");

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
  const subtotal    = totalPrice + dayLongSvcTotal;
  const taxes       = Math.round((subtotal * taxPercent) / 100);
  const total       = Math.max(0, subtotal + taxes - dayLongDiscount);
  const partialPct  = settings?.advancePaymentPercent ?? 30;
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
  // minRoomsNeeded: estimated minimum based on available rooms' capacities
  const minRoomsNeeded = useMemo(() => {
    if (!selectedCat) return null;
    const rep = rooms[0] || cartRooms[0];
    if (!rep) return null;
    const maxAdultsPerRoom = rep.maxAdults && rep.maxAdults > 0 ? rep.maxAdults : 1;
    return Math.max(1, Math.ceil(adults / maxAdultsPerRoom));
  }, [rooms, cartRooms, adults, selectedCat]);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getProperties().then((res) => {
      const props = res.properties || [];
      setProperties(props);
      // Auto-select if preselect or only one building property
      if (!preselect?.propertyId) {
        const buildings = props.filter((p) => p.type === "building");
        if (buildings.length === 1) setSelectedProp(buildings[0]._id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (bookingMode === "day_long") {
      getActiveDayLongPackages().then(setPackages).catch(() => {});
    }
  }, [bookingMode]);

  useEffect(() => {
    if (!selectedProp) return;
    getCategoriesByProperty(selectedProp).then((cats) => {
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
    return guestInfoMap.get(roomId) || { guests: [], groupType: null, coupleDocumentUrl: "", coupleDocMethod: "at_desk" };
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
      guests: [...info.guests, { name: "", age: "", gender: "male", _intent: type }],
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

  function fillFromPrimaryGuest(roomId) {
    if (!primaryGuest.name) return;
    const info = getGuestInfo(roomId);
    const alreadyIn = info.guests.some(
      (g) => g.name && g.name.toLowerCase().trim() === primaryGuest.name.toLowerCase().trim()
    );
    if (alreadyIn) return;
    const room   = cartRooms.find((r) => r._id === roomId);
    const maxFCA = settings?.maxFreeChildAge ?? 5;
    const curAdults = info.guests.filter((g) => !guestIsChild(g, maxFCA)).length;
    const primaryIsAdult = !primaryGuest.age || Number(primaryGuest.age) > maxFCA;
    if (primaryIsAdult && room?.maxAdults > 0 && curAdults >= room.maxAdults) return;
    updateGuestInfo(roomId, {
      guests: [...info.guests, { name: primaryGuest.name, age: primaryGuest.age || "", gender: primaryGuest.gender || "male" }],
    });
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
      }
      // For day long: entry is required; rooms are optional and skipped when roomSubStep === 0
      if (bookingMode === "day_long") {
        if (!selectedEntry) return "Please select an entry service to continue.";
        // If the user went into room sub-steps, a property must be selected before continuing
        if (roomSubStep > 0 && !selectedProp) return "Please select a property.";
      }
    }
    if (n === 4) {
      if (!primaryGuest.name.trim())  return "Please enter the primary guest's full name.";
      if (!primaryGuest.email.trim()) return "Please enter a valid email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryGuest.email)) return "That email address doesn't look right. Please double-check it.";
      if (!primaryGuest.phone.trim()) return "Please enter a phone number.";
      if (!primaryGuest.age || isNaN(Number(primaryGuest.age))) return "Please enter the primary guest's age.";

      // Every added guest must have name, age, and gender
      for (const room of cartRooms) {
        const info = getGuestInfo(room._id);
        for (let i = 0; i < info.guests.length; i++) {
          const g = info.guests[i];
          const label = `Room ${room.roomNumber} · Guest ${i + 1}`;
          if (!g.name?.trim())
            return `${label}: Please enter a name.`;
          if (g.age === "" || g.age === undefined || g.age === null || isNaN(Number(g.age)))
            return `${label} (${g.name}): Age is required — we need it to classify adults and children correctly.`;
          if (!g.gender)
            return `${label} (${g.name}): Please select a gender.`;
        }
      }

      // NID check — handled separately via uploadWarn prompt, not a hard block here
      // Marriage cert check — also via uploadWarn prompt
    }
    return null;
  }

  // Returns null if OK, or { type: "nid" | "cert", roomId? } if upload was skipped
  function checkUploadWarnings() {
    if (nidMethod === "upload" && !nidUrl) return { type: "nid" };
    const maxFCA = settings?.maxFreeChildAge ?? 5;
    for (const room of cartRooms) {
      const info = getGuestInfo(room._id);
      // Only count guests with a confirmed entered age — no age = don't assume adult
      const adultList = info.guests.filter((g) => g.age !== "" && g.age !== null && g.age !== undefined && !isNaN(Number(g.age)) && Number(g.age) > maxFCA);
      const hasOpposite = adultList.some((g) => g.gender === "male") && adultList.some((g) => g.gender === "female");
      if (hasOpposite && settings?.requireCoupleDoc && info.groupType === "couple" && info.coupleDocMethod === "upload" && !info.coupleDocumentUrl) {
        return { type: "cert", roomId: room._id, roomNumber: room.roomNumber };
      }
    }
    return null;
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
    setStep((s) => s + 1);
  }

  function goBack() {
    setError("");
    setUploadWarn(null);
    if (step === 3) {
      // Reset sub-step when leaving step 3
      setRoomSubStep(bookingMode === "day_long" ? 0 : 1);
    }
    setStep((s) => s - 1);
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
        coupleDocumentUrl: info.coupleDocumentUrl || "",
        coupleDocMethod:   info.coupleDocMethod   || "at_desk",
      };
    });

    const checkOutCalc = bookingMode === "day_long" && checkIn
      ? addDays(checkIn, 1)
      : checkOut;

    startTransition(async () => {
      try {
        // Lock rooms first (skip if no rooms in cart — allowed for day long)
        const sessionId = Math.random().toString(36).slice(2);
        if (cartRooms.length > 0) {
          const lockRes = await fetch("/api/booking/lock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rooms: cartRooms.map((r) => r._id),
              checkIn,
              checkOut: checkOutCalc,
              bookingMode,
              sessionId,
            }),
          });
          if (!lockRes.ok) {
            const ld = await lockRes.json();
            setError(ld.error || "Could not lock rooms. Please try again.");
            return;
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
          specialRequests: specialReqs,
          paymentMethod,
          advancePercent: advancePct,
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
            amount:      paymentMethod === "partial" ? result.advanceAmount : result.totalAmount,
            customerName:  primaryGuest.name,
            customerEmail: primaryGuest.email,
            customerPhone: primaryGuest.phone,
          }),
        });
        const payData = await payRes.json();
        if (payData.url) {
          window.location.href = payData.url;
        } else {
          setError("Payment initiation failed. Please try again.");
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={`${montserrat.className}`}>
      <StepIndicator step={step} total={5} />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Mode Selection ── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-6">
              <div className="h-[3px] bg-[#7A2267]" />
              <div className="p-6 sm:p-8">
                <h2 className={`text-[22px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>
                  How would you like to stay?
                </h2>
                <p className="text-[12.5px] text-[#9B8BAB] mb-7">Choose between a night stay or a day-long experience.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Night Stay */}
                  <button
                    onClick={() => setBookingMode("night_stay")}
                    className={`group relative rounded-2xl border-2 p-6 text-left transition-all duration-300
                      ${bookingMode === "night_stay"
                        ? "border-[#7A2267] bg-[#7A2267]/[0.03] shadow-[0_6px_28px_rgba(122,34,103,0.18)]"
                        : "border-[#EDE5F0] hover:border-[#C4B3CE] hover:shadow-md"}`}>
                    {bookingMode === "night_stay" && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200
                      ${bookingMode === "night_stay" ? "bg-[#7A2267] text-white" : "bg-[#F0E8F4] text-[#7A2267] group-hover:bg-[#E8DAF0]"}`}>
                      <MoonIcon />
                    </div>
                    <p className={`text-[17px] font-semibold text-[#1a1410] mb-1.5 ${playfair.className}`}>Night Stay</p>
                    <p className="text-[12px] text-[#9B8BAB] leading-relaxed">Stay overnight across one or more nights.</p>
                    {ciTime && coTime && (
                      <div className="mt-4 pt-3 border-t border-[#F0E8F4] grid grid-cols-2 gap-2 text-[10.5px]">
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
                    className={`group relative rounded-2xl border-2 p-6 text-left transition-all duration-300
                      ${bookingMode === "day_long"
                        ? "border-[#7A2267] bg-[#7A2267]/[0.03] shadow-[0_6px_28px_rgba(122,34,103,0.18)]"
                        : "border-[#EDE5F0] hover:border-[#C4B3CE] hover:shadow-md"}`}>
                    {bookingMode === "day_long" && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#7A2267] flex items-center justify-center shadow-sm">
                        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                          <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200
                      ${bookingMode === "day_long" ? "bg-[#7A2267] text-white" : "bg-[#F0E8F4] text-[#7A2267] group-hover:bg-[#E8DAF0]"}`}>
                      <SunIcon />
                    </div>
                    <p className={`text-[17px] font-semibold text-[#1a1410] mb-1.5 ${playfair.className}`}>Day Long</p>
                    <p className="text-[12px] text-[#9B8BAB] leading-relaxed">A full-day resort experience from morning to evening.</p>
                    {settings?.dayLongCheckInTime && settings?.dayLongCheckOutTime && (
                      <div className="mt-4 pt-3 border-t border-[#F0E8F4] grid grid-cols-2 gap-2 text-[10.5px]">
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
            <button onClick={goNext}
              className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]">
              Continue →
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: Dates + Guests ── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
              <div className="h-[3px] bg-[#7A2267]" />
              <div className="p-6 sm:p-8">
                <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>
                  {bookingMode === "day_long" ? "Select your date" : "Select your dates"}
                </h2>
                <p className="text-[12px] text-[#9B8BAB] mb-5">
                  {bookingMode === "day_long" ? "Pick the day of your visit." : "Choose your check-in and check-out dates."}
                </p>

                <Calendar mode={bookingMode} selected={dateRange} onSelect={setDateRange} />

                {/* Date summary */}
                {checkIn && (
                  <div className="mt-4 flex items-center gap-3 text-[12.5px] text-[#1a1410] bg-[#FAF7FC] rounded-xl px-4 py-3">
                    <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                      <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="#7A2267" strokeWidth="1.3" />
                      <path d="M1 6h12M5 1.5v2M9 1.5v2" stroke="#7A2267" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span>
                      {bookingMode === "day_long"
                        ? <>{fmtDate(checkIn)} · Day long</>
                        : <>{fmtDate(checkIn)} → {checkOut ? fmtDate(checkOut) : "?"}{nights > 0 ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}</>
                      }
                    </span>
                  </div>
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
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
              <div className="p-6">
                <h3 className="text-[13px] font-semibold text-[#1a1410] mb-4">How many guests?</h3>
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

            {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>}
            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">← Back</button>
              <button onClick={goNext}
                className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                  py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]">
                Continue →
              </button>
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
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                      <div className="h-[3px] bg-[#7A2267]" />
                      <div className="p-6 sm:p-8">
                        <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Choose your day package</h2>
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

                    {/* Package summary */}
                    {(selectedEntry || selectedAddons.length > 0) && (
                      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                        <div className="p-4 sm:p-5">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold mb-2.5">Selected Packages</p>
                          {selectedEntry && (
                            <div className="flex items-center justify-between text-[12.5px] py-1.5">
                              <span className="text-[#1a1410] font-medium">{selectedEntry.name} <span className="text-[#C4B3CE] text-[10px]">Entry</span></span>
                              <span className="text-[#7A2267] font-semibold">৳{Number(selectedEntry.price).toLocaleString()}</span>
                            </div>
                          )}
                          {selectedAddons.map((a) => (
                            <div key={a._id} className="flex items-center justify-between text-[12.5px] py-1">
                              <span className="text-[#1a1410]">{a.name} <span className="text-[#C4B3CE] text-[10px]">Add-on</span></span>
                              <span className="text-[#7A2267] font-semibold">৳{Number(a.price).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-[13px] font-bold mt-2 pt-2 border-t border-[#EDE5F0]">
                            <span className="text-[#1a1410]">Package Total</span>
                            <span className="text-[#7A2267]">৳{dayLongSvcTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>}
                    <div className="flex gap-3 mb-3">
                      <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">← Back</button>
                      <button onClick={goNext}
                        className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                          py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]">
                        Continue →
                      </button>
                    </div>
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
                  <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                    <div className="h-[3px] bg-[#7A2267]" />
                    <div className="p-6 sm:p-8">
                      <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Choose your property</h2>
                      <p className="text-[12px] text-[#9B8BAB] mb-5">Select the property that fits your stay.</p>

                      {properties.filter((p) => p.type === "building").length === 0 ? (
                        <p className="text-[13px] text-[#C4B3CE] text-center py-4">No properties available.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {properties.filter((p) => p.type === "building").map((p) => (
                            <button key={p._id}
                              onClick={() => { setSelectedProp(p._id); setSelectedCat(null); setRooms([]); setCart(new Map()); setPreviewRoom(null); }}
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
                                  <p className={`text-white text-[16px] font-semibold leading-tight ${playfair.className}`}>{p.name}</p>
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
                  <div className="flex gap-3">
                    <button
                      onClick={() => bookingMode === "day_long" ? setRoomSubStep(0) : goBack()}
                      className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">
                      ← Back
                    </button>
                    <button
                      onClick={() => { if (selectedProp) setRoomSubStep(2); }}
                      disabled={!selectedProp}
                      className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                        py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                        disabled:opacity-40 disabled:cursor-not-allowed">
                      Next →
                    </button>
                  </div>
                </>
              )}

              {/* ── Sub-step 2: Category Selection ── */}
              {roomSubStep === 2 && (
                <>
                  <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                    <div className="h-[3px] bg-[#7A2267]" />
                    <div className="p-6 sm:p-8">
                      <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Choose room category</h2>
                      <p className="text-[12px] text-[#9B8BAB] mb-5">Select the type of room you prefer.</p>

                      {categories.length === 0 ? (
                        <p className="text-[13px] text-[#C4B3CE]">No categories found for this property.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {categories.map((c) => (
                            <button key={c._id}
                              onClick={() => { setSelectedCat(c._id); setCart(new Map()); setPreviewRoom(null); }}
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
                  <div className="flex gap-3">
                    <button onClick={() => setRoomSubStep(1)}
                      className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">
                      ← Back
                    </button>
                    <button
                      onClick={() => { if (selectedCat) setRoomSubStep(3); }}
                      disabled={!selectedCat}
                      className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                        py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                        disabled:opacity-40 disabled:cursor-not-allowed">
                      Next →
                    </button>
                  </div>
                </>
              )}

              {/* ── Sub-step 3: Room Grid ── */}
              {roomSubStep === 3 && (
                <>
                  <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                    <div className="h-[3px] bg-[#7A2267]" />
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

                  {/* Cart summary */}
                  {cart.size > 0 && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                      <div className="p-4 sm:p-5">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold mb-2.5">Your Selection</p>
                        {cartRooms.map((r) => (
                          <div key={r._id} className="flex items-center justify-between text-[12.5px] py-1.5">
                            <span className="text-[#1a1410] font-medium">Room {r.roomNumber} · Floor {r.floor}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#7A2267] font-semibold">
                                ৳{(bookingMode === "day_long" ? r.resolvedDayPrice : r.resolvedNightPrice * nights).toLocaleString()}
                                <span className="text-[9px] text-[#C4B3CE] font-normal ml-0.5">/{bookingMode === "day_long" ? "day" : `${nights}n`}</span>
                              </span>
                              <button onClick={() => { toggleRoom(r); if (previewRoom?._id === r._id) setPreviewRoom(null); }}
                                className="w-5 h-5 rounded-full bg-[#F0E8F4] flex items-center justify-center text-[#C4B3CE] hover:bg-red-100 hover:text-red-500 transition-colors">
                                <svg viewBox="0 0 8 8" width="7" height="7" fill="none">
                                  <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                        {bookingMode === "day_long" && selectedEntry && (
                          <div className="flex items-center justify-between text-[12.5px] py-1.5 border-t border-[#F0E8F4] mt-1">
                            <span className="text-[#1a1410]">{selectedEntry.name} <span className="text-[#C4B3CE] text-[10px]">Entry</span></span>
                            <span className="text-[#7A2267] font-semibold">৳{Number(selectedEntry.price).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedAddons.map((a) => (
                          <div key={a._id} className="flex items-center justify-between text-[12.5px] py-1">
                            <span className="text-[#1a1410]">{a.name} <span className="text-[#C4B3CE] text-[10px]">Add-on</span></span>
                            <span className="text-[#7A2267] font-semibold">৳{Number(a.price).toLocaleString()}</span>
                          </div>
                        ))}
                        {dayLongDiscount > 0 && (
                          <div className="flex items-center justify-between text-[12px] py-1 text-emerald-600">
                            <span>Discount</span>
                            <span className="font-semibold">−৳{dayLongDiscount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[14px] font-bold mt-2 pt-2.5 border-t border-[#EDE5F0]">
                          <span className="text-[#1a1410]">Total</span>
                          <span className="text-[#7A2267]">৳{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setRoomSubStep(2)}
                      className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">
                      ← Back
                    </button>
                    <button onClick={goNext}
                      disabled={bookingMode === "night_stay" && cart.size === 0}
                      className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                        py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                        disabled:opacity-50 disabled:cursor-not-allowed">
                      Continue →
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          );
        })()}

        {/* ── STEP 4: Guest Info ── */}
        {step === 4 && (
          <motion.div key="step4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
              <div className="h-[3px] bg-[#7A2267]" />
              <div className="p-6 sm:p-8">
                <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Guest information</h2>
                <p className="text-[12px] text-[#9B8BAB] mb-6">Provide details for the primary guest and assign guests to each room.</p>

                {/* Primary Guest */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-3">Primary Guest (Booking Person)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Full Name *", key: "name", placeholder: "Full name" },
                      { label: "Email *",     key: "email", placeholder: "name@example.com", type: "email" },
                      { label: "Phone *",     key: "phone", placeholder: "+880 1X..." },
                      { label: "WhatsApp",    key: "whatsapp", placeholder: "+880 1X..." },
                      { label: "Age *",       key: "age", placeholder: "Age", type: "number" },
                    ].map(({ label, key, placeholder, type = "text" }) => (
                      <div key={key}>
                        <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">{label}</label>
                        <input type={type} placeholder={placeholder} value={primaryGuest[key]}
                          onChange={(e) => setPrimaryGuest((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#C4B3CE] outline-none focus:border-[#7A2267]/40 transition-all" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1">Gender *</label>
                      <CustomSelect
                        value={primaryGuest.gender}
                        onChange={(v) => setPrimaryGuest((p) => ({ ...p, gender: v }))}
                        options={GENDER_OPTIONS} />
                    </div>

                    {/* NID / Passport */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-2">NID / Passport *</label>
                      <div className="grid grid-cols-2 gap-2 mb-2.5">
                        {[
                          { v: "upload",  label: "Upload from Device" },
                          { v: "at_desk", label: "Provide at Desk" },
                        ].map(({ v, label }) => (
                          <button key={v} type="button" onClick={() => setNidMethod(v)}
                            className={`py-2.5 rounded-xl border-2 text-[11.5px] font-semibold transition-all
                              ${nidMethod === v
                                ? "bg-[#7A2267] border-[#7A2267] text-white shadow-sm"
                                : "bg-white border-[#EDE5F0] text-[#9B8BAB] hover:border-[#C4B3CE]"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {nidMethod === "upload" && (
                        nidUrl ? (
                          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                            <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
                              <circle cx="6" cy="6" r="5.5" fill="#10b981"/>
                              <path d="M3.5 6L5 7.5 8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-[12px] text-emerald-700 font-medium flex-1">Document uploaded successfully</span>
                            <button type="button" onClick={() => setNidUrl("")}
                              className="text-[10.5px] text-emerald-600 hover:text-red-500 font-semibold transition-colors">Remove</button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-3 border-2 border-dashed border-[#EDE5F0] rounded-xl px-4 py-3.5 cursor-pointer hover:border-[#7A2267]/40 hover:bg-[#FAF7FC] transition-all group">
                            <div className="w-9 h-9 rounded-xl bg-[#F0E8F4] flex items-center justify-center shrink-0 group-hover:bg-[#E4D5F0] transition-colors">
                              <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                                <path d="M10 3v9M6.5 6.5L10 3l3.5 3.5" stroke="#7A2267" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" stroke="#7A2267" strokeWidth="1.4" strokeLinecap="round"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-[12.5px] font-semibold text-[#7A2267]">Click to upload NID / Passport</p>
                              <p className="text-[10.5px] text-[#C4B3CE] mt-0.5">JPG, PNG, PDF · max 1 MB</p>
                            </div>
                            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f, setNidUrl); }} />
                          </label>
                        )
                      )}
                      {nidMethod === "at_desk" && (
                        <p className="text-[11.5px] text-[#9B8BAB] bg-[#FAF7FC] border border-[#EDE5F0] rounded-xl px-3.5 py-2.5">
                          Please bring your original NID or Passport when you check in.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-room guest assignment */}
                {cartRooms.map((room) => {
                  const info    = getGuestInfo(room._id);
                  const maxFCA  = settings?.maxFreeChildAge ?? 5;
                  const curAdults   = info.guests.filter((g) => !guestIsChild(g, maxFCA)).length;
                  const curChildren = info.guests.filter((g) =>  guestIsChild(g, maxFCA)).length;
                  const atAdultLimit   = room.maxAdults   > 0  && curAdults   >= room.maxAdults;
                  const atChildLimit   = room.maxChildren >= 0  && curChildren >= room.maxChildren;
                  const hasOpposite = (() => {
                    const adultList = info.guests.filter((g) => g.age !== "" && g.age !== null && g.age !== undefined && !isNaN(Number(g.age)) && Number(g.age) > maxFCA);
                    return adultList.some((g) => g.gender === "male") && adultList.some((g) => g.gender === "female");
                  })();
                  const primaryUsedInAnyRoom = cartRooms.some((r) =>
                    getGuestInfo(r._id).guests.some(
                      (g) => g.name && g.name.toLowerCase().trim() === primaryGuest.name.toLowerCase().trim()
                    )
                  );
                  const canFill = primaryGuest.name && !primaryUsedInAnyRoom && !atAdultLimit;

                  return (
                    <div key={room._id} className="mb-5">
                      {/* Room header */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold">
                            Room {room.roomNumber} · Floor {room.floor}
                            {room.variantName && <span className="ml-1.5 text-[#C4B3CE] normal-case tracking-normal">({room.variantName})</span>}
                          </p>
                          <p className="text-[10px] text-[#C4B3CE] mt-0.5">
                            Up to {room.maxAdults} adult{room.maxAdults !== 1 ? "s" : ""}
                            {room.maxChildren > 0 ? ` · ${room.maxChildren} child${room.maxChildren !== 1 ? "ren" : ""}` : " · no children"}
                          </p>
                        </div>
                        {canFill && (
                          <button type="button" onClick={() => fillFromPrimaryGuest(room._id)}
                            className="shrink-0 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#7A2267] bg-[#F0E8F4] hover:bg-[#E4D5F0] px-2.5 py-1.5 rounded-lg transition-colors">
                            <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                              <circle cx="6" cy="4" r="2.5" stroke="#7A2267" strokeWidth="1.2"/>
                              <path d="M1.5 10.5c0-2.5 2-4 4.5-4" stroke="#7A2267" strokeWidth="1.2" strokeLinecap="round"/>
                              <path d="M9 8v3M7.5 9.5h3" stroke="#7A2267" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            Use my info
                          </button>
                        )}
                      </div>

                      {info.guests.length === 0 ? (
                        <div className="bg-[#FAF7FC] rounded-xl p-4 text-center text-[12px] text-[#C4B3CE] mb-2.5">
                          No guests assigned yet. Add adults or children below.
                        </div>
                      ) : (
                        <div className="space-y-2.5 mb-2.5">
                          {info.guests.map((g, gi) => {
                            const isChild  = guestIsChild(g, maxFCA);
                            const warnMsg  = childReclassifyMsg[`${room._id}-${gi}`];
                            return (
                              <div key={gi}>
                                <div className="grid grid-cols-[1fr_80px_auto_auto] gap-2 items-end">
                                  <div>
                                    {gi === 0 && <label className="block text-[9px] uppercase tracking-wider text-[#C4B3CE] font-semibold mb-1">Name</label>}
                                    <input placeholder="Name" value={g.name || ""}
                                      onChange={(e) => updateGuest(room._id, gi, "name", e.target.value)}
                                      className="w-full border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-[#7A2267]/40 text-[#1a1a1a] placeholder:text-[#C4B3CE] transition-all" />
                                  </div>
                                  <div>
                                    {gi === 0 && <label className="block text-[9px] uppercase tracking-wider text-[#C4B3CE] font-semibold mb-1">Age *</label>}
                                    <div className={`relative flex items-center border rounded-xl overflow-hidden transition-all bg-white
                                      ${warnMsg ? "border-amber-400 focus-within:border-amber-500" : "border-[#EDE5F0] focus-within:border-[#7A2267]/40"}`}>
                                      <button type="button"
                                        onClick={() => updateGuest(room._id, gi, "age", Math.max(0, (Number(g.age) || 1) - 1))}
                                        className="px-2 py-2 text-[#9B8BAB] hover:text-[#7A2267] hover:bg-[#FAF7FC] transition-colors text-base leading-none font-bold select-none">−</button>
                                      <input type="number" placeholder="—" min="0" max="120" value={g.age ?? ""}
                                        onChange={(e) => updateGuest(room._id, gi, "age", e.target.value === "" ? "" : Math.min(120, Math.max(0, Number(e.target.value))))}
                                        className="w-full text-center text-[12.5px] outline-none text-[#1a1a1a] placeholder:text-[#C4B3CE] bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                      <button type="button"
                                        onClick={() => updateGuest(room._id, gi, "age", Math.min(120, (Number(g.age) || 0) + 1))}
                                        className="px-2 py-2 text-[#9B8BAB] hover:text-[#7A2267] hover:bg-[#FAF7FC] transition-colors text-base leading-none font-bold select-none">+</button>
                                      {isChild && (
                                        <span className="absolute -top-1.5 -right-1 text-[8px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
                                          {g.age === "" || g.age === null ? "Child*" : "Child"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    {gi === 0 && <label className="block text-[9px] uppercase tracking-wider text-[#C4B3CE] font-semibold mb-1">Gender</label>}
                                    <CustomSelect
                                      value={g.gender || "male"}
                                      onChange={(v) => updateGuest(room._id, gi, "gender", v)}
                                      options={GENDER_SHORT_OPTIONS} />
                                  </div>
                                  <button type="button" onClick={() => removeGuest(room._id, gi)}
                                    className="text-[#C4B3CE] hover:text-red-400 transition-colors pb-1 text-lg leading-none">×</button>
                                </div>
                                {/* Reclassification warning */}
                                {warnMsg && (
                                  <div className="mt-1.5 flex items-start gap-1.5 px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                                    <svg viewBox="0 0 12 12" width="13" height="13" fill="none" className="shrink-0 mt-0.5">
                                      <path d="M5.13 1.87L1.05 9a1 1 0 0 0 .87 1.5h8.16A1 1 0 0 0 10.95 9L6.87 1.87a1 1 0 0 0-1.74 0z" stroke="#d97706" strokeWidth="1.1"/>
                                      <path d="M6 4.5v2.5M6 8.5v.25" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                    <span>{warnMsg}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add adult / child buttons */}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addGuest(room._id, "adult")}
                          disabled={atAdultLimit}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border-2 transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed
                            border-[#EDE5F0] text-[#7A2267] hover:border-[#7A2267]/40 hover:bg-[#FAF7FC] disabled:hover:bg-white disabled:hover:border-[#EDE5F0]">
                          + Adult
                          <span className="text-[9.5px] text-[#C4B3CE] font-normal">{curAdults}/{room.maxAdults}</span>
                        </button>
                        {room.maxChildren > 0 && (
                          <button type="button" onClick={() => addGuest(room._id, "child")}
                            disabled={atChildLimit}
                            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border-2 transition-all
                              disabled:opacity-40 disabled:cursor-not-allowed
                              border-[#EDE5F0] text-amber-600 hover:border-amber-300 hover:bg-amber-50 disabled:hover:bg-white disabled:hover:border-[#EDE5F0]">
                            + Child
                            <span className="text-[9.5px] text-amber-400 font-normal">{curChildren}/{room.maxChildren}</span>
                          </button>
                        )}
                      </div>

                      {/* Group type selector — appears when opposite-gender adults detected */}
                      {hasOpposite && settings?.requireCoupleDoc && (
                        <div className="mt-4 rounded-2xl overflow-hidden border border-[#E8D5B7]">
                          <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-[#E8D5B7]">
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                              <WarningIcon />
                            </div>
                            <p className="text-[12px] font-bold text-amber-800">This room has male and female guests</p>
                          </div>
                          <div className="p-4 bg-[#FFFBF5]">
                            <p className="text-[11.5px] text-amber-700 mb-3">
                              Please let us know the relationship so we know if a marriage certificate is needed.
                            </p>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {[
                                { v: "couple", label: "💑 Couple / Married" },
                                { v: "family", label: "👨‍👩‍👧 Family / Relatives" },
                              ].map(({ v, label }) => (
                                <button key={v} type="button"
                                  onClick={() => updateGuestInfo(room._id, { groupType: v, coupleDocumentUrl: "", coupleDocMethod: "at_desk" })}
                                  className={`py-2.5 rounded-xl border-2 text-[11.5px] font-semibold transition-all text-center
                                    ${info.groupType === v
                                      ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                                      : "bg-white border-amber-200 text-amber-700 hover:border-amber-400"}`}>
                                  {label}
                                </button>
                              ))}
                            </div>

                            {/* Family — no cert needed */}
                            {info.groupType === "family" && (
                              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                                <svg viewBox="0 0 12 12" width="13" height="13" fill="none">
                                  <circle cx="6" cy="6" r="5.5" fill="#10b981"/>
                                  <path d="M3.5 6L5 7.5 8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <p className="text-[11.5px] text-emerald-700">No certificate needed for family / relatives.</p>
                              </div>
                            )}

                            {/* Couple — marriage cert required */}
                            {info.groupType === "couple" && (
                              <>
                                <p className="text-[11.5px] text-amber-700 mb-2.5">
                                  Please provide your marriage certificate.
                                </p>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {[
                                    { v: "at_desk", label: "Show at Desk" },
                                    { v: "upload",  label: "Upload from Device" },
                                  ].map(({ v, label }) => (
                                    <button key={v} type="button"
                                      onClick={() => updateGuestInfo(room._id, { coupleDocMethod: v })}
                                      className={`py-2 rounded-xl border-2 text-[11px] font-semibold transition-all
                                        ${info.coupleDocMethod === v
                                          ? "bg-[#7A2267] border-[#7A2267] text-white shadow-sm"
                                          : "bg-white border-[#EDE5F0] text-[#9B8BAB] hover:border-[#C4B3CE]"}`}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                                {info.coupleDocMethod === "upload" && (
                                  info.coupleDocumentUrl ? (
                                    <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                                      <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
                                        <circle cx="6" cy="6" r="5.5" fill="#10b981"/>
                                        <path d="M3.5 6L5 7.5 8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span className="text-[12px] text-emerald-700 font-medium flex-1">Certificate uploaded successfully</span>
                                      <button type="button" onClick={() => updateGuestInfo(room._id, { coupleDocumentUrl: "" })}
                                        className="text-[10.5px] text-emerald-600 hover:text-red-500 font-semibold transition-colors">Remove</button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-3 border-2 border-dashed border-amber-200 rounded-xl px-4 py-3.5 cursor-pointer hover:border-amber-400 hover:bg-amber-50/60 transition-all group">
                                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                                        <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                                          <path d="M10 3v9M6.5 6.5L10 3l3.5 3.5" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                          <path d="M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round"/>
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-[12.5px] font-semibold text-amber-700">Click to upload marriage certificate</p>
                                        <p className="text-[10.5px] text-amber-400 mt-0.5">JPG, PNG, PDF · max 1 MB</p>
                                      </div>
                                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadDoc(f, (url) => updateGuestInfo(room._id, { coupleDocumentUrl: url }));
                                        }} />
                                    </label>
                                  )
                                )}
                                {info.coupleDocMethod === "at_desk" && (
                                  <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                                    Please bring the original marriage certificate when checking in.
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Special requests */}
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold mb-1.5">Special Requests</label>
                  <textarea rows={2} placeholder="Any special requests or notes…" value={specialReqs}
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

            {/* Upload-missed warning panel */}
            {uploadWarn && (
              <div className="rounded-2xl overflow-hidden border border-amber-200 mb-4">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border-b border-amber-200">
                  <WarningIcon />
                  <p className="text-[12px] font-bold text-amber-800">
                    {uploadWarn.type === "nid"
                      ? "You haven't uploaded your NID / Passport"
                      : `Room ${uploadWarn.roomNumber}: Marriage certificate not uploaded`}
                  </p>
                </div>
                <div className="p-4 bg-[#FFFBF5]">
                  <p className="text-[12px] text-amber-700 mb-3">
                    {uploadWarn.type === "nid"
                      ? "You chose to upload your NID or Passport but haven't added the file yet. Would you like to provide it at check-in instead, or go back and upload it now?"
                      : "You chose to upload the marriage certificate but haven't added the file yet. Would you like to bring it at check-in instead, or go back and upload it now?"}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="button"
                      onClick={() => {
                        if (uploadWarn.type === "nid") {
                          setNidMethod("at_desk");
                        } else {
                          updateGuestInfo(uploadWarn.roomId, { coupleDocMethod: "at_desk" });
                        }
                        setUploadWarn(null);
                        // Re-check for more warnings, then advance
                        const next = checkUploadWarnings();
                        if (!next) setStep((s) => s + 1);
                        else setUploadWarn(next);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-[12px] font-semibold hover:bg-amber-700 transition-colors">
                      {uploadWarn.type === "nid" ? "I'll show my NID at desk" : "I'll bring certificate at desk"}
                    </button>
                    <button type="button"
                      onClick={() => setUploadWarn(null)}
                      className="flex-1 py-2.5 rounded-xl border-2 border-amber-200 text-amber-700 text-[12px] font-semibold hover:border-amber-400 transition-colors bg-white">
                      Go back and upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">← Back</button>
              <button onClick={goNext}
                className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                  py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]">
                Review & Pay →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: Payment ── */}
        {step === 5 && (
          <motion.div key="step5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>

            {/* Login gate */}
            {!session?.user && (
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4 p-6 sm:p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#F0E8F4] flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="#7A2267" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="#7A2267" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className={`text-[18px] font-semibold text-[#1a1410] mb-2 ${playfair.className}`}>Sign in to continue</h3>
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
                {/* Booking summary */}
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                  <div className="h-[3px] bg-[#7A2267]" />
                  <div className="p-6">
                    <h2 className={`text-[18px] font-semibold text-[#1a1410] mb-4 ${playfair.className}`}>Booking Summary</h2>

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
                        <div className="flex justify-between text-emerald-600">
                          <span>Discount</span>
                          <span>−৳{dayLongDiscount.toLocaleString()}</span>
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
                        <span className="text-[#7A2267]">৳{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment options */}
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
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

                    <div className="space-y-3">
                      <button
                        onClick={() => handleSubmit("sslcommerz")}
                        disabled={isPending}
                        className="w-full bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                          py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                          disabled:opacity-60 flex items-center justify-center gap-2">
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

            <button onClick={goBack} className="w-full py-3 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">← Back</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed floating room preview card (bottom-right on desktop, bottom sheet on mobile) ── */}
      <AnimatePresence>
        {previewRoom && (
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
              {previewRoom.coverImage
                ? <img src={previewRoom.coverImage} alt={`Room ${previewRoom.roomNumber}`} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 24 18" width="36" height="28" fill="none">
                      <rect x="1" y="5" width="22" height="12" rx="1.5" stroke="#C4B3CE" strokeWidth="1.3"/>
                      <path d="M7 5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" stroke="#C4B3CE" strokeWidth="1.3"/>
                      <rect x="9" y="8" width="6" height="4" rx="0.5" stroke="#C4B3CE" strokeWidth="1.1"/>
                    </svg>
                  </div>
              }
              {previewRoom.coverImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
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
              {previewRoom.coverImage && (
                <div className="absolute bottom-0 inset-x-0 px-4 pb-3">
                  <p className={`text-white text-[18px] font-semibold ${playfair.className}`}>Room {previewRoom.roomNumber}</p>
                  <p className="text-white/55 text-[11px] mt-0.5">
                    Floor {previewRoom.floor}{previewRoom.block ? ` · ${previewRoom.block}` : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-4">
              {!previewRoom.coverImage && (
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className={`text-[17px] font-semibold text-[#1a1410] ${playfair.className}`}>Room {previewRoom.roomNumber}</p>
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
              {previewRoom.coverImage && (
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

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleRoom(previewRoom)}
                  className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200
                    ${cart.has(previewRoom._id)
                      ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                      : "bg-[#7A2267] text-white shadow-[0_3px_14px_rgba(122,34,103,0.28)] hover:bg-[#8e2878]"}`}>
                  {cart.has(previewRoom._id) ? "Remove" : "Select Room"}
                </button>
                <a href={`/rooms/${previewRoom._id}`} target="_blank" rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl text-[12.5px] font-semibold border-2 border-[#EDE5F0]
                    text-[#9B8BAB] hover:border-[#C4B3CE] hover:text-[#7A2267] transition-all duration-150 whitespace-nowrap">
                  Full Profile
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
