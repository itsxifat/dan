"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ── Framer variants ────────────────────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const itemUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

// ── Gradient fallbacks when no image ──────────────────────────────────────────
const ENTRY_GRADIENTS = [
  "linear-gradient(135deg, #1f0d1a 0%, #3d1535 100%)",
  "linear-gradient(135deg, #0d1a1f 0%, #153533 100%)",
  "linear-gradient(135deg, #1a170d 0%, #352f15 100%)",
  "linear-gradient(135deg, #1a0d17 0%, #2d1530 100%)",
];
const ADDON_GRADIENTS = [
  "linear-gradient(135deg, #1f0d1a 0%, #3d1535 100%)",
  "linear-gradient(135deg, #0d1f14 0%, #15352e 100%)",
  "linear-gradient(135deg, #1f190d 0%, #35280f 100%)",
  "linear-gradient(135deg, #0d101f 0%, #151835 100%)",
  "linear-gradient(135deg, #1a0d0d 0%, #351515 100%)",
];

// ── Discount helpers ───────────────────────────────────────────────────────────
function discountLabel(svc) {
  if (svc.discountType === "percent" && svc.discountValue > 0)
    return `${svc.discountValue}% off`;
  if (svc.discountType === "fixed" && svc.discountValue > 0)
    return `৳${Number(svc.discountValue).toLocaleString()} off`;
  return null;
}

