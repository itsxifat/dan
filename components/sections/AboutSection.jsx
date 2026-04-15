"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Lora, Josefin_Sans } from "next/font/google";

gsap.registerPlugin(ScrollTrigger);

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};

const features = [
  { title: "Peaceful Surroundings", desc: "Far from city noise, wrapped in nature's calm and fresh air." },
  { title: "Halal Certified",        desc: "Every meal is 100% halal — a promise we keep without compromise." },
  { title: "Premium Accommodation",  desc: "Thoughtfully appointed suites crafted for rest and comfort." },
  { title: "Curated Experiences",    desc: "Nature walks, recreation, and local discoveries tailored for you." },
];

function FeatureItem({ title, desc }) {
  return (
    <motion.div variants={fadeUp} className="space-y-1.5">
      <p className={`${josefin.className} text-[12.5px] font-semibold text-[#1a1309] leading-snug`}>
        {title}
      </p>
      <p className={`${josefin.className} text-[11.5px] font-light text-[#7a6a52] leading-relaxed hidden sm:block`}>
        {desc}
      </p>
    </motion.div>
  );
}

export default function AboutSection() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px -60px 0px" });

  const imgMobile = useRef(null);
  const imgLeft   = useRef(null);
  const imgCenter = useRef(null);
  const imgRight  = useRef(null);

  useGSAP(() => {
    const triggerOpts = (el) => ({
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });

    const shared = { immediateRender: false, ease: "power3.out" };

    gsap.fromTo(imgMobile.current,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1.0, ...shared, ...triggerOpts(imgMobile.current) }
    );
    gsap.fromTo(imgLeft.current,
      { opacity: 0, x: -28 },
      { opacity: 1, x: 0, duration: 1.0, ...shared, ...triggerOpts(imgLeft.current) }
    );
    gsap.fromTo(imgCenter.current,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1.1, ...shared, ...triggerOpts(imgCenter.current) }
    );
    gsap.fromTo(imgRight.current,
      { opacity: 0, x: 28 },
      { opacity: 1, x: 0, duration: 1.0, ...shared, ...triggerOpts(imgRight.current) }
    );

    const cleanups = [];
    [imgLeft, imgCenter, imgRight, imgMobile].forEach((r) => {
      const el = r.current;
      if (!el) return;
      const onEnter = () => gsap.to(el, { y: -6, scale: 1.02, duration: 0.4, ease: "power2.out" });
      const onLeave = () => gsap.to(el, { y: 0,  scale: 1,    duration: 0.45, ease: "power2.inOut" });
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, { scope: ref });

  return (
    <section ref={ref} className="relative bg-[#f8f4ee] overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-20 md:pt-28 pb-12 md:pb-16 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex flex-col items-center gap-4"
        >
          <motion.h2 variants={fadeUp}
            className={`${lora.className} text-[2.4rem] sm:text-[3rem] lg:text-[3.6rem]
              font-400 text-[#1a1309] leading-[1.1] tracking-[-0.02em] max-w-2xl`}>
            Where Nature Becomes{" "}
            <em className={`${lora.className} italic text-[#7A2267] font-500`}>Your Retreat</em>
          </motion.h2>

          <motion.p variants={fadeUp}
            className={`${josefin.className} text-[13px] font-light text-[#9b8e78] max-w-sm leading-relaxed`}>
            A halal-friendly haven where every detail is an act of care.
          </motion.p>
        </motion.div>
      </div>

      {/* ── IMAGE TRIPTYCH ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Mobile: single hero image */}
        <div ref={imgMobile} className="sm:hidden relative rounded-2xl overflow-hidden h-72 will-change-transform">
          <Image
            src="/section/about/middle.png"
            alt="Resort exterior"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/60 via-transparent to-transparent" />
          <div className="absolute bottom-5 inset-x-0 text-center">
            <p className={`${lora.className} text-[1rem] italic text-white/80`}>
              &ldquo;A haven of serenity&rdquo;
            </p>
          </div>
        </div>

        {/* SM+: Full triptych */}
        <div className="hidden sm:flex items-end gap-3 sm:gap-4 h-90 lg:h-115">

          {/* Left — shorter, bottom-aligned */}
          <div ref={imgLeft} className="relative flex-1 h-4/5 rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform">
            <Image
              src="/section/about/left.png"
              alt="Resort accommodation"
              fill
              sizes="(max-width: 1024px) 33vw, 28vw"
              className="object-cover will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/55 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className={`${josefin.className} text-[9px] uppercase tracking-widest text-white/70`}>Accommodation</p>
            </div>
          </div>

          {/* Center — full height */}
          <div ref={imgCenter} className="relative flex-[1.2] h-full rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform">
            <Image
              src="/section/about/middle.png"
              alt="Resort exterior"
              fill
              sizes="(max-width: 1024px) 40vw, 34vw"
              className="object-cover will-change-transform"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/40 via-transparent to-transparent" />
            <div className="absolute bottom-5 inset-x-0 text-center">
              <p className={`${lora.className} text-[1.05rem] italic text-white/80`}>
                &ldquo;A haven of serenity&rdquo;
              </p>
            </div>
          </div>

          {/* Right — shorter, bottom-aligned */}
          <div ref={imgRight} className="relative flex-1 h-4/5 rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform">
            <Image
              src="/section/about/right.png"
              alt="Resort recreation"
              fill
              sizes="(max-width: 1024px) 33vw, 28vw"
              className="object-cover will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/55 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className={`${josefin.className} text-[9px] uppercase tracking-widest text-white/70`}>Recreation</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── STORY + FEATURES ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 md:py-18">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">

          {/* Left — Quote + body + CTA */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            className="space-y-6"
          >
            <motion.blockquote variants={fadeUp}
              className={`${lora.className} text-[1.4rem] sm:text-[1.6rem] lg:text-[1.75rem]
                italic text-[#1a1309] leading-[1.45] font-400`}>
              &ldquo;Where nature&apos;s stillness meets heartfelt service.&rdquo;
            </motion.blockquote>

            <motion.div variants={fadeUp} className="h-px bg-gradient-to-r from-[#7A2267]/30 to-transparent" />

            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[13px] font-light text-[#6b5e4a] leading-[1.9]`}>
              Nestled in serene landscapes, Dhali&apos;s Amber Nivaas is a proudly halal-certified resort —
              where every meal and every experience reflects our commitment to inclusivity and care.
            </motion.p>

            <motion.div variants={fadeUp} className="pt-1">
              <a href="/accommodation"
                className={`${josefin.className} group inline-flex items-center gap-2
                  text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7A2267]
                  border-b border-[#7A2267]/40 pb-0.5
                  hover:border-[#7A2267] hover:gap-3 transition-all duration-300`}>
                Explore Rooms
                <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                  className="group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Features */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-8 sm:gap-y-8 lg:pt-2"
          >
            {features.map((f) => (
              <FeatureItem key={f.title} title={f.title} desc={f.desc} />
            ))}
          </motion.div>

        </div>
      </div>

    </section>
  );
}
