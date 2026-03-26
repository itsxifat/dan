"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

const fadeUp   = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22,1,0.36,1] } } };
const fadeLeft = { hidden: { opacity: 0, x: -36 }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22,1,0.36,1] } } };
const fadeRight= { hidden: { opacity: 0, x: 36  }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22,1,0.36,1] } } };
const stagger  = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };

function SectionLabel({ text, dark }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className={`h-px w-14 ${dark ? "bg-[#c9a96e]/40" : "bg-[#c9a96e]/50"}`} />
      <p className={`${sans.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
        {text}
      </p>
      <div className={`h-px w-14 ${dark ? "bg-[#c9a96e]/40" : "bg-[#c9a96e]/50"}`} />
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
const POOL_FEATURES = [
  { icon: icons.pool,    title: "Complimentary for All Guests",  desc: "Unlimited access to the iconic infinity pool included with every stay" },
  { icon: icons.lounge,  title: "Poolside Loungers",             desc: "Plush sun beds with fresh towel service throughout the day" },
  { icon: icons.safety,  title: "Lifeguard on Duty",             desc: "Certified lifeguard present during all operating hours" },
  { icon: icons.kids,    title: "Kids' Splash Zone",             desc: "Shallow wading area designed to be safe and fun for young children" },
];

const ACTIVITIES = [
  { icon: icons.paddle,  title: "Paddle Boating",         desc: "Glide peacefully across our scenic lake surrounded by lush greenery — a perfect family outing.", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80" },
  { icon: icons.nature,  title: "Guided Nature Walks",    desc: "Explore the resort's trails with expert guides revealing local flora and fauna.", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80" },
  { icon: icons.bird,    title: "Bird Watching Tours",    desc: "Dawn expeditions to spot rare and migratory bird species in their natural habitat.", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80" },
  { icon: icons.bonfire, title: "Bonfire Evenings",       desc: "Gather under a canopy of stars around a crackling bonfire with soft music.", image: "https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?auto=format&fit=crop&w=600&q=80" },
  { icon: icons.photo,   title: "Photography Excursions", desc: "Capture the magic of Amber Nivaas with guided sunrise and sunset photography walks.", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80" },
  { icon: icons.sunrise, title: "Sunrise Viewing Deck",   desc: "Watch the sun rise over the misty horizon from our elevated private viewing terrace.", image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=600&q=80" },
];

const DINING = [
  { icon: icons.restaurant,   title: "The Amber Restaurant",      desc: "Fine dining with panoramic garden views and local flavours" },
  { icon: icons.breakfast,    title: "Complimentary Breakfast",   desc: "Fresh-made daily spread for all guests" },
  { icon: icons.roomservice,  title: "24-Hour Room Service",      desc: "Dine in the comfort of your room, any time" },
  { icon: icons.bbq,          title: "Outdoor BBQ Terrace",       desc: "Evening barbecue under the open sky — a family favourite" },
  { icon: icons.dining,       title: "Private Dining Experience", desc: "Bespoke setups for special occasions and celebrations" },
];

const SERVICES = [
  { icon: icons.wifi,       title: "Free High-Speed WiFi",      desc: "Seamless connectivity across the entire resort" },
  { icon: icons.concierge,  title: "24/7 Front Desk",           desc: "Always here to assist with any request" },
  { icon: icons.parking,    title: "Secure Parking",            desc: "Complimentary guarded parking for all guests" },
  { icon: icons.transfer,   title: "Airport Transfer",          desc: "Private pick-up and drop-off service available" },
  { icon: icons.laundry,    title: "Laundry Service",           desc: "Same-day laundry and dry-cleaning on request" },
  { icon: icons.medical,    title: "Medical Assistance",        desc: "24-hour on-call medical support and first aid" },
  { icon: icons.event,      title: "Event & Celebration Setup", desc: "Bespoke arrangements for birthdays and anniversaries" },
  { icon: icons.concierge,  title: "Dedicated Concierge",       desc: "Personalised local recommendations and bookings" },
];

// ─── Reusable feature card (light bg) ─────────────────────────────────────────
function FeatureCard({ item }) {
  return (
    <motion.div variants={fadeUp}
      className="flex items-start gap-4 p-5 rounded-2xl border border-[#ede5d8] bg-[#faf8f5]
        hover:border-[#c9a96e]/50 hover:shadow-md hover:shadow-black/5
        transition-all duration-300 group"
    >
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
        bg-white text-[#7A2267] border border-[#ede5d8]
        group-hover:border-[#c9a96e]/40 group-hover:bg-[#7A2267] group-hover:text-white
        transition-all duration-300">
        {item.icon}
      </div>
      <div className="min-w-0">
        <p className={`${sans.className} text-[13px] font-semibold text-[#1a1309] leading-snug`}>
          {item.title}
        </p>
        <p className={`${sans.className} text-[11.5px] font-light text-[#7a6a52] mt-1 leading-relaxed`}>
          {item.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Activity card (photo + overlay) ──────────────────────────────────────────
function ActivityCard({ activity }) {
  return (
    <motion.div variants={fadeUp} className="group relative rounded-2xl overflow-hidden">
      <div className="relative aspect-[4/3]">
        <Image src={activity.image} alt={activity.title} fill
          sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 30vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/80 via-[#1a1309]/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 inset-x-0 p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="text-[#c9a96e] w-5 h-5 shrink-0">{activity.icon}</div>
          <h3 className={`${playfair.className} text-[1rem] text-white leading-snug`}>
            {activity.title}
          </h3>
        </div>
        <p className={`${sans.className} text-[11.5px] font-light text-white/60 leading-relaxed
          translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}>
          {activity.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Service card ──────────────────────────────────────────────────────────────
function ServiceCard({ s }) {
  return (
    <motion.div variants={fadeUp}
      className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl
        bg-white border border-[#ede5d8]
        hover:border-[#c9a96e]/50 hover:shadow-lg hover:shadow-black/5
        transition-all duration-300 group"
    >
      <div className="w-12 h-12 rounded-xl bg-[#7A2267]/[0.08] flex items-center justify-center
        text-[#7A2267] group-hover:bg-[#7A2267] group-hover:text-white transition-all duration-300">
        {s.icon}
      </div>
      <div>
        <p className={`${sans.className} text-[13px] font-semibold text-[#1a1309]`}>{s.title}</p>
        <p className={`${sans.className} text-[11.5px] font-light text-[#7a6a52] mt-1 leading-relaxed`}>{s.desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FacilitiesContent() {
  const heroRef       = useRef(null);
  const poolRef       = useRef(null);
  const indoorRef     = useRef(null);
  const activitiesRef = useRef(null);
  const kidsRef       = useRef(null);
  const diningRef     = useRef(null);
  const servicesRef   = useRef(null);
  const ctaRef        = useRef(null);

  const poolInView       = useInView(poolRef,       { once: true, margin: "-60px" });
  const indoorInView     = useInView(indoorRef,     { once: true, margin: "-60px" });
  const activitiesInView = useInView(activitiesRef, { once: true, margin: "-60px" });
  const kidsInView       = useInView(kidsRef,       { once: true, margin: "-60px" });
  const diningInView     = useInView(diningRef,     { once: true, margin: "-60px" });
  const servicesInView   = useInView(servicesRef,   { once: true, margin: "-60px" });
  const ctaInView        = useInView(ctaRef,        { once: true, margin: "-60px" });

  return (
    <main className="overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[88vh] md:min-h-[90vh] flex flex-col justify-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80"
          alt="Resort facilities" fill priority sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1309]/30 via-[#1a1309]/40 to-[#1a1309]/88 z-[1]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#1a1309]/40 to-transparent z-[2]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-16 md:pb-20 lg:pb-24 pt-32">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">

            <motion.div variants={fadeUp}
              className={`${sans.className} flex items-center gap-2 text-[11px] text-white/40 mb-6`}>
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#c9a96e]">Facilities</span>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-5">
              <div className="h-px w-10 bg-[#c9a96e]/60" />
              <p className={`${sans.className} text-[10px] uppercase tracking-[0.3em] font-semibold text-[#c9a96e]`}>
                World-Class Amenities
              </p>
            </motion.div>

            <motion.h1 variants={fadeUp}
              className={`${playfair.className} text-[2.8rem] sm:text-[3.8rem] lg:text-[5rem]
                font-500 text-white leading-[1.1] tracking-[-0.02em]`}>
              Everything You Need{" "}
              <em className={`${cormorant.className} not-italic text-[#c9a96e] block`}>
                for the Perfect Stay
              </em>
            </motion.h1>

            <motion.p variants={fadeUp}
              className={`${sans.className} text-[14px] font-light text-white/60 leading-[1.85] mt-6 max-w-xl`}>
              From iconic swimming pools to immersive indoor entertainment, curated dining, and
              dedicated spaces for children — every amenity is thoughtfully designed for the whole family.
            </motion.p>

            {/* Halal badge */}
            <motion.div variants={fadeUp} className="mt-8">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full
                bg-white/[0.08] border border-white/15 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                  <path d="M12 2l8 3v7c0 4.5-3.5 8.5-8 10-4.5-1.5-8-5.5-8-10V5l8-3z"
                    stroke="#c9a96e" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="#c9a96e" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.2em] text-white/55`}>
                  100% Halal · Family-Friendly Environment
                </span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-bounce">
                <svg viewBox="0 0 10 14" width="9" height="11" fill="none">
                  <path d="M5 1v12M1 9l4 4 4-4" stroke="white" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5"/>
                </svg>
              </div>
              <span className={`${sans.className} text-[10.5px] uppercase tracking-[0.22em] text-white/30`}>
                Scroll to explore
              </span>
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
              <span className={`${playfair.className} text-[2.4rem] sm:text-[2.8rem] font-semibold text-white leading-none`}>
                {s.value}
              </span>
              <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.22em] text-white/35 mt-2 font-medium`}>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-start">

            {/* Left: heading + text + feature cards */}
            <motion.div variants={stagger} initial="hidden" animate={poolInView ? "show" : "hidden"}
              className="flex flex-col gap-6 lg:pt-4">
              <motion.div variants={fadeUp}>
                <h2 className={`${playfair.className} text-[2rem] sm:text-[2.4rem] lg:text-[2.8rem]
                  font-500 text-[#1a1309] leading-[1.18]`}>
                  Dive Into{" "}
                  <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Pure Serenity</em>
                </h2>
                <p className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
                  Two stunning pools await you — our iconic infinity pool open to all guests, and a
                  dedicated ladies-only pool ensuring privacy and comfort for every member of the family.
                  Both are fully complimentary with your stay.
                </p>
              </motion.div>

              <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POOL_FEATURES.map((item) => (
                  <FeatureCard key={item.title} item={item} />
                ))}
              </motion.div>
            </motion.div>

            {/* Right: dual image composition */}
            <div className="flex flex-col gap-4">

              {/* Main pool — large */}
              <motion.div variants={fadeRight} initial="hidden" animate={poolInView ? "show" : "hidden"}
                className="relative rounded-[2rem] overflow-hidden
                  shadow-[0_24px_60px_-12px_rgba(26,19,9,0.18)] aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80"
                  alt="Iconic infinity swimming pool" fill
                  sizes="(max-width:1024px) 90vw, 48vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/55 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                    <p className={`${sans.className} text-[9px] uppercase tracking-[0.22em] text-[#c9a96e] font-semibold`}>
                      Iconic Infinity Pool
                    </p>
                    <p className={`${sans.className} text-[11.5px] text-white/75 mt-0.5`}>
                      Complimentary · Open to all guests
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Ladies pool — wide banner */}
              <motion.div
                initial={{ opacity:0, y:20 }} animate={poolInView ? {opacity:1,y:0} : {}}
                transition={{ duration:0.7, delay:0.3 }}
                className="relative rounded-[1.5rem] overflow-hidden
                  shadow-[0_16px_40px_-8px_rgba(26,19,9,0.15)] aspect-[16/7]">
                <Image
                  src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80"
                  alt="Ladies exclusive swimming pool" fill
                  sizes="(max-width:1024px) 90vw, 48vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a1309]/70 via-[#1a1309]/35 to-transparent" />
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/40
                      flex items-center justify-center text-[#c9a96e]">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
                        <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 21v-5l-1-5h10l-1 5v5M9 16h6"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className={`${sans.className} text-[9px] uppercase tracking-[0.22em] text-[#c9a96e] font-semibold`}>
                      Ladies Private Pool
                    </p>
                  </div>
                  <p className={`${sans.className} text-[11.5px] text-white/70`}>
                    Complimentary · Exclusively for women
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 02 INDOOR ENTERTAINMENT ═══════════════════════════════════════════ */}
      <section ref={indoorRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-28">
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
                  src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
                  alt="Indoor Gaming Zone" fill
                  sizes="(max-width:640px) 90vw, 28vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/92 via-[#1a1309]/45 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <div className="text-[#c9a96e] mb-2">{icons.gaming}</div>
                  <h3 className={`${playfair.className} text-[1.1rem] text-white leading-snug mb-3`}>
                    Indoor Gaming Zone
                  </h3>
                  <div className="space-y-1.5">
                    {["Foosball Table", "Table Tennis", "Billiards / Snooker"].map((g) => (
                      <div key={g} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#c9a96e] shrink-0" />
                        <span className={`${sans.className} text-[10.5px] text-white/65`}>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* 9D Cinema */}
              <motion.div variants={fadeRight}
                className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <Image
                  src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80"
                  alt="9D Movie Theater" fill
                  sizes="(max-width:640px) 45vw, 24vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/85 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="text-[#c9a96e] mb-1.5 w-5 h-5">{icons.cinema}</div>
                  <h3 className={`${playfair.className} text-[0.95rem] text-white leading-snug`}>
                    9D Movie Theater
                  </h3>
                  <p className={`${sans.className} text-[9.5px] text-white/50 mt-0.5`}>
                    Immersive cinematic experience
                  </p>
                </div>
              </motion.div>

              {/* Fitness Center */}
              <motion.div variants={fadeRight}
                className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <Image
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80"
                  alt="Recreational Fitness Center" fill
                  sizes="(max-width:640px) 45vw, 24vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/85 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="text-[#c9a96e] mb-1.5 w-5 h-5">{icons.fitness}</div>
                  <h3 className={`${playfair.className} text-[0.95rem] text-white leading-snug`}>
                    Fitness Center
                  </h3>
                  <p className={`${sans.className} text-[9.5px] text-white/50 mt-0.5`}>
                    Modern gym & workout space
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: text + feature rows */}
            <motion.div variants={stagger} initial="hidden" animate={indoorInView ? "show" : "hidden"}
              className="flex flex-col gap-6">
              <motion.div variants={fadeUp}>
                <h2 className={`${playfair.className} text-[2rem] sm:text-[2.4rem] lg:text-[2.8rem]
                  font-500 text-[#1a1309] leading-[1.18]`}>
                  Fun & Entertainment{" "}
                  <em className={`${cormorant.className} not-italic text-[#7A2267] block`}>
                    Under One Roof
                  </em>
                </h2>
                <p className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
                  When you're not by the pool or out in nature, our indoor entertainment zone has
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
                      bg-white border border-[#ede5d8] hover:border-[#c9a96e]/40
                      hover:shadow-sm transition-all duration-300 group">
                    <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                      bg-[#7A2267]/[0.08] text-[#7A2267] group-hover:bg-[#7A2267] group-hover:text-white
                      transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className={`${sans.className} text-[12.5px] font-semibold text-[#1a1309]`}>{item.label}</p>
                      <p className={`${sans.className} text-[11px] font-light text-[#7a6a52]`}>{item.note}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ 03 OUTDOOR ACTIVITIES ═════════════════════════════════════════════ */}
      <section ref={activitiesRef} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]
          rounded-full bg-[#7A2267]/[0.09] blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity:0,y:-10 }} animate={activitiesInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-5">
            <SectionLabel text="Outdoor Activities" dark />
          </motion.div>

          <motion.div initial={{ opacity:0,y:20 }} animate={activitiesInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.7, delay:0.1 }} className="text-center mb-14">
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-white leading-[1.15]`}>
              Explore, Discover,{" "}
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Connect With Nature</em>
            </h2>
            <p className={`${sans.className} text-[13.5px] font-light text-white/45 mt-4 max-w-xl mx-auto leading-[1.85]`}>
              Paddle across our serene lake, trek nature trails, or simply breathe in the silence.
              Every outdoor experience at Amber Nivaas brings you closer to the natural world.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={activitiesInView ? "show" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACTIVITIES.map((a) => (
              <ActivityCard key={a.title} activity={a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ 04 FOR LITTLE ONES ════════════════════════════════════════════════ */}
      <section ref={kidsRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px]
          rounded-full bg-[#c9a96e]/[0.07] blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity:0,y:-10 }} animate={kidsInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-5">
            <SectionLabel text="For Little Ones" />
          </motion.div>

          <motion.div initial={{ opacity:0,y:20 }} animate={kidsInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.7, delay:0.1 }} className="text-center mb-14">
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-[#1a1309] leading-[1.15]`}>
              A World Built for{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Young Adventurers</em>
            </h2>
            <p className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] mt-4 max-w-xl mx-auto leading-[1.85]`}>
              We believe every family member deserves an exceptional experience.
              Our children's facilities are safe, supervised, stimulating, and endlessly fun.
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
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80"
                  alt="Outdoor Adventure Park" fill sizes="(max-width:768px) 90vw, 45vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/82 via-[#1a1309]/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center
                    bg-[#c9a96e]/20 border border-[#c9a96e]/40 text-[#c9a96e]">
                    {icons.park}
                  </div>
                  <h3 className={`${playfair.className} text-[1.2rem] text-white leading-snug`}>
                    Outdoor Adventure Park
                  </h3>
                </div>
                <p className={`${sans.className} text-[12px] font-light text-white/65 leading-relaxed mb-4`}>
                  A sprawling outdoor play space designed for young explorers — safe, supervised,
                  and set amidst the resort's natural greenery.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Climbing Frames & Slides", "Open Lawn & Running Space", "Nature Play Elements"].map((f) => (
                    <span key={f} className={`${sans.className} text-[9px] uppercase tracking-wider
                      px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/60 backdrop-blur-sm`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Indoor Kids Zone */}
            <motion.div variants={fadeRight}
              className="group relative rounded-2xl overflow-hidden
                shadow-[0_12px_40px_-8px_rgba(26,19,9,0.12)] cursor-pointer">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80"
                  alt="Kids Indoor Games Zone" fill sizes="(max-width:768px) 90vw, 45vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/82 via-[#1a1309]/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center
                    bg-[#7A2267]/20 border border-[#7A2267]/40 text-[#c9a96e]">
                    {icons.kids}
                  </div>
                  <h3 className={`${playfair.className} text-[1.2rem] text-white leading-snug`}>
                    Kids' Indoor Games Zone
                  </h3>
                </div>
                <p className={`${sans.className} text-[12px] font-light text-white/65 leading-relaxed mb-4`}>
                  A dedicated indoor play area where children can be entertained and engaged
                  rain or shine, with supervised activities for all ages.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Board Games & Puzzles", "Supervised Play Sessions", "Age-Appropriate Activities"].map((f) => (
                    <span key={f} className={`${sans.className} text-[9px] uppercase tracking-wider
                      px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/60 backdrop-blur-sm`}>
                      {f}
                    </span>
                  ))}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">

            {/* Image (right on desktop) */}
            <motion.div variants={fadeRight} initial="hidden" animate={diningInView ? "show" : "hidden"}
              className="relative order-1 lg:order-2">
              <div className="absolute -inset-2 rounded-[2.5rem] border border-[#c9a96e]/15 hidden md:block" />
              <div className="relative rounded-[2rem] overflow-hidden shadow-[0_24px_60px_-12px_rgba(26,19,9,0.2)] aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"
                  alt="Elegant resort dining" fill
                  sizes="(max-width:1024px) 90vw, 48vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/30 to-transparent" />
                <div className="absolute top-5 left-5 backdrop-blur-md bg-[#1a1309]/50
                  border border-white/15 rounded-xl px-4 py-2">
                  <p className={`${sans.className} text-[9px] uppercase tracking-[0.22em] text-[#c9a96e] font-semibold`}>
                    Dining & Cuisine
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Content (left on desktop) */}
            <motion.div variants={stagger} initial="hidden" animate={diningInView ? "show" : "hidden"}
              className="flex flex-col gap-6 order-2 lg:order-1">
              <motion.div variants={fadeUp}>
                <h2 className={`${playfair.className} text-[2rem] sm:text-[2.4rem] lg:text-[2.8rem]
                  font-500 text-[#1a1309] leading-[1.18]`}>
                  A Feast for{" "}
                  <em className={`${cormorant.className} not-italic text-[#7A2267] block`}>Every Sense</em>
                </h2>
                <p className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
                  From hearty complimentary breakfasts to intimate private dinners and evening BBQ
                  gatherings — our culinary team crafts every meal with seasonal ingredients,
                  local flavours, and genuine care.
                </p>
              </motion.div>

              <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DINING.map((item) => (
                  <FeatureCard key={item.title} item={item} />
                ))}
              </motion.div>

              {/* Venue links */}
              <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { name:"Amber Restaurant", tagline:"Fine Dining", href:"/dining/amber-restaurant", color:"#7A2267" },
                  { name:"Amber Café",        tagline:"Casual & Cosy", href:"/dining/amber-cafe",        color:"#c9a96e" },
                ].map((venue) => (
                  <motion.div key={venue.name} variants={fadeUp}>
                    <Link href={venue.href}
                      className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl
                        border border-[#c9a96e]/20 bg-[#f8f4ee] hover:bg-white
                        hover:border-[#c9a96e]/40 hover:shadow-md hover:shadow-black/5
                        transition-all duration-300 group">
                      <div>
                        <p className={`${sans.className} text-[9px] uppercase tracking-[0.2em] font-semibold mb-1`}
                          style={{ color: venue.color }}>{venue.tagline}</p>
                        <p className={`${playfair.className} text-[1.1rem] text-[#1a1309]`}>{venue.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`${sans.className} text-[10px] font-semibold uppercase tracking-wide`}
                          style={{ color: venue.color }}>View Menu</span>
                        <svg viewBox="0 0 14 10" width="10" height="10" fill="none"
                          className="group-hover:translate-x-1 transition-transform duration-200"
                          style={{ color: venue.color }}>
                          <path d="M1 5h12M8 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══ 06 GUEST SERVICES ═════════════════════════════════════════════════ */}
      <section ref={servicesRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-28">
        <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px]
          rounded-full bg-[#c9a96e]/[0.07] blur-[80px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div initial={{ opacity:0,y:-10 }} animate={servicesInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.6 }} className="mb-5">
            <SectionLabel text="Guest Services" />
          </motion.div>

          <motion.div initial={{ opacity:0,y:20 }} animate={servicesInView ? {opacity:1,y:0} : {}}
            transition={{ duration:0.7, delay:0.1 }} className="text-center mb-14">
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-[#1a1309] leading-[1.15]`}>
              Thoughtful Service,{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Every Moment</em>
            </h2>
            <p className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] mt-4 max-w-xl mx-auto leading-[1.85]`}>
              Our dedicated team is committed to ensuring your stay is seamless from arrival to farewell.
              No request is too small, no detail too minor.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={servicesInView ? "show" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((s) => (
              <ServiceCard key={s.title} s={s} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="relative overflow-hidden min-h-[420px] flex items-center justify-center py-24">
        <Image
          src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1920&q=80"
          alt="Resort pool evening view" fill sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1309]/80 via-[#1a1309]/65 to-[#7A2267]/25" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div variants={stagger} initial="hidden" animate={ctaInView ? "show" : "hidden"}
            className="flex flex-col items-center gap-6">

            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <div className="h-px w-10 bg-[#c9a96e]/60" />
              <p className={`${sans.className} text-[10px] uppercase tracking-[0.3em] font-semibold text-[#c9a96e]`}>
                Ready to Experience It All?
              </p>
              <div className="h-px w-10 bg-[#c9a96e]/60" />
            </motion.div>

            <motion.h2 variants={fadeUp}
              className={`${playfair.className} text-[2.2rem] sm:text-[3rem] lg:text-[3.6rem]
                font-500 text-white leading-[1.12]`}>
              Your Perfect Retreat
              <br />
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>
                Awaits at Amber Nivaas
              </em>
            </motion.h2>

            <motion.p variants={fadeUp}
              className={`${cormorant.className} text-[1.1rem] italic text-white/65 max-w-md`}>
              Reserve your stay today and immerse yourself in nature, luxury, and heartfelt family care.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link href="/booking"
                className={`${sans.className} inline-flex items-center gap-3
                  px-8 py-3.5 rounded-full
                  bg-white text-[#1a1309] text-[12px] font-semibold uppercase tracking-[0.18em]
                  hover:bg-[#f8f4ee] transition-all duration-300 group
                  shadow-[0_8px_30px_-6px_rgba(255,255,255,0.3)]`}>
                Book Your Stay
                <svg viewBox="0 0 16 10" width="13" height="13" fill="none"
                  className="group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/accommodation"
                className={`${sans.className} inline-flex items-center gap-2
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
