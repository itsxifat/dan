"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Cormorant, DM_Sans, Cormorant_Garamond } from "next/font/google";

const cinzel    = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans      = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const itemUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const MoonIcon = () => (
  <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true">
    <path
      d="M27 17.5A11 11 0 0 1 14.5 5a11 11 0 1 0 12.5 12.5z"
      stroke="#c084b8" strokeWidth="1.5" strokeLinejoin="round"
    />
    <path d="M20 9l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#c084b8" opacity="0.5"/>
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="1.5"/>
    <path
      d="M16 3v3M16 26v3M3 16h3M26 16h3M7.5 7.5l2 2M22.5 22.5l2 2M7.5 24.5l2-2M22.5 9.5l2-2"
      stroke="white" strokeWidth="1.5" strokeLinecap="round"
    />
  </svg>
);

function CheckIcon({ featured }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke={featured ? "rgba(255,255,255,0.4)" : "rgba(122,34,103,0.4)"}
        strokeWidth="1"/>
      <path d="M5 8l2 2 4-4" stroke={featured ? "white" : "#c084b8"} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const nightFeatures = [
  "Check-in from 2 PM",
  "Check-out by 11 AM",
  "Complimentary breakfast",
  "Room service available",
  "Free nature walk",
];

const dayFeatures = [
  "Check-in 9 AM",
  "Check-out 8 PM",
  "Lunch & evening tea",
  "Pool access",
  "Guided nature walk",
];

function PackageCard({ type }) {
  const isDay = type === "day";
  return (
    <motion.div
      variants={itemUp}
      className={`relative rounded-3xl p-8 sm:p-10 flex flex-col gap-7 transition-all duration-300
        ${isDay
          ? "bg-[#7A2267]"
          : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8"
        }`}
    >
      {/* Most Popular badge */}
      {isDay && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className={`${sans.className} text-[9px] uppercase tracking-[0.22em] font-semibold
            px-4 py-1.5 rounded-full bg-[#7A2267] text-white`}>
            Most Popular
          </span>
        </div>
      )}

      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
        ${isDay ? "bg-white/15" : "bg-white/5 border border-[#7A2267]/30"}`}>
        {isDay ? <SunIcon /> : <MoonIcon />}
      </div>

      {/* Title & price */}
      <div>
        <h3 className={`${cinzel.className} text-[1.4rem] font-500 leading-snug
          ${isDay ? "text-white" : "text-white"} mb-3`}>
          {isDay ? "Day Long Package" : "Night Stay Package"}
        </h3>
        <p className={`${cinzel.className} text-[2.2rem] font-600 leading-none
          ${isDay ? "text-white" : "text-[#c084b8]"}`}>
          {isDay ? "From ৳1,500" : "From ৳2,500"}
        </p>
        <p className={`${sans.className} text-[11px] font-light mt-1
          ${isDay ? "text-white/60" : "text-white/40"}`}>
          {isDay ? "/ day" : "/ night"}
        </p>
      </div>

      {/* Divider */}
      <div className={`h-px ${isDay ? "bg-white/20" : "bg-white/10"}`} />

      {/* Features */}
      <ul className="flex flex-col gap-3">
        {(isDay ? dayFeatures : nightFeatures).map((f) => (
          <li key={f} className="flex items-center gap-3">
            <CheckIcon featured={isDay} />
            <span className={`${sans.className} text-[13px] font-light
              ${isDay ? "text-white/80" : "text-white/55"}`}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/booking"
        className={`${sans.className} mt-2 inline-flex items-center justify-center gap-3
          px-7 py-3.5 rounded-full text-[12px] font-semibold uppercase tracking-[0.18em]
          transition-all duration-300 group
          ${isDay
            ? "bg-white text-[#1a1309] hover:bg-[#f8f4ee]"
            : "border border-white/20 text-white hover:bg-white hover:text-[#1a1309]"
          }`}
      >
        {isDay ? "Book Day Package" : "Book Night Stay"}
        <svg viewBox="0 0 16 10" width="13" height="13" fill="none"
          className="group-hover:translate-x-1 transition-transform duration-300">
          <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </motion.div>
  );
}

export default function PackagesSection() {
  const ref    = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28 lg:py-32">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
        rounded-full bg-[#7A2267]/[0.12] blur-[120px]" />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 50% 50% at 100% 100%, rgba(122,34,103,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className={`${cinzel.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
            font-500 text-white leading-[1.15]`}>
            Tailored Stays,{" "}
            <em className={`${cormorant.className} not-italic text-[#c084b8]`}>Timeless Comfort</em>
          </h2>
        </motion.div>

        {/* Package cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          <PackageCard type="night" />
          <PackageCard type="day" />
        </motion.div>

      </div>
    </section>
  );
}
