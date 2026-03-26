"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Cormorant, DM_Sans } from "next/font/google";

const display = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans    = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function CtaSection() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
  };
  const lineUp = {
    hidden: { opacity: 0, y: 36 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <section
      ref={ref}
      className="relative overflow-hidden flex items-center justify-center
        min-h-[480px] sm:min-h-[560px] lg:min-h-[680px]"
    >
      {/* ── Parallax background ── */}
      <motion.div
        className="absolute z-0 inset-0"
        style={{ y: bgY, scale: 1.2 }}
      >
        <Image
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
      </motion.div>

      {/* ── Strong overlay — no purple bleed ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(160deg, rgba(12,8,4,0.88) 0%, rgba(12,8,4,0.80) 55%, rgba(20,8,16,0.84) 100%)",
        }}
      />

      {/* ── Vignette edges ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none"
        style={{ boxShadow: "inset 0 0 120px rgba(8,4,2,0.55)" }} />

      {/* ── Content ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 text-center py-20 sm:py-28"
      >
        {/* Eyebrow */}
        <motion.div variants={lineUp} className="flex items-center justify-center gap-4 mb-7">
          <div className="h-px w-10 bg-[#7A2267]/60" />
          <span className={`${sans.className} text-[9px] uppercase tracking-[0.42em] text-[#c084b8] font-medium`}>
            Reserve Your Stay
          </span>
          <div className="h-px w-10 bg-[#7A2267]/60" />
        </motion.div>

        {/* Heading line 1 */}
        <motion.h2
          variants={lineUp}
          className={`${display.className} text-[2.8rem] sm:text-[3.6rem] lg:text-[4.8rem]
            font-300 text-white leading-[1.08] tracking-[-0.01em]`}
        >
          Your Perfect Escape
        </motion.h2>

        {/* Heading line 2 — italic accent */}
        <motion.h2
          variants={lineUp}
          className={`${display.className} text-[2.8rem] sm:text-[3.6rem] lg:text-[4.8rem]
            font-300 italic text-[#c084b8] leading-[1.12] tracking-[-0.01em] mb-8`}
        >
          Awaits at Amber Nivaas
        </motion.h2>

        {/* Divider */}
        <motion.div variants={lineUp} className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-white/15" />
          <div className="w-1 h-1 rounded-full bg-[#7A2267]/60" />
          <div className="h-px w-16 bg-white/15" />
        </motion.div>

        {/* Sub */}
        <motion.p
          variants={lineUp}
          className={`${sans.className} text-[13px] sm:text-[14.5px] font-light text-white/55
            max-w-sm mx-auto leading-[1.9] mb-10`}
        >
          Nature, luxury, and serenity — all in one sanctuary crafted for those who seek more.
        </motion.p>

        {/* Buttons — stacked on mobile, inline on sm+ */}
        <motion.div
          variants={lineUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link
            href="/booking"
            className={`${sans.className} w-full sm:w-auto inline-flex items-center justify-center gap-3
              px-8 py-4 rounded-full
              bg-white text-[#1a1309] text-[11px] font-semibold uppercase tracking-[0.22em]
              hover:bg-[#f8f4ee] transition-all duration-300 group
              shadow-[0_8px_40px_rgba(255,255,255,0.12)]`}
          >
            Book Your Stay
            <svg viewBox="0 0 16 10" width="12" height="12" fill="none"
              className="group-hover:translate-x-1 transition-transform duration-300">
              <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          <Link
            href="/accommodation"
            className={`${sans.className} w-full sm:w-auto inline-flex items-center justify-center gap-3
              px-8 py-4 rounded-full
              border border-white/25 text-white text-[11px] font-semibold uppercase tracking-[0.22em]
              hover:bg-white/8 hover:border-white/50 transition-all duration-300`}
          >
            Explore Rooms
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
