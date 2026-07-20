"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lora, Josefin_Sans } from "next/font/google";
import { ABOUT_LEFT_URL, ABOUT_MIDDLE_URL, ABOUT_RIGHT_URL, HERO_URL } from "@/lib/assets";

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
  show:   { transition: { staggerChildren: 0.13, delayChildren: 0.04 } },
};

// Journey flow — each node renders on alternating sides of the centre spine.
const milestones = [
  {
    step:  "01",
    year:  "2017",
    title: "Foundation",
    desc:  "The land was chosen and the first stone laid. What began as one family's vision — a halal-certified retreat where guests could rest without compromise — took root in the quiet countryside outside Dhaka.",
    image: ABOUT_LEFT_URL,
    alt:   "The resort grounds at Dhali's Amber Nivaas",
  },
  {
    step:  "02",
    year:  "2021",
    title: "Tower Building",
    desc:  "The Tower Building rose as our first full accommodation wing — premium rooms and suites with panoramic views across the landscape, welcoming the very first guests through our doors.",
    image: ABOUT_MIDDLE_URL,
    alt:   "The Tower Building accommodation wing",
  },
  {
    step:  "03",
    year:  "2021",
    title: "Recreation Center",
    desc:  "The Recreation Center followed in the same year. A swimming pool, indoor games and open recreation grounds turned a place to stay into a place to properly unwind.",
    image: ABOUT_RIGHT_URL,
    alt:   "Recreation facilities at the resort",
  },
  {
    step:  "04",
    year:  "2023",
    title: "Digital Transformation",
    desc:  "Bookings, galleries and corporate enquiries moved online. A single platform now connects guests across the country to every corner of the resort, before they ever arrive.",
    image: HERO_URL,
    alt:   "Dhali's Amber Nivaas resort view",
  },
];

/**
 * Portrait that degrades to a monogram.
 *
 * Uses a plain <img> rather than next/image on purpose: these URLs are entered
 * by an admin and can point at any host, which next/image rejects at runtime
 * unless the host is listed in next.config remotePatterns. onError also lets a
 * dead link fall back to the monogram instead of showing a broken image.
 */
