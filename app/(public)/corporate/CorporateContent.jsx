"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";
import { submitVisitRequest } from "@/actions/corporate/corporateActions";

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["italic"] });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const itemUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const itemScale = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

// ── Venue data ───────────────────────────────────────────────────────────────
const VENUES = [
  {
    id: "big-field",
    name: "Grand Outdoor Field",
    capacity: "Up to 15,000",
    badge: "Largest Venue",
    description:
      "Our flagship open-air field — an expansive, fully serviced outdoor space perfect for large-scale corporate events, product launches, and grand corporate galas.",
    features: ["15,000 persons", "Stage & sound setup", "Flood lighting", "Helipad access"],
    icon: "field",
  },
  {
    id: "small-field",
    name: "Garden Field",
    capacity: "Up to 3,000",
    description:
      "A lush garden venue with a natural canopy feel — ideal for mid-size corporate gatherings, team-building retreats, and outdoor brand activations.",
    features: ["3,000 persons", "Natural landscaping", "Flexible layout", "Catering ready"],
    icon: "garden",
  },
  {
    id: "helipad-field",
    name: "Helipad Field",
    capacity: "Up to 1,000",
    badge: "VIP Exclusive",
    description:
      "An exclusive open-air area featuring a certified helipad — the ultimate premium setting for VIP arrivals, executive retreats, and high-profile corporate functions.",
    features: ["1,000 persons", "Helicopter landing pad", "VIP access zone", "Elite ambiance"],
    icon: "helipad",
  },
  {
    id: "banquet-side-field",
    name: "Banquet Garden",
    capacity: "Up to 2,000",
    description:
      "A beautifully landscaped open-air garden adjacent to the Banquet Hall — perfect for cocktail receptions, evening corporate dinners, and pre-event gatherings.",
    features: ["2,000 persons", "Garden setting", "Evening lighting", "Adjacent to hall"],
    icon: "garden2",
  },
  {
    id: "small-conf",
    name: "Conference Suite",
    capacity: "Up to 50",
    description:
      "A fully equipped intimate conference room designed for boardroom meetings, executive strategy sessions, and focused workshop environments.",
    features: ["50 persons", "Full AV system", "Video conferencing", "Breakout alcove"],
    icon: "conference",
  },
  {
    id: "banquet-hall",
    name: "Grand Banquet Hall",
    capacity: "Up to 800",
    badge: "Most Popular",
    description:
      "Our magnificent banquet hall adorned with crystal chandeliers and premium décor — the premier choice for formal corporate galas, award nights, and grand dinners.",
    features: ["800 persons", "Stage & podium", "Grand décor", "Full AV & lighting"],
    icon: "banquet",
  },
  {
    id: "big-conf",
    name: "Premier Conference Hall",
    capacity: "Up to 200",
    description:
      "Our flagship conference facility with tiered seating, state-of-the-art audio-visual systems, and a professional ambiance befitting any corporate milestone event.",
    features: ["200 persons", "Tiered seating", "Smart AV system", "Breakout rooms"],
    icon: "bigconf",
  },
];

// ── Corporate services ───────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: "catering",
    title: "In-House Catering",
    desc: "World-class culinary team capable of serving up to 15,000 guests — from working lunches to elaborate banquet menus tailored to your brand.",
  },
  {
    icon: "av",
    title: "AV & Tech Setup",
    desc: "Professional audio-visual systems, LED walls, stage lighting, microphones, and high-speed Wi-Fi ensuring flawless presentations.",
  },
  {
    icon: "coordinator",
    title: "Dedicated Coordinator",
    desc: "Your personal event coordinator handles every detail from planning to execution so you can focus entirely on your guests.",
  },
  {
    icon: "transport",
    title: "Guest Transport",
    desc: "Fleet of vehicles and valet services to ensure smooth arrival and departure for all attendees, including VIP transfers.",
  },
  {
    icon: "stay",
    title: "Group Accommodation",
    desc: "Block reservations available for overnight corporate retreats with exclusive group rates across our full range of rooms and suites.",
  },
  {
    icon: "branding",
    title: "Event Branding",
    desc: "On-site branding, backdrop setups, custom signage, and décor coordination to perfectly reflect your corporate identity.",
  },
];

