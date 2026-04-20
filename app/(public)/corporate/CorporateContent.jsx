"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lora, Josefin_Sans } from "next/font/google";
import { submitVisitRequest } from "@/actions/corporate/corporateActions";

gsap.registerPlugin(ScrollTrigger);

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
};

// ── Static fallback venues ───────────────────────────────────────────────────
const FALLBACK_VENUES = [
  {
    _id: "big-field", name: "Grand Outdoor Field", capacity: "Up to 15,000",
    badge: "Largest Venue",
    description: "Our flagship open-air field — an expansive, fully serviced outdoor space perfect for large-scale corporate events, product launches, and grand corporate galas.",
    features: ["15,000 persons", "Stage & sound setup", "Flood lighting", "Helipad access"],
    iconType: "field",
  },
  {
    _id: "small-field", name: "Garden Field", capacity: "Up to 3,000",
    description: "A lush garden venue with a natural canopy feel — ideal for mid-size corporate gatherings, team-building retreats, and outdoor brand activations.",
    features: ["3,000 persons", "Natural landscaping", "Flexible layout", "Catering ready"],
    iconType: "garden",
  },
  {
    _id: "helipad-field", name: "Helipad Field", capacity: "Up to 1,000",
    badge: "VIP Exclusive",
    description: "An exclusive open-air area featuring a certified helipad — the ultimate premium setting for VIP arrivals, executive retreats, and high-profile corporate functions.",
    features: ["1,000 persons", "Helicopter landing pad", "VIP access zone", "Elite ambiance"],
    iconType: "helipad",
  },
  {
    _id: "banquet-side-field", name: "Banquet Garden", capacity: "Up to 2,000",
    description: "A beautifully landscaped open-air garden adjacent to the Banquet Hall — perfect for cocktail receptions, evening corporate dinners, and pre-event gatherings.",
    features: ["2,000 persons", "Garden setting", "Evening lighting", "Adjacent to hall"],
    iconType: "garden2",
  },
  {
    _id: "small-conf", name: "Conference Suite", capacity: "Up to 50",
    description: "A fully equipped intimate conference room designed for boardroom meetings, executive strategy sessions, and focused workshop environments.",
    features: ["50 persons", "Full AV system", "Video conferencing", "Breakout alcove"],
    iconType: "conference",
  },
  {
    _id: "banquet-hall", name: "Grand Banquet Hall", capacity: "Up to 800",
    badge: "Most Popular",
    description: "Our magnificent banquet hall adorned with crystal chandeliers and premium décor — the premier choice for formal corporate galas, award nights, and grand dinners.",
    features: ["800 persons", "Stage & podium", "Grand décor", "Full AV & lighting"],
    iconType: "banquet",
  },
  {
    _id: "big-conf", name: "Premier Conference Hall", capacity: "Up to 200",
    description: "Our flagship conference facility with tiered seating, state-of-the-art audio-visual systems, and a professional ambiance befitting any corporate milestone event.",
    features: ["200 persons", "Tiered seating", "Smart AV system", "Breakout rooms"],
    iconType: "bigconf",
  },
];

// ── Static fallback brands ───────────────────────────────────────────────────
const FALLBACK_BRANDS = [
  { _id: "1", name: "Grameen Bank",      industry: "Banking & Finance" },
  { _id: "2", name: "BRAC",              industry: "Development Org." },
  { _id: "3", name: "Square Group",      industry: "FMCG & Pharma" },
  { _id: "4", name: "PRAN-RFL Group",    industry: "Food & Beverages" },
  { _id: "5", name: "Bangladesh Bank",   industry: "Central Banking" },
  { _id: "6", name: "Dutch-Bangla Bank", industry: "Banking" },
  { _id: "7", name: "Robi Axiata",       industry: "Telecom" },
  { _id: "8", name: "Bashundhara Group", industry: "Real Estate" },
  { _id: "9", name: "Meghna Group",      industry: "Industrial" },
  { _id: "10", name: "ACI Limited",      industry: "FMCG & Health" },
];

// ── Corporate services ───────────────────────────────────────────────────────
const SERVICES = [
  { icon: "catering",    title: "In-House Catering",     desc: "World-class culinary team capable of serving up to 15,000 guests — from working lunches to elaborate banquet menus tailored to your brand." },
  { icon: "av",          title: "AV & Tech Setup",        desc: "Professional audio-visual systems, LED walls, stage lighting, microphones, and high-speed Wi-Fi ensuring flawless presentations." },
  { icon: "coordinator", title: "Dedicated Coordinator",  desc: "Your personal event coordinator handles every detail from planning to execution so you can focus entirely on your guests." },
  { icon: "transport",   title: "Guest Transport",        desc: "Fleet of vehicles and valet services to ensure smooth arrival and departure for all attendees, including VIP transfers." },
  { icon: "stay",        title: "Group Accommodation",    desc: "Block reservations available for overnight corporate retreats with exclusive group rates across our full range of rooms and suites." },
  { icon: "branding",    title: "Event Branding",         desc: "On-site branding, backdrop setups, custom signage, and décor coordination to perfectly reflect your corporate identity." },
];

