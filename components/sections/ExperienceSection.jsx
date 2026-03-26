"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lora, Josefin_Sans, Raleway } from "next/font/google";

// ── Fonts — intentionally different from other sections ──────────────────────
const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500"] });

// ── Animation variants ────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } },
};

// ── Features data ─────────────────────────────────────────────────────────────
const features = [
  {
    num: "01",
    title: "Nature Immersed",
    desc: "Pristine greenery surrounds you — the sounds of the wild fill every waking moment.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <path d="M14 3C9 3 5 8 5 13c0 3.5 2 6.5 5 8.5V24h8v-2.5c3-2 5-5 5-8.5 0-5-4-10-9-10z"
          stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M14 13v6M11 15.5c1-1 2-2 3-2.5M17 15.5c-1-1-2-2-3-2.5"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Perfect Serenity",
    desc: "Complete peace, designed for rest and renewal — far from the noise of the world.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <circle cx="14" cy="14" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M14 3v3M14 22v3M3 14h3M22 14h3M6.2 6.2l2.1 2.1M19.7 19.7l2.1 2.1M6.2 21.8l2.1-2.1M19.7 8.3l2.1-2.1"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "Premium Comfort",
    desc: "Thoughtfully appointed rooms with quality amenities for a truly indulgent stay.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <rect x="3" y="13" width="22" height="9" rx="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M7 13v-2a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 21 11v2"
          stroke="currentColor" strokeWidth="1.25"/>
        <path d="M3 22v2M25 22v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="10" cy="16.5" r="1.1" fill="currentColor"/>
        <circle cx="18" cy="16.5" r="1.1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    num: "04",
    title: "Halal Dining",
    desc: "100% halal-certified cuisine, fresh and flavorful — prepared with love and care.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <path d="M9 4v7a3 3 0 0 0 3 3v9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M19 4c0 0 0 7-3 9v9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M6 18h16" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M7 4v4M11 4v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "05",
    title: "Personal Service",
    desc: "A dedicated team ensuring every need is met before you even have to ask.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <circle cx="14" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 25c0-5 4-8.5 9-8.5s9 3.5 9 8.5"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "06",
    title: "Lasting Memories",
    desc: "Curated experiences that stay with you long after you check out.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <path d="M14 4l2.5 6.5 6.5 1-4.8 4.5 1.3 6.5L14 19l-5.5 3 1.3-6.5L5 11.5l6.5-1z"
          stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ── Card ──────────────────────────────────────────────────────────────────────
function FeatureCard({ feature }) {
  return (
    <motion.div
      variants={cardAnim}
      className="group relative p-5 sm:p-6 lg:p-7
        border border-white/[0.07] rounded-xl sm:rounded-2xl overflow-hidden cursor-default
        hover:border-[#7A2267]/30 hover:bg-white/[0.025]
        transition-colors duration-500"
    >
      {/* L-bracket corner that draws in on hover */}
      <div className="absolute top-0 left-0 w-8 h-px bg-[#7A2267]
        scale-x-0 group-hover:scale-x-100 origin-left
        transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
      <div className="absolute top-0 left-0 h-8 w-px bg-[#7A2267]
        scale-y-0 group-hover:scale-y-100 origin-top
        transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />

      {/* Number */}
      <p className={`${josefin.className} text-[9px] tracking-[0.35em] text-[#7A2267]/25
        font-light mb-4 sm:mb-5`}>
        {feature.num}
      </p>

      {/* Icon */}
      <div className="text-[#7A2267]/45 group-hover:text-[#9d3a8a]
        transition-colors duration-500 mb-4 sm:mb-5">
        {feature.icon}
      </div>

      {/* Title */}
      <h3 className={`${josefin.className} text-[10.5px] sm:text-[11.5px] font-semibold
        text-white tracking-[0.14em] uppercase mb-2 sm:mb-3
        group-hover:text-white/90 transition-colors duration-300`}>
        {feature.title}
      </h3>

      {/* Desc — hidden on mobile, shown on sm+ */}
      <p className={`${raleway.className} hidden sm:block text-[12px] lg:text-[12.5px]
        font-light text-white/35 leading-[1.85]
        group-hover:text-white/50 transition-colors duration-500`}>
        {feature.desc}
      </p>

      {/* Mobile-only: short desc (1 line) */}
      <p className={`${raleway.className} sm:hidden text-[11px]
        font-light text-white/30 leading-[1.7] line-clamp-2`}>
        {feature.desc}
      </p>
    </motion.div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function ExperienceSection() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28 lg:py-32">

      {/* Single top-centre glow — no hazy blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(122,34,103,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16 lg:mb-20"
        >
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px w-8 bg-[#7A2267]/40" />
            <span className={`${josefin.className} text-[9px] uppercase tracking-[0.42em] text-[#7A2267] font-light`}>
              The Experience
            </span>
            <div className="h-px w-8 bg-[#7A2267]/40" />
          </div>

          {/* Heading */}
          <h2 className={`${lora.className} text-[2rem] sm:text-[2.7rem] lg:text-[3.2rem]
            font-400 text-white leading-[1.18] tracking-[-0.01em]`}>
            What Makes Us{" "}
            <em className="italic text-[#c084b8]">Unlike Any Other</em>
          </h2>

          {/* Sub-text */}
          <p className={`${raleway.className} mt-4 text-[12.5px] font-light text-white/30
            max-w-xs mx-auto leading-relaxed tracking-wide`}>
            Every detail, curated for those who expect nothing less than excellence.
          </p>
        </motion.div>

        {/* ── Grid ── */}
        {/* Mobile: 2-col (3 rows), tablet: 2-col, desktop: 3-col */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.num} feature={feature} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
