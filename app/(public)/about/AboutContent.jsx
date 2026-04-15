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

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.13, delayChildren: 0.04 } },
};

const pillars = [
  {
    title: "Halal Certified",
    desc:  "Every meal served is 100% halal — a promise we keep without exception or compromise.",
    icon: (
      <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    title: "Harmony with Nature",
    desc:  "Every structure is designed to complement, not overpower, the natural landscape surrounding it.",
    icon: (
      <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 21V9M11 9C11 4 6 2 2 3c1 4 4 6 9 6z" />
        <path d="M11 9c0-5 5-7 9-6-1 4-4 6-9 6z" />
        <path d="M3 21h16" />
      </svg>
    ),
  },
  {
    title: "Heartfelt Hospitality",
    desc:  "Warm, attentive care where every guest is welcomed like family from the moment they arrive.",
    icon: (
      <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L11 6.67l-2.06-2.06a5.5 5.5 0 0 0-7.78 7.78l2.06 2.06L11 21.23l7.78-7.78 2.06-2.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: "Community & Heritage",
    desc:  "We celebrate local culture, employ from the community, and honour the heritage of the land.",
    icon: (
      <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AboutContent() {
  const heroRef    = useRef(null);
  const heroImgRef = useRef(null);
  const storyRef   = useRef(null);
  const imgLeftRef = useRef(null);
  const imgMidRef  = useRef(null);
  const imgRtRef   = useRef(null);
  const pillarsRef = useRef(null);
  const closingRef = useRef(null);

  const storyInView   = useInView(storyRef,   { once: true, margin: "-80px" });
  const pillarsInView = useInView(pillarsRef, { once: true, margin: "-80px" });
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

  // Story images reveal
  useGSAP(() => {
    const shared = { ease: "power3.out", immediateRender: false };
    const trig   = (el) => ({ scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } });

    gsap.fromTo(imgLeftRef.current, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1.0, ...shared, ...trig(imgLeftRef.current) });
    gsap.fromTo(imgMidRef.current,  { opacity: 0, y:  30 }, { opacity: 1, y: 0, duration: 1.1, ...shared, ...trig(imgMidRef.current) });
    gsap.fromTo(imgRtRef.current,   { opacity: 0, x:  30 }, { opacity: 1, x: 0, duration: 1.0, ...shared, ...trig(imgRtRef.current) });
  }, { scope: storyRef });

  return (
    <>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] overflow-hidden">

        {/* Parallax image */}
        <div ref={heroImgRef} className="absolute inset-0 scale-110 will-change-transform">
          <Image
            src="/section/about/middle.png"
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

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <span className={`${josefin.className} text-[8px] uppercase tracking-[0.35em] text-white/25`}>Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/25 to-transparent" />
          </div>
        </motion.div>

      </section>

      {/* ── STORY ────────────────────────────────────────────────────────── */}
      <section ref={storyRef} className="relative bg-white overflow-hidden py-24 md:py-32">

        <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px]
          rounded-full bg-[#7A2267]/[0.03] blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 xl:gap-28 items-center">

            {/* Triptych */}
            <div className="flex items-end gap-3 h-[400px] sm:h-[480px] lg:h-[560px] order-2 lg:order-1">

              <div ref={imgLeftRef}
                className="relative flex-1 h-[78%] rounded-2xl overflow-hidden will-change-transform
                  shadow-[0_20px_50px_-12px_rgba(13,9,5,0.18)]">
                <Image src="/section/about/left.png" alt="Accommodation"
                  fill sizes="(max-width:1024px) 27vw, 20vw"
                  className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0905]/40 to-transparent" />
              </div>

              <div ref={imgMidRef}
                className="relative flex-[1.3] h-full rounded-2xl overflow-hidden will-change-transform
                  shadow-[0_24px_60px_-12px_rgba(13,9,5,0.22)]">
                <Image src="/section/about/middle.png" alt="Resort"
                  fill sizes="(max-width:1024px) 34vw, 26vw"
                  className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0905]/35 to-transparent" />
              </div>

              <div ref={imgRtRef}
                className="relative flex-1 h-[78%] rounded-2xl overflow-hidden will-change-transform
                  shadow-[0_20px_50px_-12px_rgba(13,9,5,0.18)]">
                <Image src="/section/about/right.png" alt="Recreation"
                  fill sizes="(max-width:1024px) 27vw, 20vw"
                  className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0905]/40 to-transparent" />
              </div>

            </div>

            {/* Text */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={storyInView ? "show" : "hidden"}
              className="flex flex-col gap-7 order-1 lg:order-2"
            >
              <motion.h2 variants={fadeUp}
                className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                  font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
                Nestled in nature,<br />
                <em className={`${lora.className} italic text-[#7A2267]`}>crafted for you.</em>
              </motion.h2>

              <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30" />

              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[13.5px] font-light text-[#5a4e42] leading-[1.95]`}>
                Dhali&apos;s Amber Nivaas is a proudly halal-certified luxury resort nestled in serene natural
                surroundings just outside Dhaka. Built by a family passionate about hospitality, every detail
                is crafted for guests who want to truly escape — where time slows, comfort is absolute, and
                nature surrounds you at every step.
              </motion.p>

              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[13px] font-light text-[#7a6a52] leading-[1.9]`}>
                From thoughtfully appointed rooms to expansive outdoor spaces — we believe real rest comes not
                from excess, but from harmony. Every meal is halal. Every space is intentional. Every guest
                is welcomed like family.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-1">
                <Link href="/accommodation"
                  className={`${josefin.className} inline-flex items-center gap-3
                    px-7 py-3.5 rounded-full bg-[#1a1309] text-white
                    text-[11px] font-semibold uppercase tracking-[0.18em]
                    hover:bg-[#7A2267] transition-all duration-300 group
                    shadow-[0_4px_16px_rgba(26,19,9,0.18)]`}>
                  Explore Rooms
                  <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                    className="group-hover:translate-x-1 transition-transform duration-300">
                    <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/booking"
                  className={`${josefin.className} inline-flex items-center
                    px-7 py-3.5 rounded-full border border-[#1a1309]/20 text-[#1a1309]
                    text-[11px] font-semibold uppercase tracking-[0.18em]
                    hover:border-[#7A2267] hover:text-[#7A2267] transition-all duration-300`}>
                  Book a Stay
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── PILLARS ───────────────────────────────────────────────────────── */}
      <section ref={pillarsRef} className="bg-[#1a1309] py-20 md:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={pillarsInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12"
          >
            {pillars.map((p) => (
              <motion.div key={p.title} variants={fadeUp} className="flex flex-col gap-5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08]
                  flex items-center justify-center text-[#7A2267]">
                  {p.icon}
                </div>
                <div>
                  <p className={`${lora.className} text-[1.05rem] font-500 text-white leading-snug mb-2.5`}>
                    {p.title}
                  </p>
                  <p className={`${josefin.className} text-[12px] font-light text-white/40 leading-[1.85]`}>
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
