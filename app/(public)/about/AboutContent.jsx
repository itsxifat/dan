"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["italic"] });

const itemUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// ── Ornament divider ──────────────────────────────────────────────────────────
function OrnamentDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a96e]/50" />
      <svg viewBox="0 0 18 18" width="13" height="13" fill="none">
        <path d="M9 1l2 6h6l-5 3.5 2 6L9 13l-5 3.5 2-6L1 7h6z" fill="#c9a96e" fillOpacity="0.6" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a96e]/50" />
    </div>
  );
}

// ── Numbered feature ──────────────────────────────────────────────────────────
function Feature({ num, title, desc }) {
  return (
    <motion.div variants={itemUp} className="flex gap-4 items-start group">
      <div className="shrink-0 w-8 h-8 rounded-full border border-[#7A2267]/25 flex items-center justify-center
        group-hover:bg-[#7A2267] group-hover:border-[#7A2267] transition-all duration-300">
        <span className={`${sans.className} text-[9px] font-semibold text-[#7A2267]
          group-hover:text-white transition-colors duration-300 tracking-wider`}>{num}</span>
      </div>
      <div>
        <p className={`${sans.className} text-[13px] font-semibold text-[#1a1309] mb-0.5`}>{title}</p>
        <p className={`${sans.className} text-[11.5px] font-light text-[#7a6a52] leading-relaxed`}>{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Value card ────────────────────────────────────────────────────────────────
function ValueCard({ icon, title, desc }) {
  return (
    <motion.div
      variants={itemUp}
      className="group flex flex-col gap-4 p-6 rounded-2xl bg-white border border-[#ede5d8]
        hover:border-[#c9a96e]/40 hover:shadow-[0_12px_40px_-8px_rgba(201,169,110,0.15)]
        transition-all duration-300"
    >
      <div className="w-11 h-11 rounded-xl bg-[#f8f4ee] border border-[#ede5d8]
        flex items-center justify-center text-[#7A2267] shrink-0
        group-hover:bg-[#7A2267]/8 group-hover:border-[#7A2267]/20 transition-all duration-300">
        {icon}
      </div>
      <div>
        <h3 className={`${sans.className} text-[13px] font-semibold text-[#1a1309] mb-1.5`}>{title}</h3>
        <p className={`${sans.className} text-[11.5px] font-light text-[#7a6a52] leading-[1.75]`}>{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Timeline milestone ────────────────────────────────────────────────────────
function Milestone({ year, title, desc, last }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-[#c9a96e] border-2 border-[#f8f4ee] ring-2 ring-[#c9a96e]/30 mt-1 shrink-0" />
        {!last && <div className="w-px flex-1 bg-[#ede5d8] mt-2" />}
      </div>
      <div className={`pb-${last ? "0" : "8"}`}>
        <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.22em] font-semibold text-[#c9a96e] mb-1`}>
          {year}
        </p>
        <p className={`${playfair.className} text-[1rem] font-semibold text-[#1a1309] mb-1`}>{title}</p>
        <p className={`${sans.className} text-[12px] font-light text-[#7a6a52] leading-[1.7]`}>{desc}</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AboutContent() {

  const storyRef   = useRef(null);
  const valuesRef  = useRef(null);
  const timelineRef = useRef(null);
  const teamRef    = useRef(null);

  const storyInView    = useInView(storyRef,    { once: true, margin: "-60px" });
  const valuesInView   = useInView(valuesRef,   { once: true, margin: "-60px" });
  const timelineInView = useInView(timelineRef, { once: true, margin: "-60px" });
  const teamInView     = useInView(teamRef,     { once: true, margin: "-60px" });

  return (
    <>

      {/* ── PAGE HERO ──────────────────────────────────────────────────────── */}
      <section className="relative bg-[#f8f4ee] overflow-hidden pt-14 pb-16 md:pt-16 md:pb-20
        border-b border-[#ede5d8]">

        <div className="pointer-events-none absolute top-0 right-0 w-[450px] h-[450px]
          rounded-full bg-[#c9a96e]/[0.07] blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[300px] h-[300px]
          rounded-full bg-[#7A2267]/[0.04] blur-[80px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          {/* Breadcrumb */}
          <div className={`${sans.className} flex items-center gap-2 text-[9.5px] uppercase
            tracking-[0.18em] text-[#9b8e78] mb-10`}>
            <Link href="/" className="hover:text-[#555] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#555]">About Us</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="h-px w-10 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.3em] font-semibold text-[#c9a96e]`}>
              Our Story
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`${playfair.className} text-[2.4rem] sm:text-[3rem] lg:text-[3.8rem]
              text-[#1a1309] leading-[1.1] max-w-3xl`}
          >
            A Sanctuary Where{" "}
            <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Nature Meets Luxury</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className={`${sans.className} text-[13.5px] font-light text-[#7a6a52] leading-[1.9]
              max-w-xl mt-5`}
          >
            Since 2015, Dhali&apos;s Amber Nivaas has been Bangladesh&apos;s most beloved retreat —
            where every guest is welcomed like family, and every moment is crafted to be memorable.
          </motion.p>
        </div>
      </section>

      {/* ── OUR STORY (2-col) ──────────────────────────────────────────────── */}
      <section ref={storyRef} className="relative bg-[#f8f4ee] overflow-hidden py-16 md:py-24">

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">

            {/* Left: image composition */}
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 right-8 bottom-8 rounded-[2.5rem]
                border border-[#c9a96e]/25 z-0 hidden sm:block" />

              <div className="relative z-10 rounded-[2rem] overflow-hidden
                shadow-[0_30px_70px_-15px_rgba(30,20,5,0.22)]
                aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
                <Image
                  src="https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=900&q=80"
                  alt="Dhali's Amber Nivaas scenic view"
                  fill sizes="(max-width: 1024px) 90vw, 48vw"
                  className="object-cover scale-[1.02] hover:scale-100 transition-transform duration-[2s] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/60 via-[#1a1309]/10 to-transparent" />

                {/* Est. badge */}
                <div className="absolute top-5 left-5 backdrop-blur-md bg-white/15 border border-white/20
                  rounded-2xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#c9a96e] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
                      <path d="M7 1l1.5 4.5H13L9 8.5l1.5 4.5L7 10.5 3.5 13 5 8.5 1 5.5h4.5z" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <p className={`${sans.className} text-[9px] uppercase tracking-wider text-white/70`}>Established</p>
                    <p className={`${playfair.className} text-[15px] font-semibold text-white leading-none mt-0.5`}>Est. 2015</p>
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6">
                  <p className={`${cormorant.className} text-[1.1rem] italic text-white/80 leading-snug`}>
                    &ldquo;A sanctuary where nature and luxury meet&rdquo;
                  </p>
                </div>
              </div>

              {/* Accent image */}
              <div className="absolute -bottom-6 -right-4 sm:-right-6 z-20
                w-[140px] h-[175px] sm:w-[165px] sm:h-[205px]
                rounded-2xl overflow-hidden border-[3px] border-[#f8f4ee]
                shadow-[0_15px_40px_-8px_rgba(30,20,5,0.25)]">
                <Image
                  src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80"
                  alt="Resort pool"
                  fill sizes="165px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/40 to-transparent" />
                <div className="absolute bottom-3 inset-x-2 text-center">
                  <p className={`${playfair.className} text-[1.2rem] font-semibold text-white leading-none`}>4.9★</p>
                  <p className={`${sans.className} text-[8px] uppercase tracking-wider text-white/70 mt-0.5`}>Guest Rating</p>
                </div>
              </div>
            </motion.div>

            {/* Right: content */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={storyInView ? "show" : "hidden"}
              className="flex flex-col gap-6 lg:pl-4 xl:pl-8 mt-8 lg:mt-0"
            >
              <motion.div variants={itemUp} className="space-y-2">
                <h2 className={`${playfair.className}
                  text-[2rem] sm:text-[2.5rem] lg:text-[2.8rem]
                  font-500 text-[#1a1309] leading-[1.15]`}>
                  Experience Tranquility{" "}
                  <em className={`${cormorant.className} font-400 text-[#7A2267] not-italic`}>&amp;</em>{" "}
                  Luxury in the Heart of Nature
                </h2>
              </motion.div>

              <motion.div variants={itemUp}><OrnamentDivider /></motion.div>

              <motion.p variants={itemUp}
                className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.9]`}>
                Nestled within serene natural surroundings just outside Dhaka, our resort is a sanctuary
                designed to restore your spirit and refresh your senses. From thoughtfully appointed rooms
                to curated experiences in the wild, every detail is crafted to give you an unforgettable
                escape — where time slows down and comfort meets nature.
              </motion.p>

              <motion.p variants={itemUp}
                className={`${sans.className} text-[13px] font-light text-[#7a6a52] leading-[1.85]`}>
                Founded by a family passionate about hospitality and conservation, Dhali&apos;s Amber Nivaas
                was built with a singular vision: to create a space where Bangladesh&apos;s natural beauty
                could be experienced in absolute comfort and serenity.
              </motion.p>

              <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <Feature num="01" title="Peaceful Environment"    desc="Far from city noise, immersed in nature's calm" />
                <Feature num="02" title="Premium Accommodation"   desc="Thoughtfully designed rooms for every comfort" />
                <Feature num="03" title="Personalized Service"    desc="Warm, attentive care for every guest, every day" />
                <Feature num="04" title="Curated Experiences"     desc="Nature walks, spa retreats & local discoveries" />
              </motion.div>

              <motion.div variants={itemUp}
                className="h-px bg-gradient-to-r from-[#e0d4c0] via-[#c9a96e]/30 to-transparent" />

              {/* Mini stats */}
              <motion.div variants={itemUp} className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center">
                  <span className={`${playfair.className} text-[2.2rem] font-600 text-[#1a1309] leading-none`}>500+</span>
                  <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.2em] text-[#9b8e78] mt-1.5`}>Happy Guests</span>
                  <span className={`${cormorant.className} text-[11px] italic text-[#c9a96e] mt-0.5`}>& counting</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-12 w-px bg-[#ddd0bc]" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className={`${playfair.className} text-[2.2rem] font-600 text-[#1a1309] leading-none`}>10+</span>
                  <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.2em] text-[#9b8e78] mt-1.5`}>Years Active</span>
                  <span className={`${cormorant.className} text-[11px] italic text-[#c9a96e] mt-0.5`}>since 2015</span>
                </div>
              </motion.div>

              <motion.div variants={itemUp} className="flex flex-wrap gap-3 pt-1">
                <Link href="/accommodation"
                  className={`${sans.className} inline-flex items-center gap-3
                    px-7 py-3.5 rounded-full bg-[#1a1309] text-white
                    text-[11.5px] font-semibold uppercase tracking-[0.18em]
                    hover:bg-[#7A2267] transition-all duration-300 group
                    shadow-md hover:shadow-[#7A2267]/30 hover:shadow-lg`}
                >
                  Explore Rooms
                  <svg viewBox="0 0 16 10" width="12" height="12" fill="none"
                    className="group-hover:translate-x-1 transition-transform duration-300">
                    <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/booking"
                  className={`${sans.className} inline-flex items-center gap-2
                    px-7 py-3.5 rounded-full border border-[#1a1309]/20 text-[#1a1309]
                    text-[11.5px] font-semibold uppercase tracking-[0.18em]
                    hover:border-[#7A2267] hover:text-[#7A2267] transition-all duration-300`}
                >
                  Book a Stay
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────────── */}
      <section className="bg-[#1a1309] py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12
          grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x-0 lg:divide-x divide-white/[0.06]">
          {[
            { value: "500+",  label: "Happy Guests",    sub: "& counting" },
            { value: "4.9★",  label: "Average Rating",  sub: "by guests" },
            { value: "10+",   label: "Years of Service", sub: "since 2015" },
            { value: "100%",  label: "Nature Immersed",  sub: "always" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center lg:px-8 py-2">
              <span className={`${playfair.className} text-[2rem] sm:text-[2.4rem] font-semibold text-white leading-none`}>
                {s.value}
              </span>
              <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.22em] text-white/40 mt-2`}>
                {s.label}
              </span>
              <span className={`${cormorant.className} text-[11px] italic text-[#c9a96e]/70 mt-0.5`}>
                {s.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── OUR VALUES ─────────────────────────────────────────────────────── */}
      <section ref={valuesRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-28">

        <div className="pointer-events-none absolute top-0 left-0 w-[400px] h-[400px]
          rounded-full bg-[#7A2267]/[0.04] blur-[90px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-5 mb-6"
          >
            <div className="h-px w-12 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
              What We Stand For
            </p>
            <div className="h-px w-12 bg-[#c9a96e]/50" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14"
          >
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              text-[#1a1309] leading-[1.15]`}>
              Our Core{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Values</em>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={valuesInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <ValueCard
              title="Harmony with Nature"
              desc="Every structure, path, and garden is designed to complement the natural landscape — never to overpower it."
              icon={
                <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 21V9M11 9C11 4 6 2 2 3c1 4 4 6 9 6z" />
                  <path d="M11 9c0-5 5-7 9-6-1 4-4 6-9 6z" />
                  <path d="M3 21h16" />
                </svg>
              }
            />
            <ValueCard
              title="Uncompromising Luxury"
              desc="From 400-thread-count linens to hand-selected dining menus — quality is non-negotiable in every detail."
              icon={
                <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2l2.5 7.5H21l-6.5 4.5 2.5 7.5L11 17l-6.5 4.5 2.5-7.5L1 9.5h7.5z" />
                </svg>
              }
            />
            <ValueCard
              title="Heartfelt Hospitality"
              desc="Our team treats every guest as a cherished visitor — attentive, warm, and always anticipating your needs."
              icon={
                <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L11 6.67l-2.06-2.06a5.5 5.5 0 0 0-7.78 7.78l2.06 2.06L11 21.23l7.78-7.78 2.06-2.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              }
            />
            <ValueCard
              title="Community & Heritage"
              desc="We celebrate local culture, employ from the community, and honour the heritage of the land we call home."
              icon={
                <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          </motion.div>
        </div>
      </section>

      {/* ── TIMELINE ───────────────────────────────────────────────────────── */}
      <section ref={timelineRef} className="relative bg-white overflow-hidden py-20 md:py-28">

        <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px]
          rounded-full bg-[#c9a96e]/[0.05] blur-[90px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={timelineInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-5 mb-6"
          >
            <div className="h-px w-12 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
              Our Journey
            </p>
            <div className="h-px w-12 bg-[#c9a96e]/50" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={timelineInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center mb-14"
          >
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              text-[#1a1309] leading-[1.15]`}>
              A Decade of{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Creating Memories</em>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={timelineInView ? "show" : "hidden"}
            className="grid md:grid-cols-2 gap-x-16 gap-y-0 max-w-4xl mx-auto"
          >
            {[
              { year: "2015", title: "The Vision Takes Root",
                desc: "Dhali's Amber Nivaas opens its doors — a small family-run retreat with 12 rooms surrounded by natural woodland." },
              { year: "2017", title: "Expanding the Experience",
                desc: "The iconic infinity pool and spa pavilion are added, elevating the resort to a full luxury destination." },
              { year: "2019", title: "Corporate & Events Wing",
                desc: "The Grand Outdoor Field and Banquet Hall open, welcoming corporate clients and large-scale events for the first time." },
              { year: "2021", title: "Award-Winning Hospitality",
                desc: "Recognised as one of Bangladesh's top resort experiences, maintaining a 4.9-star guest rating throughout." },
              { year: "2023", title: "Helipad & VIP Access",
                desc: "The Helipad Field opens, making Amber Nivaas accessible to high-profile executive and diplomatic guests." },
              { year: "2025", title: "A New Chapter Begins",
                desc: "Ongoing expansion with new cottages, an enhanced dining menu, and a fully digital guest experience platform.", last: true },
            ].map((m, i, arr) => (
              <motion.div key={m.year} variants={itemUp}>
                <Milestone
                  year={m.year}
                  title={m.title}
                  desc={m.desc}
                  last={m.last || i === arr.length - 1}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TEAM SECTION ───────────────────────────────────────────────────── */}
      <section ref={teamRef} className="relative bg-[#f8f4ee] overflow-hidden py-20 md:py-24">

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-5 mb-6"
          >
            <div className="h-px w-12 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
              The People Behind It
            </p>
            <div className="h-px w-12 bg-[#c9a96e]/50" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center mb-14"
          >
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              text-[#1a1309] leading-[1.15]`}>
              Driven by{" "}
              <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Passion for Hospitality</em>
            </h2>
            <p className={`${sans.className} text-[13px] text-[#7a6a52] font-light leading-[1.85]
              max-w-xl mx-auto mt-4`}>
              Our team of dedicated professionals — from our executive chef to our nature guides —
              share one common goal: making every stay unforgettable.
            </p>
          </motion.div>

          {/* Quote / closing statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="max-w-2xl mx-auto text-center bg-white border border-[#ede5d8] rounded-3xl
              px-8 py-10 shadow-[0_8px_40px_-12px_rgba(201,169,110,0.12)]"
          >
            <div className={`${cormorant.className} text-[4.5rem] leading-none text-[#c9a96e] -mb-4 select-none`}>
              &ldquo;
            </div>
            <p className={`${cormorant.className} text-[1.2rem] italic text-[#3d3427] leading-[1.8]`}>
              We don&apos;t just offer rooms — we offer a feeling. The feeling of being truly away,
              truly cared for, and truly at home in nature. That is the promise of Amber Nivaas.
            </p>
            <div className="mt-6 pt-5 border-t border-[#ede5d8]">
              <p className={`${playfair.className} text-[13px] font-semibold text-[#1a1309]`}>
                Dhali Family
              </p>
              <p className={`${sans.className} text-[10px] uppercase tracking-wider text-[#c9a96e] mt-0.5`}>
                Founders, Dhali&apos;s Amber Nivaas
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1a1309] overflow-hidden py-20 md:py-24">

        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=80"
            alt=""
            fill className="object-cover object-center opacity-10"
          />
        </div>
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(122,34,103,0.25) 0%, rgba(26,19,9,0.95) 60%)" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.3em] text-[#c9a96e] mb-4`}>
              Come Experience It
            </p>
            <h2 className={`${playfair.className} text-[2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              text-white leading-[1.15] mb-5`}>
              Your Story at Amber Nivaas<br />
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Starts With a Single Stay</em>
            </h2>
            <p className={`${sans.className} text-[13px] text-white/40 leading-[1.85] font-light
              max-w-xl mx-auto mb-8`}>
              Whether you&apos;re seeking a quiet weekend retreat, a corporate event venue,
              or a celebration to remember — we are ready to host you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/booking"
                className={`${sans.className} group flex items-center gap-2.5 px-7 py-3.5 rounded-full
                  bg-[#c9a96e] hover:bg-[#d4b87a] text-[#0e0a05]
                  text-[10px] uppercase tracking-[0.2em] font-semibold
                  transition-all duration-300 shadow-[0_4px_20px_rgba(201,169,110,0.3)]`}
              >
                Book Your Stay
                <svg viewBox="0 0 10 10" width="7" height="7" fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/facilities"
                className={`${sans.className} flex items-center gap-2 px-7 py-3.5 rounded-full
                  border border-white/15 text-white/55 hover:text-white hover:border-white/30
                  text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300`}
              >
                Explore Facilities
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </>
  );
}
