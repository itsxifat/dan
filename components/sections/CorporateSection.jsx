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
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const itemUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const PILLARS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
    label: "7 Venues",
    sub: "From intimate boardrooms to grand outdoor fields",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "15,000 Capacity",
    sub: "Largest single-event capacity in the region",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    label: "Full Catering",
    sub: "World-class in-house catering for any scale",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "24 / 7 Support",
    sub: "Dedicated event coordinator from day one",
  },
];

export default function CorporateSection() {
  const ref     = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28 lg:py-32">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px]
        rounded-full bg-[#7A2267]/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 50% 50% at 0% 100%, rgba(122,34,103,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Heading + description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-5 max-w-3xl mx-auto"
        >
          <h2 className={`${cinzel.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
            font-500 text-white leading-[1.15] mb-4`}>
            Corporate Events,{" "}
            <em className={`${cormorant.className} not-italic text-[#c084b8]`}>Elevated</em>
          </h2>
          <p className={`${sans.className} text-[13px] text-white/45 leading-[1.85] font-light`}>
            From intimate boardroom sessions to grand outdoor galas for 15,000 guests —
            we provide the perfect backdrop, impeccable service, and everything in between.
          </p>
        </motion.div>

        {/* 4-pillar stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12"
        >
          {PILLARS.map((p, i) => (
            <motion.div
              key={i}
              variants={itemUp}
              className="group flex flex-col gap-3 px-5 py-5 rounded-2xl
                border border-white/[0.06] bg-white/[0.03]
                hover:border-[#7A2267]/25 hover:bg-white/[0.05]
                transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[#7A2267]/10 border border-[#7A2267]/20
                flex items-center justify-center text-[#c084b8] shrink-0
                group-hover:bg-[#7A2267]/15 transition-colors duration-300">
                {p.icon}
              </div>
              <div>
                <p className={`${cinzel.className} text-[1.1rem] font-semibold text-white mb-0.5`}>
                  {p.label}
                </p>
                <p className={`${sans.className} text-[11px] text-white/35 leading-[1.6] font-light`}>
                  {p.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Venue preview chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {[
            "Grand Outdoor Field",
            "Banquet Hall",
            "Premier Conference Hall",
            "Garden Field",
            "Helipad Field",
            "Conference Suite",
            "Banquet Garden",
          ].map((v) => (
            <span
              key={v}
              className={`${sans.className} text-[10px] uppercase tracking-[0.15em] font-medium
                px-3.5 py-1.5 rounded-full border border-white/[0.08] text-white/35
                hover:border-[#7A2267]/30 hover:text-[#c084b8]/70 transition-colors duration-200`}
            >
              {v}
            </span>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/corporate"
            className={`${sans.className} group flex items-center gap-2.5 px-7 py-3 rounded-full
              bg-[#7A2267] hover:bg-[#8a256f] text-white
              text-[10px] uppercase tracking-[0.2em] font-semibold
              transition-all duration-300 shadow-[0_4px_20px_rgba(122,34,103,0.3)]
              hover:shadow-[0_6px_28px_rgba(122,34,103,0.45)]`}
          >
            Explore Corporate
            <svg viewBox="0 0 10 10" width="8" height="8" fill="none"
              className="transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/corporate#visit-form"
            className={`${sans.className} flex items-center gap-2.5 px-7 py-3 rounded-full
              border border-white/15 text-white/55 hover:text-white hover:border-white/30
              text-[10px] uppercase tracking-[0.2em] font-semibold
              transition-all duration-300`}
          >
            Request a Visit
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
