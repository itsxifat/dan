"use client";

import { motion } from "framer-motion";

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

// ── Card — corner L-bracket drawn with pure CSS transition on hover ────────────
function FeatureCard({ feature, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative p-5 sm:p-6 lg:p-7
        border border-white/[0.07] rounded-xl sm:rounded-2xl overflow-hidden cursor-default
        hover:border-[#7A2267]/25 hover:bg-white/2 transition-colors duration-500"
    >
      {/*
        L-bracket corners: scaleX/scaleY from 0→1 driven purely by CSS group-hover.
        No JS, runs on compositor → zero scroll/frame budget cost.
      */}
      <div className="absolute top-0 left-0 w-8 h-px bg-[#7A2267] origin-left
        scale-x-0 group-hover:scale-x-100 transition-transform duration-380 ease-out" />
      <div className="absolute top-0 left-0 h-8 w-px bg-[#7A2267] origin-top
        scale-y-0 group-hover:scale-y-100 transition-transform duration-380 ease-out delay-40" />

      <p className="font-josefin text-[9px] tracking-[0.35em] text-[#7A2267]/30 font-light mb-3 sm:mb-4">
        {feature.num}
      </p>

      <div className="text-[#7A2267]/50 group-hover:text-[#9d3a8a] transition-colors duration-500 mb-3 sm:mb-4">
        {feature.icon}
      </div>

      <h3 className="font-josefin text-[10px] sm:text-[11px] lg:text-[11.5px] font-semibold
        text-white group-hover:text-white/90 tracking-[0.14em] uppercase mb-2 sm:mb-3
        transition-colors duration-300">
        {feature.title}
      </h3>

      <p className="font-josefin text-[11px] sm:text-[12px] lg:text-[12.5px]
        font-light text-white/35 group-hover:text-white/55 leading-[1.75] sm:leading-[1.85]
        line-clamp-3 sm:line-clamp-none transition-colors duration-500">
        {feature.desc}
      </p>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function ExperienceSection() {
  return (
    <section className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28 lg:py-32">

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(122,34,103,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16 lg:mb-20"
        >
          <h2 className="font-lora text-[2rem] sm:text-[2.7rem] lg:text-[3.2rem]
            font-normal text-white leading-[1.18] tracking-[-0.01em]">
            What Makes Us{" "}
            <em className="italic text-[#c084b8]">Unlike Any Other</em>
          </h2>

          <p className="font-josefin mt-4 text-[12.5px] sm:text-[13px] font-light text-white/35
            max-w-xs sm:max-w-sm mx-auto leading-relaxed tracking-wide">
            Every detail, curated for those who expect nothing less than excellence.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.num} feature={feature} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
