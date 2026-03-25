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

const EASE = [0.16, 1, 0.3, 1];

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

  // Steps: 1=mode, 2=dates+guests, 3=rooms, 4=guest-info, 5=payment
  const [step, setStep] = useState(1);
  const [bookingMode, setBookingMode] = useState("night_stay");  // "night_stay" | "day_long"

  // Dates
  const [dateRange, setDateRange] = useState([
    preselect?.checkIn || null,
    preselect?.checkOut || null,
  ]);
  const checkIn  = dateRange[0];
  const checkOut = dateRange[1];
  const nights   = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;

  // Guest counts
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);

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
  const [packages,     setPackages]     = useState([]);
  const [selectedPkg,  setSelectedPkg]  = useState(null);

  // Guest info per room: Map<roomId, { guests: [], coupleDocumentUrl, coupleDocMethod }>
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

  const advancePct = paymentType === "full" ? 100 : (settings?.advancePaymentPercent ?? 30);
  const taxPercent = settings?.taxPercent ?? 0;
  const subtotal   = totalPrice + (selectedPkg ? selectedPkg.price : 0);
  const taxes      = Math.round((subtotal * taxPercent) / 100);
  const total      = subtotal + taxes;
  const advanceAmt = Math.round((total * advancePct) / 100);
  const remaining  = total - advanceAmt;

  // ── Minimum room requirement ─────────────────────────────────────────────────
  const totalPeople = adults + children;
  // minRoomsNeeded is null until category rooms are loaded (prevents showing wrong "1 room" on load)
  const minRoomsNeeded = useMemo(() => {
    // Need loaded rooms to know real capacity from DB category settings
    const rep = rooms[0] || cartRooms[0];
    if (!rep || !selectedCat) return null;
    // maxAdults is the real per-room adult capacity set in admin → category
    const maxAdultsPerRoom = rep.maxAdults && rep.maxAdults > 0 ? rep.maxAdults : 1;
    // Rooms required is driven by adult count (children share adult rooms up to maxChildren)
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
    return guestInfoMap.get(roomId) || { guests: [], coupleDocumentUrl: "", coupleDocMethod: "at_desk" };
  }

  function updateGuestInfo(roomId, update) {
    setGuestInfoMap((prev) => {
      const next = new Map(prev);
      next.set(roomId, { ...getGuestInfo(roomId), ...update });
      return next;
    });
  }

  function updateGuest(roomId, idx, field, value) {
    const info = getGuestInfo(roomId);
    const guests = [...info.guests];
    guests[idx] = { ...guests[idx], [field]: value };
    updateGuestInfo(roomId, { guests });
  }

  function addGuest(roomId) {
    const info = getGuestInfo(roomId);
    updateGuestInfo(roomId, {
      guests: [...info.guests, { name: "", age: "", gender: "male", type: "adult" }],
    });
  }

  function removeGuest(roomId, idx) {
    const info = getGuestInfo(roomId);
    updateGuestInfo(roomId, {
      guests: info.guests.filter((_, i) => i !== idx),
    });
  }

  // ── Step validations ─────────────────────────────────────────────────────────
  function validateStep(n) {
    if (n === 2) {
      if (!checkIn || !checkOut) return "Please select your dates.";
      if (bookingMode === "night_stay" && nights < 1) return "Check-out must be after check-in.";
    }
    if (n === 3) {
      if (!selectedProp) return "Please select a property.";
      // For night stay: room selection is mandatory and must meet minimum rooms for adults
      if (bookingMode === "night_stay") {
        if (cart.size === 0) return "Please add at least one room to your cart.";
        if (minRoomsNeeded !== null && cart.size < minRoomsNeeded) {
          return `You need at least ${minRoomsNeeded} room(s) for ${adults} adult${adults !== 1 ? "s" : ""}. Each room fits up to ${rooms[0]?.maxAdults ?? 1} adults.`;
        }
      }
      // For day long: rooms are optional — guests can come without booking a room
    }
    if (n === 4) {
      if (!primaryGuest.name.trim()) return "Primary guest name is required.";
      if (!primaryGuest.email.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryGuest.email)) return "Invalid email address.";
      if (!primaryGuest.phone.trim()) return "Phone number is required.";
      if (!primaryGuest.age || isNaN(Number(primaryGuest.age))) return "Primary guest age is required.";
    }
    return null;
  }

  function goNext() {
    setError("");
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
  }

  function goBack() {
    setError("");
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
        guests:   info.guests,
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
          dayLongPackageId: selectedPkg?._id || null,
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

        if (paymentMethod === "pay_at_desk") {
          router.push(`/booking/success?bookingId=${result.bookingId}&method=desk`);
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
                    className={`relative rounded-2xl border-2 p-6 text-left transition-all duration-200
                      ${bookingMode === "night_stay" ? "border-[#7A2267] shadow-[0_4px_20px_rgba(122,34,103,0.15)]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                    {bookingMode === "night_stay" && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7A2267] flex items-center justify-center">
                        <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                          <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className="text-3xl mb-3">🌙</div>
                    <p className={`text-[16px] font-semibold text-[#1a1410] mb-1.5 ${playfair.className}`}>Night Stay</p>
                    <p className="text-[12px] text-[#9B8BAB] leading-relaxed">Stay overnight across multiple nights.</p>
                    {ciTime && coTime && (
                      <div className="mt-3 pt-3 border-t border-[#F0E8F4] flex gap-4 text-[10.5px] text-[#C4B3CE]">
                        <span>Check-in: <strong className="text-[#9B8BAB]">{fmt12(ciTime)}</strong></span>
                        <span>Check-out: <strong className="text-[#9B8BAB]">{fmt12(coTime)}</strong></span>
                      </div>
                    )}
                  </button>

                  {/* Day Long */}
                  <button
                    onClick={() => setBookingMode("day_long")}
                    className={`relative rounded-2xl border-2 p-6 text-left transition-all duration-200
                      ${bookingMode === "day_long" ? "border-[#7A2267] shadow-[0_4px_20px_rgba(122,34,103,0.15)]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                    {bookingMode === "day_long" && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7A2267] flex items-center justify-center">
                        <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                          <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className="text-3xl mb-3">☀️</div>
                    <p className={`text-[16px] font-semibold text-[#1a1410] mb-1.5 ${playfair.className}`}>Day Long</p>
                    <p className="text-[12px] text-[#9B8BAB] leading-relaxed">A full-day experience at the resort.</p>
                    {settings?.dayLongCheckInTime && settings?.dayLongCheckOutTime && (
                      <div className="mt-3 pt-3 border-t border-[#F0E8F4] flex gap-4 text-[10.5px] text-[#C4B3CE]">
                        <span>Arrival: <strong className="text-[#9B8BAB]">{fmt12(settings.dayLongCheckInTime)}</strong></span>
                        <span>Departure: <strong className="text-[#9B8BAB]">{fmt12(settings.dayLongCheckOutTime)}</strong></span>
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

        {/* ── STEP 3: Choose Rooms ── */}
        {step === 3 && (
          <motion.div key="step3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}>

            {/* ── 3a: Property Selection ── */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
              <div className="h-[3px] bg-[#7A2267]" />
              <div className="p-6 sm:p-8">
                <h2 className={`text-[20px] font-semibold text-[#1a1410] mb-1 ${playfair.className}`}>Choose your property</h2>
                <p className="text-[12px] text-[#9B8BAB] mb-5">Select the property that fits your stay.</p>

                {properties.filter((p) => p.type === "building").length === 0 ? (
                  <p className="text-[13px] text-[#C4B3CE] text-center py-4">No properties available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {properties.filter((p) => p.type === "building").map((p) => (
                      <button key={p._id}
                        onClick={() => { setSelectedProp(p._id); setSelectedCat(null); setRooms([]); setCart(new Map()); setPreviewRoom(null); }}
                        className={`relative text-left rounded-2xl border-2 p-4 transition-all duration-200
                          ${selectedProp === p._id ? "border-[#7A2267] shadow-[0_4px_16px_rgba(122,34,103,0.12)]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                        {selectedProp === p._id && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7A2267] flex items-center justify-center">
                            <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
                              <path d="M1.5 4L3 5.5 6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                        {p.coverImage && (
                          <div className="h-24 rounded-xl overflow-hidden mb-3 bg-[#F0E8F4]">
                            <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <p className={`text-[15px] font-semibold text-[#1a1410] ${playfair.className}`}>{p.name}</p>
                        {p.location && <p className="text-[11px] text-[#9B8BAB] mt-0.5">{p.location}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── 3b: Category Selection ── */}
            {selectedProp && (
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                <div className="p-5 sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold mb-3">Room Category</p>
                  {categories.length === 0 ? (
                    <p className="text-[13px] text-[#C4B3CE]">No categories found for this property.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button key={c._id}
                          onClick={() => { setSelectedCat(c._id); setCart(new Map()); setPreviewRoom(null); }}
                          className={`px-4 py-2 rounded-xl text-[12.5px] font-semibold border-2 transition-all duration-150
                            ${selectedCat === c._id ? "bg-[#7A2267] text-white border-[#7A2267]" : "bg-white text-[#9B8BAB] border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 3c: Room Numbers Grid ── */}
            {selectedProp && selectedCat && (
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold">Available Rooms</p>
                    {bookingMode === "night_stay" && minRoomsNeeded !== null && (
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full
                        ${cart.size >= minRoomsNeeded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {cart.size}/{minRoomsNeeded} needed
                      </span>
                    )}
                  </div>

                  {bookingMode === "day_long" && (
                    <div className="mb-4 px-3 py-2.5 rounded-xl text-[11.5px] font-medium flex items-center gap-2 bg-[#FAF7FC] text-[#7A2267] border border-[#EDE5F0]">
                      <svg viewBox="0 0 12 12" width="13" height="13" fill="none">
                        <circle cx="6" cy="6" r="5.3" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      Room selection is optional for Day Long.
                    </div>
                  )}

                  {roomsLoading ? (
                    <div className="py-10 text-center text-[13px] text-[#C4B3CE]">Checking availability…</div>
                  ) : rooms.length === 0 ? (
                    <div className="py-10 text-center text-[13px] text-[#C4B3CE]">No rooms available for the selected dates and category.</div>
                  ) : (() => {
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
                                          const isSelected = cart.has(room._id);
                                          const isPreviewing = previewRoom?._id === room._id;
                                          return (
                                            <button key={room._id}
                                              onClick={() => setPreviewRoom(isPreviewing ? null : room)}
                                              className={`relative w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 font-semibold text-[13px]
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
                  })()}

                  {/* ── Room Detail Preview Card ── */}
                  <AnimatePresence>
                    {previewRoom && (
                      <motion.div
                        key={previewRoom._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="mt-5 rounded-2xl border-2 border-[#7A2267]/30 bg-[#FAF7FC] overflow-hidden">
                        {previewRoom.coverImage && (
                          <div className="relative h-40 bg-[#F0E8F4]">
                            <img src={previewRoom.coverImage} alt={`Room ${previewRoom.roomNumber}`} className="w-full h-full object-cover" />
                            <button onClick={() => setPreviewRoom(null)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                              <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                                <path d="M2 2l6 6M8 2l-6 6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className={`text-[17px] font-semibold text-[#1a1410] ${playfair.className}`}>Room {previewRoom.roomNumber}</p>
                              <p className="text-[11.5px] text-[#9B8BAB] mt-0.5">
                                Floor {previewRoom.floor}{previewRoom.block ? ` · ${previewRoom.block}` : ""}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[18px] font-bold text-[#7A2267]">
                                ৳{Number(bookingMode === "day_long" ? previewRoom.resolvedDayPrice : previewRoom.resolvedNightPrice).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-[#C4B3CE]">/{bookingMode === "day_long" ? "day" : "night"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="text-[10.5px] bg-white text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">{previewRoom.categoryName}</span>
                            {previewRoom.bedType && (
                              <span className="text-[10.5px] bg-white text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">{previewRoom.bedType}</span>
                            )}
                            <span className="text-[10.5px] bg-white text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">Up to {previewRoom.maxAdults} adults</span>
                            {previewRoom.maxChildren > 0 && (
                              <span className="text-[10.5px] bg-white text-[#9B8BAB] border border-[#EDE5F0] px-2.5 py-1 rounded-full">{previewRoom.maxChildren} children</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { toggleRoom(previewRoom); }}
                              className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-150
                                ${cart.has(previewRoom._id)
                                  ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                                  : "bg-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.25)] hover:bg-[#8e2878]"}`}>
                              {cart.has(previewRoom._id) ? "Remove from cart" : "Select this room"}
                            </button>
                            <a href={`/rooms/${previewRoom._id}`} target="_blank" rel="noopener noreferrer"
                              className="px-4 py-2.5 rounded-xl text-[12.5px] font-semibold border-2 border-[#EDE5F0] text-[#9B8BAB] hover:border-[#C4B3CE] hover:text-[#7A2267] transition-all duration-150 whitespace-nowrap">
                              View profile
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Day Long Packages ── */}
            {bookingMode === "day_long" && packages.length > 0 && selectedProp && (
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                <div className="p-5 sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold mb-3">Day Package (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packages.map((pkg) => (
                      <button key={pkg._id} onClick={() => setSelectedPkg(selectedPkg?._id === pkg._id ? null : pkg)}
                        className={`text-left rounded-xl border-2 p-4 transition-all duration-150
                          ${selectedPkg?._id === pkg._id ? "border-[#7A2267] bg-[#FAF7FC]" : "border-[#EDE5F0] hover:border-[#C4B3CE]"}`}>
                        <p className="text-[13px] font-semibold text-[#1a1410]">{pkg.name}</p>
                        <p className="text-[13px] font-bold text-[#7A2267] mt-0.5">৳{Number(pkg.price).toLocaleString()}</p>
                        {pkg.includes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pkg.includes.map((item, i) => (
                              <span key={i} className="text-[10px] bg-[#F0E8F4] text-[#9B8BAB] px-2 py-0.5 rounded-full">{item}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Cart Summary ── */}
            {cart.size > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
                <div className="p-5 sm:p-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#9B8BAB] font-semibold mb-3">Your Selection</p>
                  {cartRooms.map((r) => (
                    <div key={r._id} className="flex items-center justify-between text-[12.5px] py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1a1410] font-medium">Room {r.roomNumber} · Floor {r.floor}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#7A2267] font-semibold">৳{(bookingMode === "day_long" ? r.resolvedDayPrice : r.resolvedNightPrice * nights).toLocaleString()}</span>
                        <button onClick={() => { toggleRoom(r); if (previewRoom?._id === r._id) setPreviewRoom(null); }}
                          className="w-5 h-5 rounded-full bg-[#F0E8F4] flex items-center justify-center text-[#C4B3CE] hover:bg-red-100 hover:text-red-500 transition-colors">
                          <svg viewBox="0 0 8 8" width="7" height="7" fill="none">
                            <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedPkg && (
                    <div className="flex items-center justify-between text-[12.5px] py-1.5 border-t border-[#F0E8F4] mt-1">
                      <span className="text-[#1a1410]">{selectedPkg.name} package</span>
                      <span className="text-[#7A2267] font-semibold">৳{Number(selectedPkg.price).toLocaleString()}</span>
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
              <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">← Back</button>
              <button onClick={goNext} disabled={bookingMode === "night_stay" && cart.size === 0}
                className="flex-[2] bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px]
                  py-4 rounded-2xl transition-all duration-200 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
                  disabled:opacity-50 disabled:cursor-not-allowed">
                Continue →
              </button>
            </div>
          </motion.div>
        )}

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
                      <select value={primaryGuest.gender}
                        onChange={(e) => setPrimaryGuest((p) => ({ ...p, gender: e.target.value }))}
                        className="w-full border border-[#EDE5F0] rounded-xl px-3.5 py-2.5 text-[13px] text-[#1a1a1a] outline-none focus:border-[#7A2267]/40 bg-white transition-all">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Per-room guest assignment */}
                {cartRooms.map((room, roomIdx) => {
                  const info = getGuestInfo(room._id);
                  const hasOpposite = (() => {
                    const adults = info.guests.filter((g) => !g.age || Number(g.age) > (settings?.maxFreeChildAge ?? 5));
                    return adults.some((g) => g.gender === "male") && adults.some((g) => g.gender === "female");
                  })();

                  return (
                    <div key={room._id} className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] uppercase tracking-[0.15em] text-[#9B8BAB] font-semibold">
                          Room {room.roomNumber} · Floor {room.floor}
                        </p>
                        <button type="button" onClick={() => addGuest(room._id)}
                          className="text-[11px] text-[#7A2267] font-semibold hover:underline">
                          + Add guest
                        </button>
                      </div>

                      {info.guests.length === 0 ? (
                        <div className="bg-[#FAF7FC] rounded-xl p-4 text-center text-[12px] text-[#C4B3CE]">
                          No guests assigned yet. Click "Add guest" above.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {info.guests.map((g, gi) => (
                            <div key={gi} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-end">
                              <div>
                                {gi === 0 && <label className="block text-[9px] uppercase tracking-wider text-[#C4B3CE] font-semibold mb-1">Name</label>}
                                <input placeholder="Name" value={g.name || ""}
                                  onChange={(e) => updateGuest(room._id, gi, "name", e.target.value)}
                                  className="w-full border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-[#7A2267]/40 text-[#1a1a1a] placeholder:text-[#C4B3CE] transition-all" />
                              </div>
                              <div>
                                {gi === 0 && <label className="block text-[9px] uppercase tracking-wider text-[#C4B3CE] font-semibold mb-1">Age</label>}
                                <input type="number" placeholder="Age" min="0" max="120" value={g.age || ""}
                                  onChange={(e) => updateGuest(room._id, gi, "age", e.target.value)}
                                  className="w-full border border-[#EDE5F0] rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-[#7A2267]/40 text-[#1a1a1a] placeholder:text-[#C4B3CE] transition-all" />
                              </div>
                              <div>
                                {gi === 0 && <label className="block text-[9px] uppercase tracking-wider text-[#C4B3CE] font-semibold mb-1">Gender</label>}
                                <select value={g.gender || "male"}
                                  onChange={(e) => updateGuest(room._id, gi, "gender", e.target.value)}
                                  className="border border-[#EDE5F0] rounded-xl px-2 py-2 text-[12px] outline-none focus:border-[#7A2267]/40 bg-white text-[#1a1a1a] transition-all">
                                  <option value="male">M</option>
                                  <option value="female">F</option>
                                  <option value="other">O</option>
                                </select>
                              </div>
                              <button type="button" onClick={() => removeGuest(room._id, gi)}
                                className="text-[#C4B3CE] hover:text-red-400 transition-colors pb-1 text-lg leading-none">×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Couple doc if opposite genders detected */}
                      {hasOpposite && settings?.requireCoupleDoc && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-800">
                          <p className="font-semibold mb-1.5">⚠️ Marriage certificate required</p>
                          <p className="text-[11px] mb-2 text-amber-700">This room has guests of opposite genders. Please provide a marriage certificate.</p>
                          <div className="flex gap-2">
                            {["at_desk", "upload"].map((opt) => (
                              <button key={opt} type="button"
                                onClick={() => updateGuestInfo(room._id, { coupleDocMethod: opt })}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border-2
                                  ${info.coupleDocMethod === opt ? "bg-amber-700 text-white border-amber-700" : "bg-white text-amber-700 border-amber-300"}`}>
                                {opt === "at_desk" ? "Show at Desk" : "Upload Online"}
                              </button>
                            ))}
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

            {error && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>}
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
                      {selectedPkg && (
                        <div className="flex justify-between">
                          <span className="text-[#9B8BAB]">{selectedPkg.name}</span>
                          <span className="font-medium">৳{selectedPkg.price.toLocaleString()}</span>
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
                          <p className="text-[16px] font-bold text-[#7A2267]">৳{advanceAmt.toLocaleString()}</p>
                          <p className="text-[10.5px] text-[#C4B3CE] mt-0.5">{settings.advancePaymentPercent}% now · ৳{remaining.toLocaleString()} at check-in</p>
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
                      <button
                        onClick={() => handleSubmit("pay_at_desk")}
                        disabled={isPending}
                        className="w-full py-4 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px]
                          hover:border-[#C4B3CE] hover:text-[#1a1410] transition-all disabled:opacity-50">
                        Pay at Desk
                      </button>
                    </div>

                    <p className="text-center text-[10.5px] text-[#C4B3CE] mt-4">
                      🔒 Secure payment powered by SSLCommerz · Your rooms are reserved for 60 seconds during checkout.
                    </p>
                  </div>
                </div>
              </>
            )}

            <button onClick={goBack} className="w-full py-3 rounded-2xl border-2 border-[#EDE5F0] text-[#9B8BAB] font-semibold text-[13px] hover:border-[#C4B3CE] transition-colors">← Back</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
