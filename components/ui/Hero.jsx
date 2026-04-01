"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lora, Josefin_Sans, Cormorant_Garamond } from "next/font/google";

const lora      = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin   = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });

// ─── Date Utilities ────────────────────────────────────────────────────────────
function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function dateStr(d) {
  if (!(d instanceof Date)) return d;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtShort(str) {
  if (!str) return null;
  const d = new Date(str);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
function fmtFull(str) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function nightCount(ci, co) {
  if (!ci || !co) return 0;
  return Math.ceil((new Date(co) - new Date(ci)) / 86400000);
}

const WEEKDAYS    = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ─── Smart Position Calculator ─────────────────────────────────────────────────
function calcPos(anchorEl, calW = 252, calH = 360) {
  if (!anchorEl || typeof window === "undefined") return { top: 0, left: 0 };
  const r   = anchorEl.getBoundingClientRect();
  const vh  = window.innerHeight;
  const vw  = window.innerWidth;
  const spB = vh - r.bottom - 12;
  const spT = r.top - 12;
  const top = (spB < calH && spT > spB)
    ? Math.max(8, r.top - calH - 8)
    : r.bottom + 8;
  // On mobile: center horizontally on screen
  if (vw < 640) {
    return { top, left: Math.max(8, Math.round((vw - calW) / 2)) };
  }
  let left = r.left;
  if (left + calW > vw - 8) left = vw - calW - 8;
  if (left < 8) left = 8;
  return { top, left };
}

// ─── Minimal Futuristic Calendar ───────────────────────────────────────────────
function PremiumCalendar({ checkIn, checkOut, onCheckIn, onCheckOut, anchorEl, onClose, initialPicking, singleDate = false }) {
  const today    = todayDate();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [picking,   setPicking]   = useState(initialPicking ?? (checkIn && !checkOut ? "out" : "in"));
  const [hoverDay,  setHoverDay]  = useState(null);

  useEffect(() => { setPicking(initialPicking); }, [initialPicking]);
  const [pos, setPos] = useState(() => calcPos(anchorEl));
  const calRef = useRef(null);

  useEffect(() => {
    setPos(calcPos(anchorEl));
  }, [anchorEl]);

  useEffect(() => {
    function handler(e) {
      if (calRef.current && !calRef.current.contains(e.target) &&
          anchorEl && !anchorEl.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorEl]);

  const ciDate = checkIn  ? new Date(checkIn)  : null;
  const coDate = checkOut ? new Date(checkOut) : null;
  if (ciDate) ciDate.setHours(0, 0, 0, 0);
  if (coDate) coDate.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startPad     = firstOfMonth.getDay();
  const days = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(viewYear, viewMonth, d);
    day.setHours(0, 0, 0, 0);
    days.push(day);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(day) {
    if (!day || day < today) return;
    if (picking === "in") {
      onCheckIn(dateStr(day));
      onCheckOut("");
      setPicking("out");
    } else {
      if (ciDate && day <= ciDate) {
        onCheckIn(dateStr(day));
        onCheckOut("");
      } else {
        onCheckOut(dateStr(day));
        onClose();
      }
    }
  }

  function classifyDay(day) {
    if (!day) return "empty";
    if (day < today) return "past";
    const isCI   = ciDate && isSameDay(day, ciDate);
    const isCO   = coDate && isSameDay(day, coDate);
    const eff    = coDate || hoverDay;
    const range  = ciDate && eff && day > ciDate && day < eff;
    if (isCI) return "start";
    if (isCO) return "end";
    if (range) return "range";
    if (isSameDay(day, today)) return "today";
    return "normal";
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const nights = nightCount(checkIn, checkOut);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={calRef}
        key="cal"
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 99999, width: 252,
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid rgba(122,34,103,0.14)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(122,34,103,0.06)",
          overflow: "hidden",
        }}
      >
        {/* ── Tabs ── */}
        <div className="flex border-b border-[#F0E6FF]">
          {singleDate ? (
            /* Single-date mode: show one "Visit Date" tab */
            <div className="flex-1 px-2.5 py-2 bg-[#FAF4FF] relative">
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#7A2267]" />
              <p className="text-[7.5px] uppercase tracking-[0.18em] font-semibold mb-0.5 text-[#7A2267]">
                Visit Date
              </p>
              <p className={`text-[10.5px] font-medium ${checkIn ? "text-[#3D0A52]" : "text-[#CCBAD8]"}`}
                style={checkIn ? cormorant.style : {}}>
                {checkIn ? fmtShort(checkIn) : "Select date"}
              </p>
            </div>
          ) : (
            /* Range mode: Arrival + Departure tabs */
            <>
              {[
                { key: "in",  label: "Arrival",   val: checkIn  },
                { key: "out", label: "Departure",  val: checkOut },
              ].map(({ key, label, val }) => (
                <button
                  key={key}
                  onClick={() => setPicking(key)}
                  className={`flex-1 px-2.5 py-2 text-left transition-all duration-200 relative
                    ${picking === key ? "bg-[#FAF4FF]" : "hover:bg-[#FCF8FF]"}`}
                >
                  {picking === key && (
                    <motion.div layoutId="calTab"
                      className="absolute bottom-0 inset-x-0 h-[2px] bg-[#7A2267]"
                      transition={{ duration: 0.25 }} />
                  )}
                  <p className={`text-[7.5px] uppercase tracking-[0.18em] font-semibold mb-0.5
                    ${picking === key ? "text-[#7A2267]" : "text-[#BCA8CC]"}`}>
                    {label}
                  </p>
                  <p className={`text-[10.5px] font-medium transition-colors duration-200
                    ${val ? (picking === key ? "text-[#3D0A52]" : "text-[#7A5590]") : "text-[#CCBAD8]"}`}
                    style={val ? cormorant.style : {}}>
                    {val ? fmtShort(val) : "Select date"}
                  </p>
                </button>
              ))}
              {nights > 0 && (
                <div className="flex items-center px-2 border-l border-[#F0E6FF]">
                  <div className="text-center">
                    <p className="text-[9.5px] font-bold text-[#7A2267]">{nights}</p>
                    <p className="text-[7px] uppercase tracking-wider text-[#BCA8CC]">night{nights !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <button onClick={prevMonth}
            className="w-6 h-6 rounded-full flex items-center justify-center
              hover:bg-[#F0E6FF] border border-transparent hover:border-[#D0B0E8]/50
              transition-all duration-200">
            <svg viewBox="0 0 6 10" width="5" height="9" fill="none">
              <path d="M5 1L1 5l4 4" stroke="#7A2267" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="text-center">
            <span className={`text-[12px] font-semibold text-[#1A0A2E] tracking-wide ${lora.className}`}>
              {MONTH_NAMES[viewMonth]}
            </span>
            <span className="text-[10.5px] text-[#A890BC] ml-1.5 font-light">{viewYear}</span>
          </div>
          <button onClick={nextMonth}
            className="w-6 h-6 rounded-full flex items-center justify-center
              hover:bg-[#F0E6FF] border border-transparent hover:border-[#D0B0E8]/50
              transition-all duration-200">
            <svg viewBox="0 0 6 10" width="5" height="9" fill="none">
              <path d="M1 1l4 4-4 4" stroke="#7A2267" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Weekday headers ── */}
        <div className="grid grid-cols-7 px-2 pb-0.5">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[8px] font-bold text-[#CDB8E0] uppercase tracking-wide py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* ── Days grid ── */}
        <div className="px-2 pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const type = classifyDay(day);
                if (type === "empty") return <div key={di} />;
                const isPast  = type === "past";
                const isStart = type === "start";
                const isEnd   = type === "end";
                const inRange = type === "range";
                const isToday = type === "today";

                const leftHalf  = inRange || isEnd;
                const rightHalf = inRange || isStart;

                return (
                  <div key={di} className="relative flex items-center justify-center h-7">
                    {(leftHalf || rightHalf) && (
                      <>
                        {leftHalf && di > 0 && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-5 bg-[#F2E4FF]" />
                        )}
                        {rightHalf && di < 6 && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-5 bg-[#F2E4FF]" />
                        )}
                        {inRange && di > 0 && di < 6 && (
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-5 bg-[#F2E4FF]" />
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => !isPast && setHoverDay(day)}
                      onMouseLeave={() => setHoverDay(null)}
                      disabled={isPast}
                      className={`relative z-10 w-6 h-6 rounded-full text-[10.5px] flex items-center justify-center
                        transition-all duration-150 font-medium select-none
                        ${isPast ? "text-[#DDD0E8] cursor-not-allowed" : "cursor-pointer"}
                        ${isStart || isEnd
                          ? "bg-[#7A2267] text-white"
                          : inRange
                            ? "text-[#5A1C78] hover:bg-[#E8D4F8]"
                            : isToday
                              ? "text-[#7A2267] font-semibold hover:bg-[#F2E4FF]"
                              : !isPast
                                ? "text-[#3D2050] hover:bg-[#F2E4FF]"
                                : ""
                        }`}
                      style={isStart || isEnd ? {
                        boxShadow: "0 2px 8px rgba(122,34,103,0.3)"
                      } : {}}
                    >
                      {day.getDate()}
                      {isToday && !isStart && !isEnd && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7A2267]" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-[#F0E6FF]">
          <button
            onClick={() => { onCheckIn(""); onCheckOut(""); setPicking("in"); }}
            className="text-[8px] uppercase tracking-[0.15em] text-[#CCBAD8] hover:text-[#7A2267]
              transition-colors duration-200 font-semibold"
          >
            Clear
          </button>
          <span className="text-[8px] text-[#CCBAD8] uppercase tracking-widest">
            {picking === "in" ? "Select arrival" : "Select departure"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─── Guest Counter ────────────────────────────────────────────────────────────
function Counter({ label, value, min, max, onChange }) {
  return (
    <div>
      <label className={`block text-[8px] sm:text-[9px] tracking-[0.18em] uppercase text-[#9B70B0] font-semibold mb-1.5 ${josefin.className}`}>
        {label}
      </label>
      <div className="flex items-center bg-[#F2E8FF] border border-[#D0A8E8]/60 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={`w-10 h-[42px] flex items-center justify-center text-xl font-light
            text-[#4A1060] hover:bg-[#7A2267]/10 active:bg-[#7A2267]/20
            disabled:text-[#D0A8E8] disabled:cursor-not-allowed
            transition-colors duration-150 shrink-0 select-none ${josefin.className}`}
        >
          −
        </button>
        <div className="flex-1 text-center py-1">
          <span className={`block text-[14px] font-semibold text-[#3D0A52] leading-none ${josefin.className}`}>
            {value}
          </span>
          <span className={`block text-[8px] text-[#9B70B0] uppercase tracking-wider leading-none mt-0.5 ${josefin.className}`}>
            {label === "Adults"
              ? value === 1 ? "adult" : "adults"
              : value === 0 ? "none" : value === 1 ? "child" : "children"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={`w-10 h-[42px] flex items-center justify-center text-xl font-light
            text-[#4A1060] hover:bg-[#7A2267]/10 active:bg-[#7A2267]/20
            disabled:text-[#D0A8E8] disabled:cursor-not-allowed
            transition-colors duration-150 shrink-0 select-none ${josefin.className}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

const EASE = [0.16, 1, 0.3, 1];

// ─── Hero Component ────────────────────────────────────────────────────────────
export default function Hero() {
  const router = useRouter();
  const [mounted,      setMounted]      = useState(false);
  const [bookingType,  setBookingType]  = useState("night_stay"); // "day_long" | "night_stay"
  const [checkIn,      setCheckIn]      = useState("");
  const [checkOut,     setCheckOut]     = useState("");
  const [adults,       setAdults]       = useState(2);
  const [children,     setChildren]     = useState(0);
  const [calOpen,      setCalOpen]      = useState(false);
  const [calAnchor,    setCalAnchor]    = useState(null);
  const [calMode,      setCalMode]      = useState("in");

  const checkInBtnRef  = useRef(null);
  const checkOutBtnRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Reset dates when switching modes
  function switchType(type) {
    setBookingType(type);
    setCheckIn("");
    setCheckOut("");
    setCalOpen(false);
  }

  function handleDateClick(btnRef, mode) {
    if (calOpen && calAnchor === btnRef.current) { setCalOpen(false); return; }
    setCalAnchor(btnRef.current);
    setCalMode(mode);
    setCalOpen(true);
  }

  function handleCheckAvailability() {
    const p = new URLSearchParams();
    p.set("mode", bookingType);
    p.set("adults",   String(adults));
    p.set("children", String(children));
    if (bookingType === "day_long") {
      if (checkIn) p.set("date", checkIn);
    } else {
      if (checkIn)  p.set("checkIn",  checkIn);
      if (checkOut) p.set("checkOut", checkOut);
    }
    router.push(`/booking?${p.toString()}`);
  }

  const nights = nightCount(checkIn, checkOut);

  const stagger = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.25 } }
  };
  const fadeUp = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } }
  };
  const cardAnim = {
    hidden:  { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 1, delay: 0.5, ease: EASE } }
  };

  return (
    <div className="relative h-[calc(100dvh-60px)] sm:h-[calc(100dvh-68px)] min-h-[560px] w-full bg-[#050308] overflow-hidden
      selection:bg-[#7A2267] selection:text-white">

      {/* ── Background with Ken Burns ── */}
      <motion.div
        initial={{ scale: 1.07 }}
        animate={{ scale: 1 }}
        transition={{ duration: 14, ease: "easeOut" }}
        className="absolute inset-0 z-0"
      >
        <Image src="/hero.png" alt="Dhali's Amber Nivaas" fill priority quality={100}
          className="object-cover object-center" />
      </motion.div>

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(10,6,2,0.72) 0%, rgba(10,6,2,0.35) 45%, transparent 75%)" }} />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "55%", background: "linear-gradient(to top, rgba(10,6,2,0.55) 0%, rgba(10,6,2,0.15) 50%, transparent 100%)" }} />
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "25%", background: "linear-gradient(to bottom, rgba(10,6,2,0.3) 0%, transparent 100%)" }} />

      {/* ── Main layout ── */}
      <div className="relative z-20 w-full h-full max-w-[90rem] mx-auto
        px-5 sm:px-8 lg:px-14 xl:px-20
        flex flex-col lg:flex-row items-center lg:items-center justify-between gap-3 sm:gap-5 lg:gap-8
        pt-5 sm:pt-8 lg:pt-0">

        {/* ── LEFT: Hero Text ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col w-full lg:w-[52%] xl:w-[55%]
            flex-1 lg:flex-none
            items-center lg:items-start
            justify-center lg:justify-center lg:h-full
            text-center lg:text-left"
        >
          {/* Headline */}
          <div className="mb-3 sm:mb-5 lg:mb-7">
            <motion.div variants={fadeUp}
              className={`text-[2rem] sm:text-[3.2rem] lg:text-[3.6rem] xl:text-[4.2rem]
                text-white/80 leading-[1.12] tracking-[0.04em] font-[300] ${cormorant.className}`}>
              Where there&apos;s unity,
            </motion.div>
            <motion.div variants={fadeUp}
              className={`text-[2.4rem] sm:text-[3.9rem] lg:text-[4.4rem] xl:text-[5.2rem]
                leading-[1.06] mt-0 sm:mt-1
                bg-gradient-to-r from-white via-white/90 to-white/65 bg-clip-text text-transparent
                italic font-[400] ${lora.className}`}>
              there&apos;s luxury.
            </motion.div>
          </div>

          {/* Subtitle — desktop only */}
          <motion.div variants={fadeUp} className="hidden sm:flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-6 h-px bg-white/25 hidden lg:block shrink-0" />
            <p className={`text-[11.5px] sm:text-[12.5px] text-white/40 leading-relaxed tracking-[0.06em] ${josefin.className}`}>
              Serenity &amp; world-class hospitality, tailored for you.
            </p>
          </motion.div>

        </motion.div>

        {/* ── RIGHT: Reserve Card ── */}
        <motion.div
          variants={cardAnim}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-[42%] xl:w-[38%] lg:h-full lg:flex lg:items-center lg:justify-end
            pb-3 sm:pb-6 lg:pb-0"
        >
          <div className={`w-full lg:max-w-[360px] bg-[#F9F0FE] rounded-2xl overflow-hidden
            shadow-[0_8px_40px_rgba(0,0,0,0.22)] ${josefin.className}`}>

            <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-4 sm:pb-5">

              {/* Header */}
              <h3 className={`text-[13px] font-semibold text-[#3D0A52] tracking-wide mb-3 ${lora.className}`}>
                Reserve Your Stay
              </h3>

              {/* Mode toggle */}
              <div className="flex gap-1.5 p-1 bg-[#EDD8FF]/60 rounded-xl mb-3 sm:mb-4">
                {[
                  { key: "day_long",   label: "Day Long"   },
                  { key: "night_stay", label: "Night Stay" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => switchType(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                      text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-all duration-200
                      ${bookingType === key
                        ? "bg-[#7A2267] text-white shadow-[0_2px_8px_rgba(122,34,103,0.35)]"
                        : "text-[#9B70B0] hover:text-[#7A2267]"
                      }`}
                  >
                    <span className={`transition-transform duration-200 ${bookingType === key ? "scale-90" : "scale-75 opacity-60"}`}>
                      {key === "day_long"
                        ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                        : <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      }
                    </span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Date fields */}
              <AnimatePresence mode="wait">
                {bookingType === "day_long" ? (
                  /* ── Day Long: single date ── */
                  <motion.div key="daylong"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
                    className="mb-3 sm:mb-4"
                  >
                    <button
                      ref={checkInBtnRef}
                      type="button"
                      onClick={() => handleDateClick(checkInBtnRef, "in")}
                      className={`w-full px-3 py-3 rounded-xl text-left transition-all duration-200 border
                        ${calOpen && calAnchor === checkInBtnRef.current
                          ? "bg-[#EDD8FF] border-[#7A2267]/30 ring-1 ring-[#7A2267]/12"
                          : "bg-[#F2E8FF] border-[#D0A8E8]/60 hover:border-[#7A2267]/35 hover:bg-[#EDD8FF]"}`}
                    >
                      <p className="text-[8px] uppercase tracking-[0.15em] text-[#9B70B0] font-medium mb-0.5">
                        Visit Date
                      </p>
                      <p className={`text-[13px] font-semibold leading-none ${checkIn ? "text-[#3D0A52]" : "text-[#CDB4E0]"}`}>
                        {checkIn ? fmtFull(checkIn) : "Select a date"}
                      </p>
                    </button>
                  </motion.div>
                ) : (
                  /* ── Night Stay: two dates ── */
                  <motion.div key="night-stay"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
                    className="mb-3 sm:mb-4"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        ref={checkInBtnRef}
                        type="button"
                        onClick={() => handleDateClick(checkInBtnRef, "in")}
                        className={`w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 border group
                          ${calOpen && calAnchor === checkInBtnRef.current
                            ? "bg-[#EDD8FF] border-[#7A2267]/30 ring-1 ring-[#7A2267]/12"
                            : "bg-[#F2E8FF] border-[#D0A8E8]/60 hover:border-[#7A2267]/35 hover:bg-[#EDD8FF]"}`}
                      >
                        <p className="text-[8px] uppercase tracking-[0.15em] text-[#9B70B0] font-medium mb-0.5">Arrival</p>
                        <p className={`text-[12.5px] font-semibold leading-none ${checkIn ? "text-[#3D0A52]" : "text-[#CDB4E0]"}`}>
                          {checkIn ? fmtShort(checkIn) : "Add date"}
                        </p>
                      </button>
                      <button
                        ref={checkOutBtnRef}
                        type="button"
                        onClick={() => handleDateClick(checkOutBtnRef, "out")}
                        className={`w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 border group
                          ${calOpen && calAnchor === checkOutBtnRef.current
                            ? "bg-[#EDD8FF] border-[#7A2267]/30 ring-1 ring-[#7A2267]/12"
                            : "bg-[#F2E8FF] border-[#D0A8E8]/60 hover:border-[#7A2267]/35 hover:bg-[#EDD8FF]"}`}
                      >
                        <p className="text-[8px] uppercase tracking-[0.15em] text-[#9B70B0] font-medium mb-0.5">Departure</p>
                        <p className={`text-[12.5px] font-semibold leading-none ${checkOut ? "text-[#3D0A52]" : "text-[#CDB4E0]"}`}>
                          {checkOut ? fmtShort(checkOut) : "Add date"}
                        </p>
                      </button>
                    </div>
                    <AnimatePresence>
                      {nights > 0 && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                          className={`text-[10.5px] font-semibold text-[#7A2267] text-center mt-2 ${josefin.className}`}
                        >
                          {nights} {nights === 1 ? "night" : "nights"}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guest Counts */}
              <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                <Counter label="Adults" value={adults} min={1} max={20} onChange={setAdults} />
                <Counter label="Children" value={children} min={0} max={10} onChange={setChildren} />
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckAvailability}
                className={`group w-full flex items-center justify-center gap-3
                  py-3 rounded-xl bg-[#7A2267] hover:bg-[#5C1A4D]
                  transition-all duration-300
                  shadow-[0_4px_20px_rgba(122,34,103,0.3)]
                  hover:shadow-[0_6px_28px_rgba(122,34,103,0.5)]
                  active:scale-[0.98]`}
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white">
                  {bookingType === "day_long" ? "Check Availability" : "Check Availability"}
                </span>
                <svg viewBox="0 0 20 20" width="13" height="13" fill="none"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 opacity-80">
                  <path d="M4 10h12M10 4l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Calendar Portal ── */}
      {calOpen && (
        <PremiumCalendar
          checkIn={checkIn}
          checkOut={bookingType === "day_long" ? checkIn : checkOut}
          onCheckIn={(v) => {
            setCheckIn(v);
            if (bookingType === "day_long") {
              setCheckOut(v); // same day for day long
              setCalOpen(false);
            }
          }}
          onCheckOut={(v) => {
            if (bookingType !== "day_long") setCheckOut(v);
          }}
          anchorEl={calAnchor}
          onClose={() => setCalOpen(false)}
          initialPicking={bookingType === "day_long" ? "in" : calMode}
          singleDate={bookingType === "day_long"}
        />
      )}
    </div>
  );
}