// ── Top corporate clients (static) ──────────────────────────────────────────
const CLIENTS = [
  { name: "Grameen Bank",      industry: "Banking & Finance" },
  { name: "BRAC",              industry: "Development Org." },
  { name: "Square Group",      industry: "FMCG & Pharma" },
  { name: "PRAN-RFL Group",    industry: "Food & Beverages" },
  { name: "Bangladesh Bank",   industry: "Central Banking" },
  { name: "Dutch-Bangla Bank", industry: "Banking" },
  { name: "Robi Axiata",       industry: "Telecom" },
  { name: "Bashundhara Group", industry: "Real Estate" },
  { name: "Meghna Group",      industry: "Industrial" },
  { name: "ACI Limited",       industry: "FMCG & Health" },
];

// ── Venue icon SVGs ───────────────────────────────────────────────────────────
function VenueIcon({ type }) {
  const icons = {
    field: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 4 5 3-4 4 7" />
        <path d="M21 21H3" />
        <circle cx="18" cy="5" r="2" />
      </svg>
    ),
    garden: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M12 12C12 7 7 4 3 5c1 4 4 7 9 7z" />
        <path d="M12 12c0-5 5-8 9-7-1 4-4 7-9 7z" />
      </svg>
    ),
    helipad: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 8h3v8M11 12h2M15 8v8" />
      </svg>
    ),
    garden2: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V8" />
        <path d="M5 10c0-3.5 3-6 7-6s7 2.5 7 6c-2 1-5 1.5-7 1.5S7 11 5 10z" />
        <path d="M2 20c0-3 4-5 10-5s10 2 10 5" />
      </svg>
    ),
    conference: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    banquet: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19h16M4 5h16M8 5v14M16 5v14" />
        <path d="M12 2l1.5 3h3l-2.5 2 1 3L12 8.5 9 10l1-3L7.5 5h3z" />
      </svg>
    ),
    bigconf: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10M12 10l-4 4M12 10l4 4" />
        <path d="M5 6h14M8 3h8" />
        <rect x="3" y="18" width="18" height="3" rx="1" />
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
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4M10 8l6 3-6 3V8z" />
      </svg>
    ),
    coordinator: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M16 11l2 2 4-4" />
      </svg>
    ),
    transport: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    stay: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
    branding: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
        <path d="M8.5 3.5C10 2.5 12 2 14 2.5" />
      </svg>
    ),
  };
  return icons[type] || icons.catering;
}

// ── Reusable section header ───────────────────────────────────────────────────
function SectionLabel({ index, text, light = false }) {
  return (
    <div className={`flex items-center justify-center gap-5 mb-6`}>
      <div className={`h-px w-16 ${light ? "bg-[#c9a96e]/50" : "bg-[#c9a96e]/40"}`} />
      <p className={`${sans.className} text-[10px] uppercase tracking-[0.28em] font-semibold
        ${light ? "text-[#c9a96e]" : "text-[#c9a96e]"}`}>
        {index} _ {text}
      </p>
      <div className={`h-px w-16 ${light ? "bg-[#c9a96e]/50" : "bg-[#c9a96e]/40"}`} />
    </div>
  );
}

// ── Visit Form ────────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  "Conference / Seminar",
  "Product Launch",
  "Corporate Gala / Dinner",
  "Team Building / Retreat",
  "Annual General Meeting",
  "Training & Workshop",
  "Award Ceremony",
  "Exhibition / Trade Show",
  "Other",
];

const VISIT_TIMES = [
  "Morning (9:00 AM – 12:00 PM)",
  "Afternoon (12:00 PM – 5:00 PM)",
  "Evening (5:00 PM – 8:00 PM)",
];

