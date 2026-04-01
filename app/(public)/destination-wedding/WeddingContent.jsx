"use client";

import { useRef, useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400","500","600","700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300","400","500","600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300","400","500","600"], style: ["italic","normal"] });

// ── Hero bg photo ──────────────────────────────────────────────────────────────
const HERO_IMAGE = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1920&q=85";

// ── Venue data ─────────────────────────────────────────────────────────────────
const VENUES = [
  { id:"grand-field",    name:"Grand Outdoor Field",  capacity:"Up to 15,000", badge:"Grand Scale",    description:"Our flagship open-air expanse — a breathtaking setting for the most lavish wedding receptions. Host thousands under the open sky with full stage, lighting, and floral décor.", features:["15,000 guests","Stage & sound","Floodlit evenings","Helipad access"], icon:"field" },
  { id:"garden-field",   name:"Garden Field",          capacity:"Up to 3,000",  description:"A lush, verdant garden venue — perfect for Holud ceremonies, outdoor receptions, and daytime celebrations surrounded by nature.", features:["3,000 guests","Natural landscaping","Flexible layout","Catering ready"], icon:"garden" },
  { id:"banquet-hall",   name:"Grand Banquet Hall",    capacity:"Up to 800",    badge:"Most Popular",   description:"Our magnificent hall adorned with crystal chandeliers and premium décor — the premier choice for receptions, Nikah ceremonies, and formal dinners.", features:["800 guests","Crystal chandeliers","Stage & podium","Full AV & lighting"], icon:"banquet" },
  { id:"banquet-garden", name:"Banquet Garden",        capacity:"Up to 2,000",  description:"A beautifully landscaped open-air garden ideal for evening cocktail receptions, Mehndi nights, and pre-wedding gatherings.", features:["2,000 guests","Garden ambiance","Evening lighting","Adjacent to hall"], icon:"garden2" },
  { id:"helipad-field",  name:"Helipad Field",         capacity:"Up to 1,000",  badge:"VIP Exclusive",  description:"An exclusive outdoor venue with a certified helipad — the ultimate VIP arrival for prestige weddings.", features:["1,000 guests","Helipad landing","VIP access zone","Elite ambiance"], icon:"helipad" },
  { id:"conference-suite",name:"Conference Suite",     capacity:"Up to 50",     description:"An intimate elegantly appointed suite — ideal for Nikah signing, private gatherings, or bridal preparation in a refined setting.", features:["50 guests","Intimate setting","AV system","Private access"], icon:"suite" },
];

// ── Services ───────────────────────────────────────────────────────────────────
const SERVICES = [
  { title:"Nikah Ceremony",        desc:"Beautifully arranged Nikah settings with floral décor, privacy, and the serenity your ceremony deserves." },
  { title:"Holud & Mehndi",        desc:"Vibrant pre-wedding events in our garden venues, styled with traditional warmth and modern elegance." },
  { title:"Grand Reception",       desc:"From intimate banquets to 15,000-guest outdoor galas — your reception, your vision, our flawless execution." },
  { title:"Halal Catering",        desc:"Bespoke wedding menus by our in-house culinary team — traditional Bangladeshi feasts to multi-cuisine spreads." },
  { title:"On-site Accommodation", desc:"Exclusive room blocks for the bridal party and out-of-town guests, coordinated with your event schedule." },
  { title:"Décor & Florals",       desc:"Our in-house décor team brings your aesthetic to life — from minimalist elegance to opulent floral installations." },
  { title:"Dedicated Planner",     desc:"Your personal coordinator manages every detail — from the first site visit to the final farewell." },
  { title:"Photography & AV",      desc:"Referrals to top-tier photographers and in-house state-of-the-art audio-visual systems for every venue." },
];

// ── Gallery ────────────────────────────────────────────────────────────────────
const GALLERY_CATS = ["All","Ceremony","Reception","Holud · Mehndi","Venue","Décor"];
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
  { id:"h1", cat:"Holud · Mehndi", title:"Holud Ceremony",      span:"col",  src:"https://images.unsplash.com/photo-1585241936939-be4099591252?auto=format&fit=crop&w=900&q=80" },
  { id:"h2", cat:"Holud · Mehndi", title:"Mehndi Night",        span:"none", src:"https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80" },
  { id:"h3", cat:"Holud · Mehndi", title:"Traditional Ritual",  span:"none", src:"https://images.unsplash.com/photo-1596797882870-8c0e5c2f82d4?auto=format&fit=crop&w=900&q=80" },
  { id:"h4", cat:"Holud · Mehndi", title:"Mehndi Details",      span:"row",  src:"https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80" },
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
    <div ref={containerRef}>
      <div className="overflow-hidden mb-1">
        <span className={`hw inline-block ${playfair.className} text-[2.8rem] sm:text-[4rem] lg:text-[5.2rem] xl:text-[6rem]
          font-semibold text-white leading-[1.05]`} style={{ opacity: 0 }}>
          Where Every
        </span>
      </div>
      <div className="overflow-hidden mb-1">
        <span className={`hw inline-block ${playfair.className} text-[2.8rem] sm:text-[4rem] lg:text-[5.2rem] xl:text-[6rem]
          font-semibold text-white leading-[1.05]`} style={{ opacity: 0 }}>
          Moment&nbsp;
          <em className={`${cormorant.className} italic text-[#D4A87C]`}>Becomes</em>
        </span>
      </div>
      <div className="overflow-hidden">
        <span className={`hw inline-block ${cormorant.className} italic text-[3.2rem] sm:text-[4.6rem] lg:text-[6rem] xl:text-[7rem]
          font-light text-[#C9956C] leading-[1.0]`} style={{ opacity: 0 }}>
          Forever
        </span>
      </div>
    </div>
  );
}