// ── Entry service card ─────────────────────────────────────────────────────────
function EntryCard({ svc, index }) {
  const badge  = discountLabel(svc);
  const gradient = ENTRY_GRADIENTS[index % ENTRY_GRADIENTS.length];

  return (
    <motion.div
      variants={itemUp}
      className="group relative flex flex-col rounded-3xl overflow-hidden
        border border-white/[0.07] hover:border-[#c084b8]/25
        transition-colors duration-300 bg-[#120a0e]"
    >
      {/* Image / Gradient header */}
      <div className="relative h-52 sm:h-56 overflow-hidden shrink-0">
        {svc.image ? (
          <Image
            src={svc.image}
            alt={svc.name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120a0e]/80 via-transparent to-transparent" />

        {/* Discount badge */}
        {badge && (
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5
            bg-[#c084b8] text-[#1a0d1a] px-3 py-1 rounded-full shadow-lg">
            <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
              <path d="M6 1l1.4 2.8 3.1.5-2.2 2.1.5 3.1L6 8.1 3.2 9.5l.5-3.1L1.5 4.3l3.1-.5z"/>
            </svg>
            <span className={`${josefin.className} text-[9px] font-bold uppercase tracking-[0.12em]`}>
              {badge}
            </span>
          </div>
        )}

        {/* Entry type pill */}
        <div className="absolute top-3.5 right-3.5">
          <span className={`${josefin.className} text-[8.5px] font-semibold uppercase tracking-[0.15em]
            px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/70 border border-white/10`}>
            Entry Service
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-4">
        <div className="flex-1">
          <h3 className={`${lora.className} text-[1.15rem] sm:text-[1.25rem] font-semibold
            text-white leading-snug mb-2`}>
            {svc.name}
          </h3>
          {svc.description && (
            <p className={`${josefin.className} text-[12.5px] text-white/40 font-light leading-[1.7]
              line-clamp-3`}>
              {svc.description}
            </p>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-3 pt-2 border-t border-white/[0.06]">
          <div>
            <p className={`${josefin.className} text-[10px] uppercase tracking-[0.18em] text-white/30 mb-0.5`}>
              Per person
            </p>
            <p className={`${lora.className} text-[1.7rem] font-semibold text-[#c084b8] leading-none`}>
              ৳{Number(svc.price).toLocaleString()}
            </p>
          </div>
          <Link href="/booking"
            className={`${josefin.className} shrink-0 inline-flex items-center gap-2 px-5 py-2.5
              rounded-full bg-[#7A2267] hover:bg-[#8a2878] text-white text-[11px] font-semibold
              uppercase tracking-[0.15em] transition-all duration-200 group/btn
              shadow-[0_4px_14px_rgba(122,34,103,0.3)] hover:shadow-[0_6px_20px_rgba(122,34,103,0.45)]`}>
            Book
            <svg viewBox="0 0 10 10" width="8" height="8" fill="none"
              className="transition-transform duration-200 group-hover/btn:translate-x-0.5">
              <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Add-on card ────────────────────────────────────────────────────────────────
function AddonCard({ svc, index }) {
  const badge    = discountLabel(svc);
  const gradient = ADDON_GRADIENTS[index % ADDON_GRADIENTS.length];

  return (
    <motion.div
      variants={itemUp}
      className="group relative flex flex-row sm:flex-col rounded-2xl overflow-hidden
        border border-white/[0.06] hover:border-[#c084b8]/20
        transition-colors duration-300 bg-[#120a0e]"
    >
      {/* Thumbnail */}
      <div className="relative w-24 sm:w-auto sm:h-36 shrink-0 overflow-hidden">
        {svc.image ? (
          <Image
            src={svc.image}
            alt={svc.name}
            fill
            sizes="(max-width:640px) 96px, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120a0e]/70 via-transparent to-transparent" />

        {badge && (
          <div className="absolute top-2 left-2 bg-[#c084b8] text-[#1a0d1a] px-2 py-0.5 rounded-full">
            <span className={`${josefin.className} text-[8px] font-bold uppercase tracking-[0.1em]`}>
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className={`${josefin.className} text-[8px] font-semibold uppercase tracking-[0.15em]
            text-[#c084b8]/50`}>
            Add-on
          </span>
        </div>
        <h4 className={`${lora.className} text-[0.92rem] font-semibold text-white leading-snug`}>
          {svc.name}
        </h4>
        {svc.description && (
          <p className={`${josefin.className} text-[11px] text-white/35 font-light leading-[1.6] line-clamp-2 hidden sm:block`}>
            {svc.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <p className={`${lora.className} text-[1.1rem] font-semibold text-[#c084b8]`}>
            ৳{Number(svc.price).toLocaleString()}
          </p>
          <Link href="/booking"
            className={`${josefin.className} text-[9.5px] font-semibold uppercase tracking-[0.12em]
              px-3 py-1.5 rounded-full border border-white/15 text-white/50
              hover:border-[#c084b8]/40 hover:text-[#c084b8] transition-all duration-200`}>
            Add
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07]
        flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
          strokeWidth="1.3" className="text-white/20">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2" strokeLinecap="round"/>
        </svg>
      </div>
      <p className={`${josefin.className} text-[13px] text-white/25`}>
        Services coming soon — check back shortly.
      </p>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export default function PackagesSection({ services = [] }) {
  const ref       = useRef(null);
  const isInView  = useInView(ref, { once: true, margin: "-60px" });

  const entryServices = services.filter((s) => s.type === "entry");
  const addons        = services.filter((s) => s.type === "addon");

  return (
    <section ref={ref} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28 lg:py-32">

      {/* Bg blobs */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2
        w-[700px] h-[400px] rounded-full bg-[#7A2267]/[0.1] blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-0
        w-[400px] h-[300px] rounded-full bg-[#c084b8]/[0.04] blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.35em]
                text-[#c084b8]/55 font-semibold mb-3`}>
                Day Visit Services
              </p>
              <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
                font-semibold text-white leading-[1.12]`}>
                Choose Your{" "}
                <em className={`${lora.className} italic text-[#c084b8]`}>Day Experience</em>
              </h2>
            </div>
            <p className={`${josefin.className} text-[12.5px] text-white/35 font-light
              max-w-sm leading-[1.75] lg:text-right`}>
              Select an entry service and optionally enhance your visit with add-ons —
              all fully halal, all at Dhali's Amber Nivaas.
            </p>
          </div>
        </motion.div>

        {/* ── No services ── */}
        {services.length === 0 && <EmptyState />}

        {/* ── Entry services ── */}
        {entryServices.length > 0 && (
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex items-center gap-3 mb-7"
            >
              <span className={`${josefin.className} text-[9px] uppercase tracking-[0.25em]
                font-semibold text-white/25`}>
                Entry Services
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className={`${josefin.className} text-[9px] uppercase tracking-[0.2em]
                text-white/20`}>
                Choose one
              </span>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={isInView ? "show" : "hidden"}
              className={`grid gap-4 sm:gap-5
                ${entryServices.length === 1 ? "grid-cols-1 max-w-sm" :
                  entryServices.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl" :
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
            >
              {entryServices.map((svc, i) => (
                <EntryCard key={svc._id} svc={svc} index={i} />
              ))}
            </motion.div>
          </div>
        )}

        {/* ── Add-ons ── */}
        {addons.length > 0 && (
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3 mb-7"
            >
              <span className={`${josefin.className} text-[9px] uppercase tracking-[0.25em]
                font-semibold text-white/25`}>
                Optional Add-ons
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className={`${josefin.className} text-[9px] uppercase tracking-[0.2em]
                text-white/20`}>
                Enhance your visit
              </span>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={isInView ? "show" : "hidden"}
              className={`grid gap-3 sm:gap-4
                ${addons.length === 1 ? "grid-cols-1 max-w-xs" :
                  addons.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-xl" :
                  addons.length <= 4  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}
            >
              {addons.map((svc, i) => (
                <AddonCard key={svc._id} svc={svc} index={i} />
              ))}
            </motion.div>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-between gap-5
              pt-10 border-t border-white/[0.06]"
          >
            <p className={`${josefin.className} text-[12px] text-white/30 font-light leading-[1.7]
              max-w-md text-center sm:text-left`}>
              All day visit services include resort grounds access. Add-ons can be
              selected during booking based on availability.
            </p>
            <Link href="/booking"
              className={`${josefin.className} shrink-0 inline-flex items-center gap-2.5 px-8 py-3.5
                rounded-full bg-white text-[#1a1309] text-[11px] font-semibold uppercase
                tracking-[0.18em] hover:bg-[#f3ede8] transition-all duration-200 group`}>
              Book a Day Visit
              <svg viewBox="0 0 16 10" width="12" height="10" fill="none"
                className="transition-transform duration-200 group-hover:translate-x-0.5">
                <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </motion.div>
        )}

      </div>
    </section>
  );
}
