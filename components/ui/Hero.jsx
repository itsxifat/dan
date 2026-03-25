"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";

const playfair   = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant  = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

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
function calcPos(anchorEl, calW = 320, calH = 420) {
  if (!anchorEl || typeof window === "undefined") return { top: 0, left: 0 };
  const r   = anchorEl.getBoundingClientRect();
  const vh  = window.innerHeight;
  const vw  = window.innerWidth;
  const spB = vh - r.bottom - 12;
  const spT = r.top - 12;
  // open upward if not enough space below
  const top = (spB < calH && spT > spB)
    ? Math.max(8, r.top - calH - 8)
    : r.bottom + 8;
  let left = r.left;
  if (left + calW > vw - 8) left = vw - calW - 8;
  if (left < 8) left = 8;
  return { top, left };
}

// ─── Premium Dark Calendar ─────────────────────────────────────────────────────
function PremiumCalendar({ checkIn, checkOut, onCheckIn, onCheckOut, anchorEl, onClose }) {
  const today    = todayDate();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [picking,   setPicking]   = useState(checkIn && !checkOut ? "out" : "in");
  const [hoverDay,  setHoverDay]  = useState(null);
  const [pos,       setPos]       = useState({ top: 0, left: 0 });
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

  // rows for week separators
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const nights = nightCount(checkIn, checkOut);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={calRef}
        key="cal"
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 99999, width: 320 }}
        className="rounded-2xl overflow-hidden"
        // Dark glass calendar
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#7A2267]/40 via-transparent to-[#7A2267]/20 pointer-events-none" />
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(15,8,28,0.97) 0%, rgba(26,10,42,0.97) 100%)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(122,34,103,0.35), 0 0 40px rgba(122,34,103,0.12) inset",
          }}
        >
          {/* Subtle dot-grid texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

          {/* ── Picking tabs ── */}
          <div className="relative flex border-b border-white/[0.07]">
            {[
              { key: "in",  label: "Arrival",   val: checkIn  },
              { key: "out", label: "Departure",  val: checkOut },
            ].map(({ key, label, val }) => (
              <button
                key={key}
                onClick={() => setPicking(key)}
                className={`flex-1 px-4 py-3 text-left transition-all duration-200 relative
                  ${picking === key ? "bg-[#7A2267]/20" : "hover:bg-white/[0.04]"}`}
              >
                {picking === key && (
                  <motion.div layoutId="calTab"
                    className="absolute bottom-0 inset-x-0 h-px bg-[#7A2267]"
                    transition={{ duration: 0.25 }} />
                )}
                <p className={`text-[8.5px] uppercase tracking-[0.22em] font-semibold mb-0.5
                  ${picking === key ? "text-[#c084b8]" : "text-white/30"}`}>
                  {label}
                </p>
                <p className={`text-[12px] font-medium transition-colors duration-200
                  ${val ? (picking === key ? "text-white" : "text-white/60") : "text-white/25"}`}
                  style={val ? cormorant.style : {}}>
                  {val ? fmtShort(val) : "Select date"}
                </p>
              </button>
            ))}
            {/* Night badge */}
            {nights > 0 && (
              <div className="flex items-center px-3 border-l border-white/[0.07]">
                <div className="text-center">
                  <p className="text-[11px] font-bold text-[#c084b8]">{nights}</p>
                  <p className="text-[8px] uppercase tracking-wider text-white/30">night{nights !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Month navigation ── */}
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={prevMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center
                bg-white/[0.06] hover:bg-[#7A2267]/30 border border-white/[0.08] hover:border-[#7A2267]/40
                transition-all duration-200 group">
              <svg viewBox="0 0 6 10" width="6" height="10" fill="none">
                <path d="M5 1L1 5l4 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-all" />
              </svg>
            </button>
            <div className="text-center">
              <span className={`text-[14px] font-semibold text-white tracking-wide ${playfair.className}`}>
                {MONTH_NAMES[viewMonth]}
              </span>
              <span className="text-[12px] text-white/40 ml-2">{viewYear}</span>
            </div>
            <button onClick={nextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center
                bg-white/[0.06] hover:bg-[#7A2267]/30 border border-white/[0.08] hover:border-[#7A2267]/40
                transition-all duration-200 group">
              <svg viewBox="0 0 6 10" width="6" height="10" fill="none">
                <path d="M1 1l4 4-4 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-all" />
              </svg>
            </button>
          </div>

          {/* ── Weekday headers ── */}
          <div className="grid grid-cols-7 px-3 pb-1.5">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-[#7A2267]/70 uppercase tracking-wider py-1">
                {d}
              </div>
            ))}
          </div>

          {/* ── Days grid ── */}
          <div className="px-3 pb-3">
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

                  // Range strip backgrounds (left/right halves)
                  const leftHalf  = inRange || isEnd;
                  const rightHalf = inRange || isStart;

                  return (
                    <div key={di} className="relative flex items-center justify-center h-9">
                      {/* Range strip */}
                      {(leftHalf || rightHalf) && (
                        <>
                          {leftHalf && di > 0 && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-7 bg-[#7A2267]/15" />
                          )}
                          {rightHalf && di < 6 && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-7 bg-[#7A2267]/15" />
                          )}
                          {/* Full range for middle cells */}
                          {inRange && di > 0 && di < 6 && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 bg-[#7A2267]/15" />
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleDayClick(day)}
                        onMouseEnter={() => !isPast && setHoverDay(day)}
                        onMouseLeave={() => setHoverDay(null)}
                        disabled={isPast}
                        className={`relative z-10 w-8 h-8 rounded-full text-[12px] flex items-center justify-center
                          transition-all duration-150 font-medium select-none
                          ${isPast ? "text-white/15 cursor-not-allowed" : "cursor-pointer"}
                          ${isStart || isEnd
                            ? "bg-[#7A2267] text-white"
                            : inRange
                              ? "text-white/80 hover:bg-[#7A2267]/30"
                              : isToday && !isPast
                                ? "text-[#c084b8] ring-1 ring-[#7A2267]/50 hover:bg-[#7A2267]/20"
                                : !isPast
                                  ? "text-white/60 hover:bg-[#7A2267]/20 hover:text-white"
                                  : ""
                          }`}
                        style={isStart || isEnd ? {
                          boxShadow: "0 0 16px rgba(122,34,103,0.6), 0 0 4px rgba(122,34,103,0.8)"
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
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06]">
            <button
              onClick={() => { onCheckIn(""); onCheckOut(""); setPicking("in"); }}
              className="text-[9px] uppercase tracking-[0.15em] text-white/25 hover:text-[#c084b8]
                transition-colors duration-200 font-medium"
            >
              Clear
            </button>
            <span className="text-[9px] text-white/25 uppercase tracking-widest">
              {picking === "in" ? "Select arrival" : "Select departure"}
            </span>
          </div>
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
      <label className={`block text-[8px] sm:text-[9px] tracking-[0.18em] uppercase text-[#9B8BAB] font-semibold mb-1.5 ${montserrat.className}`}>
        {label}
      </label>
      <div className="flex items-center bg-[#F8F4FA] border border-[#E4DAE8] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={`w-10 h-[42px] flex items-center justify-center text-xl font-light
            text-[#7A2267] hover:bg-[#7A2267]/10 active:bg-[#7A2267]/20
            disabled:text-[#D4CAD8] disabled:cursor-not-allowed
            transition-colors duration-150 shrink-0 select-none ${montserrat.className}`}
        >
          −
        </button>
        <div className="flex-1 text-center py-1">
          <span className={`block text-[14px] font-semibold text-[#1a1410] leading-none ${montserrat.className}`}>
            {value}
          </span>
          <span className={`block text-[8px] text-[#B0A0B8] uppercase tracking-wider leading-none mt-0.5 ${montserrat.className}`}>
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
            text-[#7A2267] hover:bg-[#7A2267]/10 active:bg-[#7A2267]/20
            disabled:text-[#D4CAD8] disabled:cursor-not-allowed
            transition-colors duration-150 shrink-0 select-none ${montserrat.className}`}
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
  const [mounted,  setMounted]  = useState(false);
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [calOpen,  setCalOpen]  = useState(false);
  const [calAnchor, setCalAnchor] = useState(null);

  const checkInBtnRef  = useRef(null);
  const checkOutBtnRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  function openCalendar(btnRef) {
    setCalAnchor(btnRef.current);
    setCalOpen(true);
  }

  function handleCheckAvailability() {
    const p = new URLSearchParams();
    if (checkIn)  p.set("checkIn",  checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    p.set("adults",   adults);
    p.set("children", children);
    router.push(`/booking?${p.toString()}`);
  }

  const nights = nightCount(checkIn, checkOut);

  const stagger = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.25 } }
  };
  const fadeUp = {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } }
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

      {/* ── Gradient overlays tuned for warm golden image ── */}
      {/* Left warm shadow so text stays legible */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(10,6,2,0.72) 0%, rgba(10,6,2,0.35) 45%, transparent 75%)" }} />
      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "55%", background: "linear-gradient(to top, rgba(10,6,2,0.55) 0%, rgba(10,6,2,0.15) 50%, transparent 100%)" }} />
      {/* Very subtle top shadow for depth */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: "25%", background: "linear-gradient(to bottom, rgba(10,6,2,0.3) 0%, transparent 100%)" }} />

      {/* ── Main layout ── */}
      <div className="relative z-20 w-full h-full max-w-[90rem] mx-auto
        px-5 sm:px-8 lg:px-14 xl:px-20
        flex flex-col lg:flex-row items-center justify-between gap-8
        pt-6 sm:pt-8 lg:pt-0">

        {/* ── LEFT: Hero Text ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col w-full lg:w-[52%] xl:w-[55%]
            lg:justify-center lg:h-full
            text-center lg:text-left
            pt-4 sm:pt-8 lg:pt-0"
        >
          {/* Headline */}
          <div className="mb-4 sm:mb-6 lg:mb-7">
            <motion.div variants={fadeUp}
              className={`text-[2.15rem] sm:text-[3.2rem] lg:text-[3.6rem] xl:text-[4.2rem]
                text-white leading-[1.08] tracking-[-0.01em] font-normal ${playfair.className}`}>
              Where there&apos;s unity,
            </motion.div>
            <motion.div variants={fadeUp}
              className={`text-[2.5rem] sm:text-[3.8rem] lg:text-[4.2rem] xl:text-[5rem]
                leading-[1.02] mt-0.5 sm:mt-2
                bg-gradient-to-r from-white/95 via-white/80 to-white/60 bg-clip-text text-transparent
                ${cormorant.className}`}>
              there&apos;s luxury.
            </motion.div>
          </div>

          {/* Subtitle */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-6 h-px bg-[#7A2267]/60 hidden lg:block shrink-0" />
            <p className={`text-[11px] sm:text-[13px] text-white/50 leading-relaxed font-light ${montserrat.className}`}>
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
            pb-6 sm:pb-8 lg:pb-0"
        >
          <div className={`w-full lg:max-w-[360px] bg-white rounded-2xl overflow-hidden
            shadow-[0_20px_60px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] ${montserrat.className}`}>

            {/* Purple top accent */}
            <div className="h-[3px] bg-[#7A2267]" />

            <div className="px-5 pt-4 pb-5">

              {/* Minimal header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[13px] font-semibold text-[#1a1410] tracking-wide ${playfair.className}`}>
                  Reserve Your Stay
                </h3>
                <AnimatePresence>
                  {nights > 0 && (
                    <motion.span
                      key="nights"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2 }}
                      className={`text-[11px] font-semibold text-[#7A2267] bg-[#7A2267]/8 px-2.5 py-1 rounded-full ${montserrat.className}`}
                    >
                      {nights} {nights === 1 ? "night" : "nights"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Date row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Check-in */}
                <button
                  ref={checkInBtnRef}
                  type="button"
                  onClick={() => openCalendar(checkInBtnRef)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 border group
                    ${calOpen ? "bg-[#F5EDF5] border-[#7A2267]/40 ring-1 ring-[#7A2267]/10"
                      : "bg-[#F8F5FB] border-[#EDE5F0] hover:border-[#7A2267]/35 hover:bg-[#F5EDF5]"}`}
                >
                  <p className="text-[8px] uppercase tracking-[0.15em] text-[#B0A0BA] font-medium mb-0.5">Arrival</p>
                  <p className={`text-[12.5px] font-semibold leading-none transition-colors duration-200
                    ${checkIn ? "text-[#1a1410]" : "text-[#CFC3D6]"}`}>
                    {checkIn ? fmtShort(checkIn) : "Add date"}
                  </p>
                </button>

                {/* Check-out */}
                <button
                  ref={checkOutBtnRef}
                  type="button"
                  onClick={() => openCalendar(checkOutBtnRef)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 border group
                    ${calOpen ? "bg-[#F5EDF5] border-[#7A2267]/40 ring-1 ring-[#7A2267]/10"
                      : "bg-[#F8F5FB] border-[#EDE5F0] hover:border-[#7A2267]/35 hover:bg-[#F5EDF5]"}`}
                >
                  <p className="text-[8px] uppercase tracking-[0.15em] text-[#B0A0BA] font-medium mb-0.5">Departure</p>
                  <p className={`text-[12.5px] font-semibold leading-none transition-colors duration-200
                    ${checkOut ? "text-[#1a1410]" : "text-[#CFC3D6]"}`}>
                    {checkOut ? fmtShort(checkOut) : "Add date"}
                  </p>
                </button>
              </div>

              {/* Guest counters */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Counter label="Adults"   value={adults}   min={1} max={10} onChange={setAdults} />
                <Counter label="Children" value={children} min={0} max={6}  onChange={setChildren} />
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckAvailability}
                className={`group w-full flex items-center justify-center gap-3
                  py-3 rounded-xl
                  bg-[#7A2267] hover:bg-[#8a256f]
                  transition-all duration-300
                  shadow-[0_4px_20px_rgba(122,34,103,0.3)]
                  hover:shadow-[0_6px_28px_rgba(122,34,103,0.45)]
                  active:scale-[0.98]`}
              >
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white">
                  Check Availability
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

      {/* ── Premium Calendar Portal ── */}
      {calOpen && (
        <PremiumCalendar
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckIn={setCheckIn}
          onCheckOut={setCheckOut}
          anchorEl={calAnchor}
          onClose={() => setCalOpen(false)}
        />
      )}
    </div>
  );
}