const BLANK = {
  fullName: "", company: "", designation: "", email: "",
  phone: "", eventType: "", eventSummary: "", visitDate: "",
  visitTime: "", visitorCount: "", message: "",
};

const IL = `${sans.className} block text-[9.5px] uppercase tracking-[0.14em] font-semibold text-white/40 mb-1.5`;
const INP = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3
  text-[13px] text-white placeholder-white/20 outline-none
  focus:border-[#c9a96e]/50 focus:bg-white/[0.07] transition-all duration-200`;
const INPD = `w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3
  text-[13px] text-white outline-none
  focus:border-[#c9a96e]/50 focus:bg-white/[0.07] transition-all duration-200
  [&>option]:bg-[#1a0f28] [&>option]:text-white`;

function VisitForm() {
  const [form, setForm]   = useState(BLANK);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState("");

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  // min visit date = tomorrow
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");
    const res = await submitVisitRequest(form);
    if (res.success) {
      setStatus("success");
      setForm(BLANK);
    } else {
      setStatus("error");
      setErrMsg(res.error || "Submission failed. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-6"
      >
        <div className="w-16 h-16 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/30
          flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className={`${playfair.className} text-[1.6rem] text-white mb-3`}>
          Request Received
        </h3>
        <p className={`${sans.className} text-[13px] text-white/45 leading-[1.8] max-w-md mx-auto mb-8`}>
          Thank you for your interest. Our corporate events team will reach out within 24 business hours to discuss your requirements and arrange your venue visit.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className={`${sans.className} px-6 py-2.5 rounded-full border border-white/15
            text-[10px] uppercase tracking-[0.18em] text-white/50 hover:text-white hover:border-white/30
            transition-all duration-200`}
        >
          Submit Another Request
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Full Name */}
      <div>
        <label className={IL}>Full Name <span className="text-[#c9a96e]">*</span></label>
        <input className={INP} value={form.fullName} onChange={set("fullName")}
          placeholder="Your full name" required />
      </div>

      {/* Company */}
      <div>
        <label className={IL}>Company / Organisation <span className="text-[#c9a96e]">*</span></label>
        <input className={INP} value={form.company} onChange={set("company")}
          placeholder="Company name" required />
      </div>

      {/* Designation */}
      <div>
        <label className={IL}>Designation <span className="text-[#c9a96e]">*</span></label>
        <input className={INP} value={form.designation} onChange={set("designation")}
          placeholder="e.g. CEO, HR Manager" required />
      </div>

      {/* Email */}
      <div>
        <label className={IL}>Email Address <span className="text-[#c9a96e]">*</span></label>
        <input type="email" className={INP} value={form.email} onChange={set("email")}
          placeholder="corporate@company.com" required />
      </div>

      {/* Phone */}
      <div>
        <label className={IL}>Phone Number <span className="text-[#c9a96e]">*</span></label>
        <input type="tel" className={INP} value={form.phone} onChange={set("phone")}
          placeholder="+880 ..." required />
      </div>

      {/* Event type */}
      <div>
        <label className={IL}>Event Type</label>
        <select className={INPD} value={form.eventType} onChange={set("eventType")}>
          <option value="">Select event type</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Event summary — full width */}
      <div className="sm:col-span-2">
        <label className={IL}>Event Summary <span className="text-[#c9a96e]">*</span></label>
        <textarea
          rows={3}
          className={`${INP} resize-none`}
          value={form.eventSummary}
          onChange={set("eventSummary")}
          placeholder="Briefly describe your event, objectives, and any special requirements..."
          required
        />
      </div>

      {/* Visit date */}
      <div>
        <label className={IL}>Preferred Visit Date <span className="text-[#c9a96e]">*</span></label>
        <input type="date" className={INP} value={form.visitDate} min={minDate}
          onChange={set("visitDate")} required
          style={{ colorScheme: "dark" }} />
      </div>

      {/* Visit time */}
      <div>
        <label className={IL}>Preferred Visit Time <span className="text-[#c9a96e]">*</span></label>
        <select className={INPD} value={form.visitTime} onChange={set("visitTime")} required>
          <option value="">Select time slot</option>
          {VISIT_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Visitor count */}
      <div>
        <label className={IL}>Number of Visitors <span className="text-[#c9a96e]">*</span></label>
        <input type="number" min="1" max="50" className={INP} value={form.visitorCount}
          onChange={set("visitorCount")} placeholder="e.g. 5" required />
      </div>

      {/* Message */}
      <div className="sm:col-span-2">
        <label className={IL}>Additional Notes <span className={`${sans.className} normal-case font-light text-white/25 text-[9px]`}>(optional)</span></label>
        <textarea
          rows={2}
          className={`${INP} resize-none`}
          value={form.message}
          onChange={set("message")}
          placeholder="Any specific questions or requests for the site visit..."
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="sm:col-span-2">
          <p className={`${sans.className} text-[11px] text-red-400`}>{errMsg}</p>
        </div>
      )}

      {/* Submit */}
      <div className="sm:col-span-2 pt-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className={`${sans.className} group w-full flex items-center justify-center gap-3
            py-4 rounded-xl bg-[#c9a96e] hover:bg-[#d4b87a] text-[#0e0a05]
            text-[10.5px] uppercase tracking-[0.2em] font-semibold
            transition-all duration-300 shadow-[0_4px_20px_rgba(201,169,110,0.25)]
            hover:shadow-[0_6px_28px_rgba(201,169,110,0.4)]
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {status === "loading" ? (
            <>
              <svg className="animate-spin" viewBox="0 0 24 24" width="14" height="14" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              Request Site Visit
              <svg viewBox="0 0 10 10" width="8" height="8" fill="none"
                className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        <p className={`${sans.className} text-center text-[9.5px] text-white/25 mt-3 leading-[1.6]`}>
          Our corporate team will respond within 24 business hours.
        </p>
      </div>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CorporateContent({ events = [] }) {

  // Section refs for scroll animations
  const statsRef    = useRef(null);
  const venuesRef   = useRef(null);
  const servicesRef = useRef(null);
  const eventsRef   = useRef(null);
  const clientsRef  = useRef(null);
  const formRef     = useRef(null);

  const statsInView    = useInView(statsRef,    { once: true, margin: "-60px" });
  const venuesInView   = useInView(venuesRef,   { once: true, margin: "-60px" });
  const servicesInView = useInView(servicesRef, { once: true, margin: "-60px" });
  const eventsInView   = useInView(eventsRef,   { once: true, margin: "-60px" });
  const clientsInView  = useInView(clientsRef,  { once: true, margin: "-60px" });
  const formInView     = useInView(formRef,     { once: true, margin: "-60px" });

  return (
    <>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col justify-end bg-[#050208] overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1800&q=85"
            alt="Corporate events at Dhali's Amber Nivaas"
            fill priority quality={90}
            className="object-cover object-center"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(5,2,8,0.96) 0%, rgba(5,2,8,0.65) 40%, rgba(5,2,8,0.2) 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(122,34,103,0.15) 0%, transparent 60%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 pb-16 md:pb-24">

          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`${sans.className} flex items-center gap-2 text-[9.5px] uppercase tracking-[0.18em]
              text-white/35 mb-10`}
          >
            <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/50">Corporate</span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.3em] text-[#c9a96e] mb-4`}>
              Corporate Events & Venues
            </p>
            <h1 className={`${playfair.className} text-[2.6rem] sm:text-[3.4rem] lg:text-[4.2rem]
              text-white leading-[1.08] mb-5`}>
              Where Vision<br />
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Meets Venue</em>
            </h1>
            <p className={`${sans.className} text-[13.5px] text-white/50 leading-[1.85] font-light max-w-xl mb-8`}>
              From intimate boardroom sessions to grand outdoor galas for 15,000 guests —
              Dhali&apos;s Amber Nivaas delivers unparalleled corporate event experiences
              backed by world-class catering and dedicated hospitality.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3">
              <a
                href="#visit-form"
                className={`${sans.className} group flex items-center gap-2.5 px-6 py-3 rounded-full
                  bg-[#c9a96e] hover:bg-[#d4b87a] text-[#0e0a05]
                  text-[10px] uppercase tracking-[0.2em] font-semibold
                  transition-all duration-300 shadow-[0_4px_20px_rgba(201,169,110,0.3)]`}
              >
                Request a Visit
                <svg viewBox="0 0 10 10" width="7" height="7" fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="#venues"
                className={`${sans.className} flex items-center gap-2 px-6 py-3 rounded-full
                  border border-white/20 text-white/60 hover:text-white hover:border-white/35
                  text-[10px] uppercase tracking-[0.2em] font-semibold
                  transition-all duration-300`}
              >
                Explore Venues
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-25"
        >
          <div className="w-px h-8 bg-white/40" />
          <div className="w-1 h-1 rounded-full bg-white/60" />
        </motion.div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-[#1a1309] py-8 border-y border-white/[0.05]">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={statsInView ? "show" : "hidden"}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12
            grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x-0 lg:divide-x divide-white/[0.06]"
        >
          {[
            { num: "15,000", label: "Max. Event Capacity" },
            { num: "7",      label: "Distinct Venues" },
            { num: "Full",   label: "In-House Catering" },
            { num: "24 / 7", label: "Event Support" },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={itemUp}
              className="text-center lg:px-8 py-2"
            >
              <p className={`${playfair.className} text-[1.8rem] sm:text-[2.2rem] font-600 text-white`}>
                {s.num}
              </p>
              <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.18em] text-white/35 mt-1`}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── VENUES ─────────────────────────────────────────────────────────── */}
      <section id="venues" ref={venuesRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-28">

        <div className="pointer-events-none absolute top-0 right-0 w-[450px] h-[450px]
          rounded-full bg-[#c9a96e]/[0.06] blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={venuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionLabel index="01" text="Our Venues" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={venuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14"
          >
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              text-[#1a1309] leading-[1.15]`}>
              Spaces Built for{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Every Scale</em>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={venuesInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5"
          >
            {VENUES.map((v) => (
              <motion.div
                key={v.id}
                variants={itemUp}
                className="group relative bg-white border border-[#ede5d8] rounded-2xl p-5
                  hover:border-[#c9a96e]/40 hover:shadow-[0_12px_40px_-8px_rgba(201,169,110,0.16)]
                  transition-all duration-300 flex flex-col gap-3"
              >
                {v.badge && (
                  <span className={`${sans.className} absolute top-4 right-4
                    text-[8px] uppercase tracking-[0.18em] font-semibold
                    px-2.5 py-1 rounded-full bg-[#7A2267]/10 text-[#7A2267] border border-[#7A2267]/20`}>
                    {v.badge}
                  </span>
                )}

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#f8f4ee] border border-[#ede5d8]
                  flex items-center justify-center text-[#7A2267] shrink-0
                  group-hover:bg-[#7A2267]/8 group-hover:border-[#7A2267]/20 transition-all duration-300">
                  <VenueIcon type={v.icon} />
                </div>

                <div>
                  <h3 className={`${playfair.className} text-[1.05rem] font-semibold text-[#1a1309] mb-0.5`}>
                    {v.name}
                  </h3>
                  <p className={`${sans.className} text-[10px] font-semibold text-[#c9a96e] uppercase tracking-wider`}>
                    {v.capacity}
                  </p>
                </div>

                <p className={`${sans.className} text-[11.5px] text-[#6b5e4e] leading-[1.75] font-light`}>
                  {v.description}
                </p>

                {/* Features */}
                <div className="mt-auto pt-3 border-t border-[#f0e8dc] flex flex-wrap gap-1.5">
                  {v.features.map((f) => (
                    <span key={f}
                      className={`${sans.className} text-[9.5px] text-[#7A2267]/70 bg-[#7A2267]/[0.06]
                        px-2.5 py-1 rounded-full border border-[#7A2267]/10`}>
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────────────────── */}
      <section ref={servicesRef} className="relative bg-[#0e0a05] overflow-hidden py-20 md:py-28">

        <div className="pointer-events-none absolute top-0 left-0 w-[400px] h-[400px]
          rounded-full bg-[#7A2267]/[0.07] blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[350px] h-[350px]
          rounded-full bg-[#c9a96e]/[0.04] blur-[80px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <SectionLabel index="02" text="Corporate Services" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14"
          >
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              text-white leading-[1.15]`}>
              Everything You Need,{" "}
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Handled</em>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={servicesInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {SERVICES.map((s, i) => (
              <motion.div
                key={i}
                variants={itemUp}
                className="group flex gap-4 p-5 rounded-2xl border border-white/[0.06]
                  bg-white/[0.03] hover:border-[#c9a96e]/20 hover:bg-white/[0.05]
                  transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/15
                  flex items-center justify-center text-[#c9a96e] shrink-0 mt-0.5
                  group-hover:bg-[#c9a96e]/15 transition-colors duration-300">
                  <ServiceIcon type={s.icon} />
                </div>
                <div>
                  <h3 className={`${sans.className} text-[12.5px] font-semibold text-white mb-1.5`}>
                    {s.title}
                  </h3>
                  <p className={`${sans.className} text-[11.5px] text-white/38 leading-[1.75] font-light`}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CORPORATE EVENTS GALLERY ───────────────────────────────────────── */}
      {events.length > 0 && (
        <section ref={eventsRef} className="relative bg-white overflow-hidden py-20 md:py-28">

          <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px]
            rounded-full bg-[#c9a96e]/[0.05] blur-[90px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={eventsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <SectionLabel index="03" text="Event Gallery" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={eventsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-14"
            >
              <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
                text-[#1a1309] leading-[1.15]`}>
                Moments We&apos;ve{" "}
                <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Crafted Together</em>
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={eventsInView ? "show" : "hidden"}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5"
            >
              {events.map((ev) => (
                <motion.div
                  key={ev._id}
                  variants={itemScale}
                  className="group relative rounded-2xl overflow-hidden bg-[#f8f4ee]
                    border border-[#ede5d8] hover:border-[#c9a96e]/40
                    hover:shadow-[0_12px_40px_-8px_rgba(201,169,110,0.18)]
                    transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={ev.image}
                      alt={ev.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-[#1a1309]/0 group-hover:bg-[#1a1309]/35
                      transition-all duration-300" />
                    {/* Client badge */}
                    {ev.client && (
                      <div className="absolute top-3 left-3">
                        <span className={`${sans.className} text-[9px] uppercase tracking-wider font-semibold
                          px-2.5 py-1 rounded-full bg-black/40 text-white/80 backdrop-blur-sm`}>
                          {ev.client}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className={`${playfair.className} text-[1rem] font-semibold text-[#1a1309] mb-1`}>
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className={`${sans.className} text-[11.5px] text-[#6b5e4e] leading-[1.7] font-light`}>
                        {ev.description}
                      </p>
                    )}
                    {/* Tags */}
                    {ev.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {ev.tags.map((tag) => (
                          <span key={tag}
                            className={`${sans.className} text-[9px] text-[#7A2267]/60
                              bg-[#7A2267]/[0.06] px-2 py-0.5 rounded-full`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {ev.eventDate && (
                      <p className={`${sans.className} text-[10px] text-[#9b8e78] mt-2`}>{ev.eventDate}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── TOP CLIENTS ────────────────────────────────────────────────────── */}
      <section ref={clientsRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-24">

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={clientsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel index={events.length > 0 ? "04" : "03"} text="Trusted By" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={clientsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center mb-12"
          >
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.4rem]
              text-[#1a1309] leading-[1.2]`}>
              Bangladesh&apos;s Leading{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Corporates</em>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={clientsInView ? "show" : "hidden"}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {CLIENTS.map((c, i) => (
              <motion.div
                key={i}
                variants={itemUp}
                className="group flex flex-col items-center justify-center gap-2
                  px-4 py-5 rounded-2xl bg-white border border-[#ede5d8]
                  hover:border-[#c9a96e]/40 hover:shadow-[0_8px_30px_-6px_rgba(201,169,110,0.15)]
                  transition-all duration-300 text-center"
              >
                {/* Monogram */}
                <div className="w-10 h-10 rounded-xl bg-[#f8f4ee] border border-[#ede5d8]
                  flex items-center justify-center
                  group-hover:bg-[#7A2267]/8 group-hover:border-[#7A2267]/20
                  transition-all duration-300">
                  <span className={`${playfair.className} text-[13px] font-semibold text-[#7A2267]/60
                    group-hover:text-[#7A2267] transition-colors duration-300`}>
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <p className={`${sans.className} text-[11px] font-semibold text-[#1a1309] leading-tight`}>
                  {c.name}
                </p>
                <p className={`${sans.className} text-[9px] text-[#9b8e78] uppercase tracking-wider`}>
                  {c.industry}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── VISIT REQUEST FORM ──────────────────────────────────────────────── */}
      <section id="visit-form" ref={formRef} className="relative bg-[#0e0a05] overflow-hidden py-20 md:py-28">

        <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px]
          rounded-full bg-[#7A2267]/[0.08] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px]
          rounded-full bg-[#c9a96e]/[0.05] blur-[100px]" />

        {/* Dot grid texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel index={events.length > 0 ? "05" : "04"} text="Request a Visit" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10"
          >
            <h2 className={`${playfair.className} text-[1.9rem] sm:text-[2.4rem]
              text-white leading-[1.2] mb-3`}>
              See It Before{" "}
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>You Decide</em>
            </h2>
            <p className={`${sans.className} text-[12.5px] text-white/40 leading-[1.8] font-light max-w-md mx-auto`}>
              Schedule a complimentary site visit to experience our venues first-hand.
              Fill in your details and our team will arrange a personalised tour.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <VisitForm />
          </motion.div>
        </div>
      </section>

      {/* ── CTA FOOTER ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1a1309] overflow-hidden py-20 md:py-24">

        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill
            className="object-cover object-center opacity-15"
          />
        </div>
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(122,34,103,0.3) 0%, rgba(26,19,9,0.95) 60%)" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.28em] text-[#c9a96e] mb-4`}>
              Let&apos;s Make It Happen
            </p>
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              text-white leading-[1.15] mb-5`}>
              Your Next Corporate Event<br />
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Starts Here</em>
            </h2>
            <p className={`${sans.className} text-[13px] text-white/40 leading-[1.85] font-light max-w-xl mx-auto mb-8`}>
              Contact our dedicated corporate events desk to discuss your requirements,
              check availability, and receive a tailored proposal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#visit-form"
                className={`${sans.className} group flex items-center gap-2.5 px-7 py-3.5 rounded-full
                  bg-[#c9a96e] hover:bg-[#d4b87a] text-[#0e0a05]
                  text-[10px] uppercase tracking-[0.2em] font-semibold
                  transition-all duration-300 shadow-[0_4px_20px_rgba(201,169,110,0.3)]`}
              >
                Book a Site Visit
                <svg viewBox="0 0 10 10" width="7" height="7" fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <Link
                href="/accommodation"
                className={`${sans.className} flex items-center gap-2 px-7 py-3.5 rounded-full
                  border border-white/15 text-white/55 hover:text-white hover:border-white/30
                  text-[10px] uppercase tracking-[0.2em] font-semibold
                  transition-all duration-300`}
              >
                View Rooms
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </>
  );
}
