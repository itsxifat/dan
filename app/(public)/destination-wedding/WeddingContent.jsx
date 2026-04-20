"use client";

import { useRef, useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { submitWeddingEnquiry } from "@/actions/wedding/weddingActions";

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

const HERO_IMAGE = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=85";

// ── Services ───────────────────────────────────────────────────────────────────
const SERVICES = [
  { title: "Nikah Ceremony",        desc: "Beautifully arranged Nikah settings with floral décor, privacy, and the serenity your ceremony deserves." },
  { title: "Holud & Mehndi",        desc: "Vibrant pre-wedding events in our garden venues, styled with traditional warmth and modern elegance." },
  { title: "Grand Reception",       desc: "From intimate banquets to 15,000-guest outdoor galas — your reception, your vision, our flawless execution." },
  { title: "Halal Catering",        desc: "Bespoke wedding menus by our in-house culinary team — traditional Bangladeshi feasts to multi-cuisine spreads." },
  { title: "On-site Accommodation", desc: "Exclusive room blocks for the bridal party and out-of-town guests, coordinated with your event schedule." },
  { title: "Décor & Florals",       desc: "Our in-house décor team brings your aesthetic to life — from minimalist elegance to opulent floral installations." },
  { title: "Dedicated Planner",     desc: "Your personal coordinator manages every detail — from the first site visit to the final farewell." },
  { title: "Photography & AV",      desc: "Referrals to top-tier photographers and in-house state-of-the-art audio-visual systems for every venue." },
];

// ── Gallery ────────────────────────────────────────────────────────────────────
const GALLERY_CATS = ["All", "Ceremony", "Reception", "Holud · Mehndi", "Venue", "Décor"];
const GALLERY_PHOTOS = [
  { id:"c1", cat:"Ceremony",       title:"Nikah Moment",         span:"row",  src:"https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80" },
  { id:"c2", cat:"Ceremony",       title:"Sacred Vows",          span:"none", src:"https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80" },
  { id:"c3", cat:"Ceremony",       title:"Bridal Procession",    span:"none", src:"https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80" },
  { id:"c4", cat:"Ceremony",       title:"Ring Exchange",        span:"col",  src:"https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=900&q=80" },
  { id:"r1", cat:"Reception",      title:"Grand Reception Hall", span:"col",  src:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80" },
  { id:"r2", cat:"Reception",      title:"Candlelit Tables",     span:"none", src:"https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=900&q=80" },
  { id:"r3", cat:"Reception",      title:"Evening Celebration",  span:"none", src:"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80" },
  { id:"r4", cat:"Reception",      title:"First Dance",          span:"row",  src:"https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80" },
  { id:"r5", cat:"Reception",      title:"Feast Table",          span:"none", src:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80" },
  { id:"h1", cat:"Holud · Mehndi", title:"Holud Ceremony",       span:"col",  src:"https://images.unsplash.com/photo-1585241936939-be4099591252?auto=format&fit=crop&w=900&q=80" },
  { id:"h2", cat:"Holud · Mehndi", title:"Mehndi Night",         span:"none", src:"https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80" },
  { id:"h3", cat:"Holud · Mehndi", title:"Traditional Ritual",   span:"none", src:"https://images.unsplash.com/photo-1596797882870-8c0e5c2f82d4?auto=format&fit=crop&w=900&q=80" },
  { id:"h4", cat:"Holud · Mehndi", title:"Mehndi Details",       span:"row",  src:"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80" },
  { id:"v1", cat:"Venue",          title:"Grand Outdoor Field",  span:"col",  src:"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80" },
  { id:"v2", cat:"Venue",          title:"Garden Setting",       span:"none", src:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80" },
  { id:"v3", cat:"Venue",          title:"Banquet Hall",         span:"none", src:"https://images.unsplash.com/photo-1561912774-79769a0a0a7a?auto=format&fit=crop&w=900&q=80" },
  { id:"v4", cat:"Venue",          title:"Garden Path",          span:"none", src:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80" },
  { id:"d1", cat:"Décor",          title:"Floral Arch",          span:"row",  src:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80" },
  { id:"d2", cat:"Décor",          title:"Table Centrepiece",    span:"none", src:"https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80" },
  { id:"d3", cat:"Décor",          title:"String Lights",        span:"none", src:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
  { id:"d4", cat:"Décor",          title:"Rose Petal Aisle",     span:"col",  src:"https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80" },
  { id:"d5", cat:"Décor",          title:"Mandap Setup",         span:"none", src:"https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80" },
];

// ── GSAP Hero Title ────────────────────────────────────────────────────────────
function HeroTitle() {
  const containerRef = useRef(null);

  useGSAP(() => {
    const words = containerRef.current?.querySelectorAll(".hw");
    if (!words?.length) return;
    gsap.fromTo(words,
      { y: "120%", opacity: 0 },
      { y: "0%", opacity: 1, duration: 1.1, stagger: 0.1, ease: "expo.out", delay: 0.4 }
    );
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="text-center">
      <div className="overflow-hidden mb-1">
        <span className={`hw inline-block ${lora.className} text-[2.8rem] sm:text-[4rem] lg:text-[5.2rem]
          text-white leading-[1.05]`} style={{ opacity: 0 }}>
          Where Every
        </span>
      </div>
      <div className="overflow-hidden mb-1">
        <span className={`hw inline-block ${lora.className} text-[2.8rem] sm:text-[4rem] lg:text-[5.2rem]
          text-white leading-[1.05]`} style={{ opacity: 0 }}>
          Moment&nbsp;<em className={`${lora.className} italic`}>Becomes</em>
        </span>
      </div>
      <div className="overflow-hidden">
        <span className={`hw inline-block ${lora.className} italic text-[3.2rem] sm:text-[4.6rem] lg:text-[6rem]
          text-[#7A2267] leading-none`} style={{ opacity: 0 }}>
          Forever
        </span>
      </div>
    </div>
  );
}

// ── Infinite Marquee ───────────────────────────────────────────────────────────
function Marquee() {
  const trackRef = useRef(null);
  useGSAP(() => {
    gsap.to(trackRef.current, { x: "-50%", duration: 28, repeat: -1, ease: "linear" });
  });
  const items = ["Nikah Ceremony","·","Holud · Mehndi","·","Wedding Reception","·","Walima Feast","·","Pre-Wedding Brunch","·","Valima Gathering","·","Bou Bhat","·","Family Dawat","·"];
  const doubled = [...items, ...items];
  return (
    <div className="bg-[#7A2267] py-3 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, #7A2267 0%, transparent 8%, transparent 92%, #7A2267 100%)" }} />
      <div ref={trackRef} className="flex items-center gap-6 whitespace-nowrap will-change-transform" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} className={`${josefin.className} text-[10px] uppercase tracking-[0.22em] font-semibold
            ${item === "·" ? "text-white/25" : "text-white/70"}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

// ── Stats strip with GSAP counters ─────────────────────────────────────────────
function StatsBar() {
  const sectionRef = useRef(null);
  const statRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const STATS = [
    { target: 6,     suffix: "",  label: "Stunning Venues" },
    { target: 15000, suffix: "+", label: "Max Guest Capacity" },
    { target: 100,   suffix: "%", label: "Halal Certified" },
    { target: 1,     suffix: "",  label: "Dedicated Planner" },
  ];

  useGSAP(() => {
    STATS.forEach((stat, i) => {
      const el = statRefs[i].current;
      if (!el) return;
      const obj = { val: 0 };
      gsap.to(obj, {
        val: stat.target,
        duration: 2.2,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
        onUpdate: () => {
          el.textContent = (stat.target >= 1000
            ? Math.round(obj.val).toLocaleString()
            : Math.round(obj.val)
          ) + stat.suffix;
        },
      });
    });
    gsap.fromTo(sectionRef.current?.querySelectorAll(".stat-item"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true } }
    );
  }, { scope: sectionRef });

  return (
    <div ref={sectionRef} className="bg-[#1a1309] py-8 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-14 grid grid-cols-2 lg:grid-cols-4 gap-6
        divide-x-0 lg:divide-x divide-white/6">
        {STATS.map((s, i) => (
          <div key={i} className="stat-item text-center lg:px-8 py-2" style={{ opacity: 0 }}>
            <p className={`${lora.className} text-[1.8rem] sm:text-[2.2rem] text-white`}>
              <span ref={statRefs[i]}>0{s.suffix}</span>
            </p>
            <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.18em] text-white/35 mt-1`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Venues Section ─────────────────────────────────────────────────────────────
function VenuesSection({ venues = [] }) {
  const sectionRef = useRef(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} id="venues" className="relative bg-white overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute top-0 right-0 w-125 h-125 rounded-full bg-[#7A2267]/3 blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
          className="flex flex-col items-center text-center mb-16">
          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-6`}>
            Our Wedding Venues
          </motion.p>
          <motion.h2 variants={fadeUp}
            className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
            Every Celebration Finds Its{" "}
            <em className={`${lora.className} italic text-[#7A2267]`}>Perfect Stage</em>
          </motion.h2>
          <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mt-7" />
          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[13px] text-[#6b5e4e] font-light mt-6 max-w-md leading-relaxed`}>
            Six distinct venues — from intimate suites to grand fields for 15,000.
          </motion.p>
        </motion.div>

        {venues.length === 0 ? (
          <p className={`${josefin.className} text-center py-16 text-[#9b8e78] text-[13px]`}>
            Venues coming soon.
          </p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {venues.map((v) => (
              <motion.div key={v._id} variants={fadeUp}>
                <Link href={`/destination-wedding/venues/${v.slug}`}
                  className="group flex flex-col h-full bg-[#faf8f5] border border-[#ede5d8] rounded-2xl overflow-hidden
                    hover:border-[#7A2267]/40 hover:shadow-[0_12px_40px_-8px_rgba(122,34,103,0.16)]
                    transition-all duration-300">

                  <div className="relative h-44 overflow-hidden bg-[#f0e8dc]">
                    {v.coverImage ? (
                      <img src={v.coverImage} alt={v.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg viewBox="0 0 40 36" className="w-14 h-14 text-[#7A2267]/15" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="2" y="8" width="36" height="26" rx="3"/><path d="M20 16v8M16 19.5h8"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-[#1a1309]/60 via-transparent to-transparent" />
                    {v.badge && (
                      <span className={`${josefin.className} absolute top-3 left-3 text-[8px] uppercase tracking-[0.18em]
                        font-semibold px-2.5 py-1 rounded-full bg-[#7A2267] text-white`}>{v.badge}</span>
                    )}
                    {v.capacity && (
                      <span className={`${josefin.className} absolute bottom-3 right-3 text-[9px] font-semibold
                        text-white bg-black/40 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full`}>
                        {v.capacity}
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className={`${josefin.className} inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider
                        font-semibold px-3 py-1.5 rounded-full bg-[#7A2267] text-white`}>
                        View Details
                        <svg viewBox="0 0 8 8" width="6" height="6" fill="none">
                          <path d="M1 4h5M4 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-5 flex flex-col flex-1 gap-2">
                    <h3 className={`${lora.className} text-[1.05rem] font-500 text-[#1a1309] leading-tight`}>{v.name}</h3>
                    {v.description && (
                      <p className={`${josefin.className} text-[11.5px] text-[#6b5e4e] leading-[1.8] font-light line-clamp-2`}>{v.description}</p>
                    )}
                    {v.features?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-[#f0e8dc]">
                        {v.features.slice(0, 3).map((f) => (
                          <span key={f} className={`${josefin.className} text-[9.5px] text-[#7A2267]/70
                            bg-[#7A2267]/6 border border-[#7A2267]/10 px-2.5 py-0.5 rounded-full`}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ── Services Section ───────────────────────────────────────────────────────────
const SERVICE_ICONS = [
  <svg key="s0" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  <svg key="s1" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>,
  <svg key="s2" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key="s3" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  <svg key="s4" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  <svg key="s5" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  <svg key="s6" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key="s7" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
];

function ServicesSection() {
  const sectionRef = useRef(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} className="relative bg-[#1a1309] overflow-hidden py-24 md:py-28">
      <div className="pointer-events-none absolute top-0 left-0 w-100 h-100 rounded-full bg-[#7A2267]/[0.07] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-87.5 h-87.5 rounded-full bg-[#7A2267]/4 blur-[80px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
          className="flex flex-col items-center text-center mb-16">
          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-6`}>
            What We Offer
          </motion.p>
          <motion.h2 variants={fadeUp}
            className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              font-400 text-white leading-[1.12] tracking-[-0.01em]`}>
            Everything Your Wedding Needs,{" "}
            <em className={`${lora.className} italic`}>Under One Roof</em>
          </motion.h2>
          <motion.div variants={fadeUp} className="h-px w-14 bg-white/20 mt-7" />
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s, i) => (
            <motion.div key={i} variants={fadeUp}
              className="group flex flex-col gap-4 p-6 rounded-2xl border border-white/6 bg-white/3
                hover:border-[#7A2267]/25 hover:bg-white/5 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8
                flex items-center justify-center text-[#7A2267] shrink-0
                group-hover:bg-[#7A2267]/10 group-hover:border-[#7A2267]/20 transition-colors duration-300">
                {SERVICE_ICONS[i]}
              </div>
              <div>
                <h3 className={`${lora.className} text-[1rem] font-500 text-white mb-2 leading-tight`}>{s.title}</h3>
                <p className={`${josefin.className} text-[11.5px] text-white/40 leading-[1.8] font-light`}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Lightbox ───────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-999 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
          flex items-center justify-center text-white transition-colors z-10">
        <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
          <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full
          bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
        <svg viewBox="0 0 10 16" width="8" height="14" fill="none">
          <path d="M8 1L2 8l6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full
          bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
        <svg viewBox="0 0 10 16" width="8" height="14" fill="none">
          <path d="M2 1l6 7-6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <motion.div
        key={photo.id}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}
        className="relative max-w-4xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={photo.src} alt={photo.title}
          className="w-full max-h-[72vh] object-contain rounded-2xl" />
        <div className="mt-4 text-center">
          <p className={`${lora.className} text-white text-[1.1rem]`}>{photo.title}</p>
          <p className={`${josefin.className} text-white/35 text-[9px] uppercase tracking-[0.2em] mt-1`}>{photo.cat}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Gallery Section ────────────────────────────────────────────────────────────
function WeddingGallery({ photos = [] }) {
  const sectionRef    = useRef(null);
  const inView        = useInView(sectionRef, { once: true, margin: "-80px" });
  const [activeCat, setActiveCat]     = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const allPhotos = photos.length > 0
    ? photos.map((p) => ({ id: p._id, cat: p.category, title: p.title || "", span: p.span || "none", src: p.image }))
    : GALLERY_PHOTOS;

  const dynamicCats = ["All", ...Array.from(new Set(allPhotos.map((p) => p.cat).filter(Boolean))).sort()];

  const filtered      = activeCat === "All" ? allPhotos : allPhotos.filter((p) => p.cat === activeCat);
  const openLightbox  = (i) => setLightboxIdx(i);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevPhoto     = useCallback(() => setLightboxIdx((i) => (i - 1 + filtered.length) % filtered.length), [filtered.length]);
  const nextPhoto     = useCallback(() => setLightboxIdx((i) => (i + 1) % filtered.length), [filtered.length]);

  return (
    <section ref={sectionRef} className="relative bg-[#f9f6f2] overflow-hidden py-24 md:py-28">
      <div className="pointer-events-none absolute top-0 right-0 w-100 h-100 rounded-full bg-[#7A2267]/5 blur-[90px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-5`}>
              Wedding Gallery
            </motion.p>
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
              Moments That Tell{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>Your Story</em>
            </motion.h2>
            <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mt-6" />
          </div>
          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[12px] text-[#9b8e78] font-light max-w-xs leading-relaxed sm:text-right`}>
            A glimpse into the celebrations that have unfolded at Dhali&apos;s Amber Nivaas.
          </motion.p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8">
          {dynamicCats.map((cat) => (
            <button key={cat} onClick={() => { setActiveCat(cat); setLightboxIdx(null); }}
              className={`${josefin.className} text-[10px] font-semibold px-4 py-1.5 rounded-full
                border transition-all duration-200
                ${activeCat === cat
                  ? "bg-[#7A2267] border-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.3)]"
                  : "border-[#ede5d8] text-[#9b8e78] hover:border-[#7A2267]/40 hover:text-[#7A2267]"
                }`}>
              {cat}
              {cat !== "All" && (
                <span className={`ml-1.5 text-[8.5px] ${activeCat === cat ? "text-white/55" : "text-[#b8a898]"}`}>
                  {allPhotos.filter((p) => p.cat === cat).length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Masonry */}
        <div className="columns-2 md:columns-3 gap-3" style={{ columnGap: "12px" }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.id} layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer mb-3 bg-[#ede5d8]
                  ${photo.span === "row" ? "aspect-3/4" : photo.span === "col" ? "aspect-4/3" : "aspect-square"}`}
                onClick={() => openLightbox(i)}
              >
                <Image src={photo.src} alt={photo.title} fill
                  sizes="(max-width:768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
                <div className="absolute inset-0 bg-linear-to-t from-[#1a1309]/80 via-transparent to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span className={`${josefin.className} text-[8px] uppercase tracking-[0.15em] font-semibold
                    px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20`}>
                    {photo.cat}
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 px-3.5 pb-3.5 opacity-0 group-hover:opacity-100
                  translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <p className={`${lora.className} text-white text-[13px]`}>{photo.title}</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md
                  flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
                  transition-all duration-300 border border-white/20">
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                    <path d="M4.5 1H1v3.5M7.5 1H11v3.5M4.5 11H1V7.5M7.5 11H11V7.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-[13px] text-[#9b8e78]">No photos in this category yet.</div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox photos={filtered} index={lightboxIdx}
            onClose={closeLightbox} onPrev={prevPhoto} onNext={nextPhoto} />
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Custom Calendar ────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEK   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function CustomCalendar({ value, onChange, onClose }) {
  const [view, setView] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const firstDay  = new Date(view.year, view.month, 1).getDay();
  const daysCount = new Date(view.year, view.month + 1, 0).getDate();
  const goBack = () => view.month === 0 ? setView({ year: view.year-1, month: 11 }) : setView({ ...view, month: view.month-1 });
  const goFwd  = () => view.month === 11 ? setView({ year: view.year+1, month: 0 }) : setView({ ...view, month: view.month+1 });
  const select = (day) => {
    const m = String(view.month+1).padStart(2,"0");
    const d = String(day).padStart(2,"0");
    onChange(`${view.year}-${m}-${d}`);
    onClose();
  };
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i+1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 z-50 mt-2 w-70 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      style={{ background: "#1a0e1f", border: "1px solid rgba(122,34,103,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
        <button onClick={goBack}
          className="w-7 h-7 rounded-full bg-white/6 hover:bg-[#7A2267]/15 text-white/50 hover:text-[#7A2267]
            flex items-center justify-center transition-all text-sm">‹</button>
        <span className={`${josefin.className} text-[12px] font-semibold text-white/80`}>{MONTHS[view.month]} {view.year}</span>
        <button onClick={goFwd}
          className="w-7 h-7 rounded-full bg-white/6 hover:bg-[#7A2267]/15 text-white/50 hover:text-[#7A2267]
            flex items-center justify-center transition-all text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 px-3 pt-3">
        {WEEK.map((d) => (
          <div key={d} className={`${josefin.className} text-center text-[8.5px] font-semibold text-white/20 uppercase tracking-wider py-1`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${view.year}-${String(view.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isSel   = value === dateStr;
          const isPast  = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          return (
            <button key={i} disabled={isPast} onClick={() => !isPast && select(day)}
              className={`${josefin.className} w-full aspect-square rounded-lg text-[12px] font-medium
                flex items-center justify-center transition-all
                ${isSel   ? "bg-[#7A2267] text-white shadow-[0_0_12px_rgba(122,34,103,0.5)]"
                : isToday ? "bg-[#7A2267]/15 text-[#7A2267] border border-[#7A2267]/30"
                : isPast  ? "text-white/12 cursor-not-allowed"
                :           "text-white/55 hover:bg-white/8 hover:text-white"
                }`}>
              {day}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Custom Select ──────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl transition-all duration-200 text-left text-[12.5px] font-light
          ${open ? "border-[#7A2267]/50 bg-white/8" : "border-white/10 bg-white/6 hover:bg-white/8"}
          ${value ? "text-white/80" : "text-white/25"}`}
        style={{ border: `1px solid ${open ? "rgba(122,34,103,0.5)" : "rgba(255,255,255,0.1)"}` }}>
        <span className={`${josefin.className}`}>{selected ? selected.label : placeholder}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          viewBox="0 0 10 6" width="10" height="6" fill="none" className="text-white/30 shrink-0">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl overflow-hidden shadow-2xl shadow-black/60"
            style={{ background: "#1a0e1f", border: "1px solid rgba(122,34,103,0.15)" }}>
            {options.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`${josefin.className} w-full text-left px-4 py-2.5 text-[12.5px] font-light transition-colors duration-150
                  ${value === opt.value ? "text-[#7A2267] bg-[#7A2267]/10" : "text-white/55 hover:text-white/85 hover:bg-white/5"}`}>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Floating Label Input ───────────────────────────────────────────────────────
function FloatingInput({ label, type = "text", value, onChange, required, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div className="relative">
      <label className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium
        ${active ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-3.5 text-[12.5px] text-white/25"}`}>
        {label}{required && " *"}
      </label>
      <input type={type} value={value} required={required} autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={onChange}
        className={`${josefin.className} w-full bg-white/6 rounded-xl px-4 text-[12.5px] text-white/80
          outline-none transition-all duration-200 font-light ${active ? "pt-5 pb-2" : "pt-3.5 pb-3.5"}`}
        style={{
          border: `1px solid ${focused ? "rgba(122,34,103,0.5)" : "rgba(255,255,255,0.1)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(122,34,103,0.08)" : "none",
        }}
      />
    </div>
  );
}

// ── Custom Date Input ──────────────────────────────────────────────────────────
function DateInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const formatted = value ? (() => {
    const [y, m, d] = value.split("-");
    return `${MONTHS[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
  })() : "";
  return (
    <div ref={ref} className="relative">
      <label className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium z-10
        ${value ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-3.5 text-[12.5px] text-white/25"}`}>
        Preferred Date
      </label>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`${josefin.className} w-full bg-white/6 rounded-xl px-4 text-[12.5px] text-left transition-all duration-200 font-light
          flex items-center justify-between ${value ? "pt-5 pb-2 text-white/80" : "pt-3.5 pb-3.5 text-white/25"}`}
        style={{
          border: `1px solid ${open ? "rgba(122,34,103,0.5)" : "rgba(255,255,255,0.1)"}`,
          boxShadow: open ? "0 0 0 3px rgba(122,34,103,0.08)" : "none",
        }}>
        <span>{formatted || ""}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-white/20 shrink-0">
          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && <CustomCalendar value={value} onChange={onChange} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Floating Textarea ──────────────────────────────────────────────────────────
function FloatingTextarea({ label, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div className="relative">
      <label className={`${josefin.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium
        ${active ? "top-2 text-[9px] text-[#7A2267] tracking-[0.12em] uppercase" : "top-3.5 text-[12.5px] text-white/25"}`}>
        {label}
      </label>
      <textarea value={value} rows={4}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={onChange}
        className={`${josefin.className} w-full bg-white/6 rounded-xl px-4 text-[12.5px] text-white/80
          outline-none transition-all duration-200 font-light resize-none ${active ? "pt-6 pb-3" : "pt-3.5 pb-3.5"}`}
        style={{
          border: `1px solid ${focused ? "rgba(122,34,103,0.5)" : "rgba(255,255,255,0.1)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(122,34,103,0.08)" : "none",
        }}
      />
    </div>
  );
}

// ── Enquiry Form ───────────────────────────────────────────────────────────────
function EnquiryForm({ venues = [] }) {
  const sectionRef   = useRef(null);
  const inView       = useInView(sectionRef, { once: true, margin: "-80px" });
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted]    = useState(false);
  const [error, setError]            = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", eventDate: "", guestCount: "", venue: "", message: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const venueOptions = [
    ...venues.map((v) => ({
      value: v.slug,
      label: v.capacity ? `${v.name} (${v.capacity})` : v.name,
    })),
    { value: "not-sure", label: "Not sure yet — help me choose" },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await submitWeddingEnquiry(form);
      if (res.success) setSubmitted(true);
      else setError(res.error || "Something went wrong. Please try again.");
    });
  }

  return (
    <section ref={sectionRef} id="enquiry" className="relative bg-[#1a1309] overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute top-0 right-0 w-125 h-125 rounded-full bg-[#7A2267]/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-100 h-100 rounded-full bg-[#7A2267]/5 blur-[100px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
          className="flex flex-col items-center text-center mb-12">
          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-6`}>
            Start Planning
          </motion.p>
          <motion.h2 variants={fadeUp}
            className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              font-400 text-white leading-[1.12] tracking-[-0.01em]`}>
            Begin Your{" "}
            <em className={`${lora.className} italic`}>Wedding Journey</em>
          </motion.h2>
          <motion.div variants={fadeUp} className="h-px w-14 bg-white/20 mt-7 mb-2" />
          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[13px] text-white/40 leading-[1.85] font-light max-w-md mt-5`}>
            Tell us about your dream day and our dedicated wedding team will be in touch within 24 hours.
          </motion.p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }} className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#7A2267]/15 border border-[#7A2267]/30
              flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#7A2267" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className={`${lora.className} text-[1.5rem] text-white mb-2`}>Enquiry Received</p>
            <p className={`${josefin.className} text-[12.5px] text-white/35 font-light`}>
              Thank you, {form.name || "dear guest"}. Our wedding team will contact you within 24 hours.
            </p>
          </motion.div>
        ) : (
          <motion.form onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="rounded-3xl p-6 sm:p-8 bg-white/3 border border-white/8">
            <div className="h-0.5 rounded-full mb-6"
              style={{ background: "linear-gradient(90deg, transparent 0%, #7A2267 30%, #7A2267 60%, transparent 100%)" }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FloatingInput label="Full Name" value={form.name} required
                onChange={(e) => set("name", e.target.value)} />
              <FloatingInput label="Email Address" type="email" value={form.email} required
                autoComplete="email" onChange={(e) => set("email", e.target.value)} />
              <FloatingInput label="Phone Number" type="tel" value={form.phone} required
                onChange={(e) => set("phone", e.target.value)} />
              <FloatingInput label="Expected Guest Count" type="number" value={form.guestCount}
                onChange={(e) => set("guestCount", e.target.value)} />
              <DateInput value={form.eventDate} onChange={(v) => set("eventDate", v)} />
              <div className="relative">
                {form.venue && (
                  <label className={`${josefin.className} absolute left-4 top-2 text-[9px] text-[#7A2267]/70
                    tracking-[0.12em] uppercase font-medium z-10 pointer-events-none`}>
                    Preferred Venue
                  </label>
                )}
                <div className={form.venue ? "pt-3" : ""}>
                  <CustomSelect value={form.venue} onChange={(v) => set("venue", v)}
                    placeholder="Preferred Venue" options={venueOptions} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <FloatingTextarea label="Tell us about your vision" value={form.message}
                onChange={(e) => set("message", e.target.value)} />
            </div>

            {error && (
              <p className={`${josefin.className} text-[11px] text-red-400/80 text-center mb-4 leading-[1.6]`}>
                {error}
              </p>
            )}

            <button type="submit" disabled={isPending}
              className={`${josefin.className} group w-full flex items-center justify-center gap-3
                py-4 rounded-xl bg-[#7A2267] hover:bg-[#8a256f] text-white
                text-[10.5px] uppercase tracking-[0.2em] font-semibold
                transition-all duration-300 shadow-[0_4px_20px_rgba(122,34,103,0.28)]
                hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]
                disabled:opacity-60 disabled:cursor-not-allowed`}>
              {isPending ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending…</>
              ) : (
                <>Send Wedding Enquiry
                  <svg viewBox="0 0 10 10" width="8" height="8" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
                    <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
            <p className={`${josefin.className} text-center text-[9.5px] text-white/25 mt-3 leading-[1.6]`}>
              We respect your privacy. Your information will never be shared with third parties.
            </p>
          </motion.form>
        )}
      </div>
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WeddingContent({ photos = [], venues = [] }) {
  const heroRef    = useRef(null);
  const heroImgRef = useRef(null);
  const closingRef = useRef(null);
  const closingInView = useInView(closingRef, { once: true, margin: "-80px" });

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
          <Image src={HERO_IMAGE} alt="Destination Wedding at Dhali's Amber Nivaas"
            fill priority sizes="100vw" className="object-cover object-center" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-[#0d0905]/60 via-[#0d0905]/25 to-[#0d0905]/70" />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-8`}
          >
            Destination Wedding · Dhali&apos;s Amber Nivaas
          </motion.p>

          <HeroTitle />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.9 }}
            className={`${josefin.className} text-[13px] font-light text-white/50 mt-7 max-w-sm leading-relaxed`}
          >
            From intimate Nikah ceremonies to grand receptions for 15,000 — impeccable halal catering and six stunning venues.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-10"
          >
            <a href="#enquiry"
              className={`${josefin.className} group inline-flex items-center gap-2.5
                px-7 py-3.5 rounded-full bg-[#7A2267] hover:bg-[#8a256f] text-white
                text-[10px] uppercase tracking-[0.2em] font-semibold
                transition-all duration-300 shadow-[0_4px_20px_rgba(122,34,103,0.3)]`}>
              Plan Your Wedding
              <svg viewBox="0 0 10 10" width="7" height="7" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Stats strip ── */}
      <StatsBar />

      {/* ── Venues ── */}
      <VenuesSection venues={venues} />

      {/* ── Services ── */}
      <ServicesSection />

      {/* ── Gallery ── */}
      <WeddingGallery photos={photos} />

      {/* ── Enquiry Form ── */}
      <EnquiryForm venues={venues} />

      {/* ── Closing ──────────────────────────────────────────────────────── */}
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
            &ldquo;Your wedding is not just an event — it is the first chapter of a story
            that will be told for generations.&rdquo;
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
            <a href="#enquiry"
              className={`${josefin.className} inline-flex items-center gap-3
                px-8 py-4 rounded-full bg-[#7A2267] text-white
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:bg-[#8a256f] transition-all duration-300 group
                shadow-[0_4px_22px_rgba(122,34,103,0.28)]
                hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]`}>
              Begin Your Journey
              <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                className="group-hover:translate-x-1 transition-transform duration-300">
                <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
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
