"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

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
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    label: "6 Venues",
    sub: "From intimate gardens to grand outdoor fields for 15,000",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    label: "On-site Stay",
    sub: "Exclusive accommodation for the bridal party and guests",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    label: "Halal Catering",
    sub: "Bespoke wedding menus crafted by our in-house culinary team",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: "Dedicated Planner",
    sub: "A personal wedding coordinator with you from day one",
  },
];

export default function WeddingSection() {
  const ref     = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-20 md:py-28 lg:py-32"
      style={{ background: "linear-gradient(135deg, #fdf8f4 0%, #faf3f8 50%, #f8f4fd 100%)" }}>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-0 right-0 w-[540px] h-[540px]
        rounded-full bg-[#7A2267]/[0.05] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px]
        rounded-full bg-[#c084b8]/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 60% at 100% 0%, rgba(192,132,184,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${josefin.className} text-center text-[10px] uppercase tracking-[0.3em] text-[#7A2267]/60 font-semibold mb-4`}
        >
          Destination Wedding
        </motion.p>

        {/* Heading + description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-5 max-w-3xl mx-auto"
        >
          <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
            font-500 text-[#1a1309] leading-[1.15] mb-4`}>
            Your Dream Wedding,{" "}
            <em className={`${lora.className} italic text-[#7A2267]`}>Our Timeless Backdrop</em>
          </h2>
          <p className={`${josefin.className} text-[13px] text-[#1a1309]/45 leading-[1.85] font-light`}>
            Nestled in lush surroundings, Dhali's Amber Nivaas transforms your most cherished day
            into an unforgettable celebration — from intimate Nikah ceremonies to grand receptions
            for thousands, all with bespoke halal catering and flawless hospitality.
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
                border border-[#7A2267]/[0.08] bg-white/60 backdrop-blur-sm
                hover:border-[#7A2267]/25 hover:bg-white/80
                transition-all duration-300 shadow-[0_2px_16px_rgba(122,34,103,0.04)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#7A2267]/8 border border-[#7A2267]/15
                flex items-center justify-center text-[#7A2267]/70 shrink-0
                group-hover:bg-[#7A2267]/12 transition-colors duration-300">
                {p.icon}
              </div>
              <div>
                <p className={`${lora.className} text-[1.1rem] font-semibold text-[#1a1309] mb-0.5`}>
                  {p.label}
                </p>
                <p className={`${josefin.className} text-[11px] text-[#1a1309]/40 leading-[1.6] font-light`}>
                  {p.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Occasion chips */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {[
            "Nikah Ceremony",
            "Holud / Mehndi",
            "Wedding Reception",
            "Grand Outdoor Field",
            "Garden Celebration",
            "Banquet Hall",
            "Guest Accommodation",
          ].map((v) => (
            <span
              key={v}
              className={`${josefin.className} text-[10px] uppercase tracking-[0.15em] font-medium
                px-3.5 py-1.5 rounded-full border border-[#7A2267]/15 text-[#7A2267]/50
                hover:border-[#7A2267]/35 hover:text-[#7A2267]/80 transition-colors duration-200
                bg-white/50`}
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
            href="/destination-wedding"
            className={`${josefin.className} group flex items-center gap-2.5 px-7 py-3 rounded-full
              bg-[#7A2267] hover:bg-[#8a256f] text-white
              text-[10px] uppercase tracking-[0.2em] font-semibold
              transition-all duration-300 shadow-[0_4px_20px_rgba(122,34,103,0.25)]
              hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]`}
          >
            Explore Weddings
            <svg viewBox="0 0 10 10" width="8" height="8" fill="none"
              className="transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/destination-wedding#enquiry"
            className={`${josefin.className} flex items-center gap-2.5 px-7 py-3 rounded-full
              border border-[#7A2267]/25 text-[#7A2267]/60 hover:text-[#7A2267] hover:border-[#7A2267]/50
              text-[10px] uppercase tracking-[0.2em] font-semibold
              transition-all duration-300`}
          >
            Plan Your Wedding
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
