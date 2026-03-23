"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getProperties } from "@/actions/accommodation/propertyActions";
import { getCategoriesByProperty } from "@/actions/accommodation/categoryActions";
import { getAvailableRooms } from "@/actions/accommodation/roomActions";
import { checkAvailability, createPendingBooking, confirmPayAtDesk } from "@/actions/accommodation/bookingActions";

// ─── Utilities ───────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function afterTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function diffDays(a, b) {
  return Math.ceil((new Date(b) - new Date(a)) / 86400000);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const slideIn = (dir = 1) => ({
  initial: { x: dir * 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit:    { x: dir * -50, opacity: 0 },
  transition: { type: "spring", stiffness: 320, damping: 32 },
});

const fadeUp = {
  initial:   { y: 14, opacity: 0 },
  animate:   { y: 0, opacity: 1 },
  exit:      { y: -10, opacity: 0 },
  transition: { type: "spring", stiffness: 380, damping: 30 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardItem = {
  initial: { y: 18, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 350, damping: 28 } },
};

// ─── Step Indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = [
  { title: "Search Results",  sub: "Choose property & dates" },
  { title: "Booking Details", sub: "Guest information"       },
  { title: "Booking Confirmed", sub: "Review & pay"          },
];

function StepIndicator({ step }) {
  return (
    <div className="flex items-start w-full px-4 sm:px-0 mb-10">
      {STEP_LABELS.map(({ title, sub }, i) => {
        const n      = i + 1;
        const done   = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-start flex-1">
            <div className="flex flex-col items-center w-full">
              {/* Label above */}
              <div className="text-center mb-3 hidden sm:block">
                <p className={`text-[10.5px] font-bold uppercase tracking-wider transition-colors duration-300
                  ${active ? "text-[#7A2267]" : done ? "text-[#7A2267]/50" : "text-neutral-400"}`}>
                  Step {n}
                </p>
                <p className={`text-[11.5px] mt-0.5 transition-colors duration-300
                  ${active ? "text-neutral-700" : "text-neutral-400"}`}>
                  {title}
                </p>
              </div>

              {/* Circle + line row */}
              <div className="flex items-center w-full">
                {/* Left line */}
                {n > 1 && (
                  <motion.div
                    className="flex-1 h-px"
                    animate={{ backgroundColor: done || active ? "#7A2267" : "#e5e7eb" }}
                    transition={{ duration: 0.4 }}
                  />
                )}

                {/* Circle */}
                <motion.div
                  animate={{
                    scale:           active ? 1.12 : 1,
                    backgroundColor: done ? "#7A2267" : active ? "#fff" : "#f3f4f6",
                    borderColor:     active ? "#7A2267" : done ? "#7A2267" : "#e5e7eb",
                    boxShadow:       active ? "0 0 0 6px rgba(122,34,103,0.12)" : "none",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10"
                >
                  {done ? (
                    <motion.svg
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      viewBox="0 0 12 12" width="13" height="13" fill="none"
                    >
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : (
                    <span className={`text-[13px] font-bold transition-colors duration-300
                      ${active ? "text-[#7A2267]" : "text-neutral-400"}`}>
                      {n}
                    </span>
                  )}
                </motion.div>

                {/* Right line */}
                {n < 3 && (
                  <motion.div
                    className="flex-1 h-px"
                    animate={{ backgroundColor: done ? "#7A2267" : "#e5e7eb" }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </div>

              {/* Sub label (mobile only) */}
              <p className={`mt-2 text-[10px] text-center sm:hidden transition-colors duration-300
                ${active ? "text-[#7A2267] font-semibold" : "text-neutral-400"}`}>
                {title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner({ label = "Loading…" }) {
  return (
    <motion.div {...fadeUp} className="flex flex-col items-center gap-3 py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-7 h-7 rounded-full border-2 border-[#7A2267]/20 border-t-[#7A2267]"
      />
      <p className="text-[13px] text-neutral-400">{label}</p>
    </motion.div>
  );
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────

function Step1({ preselect, settings, onNext }) {
  const [view, setView] = useState("listing");     // "listing" | "categories" | "datepick"
  const [navDir, setNavDir] = useState(1);

  const [properties,     setProperties]     = useState([]);
  const [selProperty,    setSelProperty]    = useState(null);
  const [categories,     setCategories]     = useState([]);
  const [selCategory,    setSelCategory]    = useState(null);
  const [availableRooms, setAvailableRooms] = useState(null);
  const [selRoom,        setSelRoom]        = useState(null);

  const [checkIn,  setCheckIn]  = useState(tomorrowStr());
  const [checkOut, setCheckOut] = useState(afterTomorrowStr());

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Load all properties on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getProperties({ onlyActive: true, limit: 50 });
        setProperties(res.properties);
        // Handle pre-selection from URL params
        if (preselect?.propertyId) {
          const prop = res.properties.find((p) => p._id === preselect.propertyId);
          if (prop) await selectProperty(prop, res.properties);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProperty = useCallback(async (prop, propsArr) => {
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
        // Pre-select category from URL?
        if (preselect?.categoryId) {
          const cat = cats.find((c) => c._id === preselect.categoryId);
          if (cat) { setSelCategory(cat); setView("datepick"); return; }
        }
        setView("categories");
      } finally {
        setLoading(false);
      }
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
        if (rooms.length === 0) setError("No rooms available for these dates. Please try other dates.");
      } else {
        const { available } = await checkAvailability({ propertyId: selProperty._id, checkIn, checkOut });
        if (!available) {
          setError("The cottage is not available for these dates. Please try other dates.");
        } else {
          setAvailableRooms([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (selCategory && !selRoom) { setError("Please select a room."); return; }
    const nights    = diffDays(checkIn, checkOut);
    const basePrice = selCategory ? selCategory.pricePerNight : (selProperty.pricePerNight || 0);
    onNext({ checkIn, checkOut, nights, basePrice, selProperty, selCategory, selRoom,
      bookingType: selCategory ? "room" : "cottage" });
  }

  const canConfirm = availableRooms !== null &&
    (selProperty?.type === "cottage" || (availableRooms.length > 0 && selRoom));

  const TYPE_BADGE = {
    building: "bg-blue-50 text-blue-600 border border-blue-200",
    cottage:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  return (
    <div>
      {/* Breadcrumb */}
      {view !== "listing" && (
        <motion.div {...fadeUp} className="flex items-center gap-2 mb-5 text-[12.5px]">
          <button onClick={() => { setNavDir(-1); setSelProperty(null); setView("listing"); }}
            className="text-[#7A2267] hover:underline">All Properties</button>
          {selProperty && (
            <>
              <span className="text-neutral-300">/</span>
              {view === "datepick" && selProperty.type === "building"
                ? <button onClick={() => { setNavDir(-1); setView("categories"); }}
                    className="text-[#7A2267] hover:underline">{selProperty.name}</button>
                : <span className="text-neutral-500">{selProperty.name}</span>
              }
            </>
          )}
          {selCategory && view === "datepick" && (
            <>
              <span className="text-neutral-300">/</span>
              <span className="text-neutral-500">{selCategory.name}</span>
            </>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait" custom={navDir}>
        {/* ── Property Listing ── */}
        {view === "listing" && (
          <motion.div key="listing" custom={navDir} {...slideIn(navDir)}>
            <p className="text-[13px] text-neutral-500 mb-5">
              Select a property to begin your reservation.
            </p>

            {loading ? <Spinner label="Loading properties…" /> : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {properties.map((prop) => (
                  <motion.button
                    key={prop._id}
                    variants={cardItem}
                    whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectProperty(prop, properties)}
                    className="text-left bg-white border border-neutral-100 rounded-2xl overflow-hidden
                      shadow-sm transition-shadow duration-200 group"
                  >
                    <div className="relative h-36 overflow-hidden bg-neutral-100">
                      {prop.coverImage ? (
                        <img src={prop.coverImage} alt={prop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <svg viewBox="0 0 40 40" width="32" height="32" fill="none">
                            <path d="M5 35V17L20 5l15 12v18" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                      <span className={`absolute top-3 left-3 text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${TYPE_BADGE[prop.type]}`}>
                        {prop.type}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[14px] font-semibold text-neutral-800 mb-0.5">{prop.name}</p>
                      {prop.location && (
                        <p className="text-[12px] text-neutral-400 flex items-center gap-1">
                          <svg viewBox="0 0 10 14" width="8" height="10" fill="none">
                            <path d="M5 1a4 4 0 0 1 4 4c0 3-4 8-4 8S1 8 1 5a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.2" />
                            <circle cx="5" cy="5" r="1.3" fill="currentColor" />
                          </svg>
                          {prop.location}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        {prop.type === "building"
                          ? <span className="text-[11.5px] text-neutral-400">{prop.roomStats?.available ?? 0} rooms available</span>
                          : <span className="text-[13px] font-semibold text-neutral-700">
                              {prop.pricePerNight > 0 ? `৳${prop.pricePerNight.toLocaleString()}/night` : ""}
                            </span>
                        }
                        <span className="text-[12px] text-[#7A2267] font-medium">Select →</span>
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
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-neutral-800">{selProperty?.name}</h3>
                <p className="text-[12.5px] text-neutral-400 mt-0.5">Choose a room category</p>
              </div>
              <button onClick={goBack} className="text-[12px] text-neutral-400 hover:text-[#7A2267] flex items-center gap-1 transition-colors">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M7 8.5 3 5l4-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            </div>

            {loading ? <Spinner label="Loading categories…" /> : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {categories.map((cat) => (
                  <motion.button
                    key={cat._id}
                    variants={cardItem}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setSelCategory(cat); setNavDir(1); setView("datepick"); setAvailableRooms(null); setSelRoom(null); }}
                    disabled={cat.roomStats?.available === 0}
                    className={`w-full text-left flex gap-4 p-4 bg-white border rounded-2xl shadow-sm
                      transition-all duration-200 group
                      ${cat.roomStats?.available === 0
                        ? "border-neutral-100 opacity-50 cursor-not-allowed"
                        : "border-neutral-100 hover:border-[#7A2267]/30 hover:shadow-md"}`}
                  >
                    {cat.coverImage && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
                        <img src={cat.coverImage} alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-semibold text-neutral-800">{cat.name}</p>
                        <p className="text-[13.5px] font-bold text-neutral-700 shrink-0">
                          ৳{cat.pricePerNight?.toLocaleString()}<span className="text-[10px] font-normal text-neutral-400">/night</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11.5px] text-neutral-400">
                        {cat.bedType && <span>{cat.bedType} bed</span>}
                        {cat.size && <span>· {cat.size}</span>}
                        {cat.maxAdults && <span>· {cat.maxAdults} adults</span>}
                      </div>
                      <p className={`mt-1.5 text-[11px] font-semibold
                        ${cat.roomStats?.available > 0 ? "text-emerald-600" : "text-red-400"}`}>
                        {cat.roomStats?.available > 0 ? `${cat.roomStats.available} rooms available` : "Fully booked"}
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
          <motion.div key="datepick" custom={navDir} {...slideIn(navDir)} className="space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[15px] font-bold text-neutral-800">
                  {selCategory ? selCategory.name : selProperty?.name}
                </h3>
                <p className="text-[12.5px] text-neutral-400 mt-0.5">
                  {selCategory
                    ? `৳${selCategory.pricePerNight?.toLocaleString()}/night`
                    : selProperty?.pricePerNight > 0 ? `৳${selProperty.pricePerNight?.toLocaleString()}/night` : ""}
                </p>
              </div>
              <button onClick={goBack}
                className="text-[12px] text-neutral-400 hover:text-[#7A2267] flex items-center gap-1 transition-colors">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M7 8.5 3 5l4-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
            </div>

            {/* Date picker */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4">
              <p className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">Select Dates</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">Check-in</label>
                  <input
                    type="date" min={todayStr()} value={checkIn}
                    onChange={(e) => { setCheckIn(e.target.value); setAvailableRooms(null); setSelRoom(null); setError(""); }}
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-[13px] text-neutral-800
                      focus:outline-none focus:border-[#7A2267]/60 focus:ring-2 focus:ring-[#7A2267]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">Check-out</label>
                  <input
                    type="date" min={checkIn || todayStr()} value={checkOut}
                    onChange={(e) => { setCheckOut(e.target.value); setAvailableRooms(null); setSelRoom(null); setError(""); }}
                    className="w-full border border-neutral-200 rounded-xl px-3.5 py-2.5 text-[13px] text-neutral-800
                      focus:outline-none focus:border-[#7A2267]/60 focus:ring-2 focus:ring-[#7A2267]/10 transition-all"
                  />
                </div>
              </div>

              {/* Night summary */}
              <AnimatePresence>
                {checkIn && checkOut && diffDays(checkIn, checkOut) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-between bg-[#7A2267]/5 border border-[#7A2267]/15 rounded-xl px-4 py-2.5"
                  >
                    <span className="text-[12.5px] text-neutral-600">
                      {diffDays(checkIn, checkOut)} night{diffDays(checkIn, checkOut) !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[13.5px] font-bold text-[#7A2267]">
                      ৳{((selCategory?.pricePerNight ?? selProperty?.pricePerNight ?? 0) * diffDays(checkIn, checkOut)).toLocaleString()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                onClick={handleCheckDates}
                disabled={loading || diffDays(checkIn, checkOut) < 1}
                className="w-full py-3 rounded-xl bg-neutral-900 text-white text-[13.5px] font-semibold
                  hover:bg-neutral-700 disabled:opacity-40 transition-colors duration-200"
              >
                {loading ? "Checking availability…" : "Check Availability"}
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-[12.5px] text-red-500 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Room grid */}
            <AnimatePresence>
              {availableRooms !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  {selCategory && availableRooms.length > 0 ? (
                    <>
                      <p className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">
                        Select Room
                        <span className="ml-2 font-normal text-neutral-400 capitalize">{availableRooms.length} available</span>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {availableRooms.map((room) => (
                          <motion.button
                            key={room._id}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setSelRoom(room)}
                            className={`p-3 rounded-xl border text-center transition-all duration-200
                              ${selRoom?._id === room._id
                                ? "border-[#7A2267] bg-[#7A2267]/8 shadow-md shadow-[#7A2267]/10"
                                : "border-neutral-200 hover:border-[#7A2267]/40 hover:bg-neutral-50"
                              }`}
                          >
                            <p className="text-[13.5px] font-bold text-neutral-800 font-mono">{room.roomNumber}</p>
                            <p className="text-[10.5px] text-neutral-400 mt-0.5">Floor {room.floor}</p>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : selProperty?.type === "cottage" ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-emerald-800">Cottage available!</p>
                        <p className="text-[11.5px] text-emerald-600">Your dates are free. Continue to guest details.</p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm */}
            <AnimatePresence>
              {canConfirm && (
                <motion.button
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.015, boxShadow: "0 8px 24px rgba(122,34,103,0.25)" }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleConfirm}
                  className="w-full py-4 rounded-xl bg-[#7A2267] text-white text-[14.5px] font-bold
                    transition-colors duration-200"
                >
                  Continue to Guest Details →
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 2: Guest Info ───────────────────────────────────────────────────────

const BLANK_GUEST = { name: "", age: "", gender: "male" };

function Step2({ settings, onNext, onBack }) {
  const [primary, setPrimary] = useState({ name: "", email: "", phone: "", whatsapp: "", gender: "male", age: "" });
  const [guests,  setGuests]  = useState([]);
  const [isCoupleBooking,   setIsCoupleBooking]   = useState(false);
  const [coupleDocMethod,   setCoupleDocMethod]   = useState("desk");
  const [coupleDocumentUrl, setCoupleDocumentUrl] = useState("");
  const [specialRequests,   setSpecialRequests]   = useState("");
  const [error, setError] = useState("");

  const setPri = (k) => (e) => setPrimary((p) => ({ ...p, [k]: e.target.value }));

  function addGuest() { setGuests((g) => [...g, { ...BLANK_GUEST }]); }
  function removeGuest(i) { setGuests((p) => p.filter((_, j) => j !== i)); }
  function updateGuest(i, k, v) { setGuests((p) => p.map((g, j) => j === i ? { ...g, [k]: v } : g)); }

  function handleNext() {
    setError("");
    if (!primary.name || !primary.email || !primary.phone || !primary.age) {
      setError("Please fill in all required primary guest fields.");
      return;
    }
    if (isCoupleBooking && coupleDocMethod === "online" && !coupleDocumentUrl) {
      setError("Please provide the document URL, or choose to bring it at the desk.");
      return;
    }
    onNext({
      primaryGuest: { ...primary, age: Number(primary.age) },
      guests: guests.map((g) => ({ ...g, age: Number(g.age) })),
      isCoupleBooking,
      coupleDocMethod:   isCoupleBooking ? coupleDocMethod : "",
      coupleDocumentUrl: isCoupleBooking && coupleDocMethod === "online" ? coupleDocumentUrl : "",
      specialRequests,
    });
  }

  const FI = "w-full border border-neutral-200 rounded-xl px-4 py-3 text-[13.5px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#7A2267]/60 focus:ring-2 focus:ring-[#7A2267]/10 transition-all duration-200";
  const FL = "block text-[10.5px] uppercase tracking-wider text-neutral-500 font-semibold mb-1.5";

  return (
    <motion.div key="step2" {...fadeUp} className="space-y-5">
      {/* Primary guest */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">Primary Guest</p>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-[12.5px] text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
            {error}
          </motion.p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={FL}>Full Name *</label>
            <input className={FI} value={primary.name} onChange={setPri("name")} placeholder="As on NID / Passport" />
          </div>
          <div>
            <label className={FL}>Email *</label>
            <input type="email" className={FI} value={primary.email} onChange={setPri("email")} placeholder="you@example.com" />
          </div>
          <div>
            <label className={FL}>Phone *</label>
            <input className={FI} value={primary.phone} onChange={setPri("phone")} placeholder="+880 1X XX XX XXXX" />
          </div>
          <div>
            <label className={FL}>WhatsApp</label>
            <input className={FI} value={primary.whatsapp} onChange={setPri("whatsapp")} placeholder="+880…" />
          </div>
          <div>
            <label className={FL}>Age *</label>
            <input type="number" className={FI} value={primary.age} onChange={setPri("age")} min="18" placeholder="Age" />
          </div>
          <div>
            <label className={FL}>Gender *</label>
            <select className={FI} value={primary.gender} onChange={setPri("gender")}>
              {["male","female","other"].map((g) => <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Additional guests */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">Additional Guests</p>
          <button type="button" onClick={addGuest}
            className="text-[12.5px] text-[#7A2267] font-semibold hover:text-[#8e2878] transition-colors">
            + Add guest
          </button>
        </div>
        <p className="text-[11.5px] text-neutral-400">
          Children aged {settings.maxFreeChildAge} or under are classified as child guests.
        </p>
        <AnimatePresence>
          {guests.map((g, i) => (
            <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="border border-neutral-100 rounded-xl p-4 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-neutral-500">Guest {i + 1}</p>
                <button onClick={() => removeGuest(i)} className="text-[11.5px] text-red-400 hover:text-red-600 transition-colors">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className={FL}>Name</label>
                  <input className={FI} value={g.name} onChange={(e) => updateGuest(i, "name", e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className={FL}>Age</label>
                  <input type="number" className={FI} value={g.age} onChange={(e) => updateGuest(i, "age", e.target.value)} min="0" />
                </div>
                <div>
                  <label className={FL}>Gender</label>
                  <select className={FI} value={g.gender} onChange={(e) => updateGuest(i, "gender", e.target.value)}>
                    {["male","female","other"].map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Couple booking */}
      {settings.requireCoupleDoc && (
        <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={isCoupleBooking} onChange={(e) => setIsCoupleBooking(e.target.checked)}
              className="mt-0.5 accent-[#7A2267] w-4 h-4 rounded" />
            <div>
              <p className="text-[13px] font-semibold text-neutral-700">This is a couple booking</p>
              <p className="text-[11.5px] text-neutral-400 mt-0.5">
                Unmarried couples must submit a marriage certificate. You can upload now or bring it at check-in.
              </p>
            </div>
          </label>
          <AnimatePresence>
            {isCoupleBooking && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                <div className="flex gap-3">
                  {[["desk","Bring at check-in"],["online","Upload link now"]].map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setCoupleDocMethod(v)}
                      className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-medium border transition-all duration-200
                        ${coupleDocMethod === v
                          ? "bg-[#7A2267]/8 border-[#7A2267]/50 text-[#7A2267]"
                          : "border-neutral-200 text-neutral-500 hover:border-[#7A2267]/30"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {coupleDocMethod === "online" && (
                  <div>
                    <label className={FL}>Document URL (Google Drive / cloud link)</label>
                    <input className={FI} value={coupleDocumentUrl}
                      onChange={(e) => setCoupleDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/…" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Special requests */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm">
        <label className={`${FL} mb-3`}>Special Requests</label>
        <textarea className={`${FI} resize-none`} rows={3} value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requirements or preferences… (optional)" />
      </div>

      <div className="flex gap-3 pt-1">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl border border-neutral-200 text-neutral-500 text-[13.5px]
            font-semibold hover:bg-neutral-50 transition-colors duration-200">
          ← Back
        </motion.button>
        <motion.button whileHover={{ scale: 1.015, boxShadow: "0 8px 24px rgba(122,34,103,0.25)" }}
          whileTap={{ scale: 0.985 }}
          onClick={handleNext}
          className="flex-[2] py-3.5 rounded-xl bg-[#7A2267] text-white text-[14px] font-bold
            transition-colors duration-200">
          Review & Pay →
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
  const taxes       = Math.round((subtotal * (settings.taxPercent ?? 0)) / 100);
  const totalAmount = subtotal + taxes;

  function handlePay() {
    setError("");
    startTransition(async () => {
      try {
        const bookingData = {
          propertyId:        selProperty._id,
          categoryId:        selCategory?._id ?? null,
          roomId:            selRoom?._id ?? null,
          bookingType,
          checkIn, checkOut, nights,
          primaryGuest:      guestData.primaryGuest,
          guests:            guestData.guests,
          isCoupleBooking:   guestData.isCoupleBooking,
          coupleDocumentUrl: guestData.coupleDocumentUrl,
          coupleDocMethod:   guestData.coupleDocMethod,
          specialRequests:   guestData.specialRequests,
          basePrice,
          paymentMethod,
        };

        const result = await createPendingBooking(bookingData);
        if (!result.success) throw new Error("Failed to create booking.");

        if (paymentMethod === "pay_at_desk") {
          await confirmPayAtDesk(result.bookingId);
          router.push(`/booking/success?ref=${result.bookingNumber}&method=desk`);
          return;
        }

        const res  = await fetch("/api/ssl/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: result.bookingId }),
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
    <motion.div key="step3" {...fadeUp} className="space-y-5">
      {/* Summary card */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">Booking Summary</p>
        <dl className="text-[13px] space-y-2">
          {[
            ["Property",  selProperty?.name],
            ["Category",  selCategory?.name],
            ["Room",      selRoom ? `#${selRoom.roomNumber} · Floor ${selRoom.floor}` : null],
            ["Check-in",  fmtDate(checkIn)],
            ["Check-out", fmtDate(checkOut)],
            ["Duration",  `${nights} night${nights !== 1 ? "s" : ""}`],
            ["Guest",     guestData.primaryGuest.name],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-neutral-500">{label}</dt>
              <dd className="font-medium text-neutral-700 text-right max-w-[55%] truncate">{val}</dd>
            </div>
          ))}
          {guestData.isCoupleBooking && (
            <div className="flex justify-between">
              <dt className="text-neutral-500">Couple booking</dt>
              <dd className="font-medium text-amber-600">Doc required</dd>
            </div>
          )}
        </dl>
        {/* Price breakdown */}
        <div className="border-t border-neutral-100 pt-3 space-y-1.5 text-[12.5px]">
          <div className="flex justify-between">
            <dt className="text-neutral-400">{nights} night{nights!==1?"s":""} × ৳{basePrice.toLocaleString()}</dt>
            <dd className="text-neutral-600">৳{subtotal.toLocaleString()}</dd>
          </div>
          {taxes > 0 && (
            <div className="flex justify-between">
              <dt className="text-neutral-400">Tax ({settings.taxPercent}%)</dt>
              <dd className="text-neutral-600">৳{taxes.toLocaleString()}</dd>
            </div>
          )}
          <div className="flex justify-between font-bold text-[15px] pt-1.5 border-t border-neutral-100">
            <dt className="text-neutral-800">Total</dt>
            <dd className="text-[#7A2267]">৳{totalAmount.toLocaleString()}</dd>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-[12px] font-semibold text-neutral-600 uppercase tracking-wider">Payment Method</p>
        {[
          { v: "sslcommerz",  label: "Pay Online",    sub: "Card, Bkash, Nagad via SSLCommerz — secure redirect" },
          { v: "pay_at_desk", label: "Pay at Desk",   sub: "Booking confirmed, pay cash on arrival at front desk"  },
        ].map(({ v, label, sub }) => (
          <motion.label key={v} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200
              ${paymentMethod === v ? "border-[#7A2267]/50 bg-[#7A2267]/5" : "border-neutral-200 hover:border-neutral-300"}`}>
            <input type="radio" name="pay" value={v} checked={paymentMethod === v}
              onChange={() => setPaymentMethod(v)} className="mt-0.5 accent-[#7A2267]" />
            <div>
              <p className="text-[13.5px] font-semibold text-neutral-800">{label}</p>
              <p className="text-[11.5px] text-neutral-400 mt-0.5">{sub}</p>
            </div>
          </motion.label>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 text-[12.5px] px-4 py-3 rounded-xl">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={onBack} disabled={isPending}
          className="flex-1 py-3.5 rounded-xl border border-neutral-200 text-neutral-500 text-[13.5px]
            font-semibold hover:bg-neutral-50 transition-colors duration-200">
          ← Back
        </motion.button>
        <motion.button
          whileHover={!isPending ? { scale: 1.015, boxShadow: "0 8px 28px rgba(122,34,103,0.28)" } : {}}
          whileTap={!isPending ? { scale: 0.985 } : {}}
          onClick={handlePay} disabled={isPending}
          className="flex-[2] py-3.5 rounded-xl bg-[#7A2267] text-white text-[14px] font-bold
            disabled:opacity-60 transition-colors duration-200 relative overflow-hidden"
        >
          {isPending && (
            <motion.div animate={{ x: ["−100%", "200%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/3 bg-white/10 skew-x-[-15deg]" />
          )}
          {isPending ? "Processing…"
            : paymentMethod === "pay_at_desk"
              ? `Confirm · ৳${totalAmount.toLocaleString()}`
              : `Pay ৳${totalAmount.toLocaleString()} →`
          }
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
              settings={settings}
              onNext={(data) => { setDatesData(data); goStep(2); }}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" custom={stepDir} {...slideIn(stepDir)}>
            <Step2
              settings={settings}
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
