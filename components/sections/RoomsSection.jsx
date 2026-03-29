"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lora, Josefin_Sans } from "next/font/google";

gsap.registerPlugin(ScrollTrigger);

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

const PLACEHOLDER_PROPERTIES = [
  {
    _id: "placeholder-1",
    name: "The Garden Villa",
    slug: "garden-villa",
    type: "cottage",
    tagline: "Surrounded by tropical greenery and birdsong.",
    coverImage:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "placeholder-2",
    name: "Amber View Suite",
    slug: "amber-view-suite",
    type: "building",
    tagline: "Panoramic nature views from a luxury suite.",
    coverImage:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=800&q=80",
  },
  {
    _id: "placeholder-3",
    name: "Forest Bungalow",
    slug: "forest-bungalow",
    type: "cottage",
    tagline: "Wake up to forest sounds in this private woodland escape.",
    coverImage:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  },
];

// ── Single card ───────────────────────────────────────────────────────────────
function PropertyCard({ property }) {
  const cardRef    = useRef(null);
  const imgRef     = useRef(null);
  const overlayRef = useRef(null);
  const slideRef   = useRef(null);

  const imgSrc    = property.coverImage || FALLBACK_IMAGE;
  const isCottage = property.type === "cottage";
  const tagline   = property.tagline || "";

  useGSAP(() => {
    const card    = cardRef.current;
    const img     = imgRef.current;
    const overlay = overlayRef.current;
    const slide   = slideRef.current;

    const mm = gsap.matchMedia();

    // ── Desktop / pointer devices: hide slide, reveal on hover ──
    mm.add("(hover: hover)", () => {
      // set hidden state via GSAP (no inline style needed)
      gsap.set(slide, { y: 18, opacity: 0 });

      const onEnter = () => {
        gsap.to(img,     { scale: 1.08, duration: 0.7,  ease: "power2.out" });
        gsap.to(overlay, { opacity: 1,  duration: 0.35, ease: "power2.out" });
        gsap.to(slide,   { y: 0, opacity: 1, duration: 0.42, ease: "power3.out" });
      };
      const onLeave = () => {
        gsap.to(img,     { scale: 1,   duration: 0.6,  ease: "power2.inOut" });
        gsap.to(overlay, { opacity: 0, duration: 0.35, ease: "power2.inOut" });
        gsap.to(slide,   { y: 18, opacity: 0, duration: 0.32, ease: "power2.in" });
      };

      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      return () => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
      };
    });

    // ── Touch devices: always show tagline ──
    mm.add("(hover: none)", () => {
      gsap.set(slide, { y: 0, opacity: 1 });
    });
  });

  return (
    <Link
      ref={cardRef}
      href={`/accommodation/${property.slug}`}
      className="property-card relative block rounded-2xl overflow-hidden cursor-pointer
        aspect-[3/4] w-[78vw] sm:w-[72vw] md:w-auto flex-shrink-0 snap-start"
    >
      {/* Image */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={property.name}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0905]/90 via-[#0d0905]/30 to-transparent" />

      {/* Hover darkening */}
      <div ref={overlayRef} className="absolute inset-0 bg-[#0d0905]/25 opacity-0 pointer-events-none" />

      {/* Cottage badge */}
      {isCottage && (
        <div className="absolute top-4 left-4">
          <span className={`${josefin.className} text-[9px] uppercase tracking-[0.2em] font-semibold
            px-3 py-1.5 rounded-full backdrop-blur-md bg-white/12 text-white border border-white/20`}>
            Cottage
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col gap-2">
        {/* Name — always visible */}
        <h3 className={`${lora.className} text-[1.25rem] sm:text-[1.35rem] font-500 text-white leading-snug`}>
          {property.name}
        </h3>

        {/* Tagline + CTA — hidden on desktop until hover, always shown on touch */}
        <div ref={slideRef} className="flex flex-col gap-2.5 will-change-transform">
          {tagline && (
            <p className={`${lora.className} text-[12.5px] italic text-white/65 leading-snug`}>
              {tagline}
            </p>
          )}
          <span className={`${josefin.className} inline-flex items-center gap-2 text-[10px]
            uppercase tracking-[0.22em] font-semibold text-[#c084b8]`}>
            Explore
            <svg viewBox="0 0 16 10" width="10" height="10" fill="none">
              <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export default function RoomsSection({ properties }) {
  const sectionRef = useRef(null);
  const cardsRef   = useRef(null);
  const isInView   = useInView(sectionRef, { once: true, margin: "-60px" });

  const displayProperties =
    Array.isArray(properties) && properties.length > 0
      ? properties
      : PLACEHOLDER_PROPERTIES;

  useGSAP(() => {
    const cards = cardsRef.current?.querySelectorAll(".property-card");
    if (!cards?.length) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      gsap.from(cards, {
        opacity: 0, y: 65, duration: 1, ease: "power3.out", stagger: 0.14,
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 82%",
          toggleActions: "play none none none",
        },
      });
    });

    mm.add("(max-width: 767px)", () => {
      cards.forEach((card) => {
        gsap.from(card, {
          opacity: 0, y: 40, duration: 0.8, ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            toggleActions: "play none none none",
          },
        });
      });
    });
  });

  return (
    <section ref={sectionRef} className="relative bg-white overflow-hidden py-20 md:py-28 lg:py-32">

      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(122,34,103,0.05) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Header */}
        <div className="px-5 sm:px-8 lg:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`${lora.className} text-center text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-[#1a1309] leading-[1.15] mb-4`}
          >
            Choose Your{" "}
            <em className={`${lora.className} not-italic text-[#7A2267]`}>Perfect Escape</em>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`${josefin.className} text-center text-[13.5px] font-light text-[#7a6a52]
              max-w-xl mx-auto mb-12 leading-[1.85]`}
          >
            From private cottages nestled in greenery to suite-style rooms with sweeping views —
            each stay is crafted for comfort, elegance, and lasting memories.
          </motion.p>
        </div>

        {/* Cards — horizontal scroll on mobile, grid on md+ */}
        <div
          ref={cardsRef}
          className="
            flex md:grid md:grid-cols-2 lg:grid-cols-3
            gap-4 sm:gap-5 md:gap-6
            overflow-x-auto md:overflow-visible
            pl-4 sm:pl-8 lg:pl-12
            pr-4 sm:pr-8 lg:pr-12
            pb-3 md:pb-0
            snap-x snap-mandatory md:snap-none scroll-pl-4 sm:scroll-pl-8
          "
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Left-edge spacer so first card isn't flush to screen edge */}
          <div className="md:hidden w-0.5 flex-shrink-0" aria-hidden />

          {displayProperties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}

          {/* Right-edge spacer so last card isn't flush to screen edge */}
          <div className="md:hidden w-0.5 flex-shrink-0" aria-hidden />
        </div>

        {/* Swipe hint dots — mobile only */}
        <div className="flex md:hidden justify-center gap-1.5 mt-5 px-5">
          {displayProperties.map((p, i) => (
            <div
              key={p._id}
              className={`rounded-full transition-all duration-300 ${
                i === 0
                  ? "w-5 h-1.5 bg-[#7A2267]"
                  : "w-1.5 h-1.5 bg-[#7A2267]/25"
              }`}
            />
          ))}
        </div>

        {/* View All */}
        <div className="px-5 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mt-10 md:mt-12"
          >
            <Link
              href="/accommodation"
              className={`${josefin.className} inline-flex items-center gap-3
                px-8 py-3.5 rounded-full
                border border-[#1a1309]/20 text-[#1a1309] text-[12px] font-semibold uppercase tracking-[0.18em]
                hover:bg-[#1a1309] hover:text-white hover:border-[#1a1309] transition-all duration-300 group`}
            >
              View All Accommodation
              <svg viewBox="0 0 16 10" width="13" height="13" fill="none"
                className="group-hover:translate-x-1 transition-transform duration-300">
                <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