function Portrait({ src, name, className = "", monogramClass = "" }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "").trim().charAt(0) || "—";

  if (!src || failed) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-[#f0e7e0] ${className}`}>
        <span className={`${lora.className} text-[#7A2267]/30 font-400 ${monogramClass}`}>
          {initial}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see note above
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover object-top ${className}`}
    />
  );
}

function ExecutiveCard({ member }) {
  return (
    <motion.div variants={fadeUp} className="group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#f0e7e0]
        ring-1 ring-[#1a1309]/[0.06] shadow-[0_18px_40px_-24px_rgba(26,19,9,0.35)]">
        <div className="w-full h-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]">
          <Portrait src={member.image} name={member.name} monogramClass="text-[2.6rem] italic" />
        </div>
      </div>

      <div className="pt-4">
        <p className={`${lora.className} text-[1rem] sm:text-[1.08rem] text-[#1a1309] font-500 leading-snug`}>
          {member.name}
        </p>
        {member.role && (
          <p className={`${josefin.className} mt-1.5 text-[10px] uppercase tracking-[0.22em]
            text-[#7A2267]/75 font-semibold`}>
            {member.role}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AboutContent({ aboutData = {} }) {
  const chairman = {
    name:         aboutData.chairmanName         || "Md. Abdur Rahman Dhali",
    title:        aboutData.chairmanTitle         || "Chairman",
    organization: aboutData.chairmanOrganization  || "Dhali's Amber Nivaas Resort",
    image:        aboutData.chairmanImage         || "",
    quote:        aboutData.chairmanQuote         || "",
    para1:        aboutData.chairmanMessagePara1  || "",
    para2:        aboutData.chairmanMessagePara2  || "",
  };
  const executives = (aboutData.executives ?? []).filter((m) => m?.name || m?.image);

  const heroRef      = useRef(null);
  const heroImgRef   = useRef(null);
  const closingRef   = useRef(null);
  const flowRef      = useRef(null);
  const spineFillRef = useRef(null);
  const chairmanRef  = useRef(null);
  const execRef      = useRef(null);

  const chairmanInView = useInView(chairmanRef, { once: true, margin: "-80px" });
  const execInView     = useInView(execRef,     { once: true, margin: "-80px" });
  const closingInView  = useInView(closingRef,  { once: true, margin: "-80px" });

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

  // Journey flow — the spine draws itself on scrub, each node latches in as it arrives
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Spine fill tracks scroll position through the flow
    gsap.fromTo(spineFillRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: flowRef.current,
          start: "top 65%",
          end:   "bottom 80%",
          scrub: 0.6,
        },
      });

    gsap.utils.toArray(".flow-node", flowRef.current).forEach((node) => {
      const dot       = node.querySelector(".flow-dot");
      const connector = node.querySelector(".flow-connector");
      const card      = node.querySelector(".flow-card");
      const img       = node.querySelector(".flow-img");
      const fromX     = node.dataset.side === "right" ? 34 : -34;

      gsap.timeline({
        scrollTrigger: { trigger: node, start: "top 82%", toggleActions: "play none none none" },
      })
        .fromTo(dot,       { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.2)" })
        .fromTo(connector, { scaleX: 0 },            { scaleX: 1, duration: 0.45, ease: "power2.out" }, "-=0.22")
        .fromTo(card,      { opacity: 0, y: 42, x: fromX },
                           { opacity: 1, y: 0, x: 0, duration: 0.95, ease: "power3.out" }, "-=0.28");

      // Slow drift inside each frame as the node passes through the viewport
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5,
        ease: "none",
        scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }, { scope: flowRef });

  return (
    <>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] overflow-hidden">

        {/* Parallax image */}
        <div ref={heroImgRef} className="absolute inset-0 scale-110 will-change-transform">
          <Image
            src={ABOUT_MIDDLE_URL}
            alt="Dhali's Amber Nivaas"
            fill sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0905]/60 via-[#0d0905]/25 to-[#0d0905]/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-7`}
          >
            Dhali&apos;s Amber Nivaas
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.4, ease: EASE }}
            className={`${lora.className} text-[2.8rem] sm:text-[3.8rem] lg:text-[5.2rem]
              text-white font-400 leading-[1.08] max-w-4xl`}
          >
            A Place Where{" "}
            <em className={`${lora.className} italic`}>Nature Speaks</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.75 }}
            className={`${josefin.className} text-[13px] font-light text-white/50 mt-7 max-w-sm leading-relaxed`}
          >
            A halal-certified luxury retreat, surrounded by the natural beauty of Bangladesh.
          </motion.p>
        </div>


      </section>

      {/* ── CHAIRMAN MESSAGE ─────────────────────────────────────────────
          Editorial split: a large portrait held against the message. No
          overflow-hidden here — it would break the sticky portrait on desktop.
      ──────────────────────────────────────────────────────────────────── */}
      <section ref={chairmanRef} className="relative bg-white py-24 md:py-32">

        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 45% at 8% 40%, rgba(122,34,103,0.05) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid lg:grid-cols-[1.02fr_1fr] gap-12 lg:gap-20 xl:gap-24 items-start">

            {/* Portrait */}
            <motion.div
              initial={{ opacity: 0, y: 34 }}
              animate={chairmanInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.0, ease: EASE }}
              className="lg:sticky lg:top-24"
            >
              <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[min(74vh,760px)]
                rounded-[26px] overflow-hidden bg-[#f0e7e0]
                shadow-[0_40px_80px_-40px_rgba(26,19,9,0.45)]">
                <Portrait
                  src={chairman.image}
                  name={chairman.name}
                  monogramClass="text-[6rem] italic"
                />

                {/* Identity plate */}
                <div className="absolute inset-x-0 bottom-0 pt-24 pb-7 px-7
                  bg-gradient-to-t from-[#120c07] via-[#120c07]/70 to-transparent">
                  <p className={`${lora.className} text-[1.55rem] sm:text-[1.8rem] text-white font-400 leading-tight`}>
                    {chairman.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="h-px w-6 bg-[#7A2267]" />
                    <p className={`${josefin.className} text-[10px] uppercase tracking-[0.26em] text-white/85 font-semibold`}>
                      {chairman.title}
                    </p>
                  </div>
                  <p className={`${josefin.className} mt-2 text-[11px] font-light text-white/45 tracking-wide`}>
                    {chairman.organization}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={chairmanInView ? "show" : "hidden"}
              className="flex flex-col gap-8 lg:pt-6"
            >
              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60`}>
                Message from the Chairman
              </motion.p>

              {chairman.quote && (
                <motion.blockquote variants={fadeUp}
                  className="border-l border-[#7A2267]/25 pl-6 sm:pl-7">
                  <p className={`${lora.className} text-[1.4rem] sm:text-[1.7rem] lg:text-[1.9rem]
                    font-400 text-[#1a1309] leading-[1.45] tracking-[-0.015em]`}>
                    {chairman.quote}
                  </p>
                </motion.blockquote>
              )}

              {chairman.para1 && (
                <motion.p variants={fadeUp}
                  className={`${josefin.className} text-[13.5px] font-light text-[#5a4e42] leading-[1.95]`}>
                  {chairman.para1}
                </motion.p>
              )}

              {chairman.para2 && (
                <motion.p variants={fadeUp}
                  className={`${josefin.className} text-[13px] font-light text-[#7a6a52] leading-[1.9]`}>
                  {chairman.para2}
                </motion.p>
              )}

              <motion.div variants={fadeUp} className="h-px w-16 bg-gradient-to-r from-[#7A2267]/40 to-transparent" />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── EXECUTIVE PANEL ──────────────────────────────────────────────
          Admin-managed via Admin → About. Renders nothing when the list is
          empty so the page never shows a bare heading over an empty grid.
      ──────────────────────────────────────────────────────────────────── */}
      {executives.length > 0 && (
        <section ref={execRef} className="relative bg-[#f9f6f2] overflow-hidden py-24 md:py-32">

          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(122,34,103,0.045) 0%, transparent 70%)" }} />

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">

            {/* Heading */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={execInView ? "show" : "hidden"}
              className="max-w-2xl mb-14 md:mb-18"
            >
              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-4`}>
                Leadership
              </motion.p>
              <motion.h2 variants={fadeUp}
                className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                  font-400 text-[#1a1309] leading-[1.12] tracking-[-0.015em]`}>
                The people behind{" "}
                <em className={`${lora.className} italic text-[#7A2267]`}>the promise</em>
              </motion.h2>
              <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mt-6" />
            </motion.div>

            {/* Grid */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={execInView ? "show" : "hidden"}
              className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-7 sm:gap-y-12"
            >
              {executives.map((m, i) => (
                <ExecutiveCard key={`${m.name}-${i}`} member={m} />
              ))}
            </motion.div>

          </div>
        </section>
      )}

      {/* ── JOURNEY FLOW ─────────────────────────────────────────────────
          Flow-chart of the four milestones. A centre spine draws itself on
          scroll (scrub), and each node latches in as it reaches the viewport.
          contentVisibility is forced on so the browser measures the full
          section height up front — the global `content-visibility: auto` rule
          would otherwise feed ScrollTrigger a stale height and desync the spine.
      ──────────────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1a1309] overflow-hidden py-24 md:py-32"
        style={{ contentVisibility: "visible" }}>

        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(122,34,103,0.12) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-14">

          {/* Heading */}
          <div className="text-center mb-20 md:mb-24">
            <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-4`}>
              Our Journey
            </p>
            <h2 className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
              font-400 text-white leading-[1.12] tracking-[-0.01em]`}>
              How it{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>unfolded</em>
            </h2>
            <div className="h-px w-14 bg-[#7A2267]/30 mx-auto mt-6" />
          </div>

          {/* Flow */}
          <div ref={flowRef} className="relative">

            {/* Spine — track + scroll-driven fill */}
            <div className="absolute top-0 bottom-0 w-px bg-white/[0.07] left-[7px] md:left-1/2 md:-translate-x-1/2" />
            <div ref={spineFillRef}
              className="absolute top-0 bottom-0 w-px origin-top left-[7px] md:left-1/2 md:-translate-x-1/2
                bg-gradient-to-b from-[#7A2267] to-[#7A2267]/30" />

            {/* Start cap */}
            <div className="absolute -top-1 left-[7px] md:left-1/2 -translate-x-1/2 w-2 h-2 rounded-full
              bg-[#7A2267]/50 ring-4 ring-[#7A2267]/10" />

            {milestones.map((m, i) => {
              const right = i % 2 === 1;
              return (
                <div
                  key={m.step}
                  data-side={right ? "right" : "left"}
                  className={`flow-node relative pl-11 md:pl-0 md:grid md:grid-cols-2 md:gap-16
                    ${i === milestones.length - 1 ? "" : "mb-14 md:mb-20"}`}
                >
                  {/* Node dot on the spine */}
                  <div className="flow-dot absolute z-10 top-9 w-[15px] h-[15px] rounded-full
                    left-[7px] md:left-1/2 -translate-x-1/2 -translate-y-1/2
                    bg-[#1a1309] border border-[#7A2267] flex items-center justify-center">
                    <div className="w-[5px] h-[5px] rounded-full bg-[#7A2267]
                      shadow-[0_0_0_4px_rgba(122,34,103,0.15)]" />
                  </div>

                  {/* Elbow connector, spine → card */}
                  <div className={`flow-connector absolute top-9 h-px bg-gradient-to-r from-[#7A2267]/50 to-[#7A2267]/10
                    left-[7px] w-[30px] origin-left
                    ${right ? "md:left-1/2 md:w-8" : "md:left-auto md:right-1/2 md:w-8 md:origin-right"}`} />

                  {/* Card */}
                  <div className={`flow-card group relative rounded-2xl overflow-hidden
                    border border-white/[0.07] bg-white/[0.02]
                    shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]
                    hover:border-[#7A2267]/25 transition-colors duration-500
                    ${right ? "md:col-start-2" : "md:col-start-1"}`}>

                    {/* Frame */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <div className="flow-img absolute inset-0 scale-[1.14] will-change-transform">
                        <Image
                          src={m.image}
                          alt={m.alt}
                          fill sizes="(max-width:768px) 88vw, 40vw"
                          className="object-cover transition-transform duration-[900ms] ease-out
                            group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309] via-[#1a1309]/25 to-transparent" />
                      <span className={`${lora.className} absolute bottom-4 left-6 text-[2.1rem] sm:text-[2.4rem]
                        leading-none text-white font-400 tracking-tight`}>
                        {m.year}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-6 sm:p-7">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`${josefin.className} text-[9.5px] font-semibold tracking-[0.3em] text-[#7A2267]`}>
                          {m.step}
                        </span>
                        <span className="h-px w-5 bg-[#7A2267]/30" />
                        <h3 className={`${lora.className} text-[1.15rem] sm:text-[1.3rem] text-white font-400 leading-snug`}>
                          {m.title}
                        </h3>
                      </div>
                      <p className={`${josefin.className} text-[12.5px] font-light text-white/45 leading-[1.9]`}>
                        {m.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Terminal arrowhead */}
            <div className="absolute -bottom-3 left-[7px] md:left-1/2 -translate-x-1/2 text-[#7A2267]/40">
              <svg viewBox="0 0 12 8" width="11" height="8" fill="none">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* ── CLOSING ──────────────────────────────────────────────────────── */}
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
            &ldquo;We don&apos;t just offer rooms — we offer a feeling. The feeling of being truly away,
            truly cared for, and truly at home in nature.&rdquo;
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
            <Link href="/booking"
              className={`${josefin.className} inline-flex items-center gap-3
                px-8 py-4 rounded-full bg-[#7A2267] text-white
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:bg-[#8a256f] transition-all duration-300 group
                shadow-[0_4px_22px_rgba(122,34,103,0.28)]
                hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]`}>
              Reserve Your Stay
              <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                className="group-hover:translate-x-1 transition-transform duration-300">
                <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/contact"
              className={`${josefin.className} inline-flex items-center
                px-8 py-4 rounded-full border border-[#1a1309]/20 text-[#1a1309]
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:border-[#7A2267] hover:text-[#7A2267] transition-all duration-300`}>
              Get in Touch
            </Link>
          </motion.div>

        </div>
      </section>

    </>
  );
}