// ── Venue icon SVGs ───────────────────────────────────────────────────────────
function VenueIcon({ type }) {
  const icons = {
    field: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 4 5 3-4 4 7" /><path d="M21 21H3" /><circle cx="18" cy="5" r="2" />
      </svg>
    ),
    garden: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" /><path d="M12 12C12 7 7 4 3 5c1 4 4 7 9 7z" /><path d="M12 12c0-5 5-8 9-7-1 4-4 7-9 7z" />
      </svg>
    ),
    helipad: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M8 8h3v8M11 12h2M15 8v8" />
      </svg>
    ),
    garden2: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V8" /><path d="M5 10c0-3.5 3-6 7-6s7 2.5 7 6c-2 1-5 1.5-7 1.5S7 11 5 10z" /><path d="M2 20c0-3 4-5 10-5s10 2 10 5" />
      </svg>
    ),
    conference: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
    banquet: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19h16M4 5h16M8 5v14M16 5v14" /><path d="M12 2l1.5 3h3l-2.5 2 1 3L12 8.5 9 10l1-3L7.5 5h3z" />
      </svg>
    ),
    bigconf: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10M12 10l-4 4M12 10l4 4" /><path d="M5 6h14M8 3h8" /><rect x="3" y="18" width="18" height="3" rx="1" />
      </svg>
    ),
  };
  return icons[type] || icons.field;
}

// ── Service icon SVGs ─────────────────────────────────────────────────────────
function ServiceIcon({ type }) {
  const icons = {
    catering: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
      </svg>
    ),
    av: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4M10 8l6 3-6 3V8z" />
      </svg>
    ),
    coordinator: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M16 11l2 2 4-4" />
      </svg>
    ),
    transport: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    stay: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" />
      </svg>
    ),
    branding: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /><path d="M8.5 3.5C10 2.5 12 2 14 2.5" />
      </svg>
    ),
  };
  return icons[type] || icons.catering;
}

