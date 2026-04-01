"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lora, Josefin_Sans, Raleway } from "next/font/google";

gsap.registerPlugin(ScrollTrigger);

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });
const raleway = Raleway({ subsets: ["latin"], weight: ["300", "400", "500"] });

const features = [
  {
    num: "01",
    title: "Nature Immersed",
    desc: "Pristine greenery surrounds you — the sounds of the wild fill every waking moment.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <path d="M14 3C9 3 5 8 5 13c0 3.5 2 6.5 5 8.5V24h8v-2.5c3-2 5-5 5-8.5 0-5-4-10-9-10z"
          stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M14 13v6M11 15.5c1-1 2-2 3-2.5M17 15.5c-1-1-2-2-3-2.5"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Perfect Serenity",
    desc: "Complete peace, designed for rest and renewal — far from the noise of the world.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <circle cx="14" cy="14" r="5.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M14 3v3M14 22v3M3 14h3M22 14h3M6.2 6.2l2.1 2.1M19.7 19.7l2.1 2.1M6.2 21.8l2.1-2.1M19.7 8.3l2.1-2.1"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "Premium Comfort",
    desc: "Thoughtfully appointed rooms with quality amenities for a truly indulgent stay.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <rect x="3" y="13" width="22" height="9" rx="2" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M7 13v-2a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 21 11v2"
          stroke="currentColor" strokeWidth="1.25"/>
        <path d="M3 22v2M25 22v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="10" cy="16.5" r="1.1" fill="currentColor"/>
        <circle cx="18" cy="16.5" r="1.1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    num: "04",
    title: "Halal Dining",
    desc: "100% halal-certified cuisine, fresh and flavorful — prepared with love and care.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <path d="M9 4v7a3 3 0 0 0 3 3v9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M19 4c0 0 0 7-3 9v9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M6 18h16" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M7 4v4M11 4v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "05",
    title: "Personal Service",
    desc: "A dedicated team ensuring every need is met before you even have to ask.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <circle cx="14" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 25c0-5 4-8.5 9-8.5s9 3.5 9 8.5"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "06",
    title: "Lasting Memories",
    desc: "Curated experiences that stay with you long after you check out.",
    icon: (
      <svg viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden>
        <path d="M14 4l2.5 6.5 6.5 1-4.8 4.5 1.3 6.5L14 19l-5.5 3 1.3-6.5L5 11.5l6.5-1z"
          stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ── Card ──────────────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);

  useGSAP(() => {
    const card = cardRef.current;
    const h    = card.querySelector(".corner-h");
    const v    = card.querySelector(".corner-v");
    const mm   = gsap.matchMedia();

    // Mobile: alternate left/right slide-in on scroll
    mm.add("(max-width: 767px)", () => {
      const fromX = index % 2 === 0 ? -40 : 40;
      gsap.from(card, {
        opacity: 0, x: fromX, duration: 0.75, ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 92%",
          toggleActions: "play none none none",
        },
      });
    });

    // Desktop: fade up on scroll + hover corner draw
    mm.add("(min-width: 768px)", () => {
      gsap.from(card, {
        opacity: 0, y: 45, duration: 0.85, ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // Corner hover
      gsap.set(h, { scaleX: 0 });
      gsap.set(v, { scaleY: 0 });

      let enterTimer  = null;   // debounce quick pass-throughs
      let idleTimer   = null;   // auto-fade-out after mouse goes idle
      let hovered     = false;

      const fadeOut = () => {
        hovered = false;
        gsap.killTweensOf([h, v]);
        gsap.to(h, { scaleX: 0, duration: 0.32, ease: "power2.in" });
        gsap.to(v, { scaleY: 0, duration: 0.32, ease: "power2.in" });
      };

      const resetIdle = () => {
        clearTimeout(idleTimer);
        if (hovered) idleTimer = setTimeout(fadeOut, 1500);
      };

      const onEnter = () => {
        clearTimeout(enterTimer);
        clearTimeout(idleTimer);
        // Only commit to the animation if mouse actually stays ≥ 80ms
        enterTimer = setTimeout(() => {
          hovered = true;
          gsap.killTweensOf([h, v]);
          gsap.to(h, { scaleX: 1, duration: 0.38, ease: "power2.out" });
          gsap.to(v, { scaleY: 1, duration: 0.38, ease: "power2.out", delay: 0.04 });
          idleTimer = setTimeout(fadeOut, 1500);
        }, 80);
      };

      const onLeave = () => {
        clearTimeout(enterTimer);
        clearTimeout(idleTimer);
        fadeOut();
      };

      const onMove = () => resetIdle();

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      card.addEventListener("mousemove",  onMove);
      return () => {
        clearTimeout(enterTimer);
        clearTimeout(idleTimer);
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
        card.removeEventListener("mousemove",  onMove);
      };
    });
  });

  return (
    <div
      ref={cardRef}
      className="exp-card group relative p-5 sm:p-6 lg:p-7
        border border-white/[0.07] rounded-xl sm:rounded-2xl overflow-hidden cursor-default
        hover:border-[#7A2267]/25 hover:bg-white/2 transition-colors duration-500"
    >
      {/* L-bracket corner — hover on desktop, scrub on mobile */}
      <div className="corner-h absolute top-0 left-0 w-8 h-px bg-[#7A2267] origin-left"
        style={{ transform: "scaleX(0)" }} />
      <div className="corner-v absolute top-0 left-0 h-8 w-px bg-[#7A2267] origin-top"
        style={{ transform: "scaleY(0)" }} />

      {/* Number */}
      <p className={`${josefin.className} text-[9px] tracking-[0.35em] text-[#7A2267]/30
        font-light mb-3 sm:mb-4`}>
        {feature.num}
      </p>

      {/* Icon */}
      <div className="text-[#7A2267]/50 group-hover:text-[#9d3a8a] transition-colors duration-500 mb-3 sm:mb-4">
        {feature.icon}
      </div>

      {/* Title */}
      <h3 className={`${josefin.className} text-[10px] sm:text-[11px] lg:text-[11.5px] font-semibold
        text-white group-hover:text-white/90 tracking-[0.14em] uppercase mb-2 sm:mb-3
        transition-colors duration-300`}>
        {feature.title}
      </h3>

      {/* Desc */}
      <p className={`${raleway.className} text-[11px] sm:text-[12px] lg:text-[12.5px]
        font-light text-white/35 group-hover:text-white/55 leading-[1.75] sm:leading-[1.85]
        line-clamp-3 sm:line-clamp-none transition-colors duration-500`}>
        {feature.desc}
      </p>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function ExperienceSection() {
  const ref     = useRef(null);
  const gridRef = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  // Mobile only: corner sweep scrubbed to scroll position (floats with finger)
  useGSAP(() => {
    const cards = gridRef.current?.querySelectorAll(".exp-card");
    if (!cards?.length) return;

    const mm = gsap.matchMedia();

    mm.add("(max-width: 767px)", () => {
      gsap.set(gridRef.current.querySelectorAll(".corner-h"), { scaleX: 0 });
      gsap.set(gridRef.current.querySelectorAll(".corner-v"), { scaleY: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
          end: "bottom 30%",
          scrub: 1.8,   // smooth lag — feels like it floats with scroll
        },
      });

      // Sweep top-left → bottom-right: card 0,1 → 2,3 → 4,5
      cards.forEach((card, i) => {
        const h = card.querySelector(".corner-h");
        const v = card.querySelector(".corner-v");
        const t = i * 0.14;
        tl.to(h, { scaleX: 1, duration: 0.4, ease: "none" }, t)
          .to(v, { scaleY: 1, duration: 0.4, ease: "none" }, t + 0.05);
      });
    });
  }, { scope: gridRef });

  return (
    <section ref={ref} className="relative bg-[#1a1309] overflow-hidden py-20 md:py-28 lg:py-32">

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(122,34,103,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16 lg:mb-20"
        >
          <h2 className={`${lora.className} text-[2rem] sm:text-[2.7rem] lg:text-[3.2rem]
            font-400 text-white leading-[1.18] tracking-[-0.01em]`}>
            What Makes Us{" "}
            <em className="italic text-[#c084b8]">Unlike Any Other</em>
          </h2>

          <p className={`${raleway.className} mt-4 text-[12.5px] sm:text-[13px] font-light text-white/35
            max-w-xs sm:max-w-sm mx-auto leading-relaxed tracking-wide`}>
            Every detail, curated for those who expect nothing less than excellence.
          </p>
        </motion.div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
        >
          {features.map((feature, i) => (
            <FeatureCard key={feature.num} feature={feature} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
