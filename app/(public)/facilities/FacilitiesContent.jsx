"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lora, Josefin_Sans } from "next/font/google";

gsap.registerPlugin(ScrollTrigger);

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const EASE     = [0.22, 1, 0.36, 1];
const fadeUp   = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
const fadeLeft = { hidden: { opacity: 0, x: -36 }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE } } };
const fadeRight= { hidden: { opacity: 0, x: 36  }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: EASE } } };
const stagger  = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const HERO_BG_URL = "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/2c07aed9-b4ab-4484-89ba-e070065c3632.webp";

function SectionLabel({ text, dark }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className={`h-px w-14 ${dark ? "bg-white/20" : "bg-[#7A2267]/30"}`} />
      <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold ${dark ? "text-white/40" : "text-[#7A2267]/70"}`}>
        {text}
      </p>
      <div className={`h-px w-14 ${dark ? "bg-white/20" : "bg-[#7A2267]/30"}`} />
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  pool:      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M8 7V4M16 7V4M12 7V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  ladies:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 21v-5l-1-5h10l-1 5v5M9 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  lounge:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 17h18M3 17V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M7 17v2M17 17v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  safety:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2l8 3v7c0 4.5-3.5 8.5-8 10-4.5-1.5-8-5.5-8-10V5l8-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  gaming:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="2" y="7" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M7 13h4M9 11v4M15 12h.01M17 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  cinema:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2v4M16 2v4M10 10l6 4-6 4V10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  fitness:   <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M6 12h12M4 8h2v8H4zM18 8h2v8h-2zM2 10h2v4H2zM20 10h2v4h-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  paddle:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><ellipse cx="9" cy="7" rx="5" ry="4" stroke="currentColor" strokeWidth="1.5"/><path d="M12.5 10.5l6 6M2 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  park:      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 22V14M7 14h10M7 14c-2-1-4-3-4-6a9 9 0 0 1 18 0c0 3-2 5-4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  kids:      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M9 21v-6l-3-3 3-3h6l3 3-3 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  restaurant:<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 2v7c0 2.2 1.8 4 4 4v9M7 2v7M11 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M17 2c0 0 0 9-2 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  breakfast: <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="currentColor" strokeWidth="1.5"/><path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  roomservice:<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M2 14h20M4 14V9a8 8 0 0 1 16 0v5M2 19h20M12 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  bbq:       <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M12 17v5M9 22h6M5 10h14M8 6c1-1 2-1 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  dining:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 11l19-9-9 19-2-8-8-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  nature:    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M17 14c2.5-1 4-3.5 4-6 0-5-4-6-4-6s-4 2-4 7c0 1 .2 2 .5 2.8M7 11c-2-1-3-3-3-5 0-4 3-5 3-5s3 1.5 3 5.5c0 .8-.2 1.5-.5 2.2M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bird:      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 4c-2 0-4 2-4 4v1l-4 4 2 1 3-2v1c0 3 2 5 5 5s5-2 5-5V8c0-2-2-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="7" r="1" fill="currentColor"/></svg>,
  bonfire:   <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 22V18M8 18h8M12 18c-3 0-5-2-5-5 0-4 3-6 5-9 2 3 5 5 5 9 0 3-2 5-5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  photo:     <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="2" y="6" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="13.5" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M8 6l2-3h4l2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sunrise:   <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 3v2M5 6l1.5 1.5M19 6l-1.5 1.5M3 13h2M19 13h2M7 17A5 5 0 0 1 17 17M2 20h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  wifi:      <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M1.5 8.5a14 14 0 0 1 21 0M5 12a10 10 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>,
  parking:   <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M9 17V7h5a3 3 0 0 1 0 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  concierge: <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M3 18h18M12 3v3M6 18V9a6 6 0 0 1 12 0v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  laundry:   <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="13" r="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  transfer:  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  medical:   <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  event:     <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

// ─── Data ──────────────────────────────────────────────────────────────────────
// Gallery mosaic — images only, no captions. On desktop each row is given a
// fixed height instead of an aspect ratio: tiles in a row have different widths,
// so a shared ratio would resolve to mismatched heights and leave ragged gaps.
const GALLERY = [
  { src: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/04513f79-b485-4ea2-ae33-585a060146ff.jpg",
    span: "col-span-2 lg:col-span-7",  box: "aspect-[4/3] lg:aspect-auto lg:h-[430px]",  sizes: "(max-width:1024px) 100vw, 58vw" },
  { src: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/f5262688-c246-4696-a5f5-0b171d8ad0ad.webp",
    span: "col-span-1 lg:col-span-5",  box: "aspect-[4/3] lg:aspect-auto lg:h-[430px]",  sizes: "(max-width:1024px) 50vw, 42vw" },
  { src: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/2619f896-9fd9-4c28-9119-608bac7073b2.webp",
    span: "col-span-1 lg:col-span-4",  box: "aspect-[4/3] lg:aspect-auto lg:h-[300px]",  sizes: "(max-width:1024px) 50vw, 33vw" },
  { src: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/a7de85ec-3393-4cf5-9f98-8685e80e19a2.webp",
    span: "col-span-1 lg:col-span-4",  box: "aspect-[4/3] lg:aspect-auto lg:h-[300px]",  sizes: "(max-width:1024px) 50vw, 33vw" },
  { src: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/0db311fc-b5d1-4431-8b6a-13ebde1d3574.webp",
    span: "col-span-1 lg:col-span-4",  box: "aspect-[4/3] lg:aspect-auto lg:h-[300px]",  sizes: "(max-width:1024px) 50vw, 33vw" },
  { src: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/989f6d8c-5722-4697-a7de-36ae1a65a50f.webp",
    span: "col-span-2 lg:col-span-12", box: "aspect-[16/9] lg:aspect-auto lg:h-[380px]", sizes: "100vw" },
];

// The two real venues — same names, taglines and photography as the home page.
const DINING_VENUES = [
  {
    name: "Amber Restaurant",
    tagline: "Fine Dining",
    href: "/dining/amber-restaurant",
    image: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/99e5b6dd-8eee-432d-a675-bbd2354add81.jpeg",
  },
  {
    name: "Amber Café",
    tagline: "Casual & Cosy",
    href: "/dining/amber-cafe",
    image: "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/b564a582-5db2-4451-b417-e141864b7271.jpeg",
  },
];


// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FacilitiesContent() {
  const heroRef       = useRef(null);
  const heroImgRef    = useRef(null);
  const poolRef       = useRef(null);
  const indoorRef     = useRef(null);
  const activitiesRef = useRef(null);
  const kidsRef       = useRef(null);
  const diningRef     = useRef(null);
  const ctaRef        = useRef(null);

  const poolInView       = useInView(poolRef,       { once: true, margin: "-60px" });
  const indoorInView     = useInView(indoorRef,     { once: true, margin: "-60px" });
  const activitiesInView = useInView(activitiesRef, { once: true, margin: "-60px" });
  const kidsInView       = useInView(kidsRef,       { once: true, margin: "-60px" });
  const diningInView     = useInView(diningRef,     { once: true, margin: "-60px" });
  const ctaInView        = useInView(ctaRef,        { once: true, margin: "-60px" });

  useGSAP(() => {
    if (!heroImgRef.current || !heroRef.current) return;
    gsap.fromTo(
      heroImgRef.current,
      { yPercent: 0 },
      {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });

  return (
    <main className="overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[88vh] md:min-h-[90vh] flex flex-col justify-center overflow-hidden">

        <div ref={heroImgRef} className="absolute inset-0 scale-110">
          <Image
            src={HERO_BG_URL}
            alt="Resort facilities" fill priority sizes="100vw" quality={95}
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1309]/30 via-[#1a1309]/40 to-[#1a1309]/88 z-[1]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#1a1309]/40 to-transparent z-[2]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 md:py-20">

          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl text-center mx-auto">

            <motion.h1 variants={fadeUp}
              className={`${lora.className} text-[2.8rem] sm:text-[3.8rem] lg:text-[5rem]
                text-white leading-[1.1] tracking-[-0.02em]`}>
              Everything You Need{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>
                for the Perfect Stay
              </em>
            </motion.h1>

            {/* Halal & Family badges */}
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full
                bg-[#7A2267]/20 border border-[#7A2267]/40 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <path d="M12 2l8 3v7c0 4.5-3.5 8.5-8 10-4.5-1.5-8-5.5-8-10V5l8-3z"
                    stroke="#c084b8" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="#c084b8" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={`${josefin.className} text-[10px] uppercase tracking-[0.22em] font-semibold text-[#c084b8]`}>
                  100% Halal
                </span>
              </div>

              <div className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full
                bg-white/[0.08] border border-white/15 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="1.4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <span className={`${josefin.className} text-[10px] uppercase tracking-[0.22em] font-semibold text-white/55`}>
                  Family-Friendly
                </span>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ══ STATS STRIP ═══════════════════════════════════════════════════════ */}
      <section className="relative bg-[#1a1309]">
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10
            grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 border-b border-white/10"
        >
          {[
            { value: "2",    label: "Swimming Pools" },
            { value: "6+",   label: "Indoor Facilities" },
            { value: "100%", label: "Halal & Family Safe" },
            { value: "24/7", label: "Guest Support" },
          ].map((s, i, arr) => (
            <motion.div key={s.label} variants={fadeUp}
              className="flex flex-col items-center text-center relative">
              {i < arr.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-white/10 hidden md:block" />
              )}
              <span className={`${lora.className} text-[2.4rem] sm:text-[2.8rem] font-semibold text-white leading-none`}>
                {s.value}
              </span>
              <span className={`${josefin.className} text-[9.5px] uppercase tracking-[0.22em] text-white/35 mt-2 font-medium`}>
                {s.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══ 01 POOL & AQUATICS ════════════════════════════════════════════════ */}
      <section ref={poolRef} className="relative bg-white overflow-hidden py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div initial={{ opacity:0,y:-10 }} animate={poolInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-12">
            <SectionLabel text="Pool & Aquatics" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">

            {/* Left: heading + text */}
            <motion.div variants={stagger} initial="hidden" animate={poolInView ? "show" : "hidden"}
              className="flex flex-col gap-6">
              <motion.div variants={fadeUp}>
                <h2 className={`${lora.className} text-[2rem] sm:text-[2.4rem] lg:text-[2.8rem]
                  font-500 text-[#1a1309] leading-[1.18]`}>
                  Dive Into{" "}
                  <em className={`${lora.className} italic text-[#7A2267]`}>Pure Serenity</em>
                </h2>
                <p className={`${josefin.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
                  Two stunning pools await you — our iconic pool open to all guests, and a
                  dedicated ladies-only pool ensuring privacy and comfort for every member of the family.
                  Both are fully complimentary with your stay.
                </p>
              </motion.div>
            </motion.div>

            {/* Right: pool image */}
            <motion.div variants={fadeRight} initial="hidden" animate={poolInView ? "show" : "hidden"}
              className="relative rounded-[2rem] overflow-hidden
                shadow-[0_24px_60px_-12px_rgba(26,19,9,0.18)] aspect-[4/3]">
              <Image
                src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/af2c7a6f-e5d4-4510-bc3d-af2620cbf381.jpeg"
                alt="Iconic swimming pool" fill
                sizes="(max-width:1024px) 90vw, 48vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/55 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                  <p className={`${josefin.className} text-[9px] uppercase tracking-[0.22em] text-[#7A2267] font-semibold`}>
                    Iconic Pool
                  </p>
                  <p className={`${josefin.className} text-[11.5px] text-white/75 mt-0.5`}>
                    Complimentary · Open to all guests
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ 02 INDOOR ENTERTAINMENT ═══════════════════════════════════════════ */}
      <section ref={indoorRef} className="relative bg-[#f9f6f2] overflow-hidden py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div initial={{ opacity:0,y:-10 }} animate={indoorInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-12">
            <SectionLabel text="Indoor Entertainment" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">

            {/* Left: bento grid */}
            <motion.div
              variants={stagger} initial="hidden" animate={indoorInView ? "show" : "hidden"}
              className="grid grid-cols-2 grid-rows-[220px_220px] gap-4"
            >
              {/* Gaming Zone — tall, spans 2 rows */}
              <motion.div variants={fadeLeft}
                className="row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer">
                <Image
                  src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/99a66443-5a5b-4dbf-bf5f-c3d9881fdc8c.jpeg"
                  alt="Indoor Gaming Zone" fill
                  sizes="(max-width:640px) 90vw, 28vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/92 via-[#1a1309]/45 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <div className="text-[#7A2267] mb-2">{icons.gaming}</div>
                  <h3 className={`${lora.className} text-[1.1rem] text-white leading-snug mb-3`}>
                    Indoor Gaming Zone
                  </h3>
                  <div className="space-y-1.5">
                    {["Foosball Table", "Table Tennis", "Billiards / Snooker"].map((g) => (
                      <div key={g} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#7A2267] shrink-0" />
                        <span className={`${josefin.className} text-[10.5px] text-white/65`}>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 9D Cinema */}
              <motion.div variants={fadeRight}
                className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <Image
                  src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/22a998ec-a915-4482-9b6a-dbc67850bd96.jpeg"
                  alt="9D Movie Theater" fill
                  sizes="(max-width:640px) 45vw, 24vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/85 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="text-[#7A2267] mb-1.5 w-5 h-5">{icons.cinema}</div>
                  <h3 className={`${lora.className} text-[0.95rem] text-white leading-snug`}>
                    9D Movie Theater
                  </h3>
                  <p className={`${josefin.className} text-[9.5px] text-white/50 mt-0.5`}>
                    Immersive cinematic experience
                  </p>
                </div>
              </motion.div>

              {/* Fitness Center */}
              <motion.div variants={fadeRight}
                className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <Image
                  src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/0d54039d-97cf-4b8d-a7a0-3a404314f929.jpeg"
                  alt="Recreational Fitness Center" fill
                  sizes="(max-width:640px) 45vw, 24vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/85 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="text-[#7A2267] mb-1.5 w-5 h-5">{icons.fitness}</div>
                  <h3 className={`${lora.className} text-[0.95rem] text-white leading-snug`}>
                    Fitness Center
                  </h3>
                  <p className={`${josefin.className} text-[9.5px] text-white/50 mt-0.5`}>
                    Modern gym & workout space
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: text + feature rows */}
            <motion.div variants={stagger} initial="hidden" animate={indoorInView ? "show" : "hidden"}
              className="flex flex-col gap-6">
              <motion.div variants={fadeUp}>
                <h2 className={`${lora.className} text-[2rem] sm:text-[2.4rem] lg:text-[2.8rem]
                  font-500 text-[#1a1309] leading-[1.18]`}>
                  Fun & Entertainment{" "}
                  <em className={`${lora.className} italic text-[#7A2267] block`}>
                    Under One Roof
                  </em>
                </h2>
                <p className={`${josefin.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
                  When you&apos;re not by the pool or out in nature, our indoor entertainment zone has
                  something for every member of the family — from friendly gaming competitions to
                  an immersive cinematic escape and a well-equipped fitness space.
                </p>
              </motion.div>

              <motion.div variants={stagger} className="space-y-3">
                {[
                  { icon: icons.gaming,  label: "Indoor Gaming Zone",       note: "Foosball · Table Tennis · Billiards" },
                  { icon: icons.cinema,  label: "9D Movie Theater",         note: "Immersive motion-seat cinematic experience" },
                  { icon: icons.fitness, label: "Recreational Fitness Center", note: "Modern equipment, open daily for all guests" },
                ].map((item) => (
                  <motion.div key={item.label} variants={fadeUp}
                    className="flex items-center gap-4 p-4 rounded-xl
                      bg-white border border-[#ede5d8] hover:border-[#7A2267]/40
                      hover:shadow-sm transition-all duration-300 group">
                    <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                      bg-[#7A2267]/[0.08] text-[#7A2267] group-hover:bg-[#7A2267] group-hover:text-white
                      transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className={`${josefin.className} text-[12.5px] font-semibold text-[#1a1309]`}>{item.label}</p>
                      <p className={`${josefin.className} text-[11px] font-light text-[#7a6a52]`}>{item.note}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ 03 GALLERY ════════════════════════════════════════════════════════ */}
      <section ref={activitiesRef} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]
          rounded-full bg-[#7A2267]/[0.09] blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity:0,y:-10 }} animate={activitiesInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-5">
            <SectionLabel text="Gallery" dark />
          </motion.div>

          <motion.div initial={{ opacity:0,y:20 }} animate={activitiesInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.7, delay:0.1 }} className="text-center mb-14">
            <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-white leading-[1.15]`}>
              Scenes from{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>Amber Nivaas</em>
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={activitiesInView ? "show" : "hidden"}
            className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
            {GALLERY.map((shot, i) => (
              <motion.div key={shot.src} variants={fadeUp}
                className={`${shot.span} relative rounded-2xl overflow-hidden
                  ring-1 ring-white/5 ${shot.box}`}>
                <Image
                  src={shot.src} alt={`Dhali's Amber Nivaas — view ${i + 1}`} fill
                  sizes={shot.sizes}
                  className="object-cover hover:scale-[1.04] transition-transform duration-700 ease-out" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ 04 FOR LITTLE ONES ════════════════════════════════════════════════ */}
      <section ref={kidsRef} className="relative bg-[#f9f6f2] overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px]
          rounded-full bg-[#7A2267]/[0.07] blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity:0,y:-10 }} animate={kidsInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-5">
            <SectionLabel text="For Little Ones" />
          </motion.div>

          <motion.div initial={{ opacity:0,y:20 }} animate={kidsInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.7, delay:0.1 }} className="text-center mb-14">
            <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-[#1a1309] leading-[1.15]`}>
              A World Built for{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>Young Adventurers</em>
            </h2>
            <p className={`${josefin.className} text-[13.5px] font-light text-[#6b5e4a] mt-4 max-w-xl mx-auto leading-[1.85]`}>
              Two dedicated play areas for children — one outdoors, one indoors.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={kidsInView ? "show" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Outdoor Park */}
            <motion.div variants={fadeLeft}
              className="group relative rounded-2xl overflow-hidden
                shadow-[0_12px_40px_-8px_rgba(26,19,9,0.12)] cursor-pointer">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/8004d392-3153-47b2-9955-1812e6cdd517.jpeg"
                  alt="Kids' outdoor play zone" fill sizes="(max-width:768px) 90vw, 45vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/82 via-[#1a1309]/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center
                    bg-[#7A2267]/20 border border-[#7A2267]/40 text-[#c084b8]">
                    {icons.park}
                  </div>
                  <h3 className={`${lora.className} text-[1.2rem] text-white leading-snug`}>
                    Kids&apos; Outdoor Play Zone
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* Indoor Kids Zone */}
            <motion.div variants={fadeRight}
              className="group relative rounded-2xl overflow-hidden
                shadow-[0_12px_40px_-8px_rgba(26,19,9,0.12)] cursor-pointer">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/b8878884-c97c-41d6-a269-19f0a3d3944b.jpeg"
                  alt="Kids' indoor play zone" fill sizes="(max-width:768px) 90vw, 45vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/82 via-[#1a1309]/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center
                    bg-[#7A2267]/20 border border-[#7A2267]/40 text-[#c084b8]">
                    {icons.kids}
                  </div>
                  <h3 className={`${lora.className} text-[1.2rem] text-white leading-snug`}>
                    Kids&apos; Indoor Play Zone
                  </h3>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ══ 05 DINING & CUISINE ═══════════════════════════════════════════════ */}
      <section ref={diningRef} className="relative bg-white overflow-hidden py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div initial={{ opacity:0,y:-10 }} animate={diningInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-12">
            <SectionLabel text="Dining & Cuisine" />
          </motion.div>

          {/* Intro */}
          <motion.div variants={stagger} initial="hidden" animate={diningInView ? "show" : "hidden"}
            className="max-w-2xl mb-12">
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2rem] sm:text-[2.4rem] lg:text-[2.8rem]
                font-500 text-[#1a1309] leading-[1.18]`}>
              Dine at{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>Amber Nivaas</em>
            </motion.h2>
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
              Two venues on the property — the Amber Restaurant for sit-down meals,
              and the Amber Café for coffee and light bites.
            </motion.p>
          </motion.div>

          {/* Venue cards */}
          <motion.div variants={stagger} initial="hidden" animate={diningInView ? "show" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {DINING_VENUES.map((venue) => (
              <motion.div key={venue.name} variants={fadeUp}>
                <Link href={venue.href}
                  className="group block relative rounded-[2rem] overflow-hidden aspect-[4/3]
                    shadow-[0_24px_60px_-12px_rgba(26,19,9,0.18)]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A2267] focus-visible:ring-offset-2">
                  <Image
                    src={venue.image} alt={venue.name} fill
                    sizes="(max-width:768px) 90vw, 46vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t
                    from-[#1a1309]/85 via-[#1a1309]/25 to-transparent" />

                  <div className="absolute top-5 left-5 backdrop-blur-md bg-[#1a1309]/50
                    border border-white/15 rounded-xl px-4 py-2">
                    <p className={`${josefin.className} text-[9px] uppercase tracking-[0.22em] text-[#c084b8] font-semibold`}>
                      {venue.tagline}
                    </p>
                  </div>

                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                    <h3 className={`${lora.className} text-[1.5rem] sm:text-[1.75rem] text-white leading-[1.15]`}>
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 pb-1">
                      <span className={`${josefin.className} text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80`}>
                        View Menu
                      </span>
                      <svg viewBox="0 0 14 10" width="10" height="10" fill="none"
                        className="text-white/80 group-hover:translate-x-1 transition-transform duration-200">
                        <path d="M1 5h12M8 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="relative overflow-hidden min-h-[420px] flex items-center justify-center py-24">
        <Image
          src="https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/af2c7a6f-e5d4-4510-bc3d-af2620cbf381.jpeg"
          alt="Swimming pool at Dhali's Amber Nivaas" fill sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1309]/80 via-[#1a1309]/65 to-[#7A2267]/25" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div variants={stagger} initial="hidden" animate={ctaInView ? "show" : "hidden"}
            className="flex flex-col items-center gap-6">

            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <div className="h-px w-10 bg-[#7A2267]/60" />
              <p className={`${josefin.className} text-[10px] uppercase tracking-[0.3em] font-semibold text-[#7A2267]`}>
                Ready to Experience It All?
              </p>
              <div className="h-px w-10 bg-[#7A2267]/60" />
            </motion.div>

            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[3rem] lg:text-[3.6rem]
                font-500 text-white leading-[1.12]`}>
              Your Perfect Retreat
              <br />
              <em className={`${lora.className} italic text-[#7A2267]`}>
                Awaits at Amber Nivaas
              </em>
            </motion.h2>

            <motion.p variants={fadeUp}
              className={`${lora.className} text-[1.1rem] italic text-white/65 max-w-md`}>
              Reserve your stay today and immerse yourself in nature, luxury, and heartfelt family care.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link href="/booking"
                className={`${josefin.className} inline-flex items-center gap-3
                  px-8 py-3.5 rounded-full
                  bg-white text-[#1a1309] text-[12px] font-semibold uppercase tracking-[0.18em]
                  hover:bg-[#f9f6f2] transition-all duration-300 group
                  shadow-[0_8px_30px_-6px_rgba(255,255,255,0.3)]`}>
                Book Your Stay
                <svg viewBox="0 0 16 10" width="13" height="13" fill="none"
                  className="group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/accommodation"
                className={`${josefin.className} inline-flex items-center gap-2
                  px-8 py-3.5 rounded-full
                  border border-white/35 text-white text-[12px] font-semibold uppercase tracking-[0.18em]
                  hover:bg-white/10 hover:border-white/60 transition-all duration-300`}>
                View Rooms
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