// ── Form constants ────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  "Conference / Seminar", "Product Launch", "Corporate Gala / Dinner",
  "Team Building / Retreat", "Annual General Meeting", "Training & Workshop",
  "Award Ceremony", "Exhibition / Trade Show", "Other",
];
const VISIT_TIMES = [
  { value: "morning",   label: "Morning",   sub: "9:00 AM – 12:00 PM" },
  { value: "afternoon", label: "Afternoon", sub: "12:00 PM – 5:00 PM" },
  { value: "evening",   label: "Evening",   sub: "5:00 PM – 8:00 PM" },
];
const BLANK = {
  fullName: "", company: "", designation: "", email: "",
  phone: "", eventType: "", eventSummary: "", visitDate: "",
  visitTime: "", visitorCount: "", message: "",
};
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── Floating label input ───────────────────────────────────────────────────────
function FInput({ label, type = "text", value, onChange, required, autoComplete, placeholder }) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div className="relative">
      <label className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium z-10
        ${active ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-1/2 -translate-y-1/2 text-[12.5px] text-white/30"}`}>
        {label}{required && <span className="text-[#7A2267] ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} required={required} autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={onChange}
        placeholder={active ? (placeholder || "") : ""}
        className={`${josefin.className} w-full rounded-xl px-4 text-[13px] text-white/85 outline-none
          transition-all duration-200 font-light min-h-13
          ${active ? "pt-5 pb-2" : "pt-3.5 pb-3.5"}
          placeholder:text-white/20`}
        style={{
          border: `1px solid ${focused ? "rgba(122,34,103,0.55)" : "rgba(255,255,255,0.09)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(122,34,103,0.09), inset 0 1px 0 rgba(255,255,255,0.04)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
          background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.05)",
        }}
      />
    </div>
  );
}

// ── Floating label textarea ────────────────────────────────────────────────────
function FTextarea({ label, value, onChange, required, rows = 3, placeholder }) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div className="relative">
      <label className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium z-10
        ${active ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-4 text-[12.5px] text-white/30"}`}>
        {label}{required && <span className="text-[#7A2267] ml-0.5">*</span>}
      </label>
      <textarea
        rows={rows} value={value} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={onChange}
        placeholder={active ? (placeholder || "") : ""}
        className={`${josefin.className} w-full rounded-xl px-4 text-[13px] text-white/85 outline-none
          transition-all duration-200 font-light resize-none
          ${active ? "pt-6 pb-3" : "pt-4 pb-4"}
          placeholder:text-white/20`}
        style={{
          border: `1px solid ${focused ? "rgba(122,34,103,0.55)" : "rgba(255,255,255,0.09)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(122,34,103,0.09), inset 0 1px 0 rgba(255,255,255,0.04)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
          background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.05)",
        }}
      />
    </div>
  );
}

// ── Custom dropdown ────────────────────────────────────────────────────────────
function FSelect({ label, value, onChange, options, required }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => (o.value ?? o) === value);
  const displayLabel = selected ? (selected.label ?? selected) : null;
  const active = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${josefin.className} w-full text-left flex items-center justify-between gap-2
          rounded-xl px-4 min-h-13 text-[13px] font-light outline-none transition-all duration-200`}
        style={{
          border: `1px solid ${open ? "rgba(122,34,103,0.55)" : "rgba(255,255,255,0.09)"}`,
          boxShadow: open ? "0 0 0 3px rgba(122,34,103,0.09), inset 0 1px 0 rgba(255,255,255,0.04)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
          background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.05)",
        }}
      >
        {/* Floating label */}
        <span className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium
          ${active || open ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-1/2 -translate-y-1/2 text-[12.5px] text-white/30"}`}>
          {label}{required && <span className="text-[#7A2267] ml-0.5">*</span>}
        </span>
        <span className={`${active ? "pt-4 pb-0.5" : ""} text-white/85 truncate pr-2`}>
          {displayLabel || ""}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          viewBox="0 0 10 6" width="10" height="6" fill="none"
          className="text-white/30 shrink-0">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl overflow-hidden
              shadow-[0_16px_48px_rgba(0,0,0,0.5)] border border-white/8"
            style={{ background: "#17101f" }}
          >
            {options.map((opt) => {
              const val = opt.value ?? opt;
              const lbl = opt.label ?? opt;
              const sub = opt.sub ?? null;
              const sel = value === val;
              return (
                <button
                  key={val} type="button"
                  onClick={() => { onChange(val); setOpen(false); }}
                  className={`${josefin.className} w-full text-left px-4 py-3 flex items-center justify-between gap-3
                    text-[12.5px] font-light transition-colors duration-150
                    ${sel ? "text-[#7A2267] bg-[#7A2267]/10" : "text-white/60 hover:text-white/90 hover:bg-white/5"}`}
                >
                  <span>{lbl}</span>
                  {sub && <span className={`text-[10px] ${sel ? "text-[#7A2267]/60" : "text-white/25"} shrink-0`}>{sub}</span>}
                  {sel && (
                    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" className="shrink-0 ml-auto">
                      <path d="M2 6l3 3 5-5" stroke="#7A2267" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Custom calendar / date input ───────────────────────────────────────────────
function FDateInput({ value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const formatted = value ? (() => {
    const [y, m, d] = value.split("-");
    return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  })() : "";

  // Calendar state
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const firstDay  = new Date(view.year, view.month, 1).getDay();
  const daysCount = new Date(view.year, view.month + 1, 0).getDate();
  const cells     = [...Array(firstDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)];

  const goBack = () => view.month === 0 ? setView({ year: view.year - 1, month: 11 }) : setView({ ...view, month: view.month - 1 });
  const goFwd  = () => view.month === 11 ? setView({ year: view.year + 1, month: 0 }) : setView({ ...view, month: view.month + 1 });

  const select = (day) => {
    const m = String(view.month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${view.year}-${m}-${d}`);
    setOpen(false);
  };

  const active = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${josefin.className} w-full text-left flex items-center justify-between gap-2
          rounded-xl px-4 min-h-13 text-[13px] font-light outline-none transition-all duration-200`}
        style={{
          border: `1px solid ${open ? "rgba(122,34,103,0.55)" : "rgba(255,255,255,0.09)"}`,
          boxShadow: open ? "0 0 0 3px rgba(122,34,103,0.09)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
          background: open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.05)",
        }}
      >
        <span className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium
          ${active || open ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-1/2 -translate-y-1/2 text-[12.5px] text-white/30"}`}>
          Visit Date{required && <span className="text-[#7A2267] ml-0.5">*</span>}
        </span>
        <span className={`${active ? "pt-4 pb-0.5" : ""} text-white/85`}>{formatted}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-white/25 shrink-0">
          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 z-50 mt-2 w-60 rounded-xl overflow-hidden
              shadow-[0_16px_48px_rgba(0,0,0,0.6)] border border-white/8"
            style={{ background: "#17101f" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/6">
              <button onClick={goBack} type="button"
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/40
                  hover:text-[#7A2267] hover:bg-[#7A2267]/10 transition-all duration-150 text-sm leading-none">
                ‹
              </button>
              <span className={`${josefin.className} text-[11px] font-semibold text-white/80 tracking-wide`}>
                {MONTHS[view.month]} {view.year}
              </span>
              <button onClick={goFwd} type="button"
                className="w-6 h-6 rounded-full flex items-center justify-center text-white/40
                  hover:text-[#7A2267] hover:bg-[#7A2267]/10 transition-all duration-150 text-sm leading-none">
                ›
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-2.5 pt-2">
              {WEEK.map((d) => (
                <div key={d} className={`${josefin.className} text-center text-[7.5px] font-semibold text-white/20 uppercase tracking-wider py-0.5`}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 px-2.5 pb-3">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const ds = `${view.year}-${String(view.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isSel   = value === ds;
                const isPast  = ds <= todayStr;
                const isToday = ds === todayStr;
                return (
                  <button key={i} type="button" disabled={isPast} onClick={() => !isPast && select(day)}
                    className={`${josefin.className} w-full aspect-square rounded-md text-[11px] font-medium
                      flex items-center justify-center transition-all duration-150
                      ${isSel   ? "bg-[#7A2267] text-white shadow-[0_0_10px_rgba(122,34,103,0.5)]"
                      : isToday ? "bg-[#7A2267]/12 text-[#7A2267] border border-[#7A2267]/30"
                      : isPast  ? "text-white/12 cursor-not-allowed"
                      :           "text-white/55 hover:bg-white/8 hover:text-white"
                      }`}>
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            {value && (
              <div className="px-3 py-2 border-t border-white/6 flex items-center justify-between">
                <span className={`${josefin.className} text-[9px] text-[#7A2267]/70 uppercase tracking-wider`}>Selected</span>
                <span className={`${josefin.className} text-[10px] text-white/70 font-medium`}>{formatted}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Visit Form ─────────────────────────────────────────────────────────────────
function VisitForm() {
  const [form, setForm]     = useState(BLANK);
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onInput  = (k) => (e) => setField(k, e.target.value);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading"); setErrMsg("");
    // Build the visitTime label back for the action
    const timeLabel = VISIT_TIMES.find((t) => t.value === form.visitTime)?.label + " (" + VISIT_TIMES.find((t) => t.value === form.visitTime)?.sub + ")" || form.visitTime;
    const res = await submitVisitRequest({ ...form, visitTime: timeLabel });
    if (res.success) { setStatus("success"); setForm(BLANK); }
    else { setStatus("error"); setErrMsg(res.error || "Submission failed. Please try again."); }
  }

  if (status === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }} className="text-center py-14 px-4">
        <div className="w-16 h-16 rounded-full bg-[#7A2267]/15 border border-[#7A2267]/30
          flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#7A2267" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className={`${lora.className} text-[1.6rem] text-white mb-3`}>Request Received</h3>
        <p className={`${josefin.className} text-[13px] text-white/45 leading-[1.85] max-w-sm mx-auto mb-8`}>
          Thank you, {form.fullName || "there"}. Our corporate events team will reach out within 24 business hours.
        </p>
        <button onClick={() => setStatus("idle")}
          className={`${josefin.className} px-6 py-2.5 rounded-full border border-white/15
            text-[10px] uppercase tracking-[0.18em] text-white/45 hover:text-white hover:border-white/30 transition-all duration-200`}>
          Submit Another
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Accent bar */}
      <div className="h-0.5 rounded-full mb-7"
        style={{ background: "linear-gradient(90deg, transparent, #7A2267 25%, #7A2267 75%, transparent)" }} />

      {/* Step 1 — Who are you */}
      <div className="mb-5">
        <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.3em] text-white/25 mb-3 flex items-center gap-2`}>
          <span className="inline-flex w-4 h-4 rounded-full bg-[#7A2267]/20 text-[#7A2267]/70 items-center justify-center text-[8px] font-bold shrink-0">1</span>
          Your details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FInput label="Full Name" value={form.fullName} onChange={onInput("fullName")} required />
          <FInput label="Company / Organisation" value={form.company} onChange={onInput("company")} required />
          <FInput label="Designation" value={form.designation} onChange={onInput("designation")} placeholder="e.g. CEO, HR Manager" required />
          <FInput label="Email Address" type="email" value={form.email} onChange={onInput("email")} autoComplete="email" required />
          <FInput label="Phone Number" type="tel" value={form.phone} onChange={onInput("phone")} placeholder="+880 ..." required />
          <FSelect
            label="Event Type"
            value={form.eventType}
            onChange={(v) => setField("eventType", v)}
            options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-5" />

      {/* Step 2 — About the event */}
      <div className="mb-5">
        <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.3em] text-white/25 mb-3 flex items-center gap-2`}>
          <span className="inline-flex w-4 h-4 rounded-full bg-[#7A2267]/20 text-[#7A2267]/70 items-center justify-center text-[8px] font-bold shrink-0">2</span>
          About your event
        </p>
        <FTextarea
          label="Event Summary"
          value={form.eventSummary}
          onChange={onInput("eventSummary")}
          required
          rows={3}
          placeholder="Briefly describe your event, objectives, and any special requirements…"
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 my-5" />

      {/* Step 3 — Visit logistics */}
      <div className="mb-5">
        <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.3em] text-white/25 mb-3 flex items-center gap-2`}>
          <span className="inline-flex w-4 h-4 rounded-full bg-[#7A2267]/20 text-[#7A2267]/70 items-center justify-center text-[8px] font-bold shrink-0">3</span>
          Visit logistics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FDateInput value={form.visitDate} onChange={(v) => setField("visitDate", v)} required />
          <FSelect
            label="Preferred Time"
            value={form.visitTime}
            onChange={(v) => setField("visitTime", v)}
            options={VISIT_TIMES}
            required
          />
          <FInput
            label="Number of Visitors"
            type="number"
            value={form.visitorCount}
            onChange={onInput("visitorCount")}
            placeholder="e.g. 5"
            required
          />
          <FTextarea
            label="Additional Notes"
            value={form.message}
            onChange={onInput("message")}
            rows={1}
            placeholder="Any specific questions or requests…"
          />
        </div>
      </div>

      {/* Error */}
      {status === "error" && (
        <p className={`${josefin.className} text-[11.5px] text-red-400/80 bg-red-400/6 border border-red-400/15
          rounded-xl px-4 py-3 mb-4`}>{errMsg}</p>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button type="submit" disabled={status === "loading"}
          className={`${josefin.className} group w-full flex items-center justify-center gap-3
            py-4 rounded-xl bg-[#7A2267] hover:bg-[#8a256f] text-white
            text-[10.5px] uppercase tracking-[0.22em] font-semibold
            transition-all duration-300
            shadow-[0_4px_24px_rgba(122,34,103,0.32)]
            hover:shadow-[0_8px_32px_rgba(122,34,103,0.45)]
            disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden`}>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700
            bg-linear-to-r from-transparent via-white/10 to-transparent" />
          {status === "loading" ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Submitting…</>
          ) : (
            <>Request Site Visit
              <svg viewBox="0 0 10 10" width="8" height="8" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5 relative z-10">
                <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        <p className={`${josefin.className} text-center text-[9.5px] text-white/20 mt-3`}>
          Our corporate team will respond within 24 business hours.
        </p>
      </div>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CorporateContent({ events = [], venues = [], brands = [] }) {
  const displayVenues = venues.length > 0 ? venues : FALLBACK_VENUES;
  const displayBrands = brands.length > 0 ? brands : FALLBACK_BRANDS;

  const heroRef     = useRef(null);
  const heroImgRef  = useRef(null);
  const statsRef    = useRef(null);
  const venuesRef   = useRef(null);
  const servicesRef = useRef(null);
  const eventsRef   = useRef(null);
  const clientsRef  = useRef(null);
  const formRef     = useRef(null);
  const closingRef  = useRef(null);

  const statsInView    = useInView(statsRef,    { once: true, margin: "-60px" });
  const venuesInView   = useInView(venuesRef,   { once: true, margin: "-80px" });
  const servicesInView = useInView(servicesRef, { once: true, margin: "-80px" });
  const eventsInView   = useInView(eventsRef,   { once: true, margin: "-80px" });
  const clientsInView  = useInView(clientsRef,  { once: true, margin: "-80px" });
  const formInView     = useInView(formRef,     { once: true, margin: "-80px" });
  const closingInView  = useInView(closingRef,  { once: true, margin: "-80px" });

  // Hero parallax
  useGSAP(() => {
    gsap.to(heroImgRef.current, {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, { scope: heroRef });

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-150 overflow-hidden">

        {/* Parallax image */}
        <div ref={heroImgRef} className="absolute inset-0 scale-110 will-change-transform">
          <Image
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1800&q=85"
            alt="Corporate events at Dhali's Amber Nivaas"
            fill sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0905]/60 via-[#0d0905]/25 to-[#0d0905]/70" />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-7`}
          >
            Corporate Events &amp; Venues
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.4, ease: EASE }}
            className={`${lora.className} text-[2.8rem] sm:text-[3.8rem] lg:text-[5.2rem]
              text-white font-400 leading-[1.08] max-w-4xl`}
          >
            Where Vision{" "}
            <em className={`${lora.className} italic`}>Meets Venue</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.75 }}
            className={`${josefin.className} text-[13px] font-light text-white/50 mt-7 max-w-sm leading-relaxed`}
          >
            From intimate boardroom sessions to grand outdoor galas for 15,000 guests.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-10"
          >
            <a href="#visit-form"
              className={`${josefin.className} group inline-flex items-center gap-2.5
                px-7 py-3.5 rounded-full bg-[#7A2267] hover:bg-[#8a256f] text-white
                text-[10px] uppercase tracking-[0.2em] font-semibold
                transition-all duration-300 shadow-[0_4px_20px_rgba(122,34,103,0.3)]`}>
              Request a Visit
              <svg viewBox="0 0 10 10" width="7" height="7" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="#venues"
              className={`${josefin.className} inline-flex items-center
                px-7 py-3.5 rounded-full border border-white/20 text-white/60
                hover:text-white hover:border-white/35
                text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300`}>
              Explore Venues
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-[#1a1309] py-8 border-y border-white/5">
        <motion.div variants={stagger} initial="hidden" animate={statsInView ? "show" : "hidden"}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-14 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x-0 lg:divide-x divide-white/6">
          {[
            { num: "15,000", label: "Max. Event Capacity" },
            { num: displayVenues.length || "7", label: "Distinct Venues" },
            { num: "Full",   label: "In-House Catering" },
            { num: "24 / 7", label: "Event Support" },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center lg:px-8 py-2">
              <p className={`${lora.className} text-[1.8rem] sm:text-[2.2rem] text-white`}>{s.num}</p>
              <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.18em] text-white/35 mt-1`}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── VENUES ───────────────────────────────────────────────────────── */}
      <section id="venues" ref={venuesRef} className="relative bg-white overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute top-0 right-0 w-125 h-125 rounded-full bg-[#7A2267]/3 blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <motion.div variants={stagger} initial="hidden" animate={venuesInView ? "show" : "hidden"}
            className="flex flex-col items-center text-center mb-16">
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-6`}>
              Our Venues
            </motion.p>
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
              Spaces Built for{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>Every Scale</em>
            </motion.h2>
            <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mt-7" />
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={venuesInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {displayVenues.map((v) => {
              const cardCls = `group relative bg-[#faf8f5] border border-[#ede5d8] rounded-2xl overflow-hidden
                hover:border-[#7A2267]/40 hover:shadow-[0_12px_40px_-8px_rgba(122,34,103,0.16)]
                transition-all duration-300 flex flex-col h-full`;

              const inner = (
                <>
                  {v.image ? (
                    <div className="relative w-full overflow-hidden shrink-0" style={{ paddingBottom: "56.25%" }}>
                      <img src={v.image} alt={v.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-[#1a1309]/0 group-hover:bg-[#1a1309]/20 transition-all duration-300" />
                      {v.badge && (
                        <span className={`${josefin.className} absolute top-3 left-3 text-[8px] uppercase tracking-[0.18em] font-semibold
                          px-2.5 py-1 rounded-full bg-black/45 text-white/85 backdrop-blur-sm`}>{v.badge}</span>
                      )}
                      {v.slug && (
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className={`${josefin.className} inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider
                            font-semibold px-3 py-1.5 rounded-full bg-[#7A2267] text-white`}>
                            View Details
                            <svg viewBox="0 0 8 8" width="6" height="6" fill="none">
                              <path d="M1 4h5M4 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative px-6 pt-6 pb-2">
                      {v.badge && (
                        <span className={`${josefin.className} absolute top-4 right-4 text-[8px] uppercase tracking-[0.18em] font-semibold
                          px-2.5 py-1 rounded-full bg-[#7A2267]/10 text-[#7A2267] border border-[#7A2267]/20`}>{v.badge}</span>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#ede5d8] flex items-center justify-center text-[#7A2267] shrink-0
                        group-hover:bg-[#7A2267]/6 group-hover:border-[#7A2267]/20 transition-all duration-300">
                        <VenueIcon type={v.iconType || v.icon} />
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col gap-2 flex-1">
                    <div>
                      <h3 className={`${lora.className} text-[1.05rem] font-500 text-[#1a1309] mb-0.5`}>{v.name}</h3>
                      <p className={`${josefin.className} text-[10px] font-semibold text-[#7A2267] uppercase tracking-wider`}>{v.capacity}</p>
                    </div>
                    <p className={`${josefin.className} text-[11.5px] text-[#6b5e4e] leading-[1.8] font-light`}>{v.description}</p>
                    {v.features?.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-[#f0e8dc] flex flex-wrap gap-1.5">
                        {v.features.map((f) => (
                          <span key={f} className={`${josefin.className} text-[9.5px] text-[#7A2267]/70 bg-[#7A2267]/6 px-2.5 py-1 rounded-full border border-[#7A2267]/10`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );

              return (
                <motion.div key={v._id} variants={fadeUp}>
                  {v.slug ? (
                    <Link href={`/corporate/venues/${v.slug}`} className={cardCls}>{inner}</Link>
                  ) : (
                    <div className={cardCls}>{inner}</div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section ref={servicesRef} className="relative bg-[#1a1309] overflow-hidden py-24 md:py-28">
        <div className="pointer-events-none absolute top-0 left-0 w-100 h-100 rounded-full bg-[#7A2267]/7 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-87.5 h-87.5 rounded-full bg-[#7A2267]/4 blur-[80px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <motion.div variants={stagger} initial="hidden" animate={servicesInView ? "show" : "hidden"}
            className="flex flex-col items-center text-center mb-16">
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-6`}>
              Corporate Services
            </motion.p>
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                font-400 text-white leading-[1.12] tracking-[-0.01em]`}>
              Everything You Need,{" "}
              <em className={`${lora.className} italic`}>Handled</em>
            </motion.h2>
            <motion.div variants={fadeUp} className="h-px w-14 bg-white/20 mt-7" />
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={servicesInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                className="group flex gap-4 p-6 rounded-2xl border border-white/6 bg-white/3
                  hover:border-[#7A2267]/25 hover:bg-white/5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8
                  flex items-center justify-center text-[#7A2267] shrink-0 mt-0.5
                  group-hover:bg-[#7A2267]/10 group-hover:border-[#7A2267]/20 transition-colors duration-300">
                  <ServiceIcon type={s.icon} />
                </div>
                <div>
                  <h3 className={`${lora.className} text-[1rem] font-500 text-white mb-2`}>{s.title}</h3>
                  <p className={`${josefin.className} text-[11.5px] text-white/40 leading-[1.8] font-light`}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CORPORATE EVENTS ─────────────────────────────────────────────── */}
      {events.length > 0 && (
        <section id="events" ref={eventsRef} className="relative bg-[#f9f6f2] overflow-hidden py-24 md:py-28">
          <div className="pointer-events-none absolute top-0 right-0 w-100 h-100 rounded-full bg-[#7A2267]/5 blur-[90px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
            <motion.div variants={stagger} initial="hidden" animate={eventsInView ? "show" : "hidden"}
              className="flex flex-col items-center text-center mb-16">
              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-6`}>
                Event Gallery
              </motion.p>
              <motion.h2 variants={fadeUp}
                className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                  font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
                Moments We&apos;ve{" "}
                <em className={`${lora.className} italic text-[#7A2267]`}>Crafted Together</em>
              </motion.h2>
              <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mt-7" />
            </motion.div>

            <motion.div variants={stagger} initial="hidden" animate={eventsInView ? "show" : "hidden"}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-7">
              {events.map((ev) => (
                <motion.div key={ev._id} variants={fadeUp}>
                  <Link href={`/corporate/events/${ev._id}`}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-[#ede5d8]
                      hover:border-[#7A2267]/40 hover:shadow-[0_12px_40px_-8px_rgba(122,34,103,0.18)]
                      transition-all duration-300 flex flex-col h-full">

                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src={ev.image} alt={ev.title} fill
                        sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-[#1a1309]/0 group-hover:bg-[#1a1309]/20 transition-all duration-300" />

                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className={`${josefin.className} inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider
                          font-semibold px-3 py-1.5 rounded-full bg-[#7A2267] text-white`}>
                          View Details
                          <svg viewBox="0 0 8 8" width="6" height="6" fill="none">
                            <path d="M1 4h5M4 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>

                      {ev.client && (
                        <div className="absolute top-3 left-3">
                          <span className={`${josefin.className} text-[9px] uppercase tracking-wider font-semibold
                            px-2.5 py-1 rounded-full bg-black/40 text-white/80 backdrop-blur-sm`}>{ev.client}</span>
                        </div>
                      )}
                      {ev.gallery?.length > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className={`${josefin.className} text-[8px] uppercase tracking-wider font-semibold
                            px-2 py-1 rounded-full bg-black/40 text-white/70 backdrop-blur-sm`}>
                            +{ev.gallery.length} photos
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className={`${lora.className} text-[1rem] font-500 text-[#1a1309] mb-1`}>{ev.title}</h3>
                      {ev.description && (
                        <p className={`${josefin.className} text-[11.5px] text-[#6b5e4e] leading-[1.75] font-light line-clamp-2`}>{ev.description}</p>
                      )}
                      {ev.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ev.tags.map((tag) => (
                            <span key={tag} className={`${josefin.className} text-[9px] text-[#7A2267]/60 bg-[#7A2267]/6 px-2 py-0.5 rounded-full`}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3">
                        {ev.eventDate && (
                          <p className={`${josefin.className} text-[10px] text-[#9b8e78]`}>{ev.eventDate}</p>
                        )}
                        <span className={`${josefin.className} ml-auto text-[9px] uppercase tracking-wider font-semibold text-[#7A2267]/55
                          group-hover:text-[#7A2267] transition-colors duration-200 flex items-center gap-1`}>
                          View Gallery
                          <svg viewBox="0 0 8 8" width="6" height="6" fill="none">
                            <path d="M1 4h5M4 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── TRUSTED BRANDS ───────────────────────────────────────────────── */}
      <section ref={clientsRef} className="relative bg-white overflow-hidden py-24 md:py-28">
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <motion.div variants={stagger} initial="hidden" animate={clientsInView ? "show" : "hidden"}
            className="flex flex-col items-center text-center mb-14">
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-6`}>
              Trusted By
            </motion.p>
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
              Bangladesh&apos;s Leading{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>Corporates</em>
            </motion.h2>
            <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mt-7" />
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={clientsInView ? "show" : "hidden"}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayBrands.map((c, i) => (
              <motion.div key={c._id || i} variants={fadeUp}
                className="group flex flex-col items-center gap-4 px-5 py-7 rounded-2xl
                  bg-[#faf8f5] border border-[#ede5d8]
                  hover:border-[#7A2267]/35 hover:shadow-[0_10px_36px_-8px_rgba(122,34,103,0.18)]
                  transition-all duration-300 text-center">
                <div className="h-16 flex items-center justify-center">
                  {c.logo
                    ? <img src={c.logo} alt={c.name} className="max-h-16 max-w-30 w-auto h-auto object-contain" />
                    : <span className={`${lora.className} text-[1.6rem] font-semibold text-[#7A2267]/50
                        group-hover:text-[#7A2267]/80 transition-colors duration-300 leading-none select-none`}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                  }
                </div>
                <div className="space-y-1">
                  <p className={`${josefin.className} text-[12px] font-semibold text-[#1a1309] leading-snug`}>{c.name}</p>
                  {c.industry && (
                    <p className={`${josefin.className} text-[9.5px] text-[#9b8e78] uppercase tracking-[0.12em]`}>{c.industry}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── VISIT REQUEST FORM ───────────────────────────────────────────── */}
      <section id="visit-form" ref={formRef} className="relative bg-[#1a1309] overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute top-0 right-0 w-125 h-125 rounded-full bg-[#7A2267]/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-100 h-100 rounded-full bg-[#7A2267]/5 blur-[100px]" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div variants={stagger} initial="hidden" animate={formInView ? "show" : "hidden"}
            className="flex flex-col items-center text-center mb-12">
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-6`}>
              Request a Visit
            </motion.p>
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                font-400 text-white leading-[1.12] tracking-[-0.01em]`}>
              See It Before{" "}
              <em className={`${lora.className} italic`}>You Decide</em>
            </motion.h2>
            <motion.div variants={fadeUp} className="h-px w-14 bg-white/20 mt-7 mb-2" />
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[13px] text-white/40 leading-[1.85] font-light max-w-md mt-5`}>
              Schedule a complimentary site visit to experience our venues first-hand.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}>
            <VisitForm />
          </motion.div>
        </div>
      </section>

      {/* ── CLOSING ──────────────────────────────────────────────────────── */}
      <section ref={closingRef} className="relative bg-[#f9f6f2] overflow-hidden py-28 md:py-36">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(122,34,103,0.05) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            animate={closingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.95, ease: EASE }}
            className={`${lora.className} text-[1.55rem] sm:text-[1.95rem] lg:text-[2.3rem]
              italic text-[#1a1309] leading-[1.55] font-400`}
          >
            &ldquo;We don&apos;t just host events — we craft experiences that reflect your vision,
            your brand, and the people behind it.&rdquo;
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={closingInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.55, delay: 0.35, ease: EASE }}
            className="h-px w-14 bg-[#7A2267]/40 mx-auto my-9 origin-center"
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={closingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a href="#visit-form"
              className={`${josefin.className} inline-flex items-center gap-3
                px-8 py-4 rounded-full bg-[#7A2267] text-white
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:bg-[#8a256f] transition-all duration-300 group
                shadow-[0_4px_22px_rgba(122,34,103,0.28)]
                hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]`}>
              Book a Site Visit
              <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                className="group-hover:translate-x-1 transition-transform duration-300">
                <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <Link href="/accommodation"
              className={`${josefin.className} inline-flex items-center
                px-8 py-4 rounded-full border border-[#1a1309]/20 text-[#1a1309]
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:border-[#7A2267] hover:text-[#7A2267] transition-all duration-300`}>
              View Rooms
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
