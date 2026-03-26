"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Cormorant, DM_Sans, Cormorant_Garamond } from "next/font/google";

const cinzel    = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans      = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

const fadeUp   = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22,1,0.36,1] } } };
const fadeLeft = { hidden: { opacity: 0, x: -32 }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22,1,0.36,1] } } };
const fadeRight= { hidden: { opacity: 0, x: 32  }, show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22,1,0.36,1] } } };
const stagger  = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } };

const VENUES = [
  {
    key: "restaurant",
    name: "Amber Restaurant",
    tagline: "Fine Dining",
    desc: "An elevated dining experience where local flavours meet artisan cooking. Our chefs craft each plate with seasonal ingredients and genuine care — whether it's a family breakfast or a candlelit private dinner.",
    highlights: ["Panoramic garden views", "Complimentary breakfast daily", "Private dining setups", "Outdoor BBQ terrace"],
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    href: "/dining/amber-restaurant",
    color: "#7A2267",
    flip: false,
  },
  {
    key: "cafe",
    name: "Amber Café",
    tagline: "Casual & Cosy",
    desc: "A warm corner to unwind with freshly brewed tea or coffee, light bites, and wholesome snacks. Perfect for a relaxed morning, an afternoon catch-up, or a quiet evening with something sweet.",
    highlights: ["All-day beverages & snacks", "Homemade pastries & desserts", "Halal-certified kitchen", "Indoor & terrace seating"],
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80",
    href: "/dining/amber-cafe",
    color: "#9d3a8a",
    flip: true,
  },
];

function VenueCard({ venue, inView }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center
      ${venue.flip ? "" : ""}`}>

      {/* Image */}
      <motion.div
        variants={venue.flip ? fadeRight : fadeLeft}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className={`relative ${venue.flip ? "lg:order-2" : ""}`}
      >
        <div className="absolute -inset-2 rounded-[2.5rem] border border-[#c9a96e]/15 hidden md:block" />
        <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]
          shadow-[0_20px_60px_-12px_rgba(26,19,9,0.18)]">
          <Image src={venue.image} alt={venue.name} fill
            sizes="(max-width:1024px) 90vw, 48vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/45 to-transparent" />
          <div className="absolute top-5 left-5">
            <div className="backdrop-blur-md bg-[#1a1309]/50 border border-white/15 rounded-xl px-4 py-2">
              <p className={`${sans.className} text-[9px] uppercase tracking-[0.22em] font-semibold`}
                style={{ color: venue.color }}>
                {venue.tagline}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"}
        className={`flex flex-col gap-5 ${venue.flip ? "lg:order-1" : ""}`}
      >
        <motion.div variants={fadeUp}>
          <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.28em] font-semibold mb-3`}
            style={{ color: venue.color }}>
            {venue.tagline}
          </p>
          <h3 className={`${cinzel.className} text-[2rem] sm:text-[2.4rem] text-[#1a1309] leading-[1.15]`}>
            {venue.name}
          </h3>
          <p className={`${sans.className} text-[13px] font-light text-[#6b5e4a] leading-[1.9] mt-4`}>
            {venue.desc}
          </p>
        </motion.div>

        {/* Highlights */}
        <motion.div variants={stagger} className="grid grid-cols-2 gap-2">
          {venue.highlights.map((h) => (
            <motion.div key={h} variants={fadeUp}
              className="flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: venue.color }} />
              <span className={`${sans.className} text-[11.5px] font-light text-[#5a4e3a]`}>{h}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp}>
          <Link href={venue.href}
            className={`${sans.className} inline-flex items-center gap-3
              px-6 py-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em]
              transition-all duration-300 group`}
            style={{ backgroundColor: `${venue.color}15`, color: venue.color,
              border: `1px solid ${venue.color}30` }}
          >
            View Menu & Details
            <svg viewBox="0 0 14 10" width="11" height="11" fill="none"
              className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M1 5h12M8 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function DiningSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative bg-[#f8f4ee] py-20 md:py-28 lg:py-32 overflow-hidden">

      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 45% at 100% 0%, rgba(122,34,103,0.06) 0%, transparent 65%)" }} />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity:0, y:-10 }} animate={inView ? {opacity:1,y:0} : {}}
          transition={{ duration:0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`${cinzel.className} text-[2rem] sm:text-[2.6rem] lg:text-[3.2rem]
            text-[#1a1309] leading-[1.12]`}>
            Savour Every{" "}
            <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Moment</em>
          </h2>
          <p className={`${sans.className} text-[13px] font-light text-[#7a6a52] mt-4 max-w-lg mx-auto leading-[1.85]`}>
            Two distinct dining destinations — one for refined meals, one for relaxed bites.
            Both crafted with halal ingredients and heartfelt hospitality.
          </p>
        </motion.div>

        {/* Venue cards */}
        <div className="flex flex-col gap-20 md:gap-28">
          {VENUES.map((v) => (
            <VenueCard key={v.key} venue={v} inView={inView} />
          ))}
        </div>

      </div>
    </section>
  );
}