// ── Ornamental Divider ──────────────────────────────────────────────────────────
function OrnamentalDivider({ light = false }) {
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <div className={`h-px flex-1 max-w-[80px] ${light ? "bg-white/10" : "bg-[#C9956C]/20"}`} />
      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" className={light ? "text-white/20" : "text-[#C9956C]/40"}>
        <path d="M10 1 L11.8 7H18L13 11L14.8 17L10 13L5.2 17L7 11L2 7H8.2Z" fill="currentColor"/>
      </svg>
      <div className={`h-px flex-1 max-w-[80px] ${light ? "bg-white/10" : "bg-[#C9956C]/20"}`} />
    </div>
  );
}

// ── Infinite Marquee ───────────────────────────────────────────────────────────
function Marquee() {
  const trackRef = useRef(null);

  useGSAP(() => {
    gsap.to(trackRef.current, {
      x: "-50%",
      duration: 28,
      repeat: -1,
      ease: "linear",
    });
  });

  const items = ["Nikah Ceremony","·","Holud · Mehndi","·","Wedding Reception","·","Walima Feast","·","Pre-Wedding Brunch","·","Valima Gathering","·","Bou Bhat","·","Family Dawat","·"];
  const doubled = [...items, ...items];

  return (
    <div className="bg-[#7A2267] py-3 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, #7A2267 0%, transparent 8%, transparent 92%, #7A2267 100%)" }} />
      <div ref={trackRef} className="flex items-center gap-6 whitespace-nowrap will-change-transform" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} className={`${sans.className} text-[10px] uppercase tracking-[0.22em] font-semibold
            ${item === "·" ? "text-white/25" : "text-white/70"}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stats with GSAP counters ───────────────────────────────────────────────────
function StatsBar() {
  const sectionRef = useRef(null);
  const statRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const STATS = [
    { target: 6,      suffix: "",   label: "Stunning Venues" },
    { target: 15000,  suffix: "+",  label: "Max Guest Capacity" },
    { target: 100,    suffix: "%",  label: "Halal Certified" },
    { target: 1,      suffix: "",   label: "Dedicated Planner" },
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
    <div ref={sectionRef} className="relative py-16 md:py-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0e0710 0%, #1a0d1a 50%, #0e0710 100%)" }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(122,34,103,0.15) 0%, transparent 70%)" }} />
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <div key={i} className="stat-item" style={{ opacity: 0 }}>
              <div className="mb-1">
                <span
                  ref={statRefs[i]}
                  className={`${playfair.className} text-[2.6rem] sm:text-[3.2rem] font-semibold text-[#C9956C] leading-none`}
                >
                  0{s.suffix}
                </span>
              </div>
              <OrnamentalDivider light />
              <p className={`${sans.className} text-[9px] uppercase tracking-[0.22em] text-white/35 font-semibold mt-1`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Venue Cards ────────────────────────────────────────────────────────────────
function VenuesSection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const cardsRef   = useRef(null);

  useGSAP(() => {
    gsap.fromTo(headRef.current?.querySelectorAll(".reveal-item"),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: headRef.current, start: "top 82%", once: true } }
    );
    gsap.fromTo(cardsRef.current?.querySelectorAll(".venue-card"),
      { opacity: 0, y: 60, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: cardsRef.current, start: "top 82%", once: true } }
    );
  }, { scope: sectionRef });

  const icons = {
    field:   <svg viewBox="0 0 32 28" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="8" width="28" height="18" rx="2"/><path d="M10 8V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M16 13v5M13 15.5h6"/></svg>,
    garden:  <svg viewBox="0 0 32 28" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 26c0-6 5-11 11-11s11 5 11 11"/><path d="M16 15V7"/><path d="M9 10c2-4 7-5 7-5s5 1 7 5"/></svg>,
    garden2: <svg viewBox="0 0 32 28" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M5 26c0-6 5-11 11-11s11 5 11 11"/><path d="M16 15V7"/><path d="M9 10c2-4 7-5 7-5s5 1 7 5"/><circle cx="16" cy="7" r="2"/></svg>,
    banquet: <svg viewBox="0 0 32 28" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="8" width="28" height="18" rx="2"/><path d="M8 8V5.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V8"/><path d="M16 13v6M12 16h8"/></svg>,
    helipad: <svg viewBox="0 0 32 28" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="16" cy="14" r="11"/><path d="M9 14h14M16 7v14M12.5 10.5h7"/></svg>,
    suite:   <svg viewBox="0 0 32 28" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="4" y="4" width="24" height="20" rx="2"/><path d="M4 10h24M11 4v6M21 4v6"/></svg>,
  };

  return (
    <div ref={sectionRef} id="venues"
      className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0e0710 0%, #150d1c 100%)" }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(ellipse 70% 50% at 80% 20%, rgba(122,34,103,0.12) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <div ref={headRef} className="mb-14 md:mb-16">
          <p className={`reveal-item ${sans.className} text-[9.5px] uppercase tracking-[0.35em] text-[#C9956C]/60 font-semibold mb-4`}
            style={{ opacity: 0 }}>
            Our Wedding Venues
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <h2 className={`reveal-item ${playfair.className} text-[2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              font-semibold text-white leading-[1.1] max-w-xl`} style={{ opacity: 0 }}>
              Every Celebration Finds Its{" "}
              <em className={`${cormorant.className} italic text-[#C9956C]`}>Perfect Stage</em>
            </h2>
            <p className={`reveal-item ${sans.className} text-[12px] text-white/35 font-light max-w-xs leading-relaxed lg:text-right`}
              style={{ opacity: 0 }}>
              Six distinct venues — from intimate suites to grand fields for 15,000.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {VENUES.map((v) => (
            <div key={v.id} className="venue-card group relative rounded-2xl overflow-hidden cursor-default"
              style={{ opacity: 0,
                background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(201,149,108,0.12)" }}>

              {/* Top gradient accent strip */}
              <div className="h-[3px] w-full"
                style={{ background: "linear-gradient(90deg, transparent 0%, #7A2267 40%, #C9956C 60%, transparent 100%)",
                  opacity: 0.6 }} />

              {/* Icon area */}
              <div className="relative h-36 flex items-center justify-center overflow-hidden px-6 pt-4"
                style={{ background: "linear-gradient(135deg, rgba(122,34,103,0.08) 0%, rgba(201,149,108,0.04) 100%)" }}>
                <div className="w-14 h-14 text-[#C9956C]/25 group-hover:text-[#C9956C]/50 transition-colors duration-500">
                  {icons[v.icon] || icons.suite}
                </div>
                {v.badge && (
                  <div className="absolute top-3 left-3 bg-[#C9956C] text-[#0e0710] text-[8px] font-bold
                    px-2.5 py-1 rounded-full uppercase tracking-[0.15em]">
                    {v.badge}
                  </div>
                )}
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at center, rgba(201,149,108,0.08) 0%, transparent 70%)" }} />
              </div>

              {/* Content */}
              <div className="px-5 pb-5 pt-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className={`${playfair.className} text-[1.05rem] font-semibold text-white/90 leading-tight`}>{v.name}</h3>
                  <span className={`${sans.className} shrink-0 text-[9px] font-semibold text-[#C9956C] bg-[#C9956C]/10
                    border border-[#C9956C]/20 px-2.5 py-1 rounded-full whitespace-nowrap`}>
                    {v.capacity}
                  </span>
                </div>
                <p className={`${sans.className} text-[11.5px] text-white/35 leading-[1.75] font-light mb-4`}>{v.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {v.features.map((f) => (
                    <span key={f} className={`${sans.className} text-[9.5px] text-[#C9956C]/50
                      bg-[#C9956C]/[0.06] border border-[#C9956C]/10 px-2.5 py-0.5 rounded-full`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
  const headRef    = useRef(null);
  const gridRef    = useRef(null);

  useGSAP(() => {
    gsap.fromTo(headRef.current?.querySelectorAll(".rev"),
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: headRef.current, start: "top 83%", once: true } }
    );
    gsap.fromTo(gridRef.current?.querySelectorAll(".svc-card"),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.75, ease: "power3.out",
        scrollTrigger: { trigger: gridRef.current, start: "top 83%", once: true } }
    );
  }, { scope: sectionRef });

  return (
    <div ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #120a18 0%, #0d0612 100%)" }}>

      {/* Soft rose glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, rgba(201,149,108,0.07) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div ref={headRef} className="mb-12 md:mb-14">
          <p className={`rev ${sans.className} text-[9.5px] uppercase tracking-[0.35em] text-[#C9956C]/55 font-semibold mb-4`}
            style={{ opacity: 0 }}>
            What We Offer
          </p>
          <h2 className={`rev ${playfair.className} text-[2rem] sm:text-[2.8rem] font-semibold text-white leading-[1.1] max-w-2xl`}
            style={{ opacity: 0 }}>
            Everything Your Wedding Needs,{" "}
            <em className={`${cormorant.className} italic text-[#C9956C]`}>Under One Roof</em>
          </h2>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {SERVICES.map((s, i) => (
            <div key={i} className="svc-card group relative p-5 rounded-2xl cursor-default
              transition-all duration-500 hover:-translate-y-1"
              style={{ opacity: 0,
                background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(201,149,108,0.1)" }}>
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top left, rgba(201,149,108,0.06) 0%, transparent 60%)" }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-[#C9956C]/50
                  group-hover:text-[#C9956C]/80 transition-colors duration-300"
                  style={{ background: "rgba(201,149,108,0.08)", border: "1px solid rgba(201,149,108,0.1)" }}>
                  {SERVICE_ICONS[i]}
                </div>
                <h3 className={`${playfair.className} text-[1rem] font-semibold text-white/85 mb-2 leading-tight`}>{s.title}</h3>
                <p className={`${sans.className} text-[11.5px] text-white/30 leading-[1.75] font-light`}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ───────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   onPrev();
      if (e.key === "ArrowRight")  onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
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
          <p className={`${playfair.className} text-white text-[1.1rem] font-semibold`}>{photo.title}</p>
          <p className={`${sans.className} text-white/35 text-[9px] uppercase tracking-[0.2em] mt-1`}>{photo.cat}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Gallery Section ────────────────────────────────────────────────────────────
function WeddingGallery({ photos = [] }) {
  const sectionRef = useRef(null);
  const [activeCat, setActiveCat]     = useState("All");
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const allPhotos = photos.length > 0
    ? photos.map((p) => ({ id: p._id, cat: p.category, title: p.title || "", span: p.span || "none", src: p.image }))
    : GALLERY_PHOTOS;

  const filtered    = activeCat === "All" ? allPhotos : allPhotos.filter((p) => p.cat === activeCat);
  const openLightbox  = (i) => setLightboxIdx(i);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevPhoto     = useCallback(() => setLightboxIdx((i) => (i - 1 + filtered.length) % filtered.length), [filtered.length]);
  const nextPhoto     = useCallback(() => setLightboxIdx((i) => (i + 1) % filtered.length), [filtered.length]);

  useGSAP(() => {
    gsap.fromTo(sectionRef.current?.querySelectorAll(".gallery-head"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 82%", once: true } }
    );
  }, { scope: sectionRef });

  return (
    <div ref={sectionRef} className="py-20 md:py-28 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #faf5f0 0%, #f5ece8 100%)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <p className={`gallery-head ${sans.className} text-[9.5px] uppercase tracking-[0.35em] text-[#7A2267]/55 font-semibold mb-3`}
              style={{ opacity: 0 }}>
              Wedding Gallery
            </p>
            <h2 className={`gallery-head ${playfair.className} text-[2rem] sm:text-[2.8rem] font-semibold text-[#1a0d14] leading-[1.1]`}
              style={{ opacity: 0 }}>
              Moments That Tell{" "}
              <em className={`${cormorant.className} italic text-[#7A2267]`}>Your Story</em>
            </h2>
          </div>
          <p className={`gallery-head ${sans.className} text-[11.5px] text-[#9B7A8A] font-light max-w-xs leading-relaxed sm:text-right`}
            style={{ opacity: 0 }}>
            A glimpse into the celebrations that have unfolded at Dhali's Amber Nivaas.
          </p>
        </div>

        {/* Filter tabs */}
        <motion.div className="flex flex-wrap gap-2 mb-8">
          {GALLERY_CATS.map((cat) => (
            <button key={cat} onClick={() => { setActiveCat(cat); setLightboxIdx(null); }}
              className={`${sans.className} text-[10px] font-semibold px-4 py-1.5 rounded-full
                border transition-all duration-200
                ${activeCat === cat
                  ? "bg-[#7A2267] border-[#7A2267] text-white shadow-[0_2px_12px_rgba(122,34,103,0.3)]"
                  : "border-[#D4B8C4] text-[#9B7A8A] hover:border-[#7A2267]/40 hover:text-[#7A2267]"
                }`}>
              {cat}
              {cat !== "All" && (
                <span className={`ml-1.5 text-[8.5px] ${activeCat === cat ? "text-white/55" : "text-[#C4A8B4]"}`}>
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
                className={`group relative overflow-hidden rounded-2xl cursor-pointer mb-3 bg-[#F0E4EC]
                  ${photo.span === "row" ? "aspect-[3/4]" : photo.span === "col" ? "aspect-[4/3]" : "aspect-square"}`}
                onClick={() => openLightbox(i)}
              >
                <Image src={photo.src} alt={photo.title} fill
                  sizes="(max-width:768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d14]/80 via-transparent to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <span className={`${sans.className} text-[8px] uppercase tracking-[0.15em] font-semibold
                    px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20`}>
                    {photo.cat}
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 px-3.5 pb-3.5 opacity-0 group-hover:opacity-100
                  translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <p className={`${playfair.className} text-white text-[13px] font-semibold`}>{photo.title}</p>
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
          <div className="py-20 text-center text-[13px] text-[#C4A8B4]">No photos in this category yet.</div>
        )}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox photos={filtered} index={lightboxIdx}
            onClose={closeLightbox} onPrev={prevPhoto} onNext={nextPhoto} />
        )}
      </AnimatePresence>
    </div>
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

  const today     = new Date();
  const todayStr  = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
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
      className="absolute top-full left-0 z-50 mt-2 w-[280px] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
      style={{ background: "#1a0e1f", border: "1px solid rgba(201,149,108,0.18)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <button onClick={goBack}
          className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-[#C9956C]/15 text-white/50 hover:text-[#C9956C]
            flex items-center justify-center transition-all text-sm">
          ‹
        </button>
        <span className={`${sans.className} text-[12px] font-semibold text-white/80`}>
          {MONTHS[view.month]} {view.year}
        </span>
        <button onClick={goFwd}
          className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-[#C9956C]/15 text-white/50 hover:text-[#C9956C]
            flex items-center justify-center transition-all text-sm">
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-3 pt-3">
        {WEEK.map((d) => (
          <div key={d} className={`${sans.className} text-center text-[8.5px] font-semibold text-white/20 uppercase tracking-wider py-1`}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${view.year}-${String(view.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isSel   = value === dateStr;
          const isPast  = dateStr < todayStr;
          const isToday = dateStr === todayStr;
          return (
            <button key={i} disabled={isPast} onClick={() => !isPast && select(day)}
              className={`${sans.className} w-full aspect-square rounded-lg text-[12px] font-medium
                flex items-center justify-center transition-all
                ${isSel   ? "bg-[#7A2267] text-white shadow-[0_0_12px_rgba(122,34,103,0.5)]"
                : isToday ? "bg-[#C9956C]/15 text-[#C9956C] border border-[#C9956C]/30"
                : isPast  ? "text-white/12 cursor-not-allowed"
                :           "text-white/55 hover:bg-white/[0.08] hover:text-white"
                }`}>
              {day}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Custom Select Dropdown ─────────────────────────────────────────────────────
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
        className={`w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl transition-all duration-200
          text-left text-[12.5px] font-light
          ${open ? "border-[#C9956C]/50 bg-white/[0.08]" : "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.07]"}
          ${value ? "text-white/80" : "text-white/25"}`}
        style={{ border: `1px solid ${open ? "rgba(201,149,108,0.5)" : "rgba(255,255,255,0.1)"}` }}>
        <span className={`${sans.className}`}>{selected ? selected.label : placeholder}</span>
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
            style={{ background: "#1a0e1f", border: "1px solid rgba(201,149,108,0.15)" }}>
            {options.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`${sans.className} w-full text-left px-4 py-2.5 text-[12.5px] font-light
                  transition-colors duration-150
                  ${value === opt.value
                    ? "text-[#C9956C] bg-[#C9956C]/10"
                    : "text-white/55 hover:text-white/85 hover:bg-white/[0.05]"
                  }`}>
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
      <label
        className={`${sans.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium
          ${active
            ? "top-2 text-[9px] text-[#C9956C] tracking-[0.12em] uppercase"
            : "top-3.5 text-[12.5px] text-white/25"
          }`}>
        {label}{required && " *"}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={onChange}
        className={`${sans.className} w-full bg-white/[0.04] rounded-xl px-4 text-[12.5px] text-white/80
          outline-none transition-all duration-200 font-light
          ${active ? "pt-5 pb-2" : "pt-3.5 pb-3.5"}`}
        style={{
          border: `1px solid ${focused ? "rgba(201,149,108,0.5)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(201,149,108,0.08)" : "none",
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
      <label className={`${sans.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium z-10
        ${value ? "top-2 text-[9px] text-[#C9956C] tracking-[0.12em] uppercase" : "top-3.5 text-[12.5px] text-white/25"}`}>
        Preferred Date
      </label>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`${sans.className} w-full bg-white/[0.04] rounded-xl px-4 text-[12.5px] text-left transition-all duration-200 font-light
          flex items-center justify-between
          ${value ? "pt-5 pb-2 text-white/80" : "pt-3.5 pb-3.5 text-white/25"}`}
        style={{
          border: `1px solid ${open ? "rgba(201,149,108,0.5)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: open ? "0 0 0 3px rgba(201,149,108,0.08)" : "none",
        }}>
        <span>{formatted || ""}</span>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-white/20 shrink-0">
          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <CustomCalendar value={value} onChange={onChange} onClose={() => setOpen(false)} />
        )}
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
      <label className={`${sans.className} absolute left-4 pointer-events-none transition-all duration-200 font-medium
        ${active ? "top-2 text-[9px] text-[#C9956C] tracking-[0.12em] uppercase" : "top-3.5 text-[12.5px] text-white/25"}`}>
        {label}
      </label>
      <textarea
        value={value} rows={4}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={onChange}
        className={`${sans.className} w-full bg-white/[0.04] rounded-xl px-4 text-[12.5px] text-white/80
          outline-none transition-all duration-200 font-light resize-none
          ${active ? "pt-6 pb-3" : "pt-3.5 pb-3.5"}`}
        style={{
          border: `1px solid ${focused ? "rgba(201,149,108,0.5)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(201,149,108,0.08)" : "none",
        }}
      />
    </div>
  );
}

// ── Enquiry Form ───────────────────────────────────────────────────────────────
function EnquiryForm() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted]    = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", eventDate: "", guestCount: "", venue: "", message: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useGSAP(() => {
    gsap.fromTo(headRef.current?.querySelectorAll(".frev"),
      { opacity: 0, y: 35 },
      { opacity: 1, y: 0, stagger: 0.12, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: headRef.current, start: "top 83%", once: true } }
    );
    gsap.fromTo(sectionRef.current?.querySelector(".form-card"),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current?.querySelector(".form-card"), start: "top 85%", once: true } }
    );
  }, { scope: sectionRef });

  const venueOptions = [
    ...VENUES.map((v) => ({ value: v.id, label: `${v.name} (${v.capacity})` })),
    { value: "not-sure", label: "Not sure yet — help me choose" },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 900));
      setSubmitted(true);
    });
  }

  return (
    <div ref={sectionRef} id="enquiry" className="relative overflow-hidden py-20 md:py-28 lg:py-32"
      style={{ background: "linear-gradient(160deg, #0e0710 0%, #150b1d 60%, #0e0710 100%)" }}>

      {/* Bg glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[160px]"
        style={{ background: "radial-gradient(circle, rgba(122,34,103,0.12) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(201,149,108,0.07) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div ref={headRef} className="text-center mb-12">
          <p className={`frev ${sans.className} text-[9.5px] uppercase tracking-[0.35em] text-[#C9956C]/55 font-semibold mb-4`}
            style={{ opacity: 0 }}>
            Start Planning
          </p>
          <h2 className={`frev ${playfair.className} text-[2rem] sm:text-[2.8rem] font-semibold text-white leading-[1.1] mb-4`}
            style={{ opacity: 0 }}>
            Begin Your{" "}
            <em className={`${cormorant.className} italic text-[#C9956C]`}>Wedding Journey</em>
          </h2>
          <p className={`frev ${sans.className} text-[12.5px] text-white/30 leading-[1.85] font-light max-w-lg mx-auto`}
            style={{ opacity: 0 }}>
            Tell us about your dream day and our dedicated wedding team will be in touch within 24 hours.
          </p>
          <div className="mt-5 frev" style={{ opacity: 0 }}><OrnamentalDivider light /></div>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(201,149,108,0.12)", border: "1px solid rgba(201,149,108,0.3)" }}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#C9956C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className={`${playfair.className} text-[1.5rem] text-white font-semibold mb-2`}>Enquiry Received</p>
            <p className={`${sans.className} text-[12.5px] text-white/35 font-light`}>
              Thank you, {form.name || "dear guest"}. Our wedding team will contact you within 24 hours.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="form-card rounded-3xl p-6 sm:p-8" style={{
            opacity: 0,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(201,149,108,0.1)",
            backdropFilter: "blur(20px)",
          }}>
            {/* Gold accent top */}
            <div className="h-[2px] rounded-full mb-6"
              style={{ background: "linear-gradient(90deg, transparent 0%, #C9956C 30%, #7A2267 60%, transparent 100%)" }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FloatingInput label="Full Name" value={form.name} required
                onChange={(e) => set("name", e.target.value)} />
              <FloatingInput label="Email Address" type="email" value={form.email} required
                autoComplete="email" onChange={(e) => set("email", e.target.value)} />
              <FloatingInput label="Phone Number" type="tel" value={form.phone} required
                onChange={(e) => set("phone", e.target.value)} />
              <FloatingInput label="Expected Guest Count" type="number" value={form.guestCount}
                onChange={(e) => set("guestCount", e.target.value)} />

              {/* Custom date */}
              <DateInput value={form.eventDate} onChange={(v) => set("eventDate", v)} />

              {/* Custom venue select */}
              <div className="relative">
                {form.venue && (
                  <label className={`${sans.className} absolute left-4 top-2 text-[9px] text-[#C9956C]/70
                    tracking-[0.12em] uppercase font-medium z-10 pointer-events-none`}>
                    Preferred Venue
                  </label>
                )}
                <div className={form.venue ? "pt-3" : ""}>
                  <CustomSelect
                    value={form.venue}
                    onChange={(v) => set("venue", v)}
                    placeholder="Preferred Venue"
                    options={venueOptions}
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <FloatingTextarea
                label="Tell us about your vision"
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </div>

            {/* Submit */}
            <button type="submit" disabled={isPending}
              className={`${sans.className} w-full py-4 rounded-2xl text-[11.5px] font-semibold
                uppercase tracking-[0.18em] transition-all duration-300 relative overflow-hidden group
                ${isPending ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
              style={{
                background: "linear-gradient(135deg, #7A2267 0%, #9A3087 50%, #7A2267 100%)",
                backgroundSize: "200% 100%",
                boxShadow: "0 4px 20px rgba(122,34,103,0.4)",
              }}>
              <span className="relative z-10 text-white flex items-center justify-center gap-2.5">
                {isPending ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending…</>
                ) : (
                  <><svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                    <path d="M10 2L12 8H18L13 12L14.8 18L10 14L5.2 18L7 12L2 8H8Z" fill="currentColor"/>
                  </svg>
                    Send Wedding Enquiry</>
                )}
              </span>
              {/* Shimmer */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700
                bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </button>

            <p className={`${sans.className} text-center text-[10px] text-white/18 mt-3 font-light`}>
              We respect your privacy. Your information will never be shared with third parties.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WeddingContent({ photos = [] }) {
  const heroRef    = useRef(null);
  const heroBgRef  = useRef(null);
  const heroTextRef = useRef(null);
  const scrollRef  = useRef(null);

  // Hero parallax + initial badge reveal
  useGSAP(() => {
    // Parallax on hero bg image
    gsap.to(heroBgRef.current, {
      y: "30%",
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Fade out hero content on scroll
    gsap.to(heroTextRef.current, {
      opacity: 0,
      y: -40,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "30% top",
        end: "70% top",
        scrub: true,
      },
    });

    // Scroll indicator bounce
    gsap.to(scrollRef.current, {
      y: 8,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Badge reveal
    gsap.fromTo(heroRef.current?.querySelectorAll(".hero-badge"),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.9, delay: 1.8, stagger: 0.12, ease: "power3.out" }
    );
  }, { scope: heroRef });

  return (
    <div className={sans.className} style={{ background: "#0e0710" }}>

      {/* ── HERO ── */}
      <div ref={heroRef} className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">

        {/* BG Photo with parallax */}
        <div ref={heroBgRef} className="absolute inset-0 will-change-transform" style={{ top: "-15%" }}>
          <Image
            src={HERO_IMAGE}
            alt="Destination Wedding at Dhali's Amber Nivaas"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0710] via-[#0e0710]/60 to-[#0e0710]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0710]/70 via-transparent to-transparent" />
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundSize: "200px 200px" }} />

        {/* Content */}
        <div ref={heroTextRef} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20 lg:pb-24 pt-28 w-full">

          {/* Top badge */}
          <div className="hero-badge flex items-center gap-2 mb-7" style={{ opacity: 0 }}>
            <div className="h-px w-8 bg-[#C9956C]/50" />
            <span className={`${sans.className} text-[9px] uppercase tracking-[0.4em] text-[#C9956C]/70 font-semibold`}>
              Destination Wedding · Dhali's Amber Nivaas
            </span>
          </div>

          {/* GSAP animated title */}
          <div className="mb-7">
            <HeroTitle />
          </div>

          {/* Subtitle */}
          <p className={`hero-badge ${sans.className} text-[13px] sm:text-[14px] text-white/40 leading-[1.9]
            font-light max-w-xl mb-9`} style={{ opacity: 0 }}>
            From intimate Nikah ceremonies to grand receptions for 15,000 — impeccable halal catering,
            six stunning venues, and a dedicated team to make every detail flawless.
          </p>

          {/* CTAs */}
          <div className="hero-badge flex flex-col sm:flex-row gap-3" style={{ opacity: 0 }}>
            <a href="#enquiry"
              className={`${sans.className} group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full
                text-[10.5px] uppercase tracking-[0.2em] font-semibold text-white transition-all duration-300
                hover:-translate-y-0.5 relative overflow-hidden`}
              style={{
                background: "linear-gradient(135deg, #7A2267 0%, #9A3087 100%)",
                boxShadow: "0 4px 24px rgba(122,34,103,0.45)",
              }}>
              <span className="relative z-10">Plan Your Wedding</span>
              <svg viewBox="0 0 10 10" width="8" height="8" fill="none" className="relative z-10
                transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </a>
            <a href="#venues"
              className={`${sans.className} inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full
                border border-white/15 text-white/50 hover:text-white hover:border-white/35
                text-[10.5px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 backdrop-blur-sm`}>
              Explore Venues
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div ref={scrollRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10
          flex flex-col items-center gap-1.5 opacity-30">
          <span className={`${sans.className} text-[8px] uppercase tracking-[0.3em] text-white`}>Scroll</span>
          <svg viewBox="0 0 10 16" width="8" height="13" fill="none">
            <path d="M5 1v12M1 9l4 5 4-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Venues ── */}
      <VenuesSection />

      {/* ── Services ── */}
      <ServicesSection />

      {/* ── Gallery ── */}
      <WeddingGallery photos={photos} />

      {/* ── Stats ── */}
      <StatsBar />

      {/* ── Form ── */}
      <EnquiryForm />

      {/* ── Footer strip ── */}
      <div className="py-8 border-t" style={{ background: "#0e0710", borderColor: "rgba(201,149,108,0.08)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/"
            className={`${sans.className} inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]
              text-white/20 hover:text-[#C9956C] font-semibold transition-colors duration-200`}>
            <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
              <path d="M9 5H2M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#C9956C]/20" />
            <span className={`${cormorant.className} italic text-[#C9956C]/30 text-[13px]`}>
              Dhali's Amber Nivaas
            </span>
            <div className="h-px w-8 bg-[#C9956C]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
