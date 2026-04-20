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

const EASE   = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } } };
const stagger= { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };

function SectionLabel({ text, dark }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className={`h-px w-14 ${dark ? "bg-white/20" : "bg-[#7A2267]/30"}`} />
      <p className={`${josefin.className} text-[10px] uppercase tracking-[0.28em] font-semibold ${dark ? "text-white/40" : "text-[#7A2267]/70"}`}>
        {text}
      </p>
      <div className={`h-px w-14 ${dark ? "bg-white/20" : "bg-[#7A2267]/30"}`} />
    </div>
  );
}

function PropertyCard({ property }) {
  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/accommodation/${property.slug}`}
        className="group block rounded-2xl overflow-hidden bg-white border border-[#ede5d8]
          hover:border-[#7A2267]/40 hover:shadow-[0_16px_40px_-8px_rgba(122,34,103,0.12)]
          hover:-translate-y-1 transition-all duration-400"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden bg-[#f0ebe0]">
          {property.coverImage ? (
            <img
              src={property.coverImage}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#c9b8a0]">
              <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
                <path d="M6 42V21L24 6l18 15v21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <rect x="17" y="28" width="14" height="14" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/50 to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

          {/* Badges */}
          {property.isFeatured && (
            <div className={`${josefin.className} absolute top-3 left-3 text-[8.5px] uppercase
              tracking-[0.18em] font-semibold px-2.5 py-1 rounded-full
              bg-[#7A2267] text-white`}>
              Featured
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.18em] font-semibold
              px-2.5 py-1 rounded-full backdrop-blur-sm border
              ${property.type === "cottage"
                ? "bg-emerald-900/60 text-emerald-300 border-emerald-700/40"
                : "bg-[#1a1309]/60 text-white/70 border-white/20"
              }`}>
              {property.type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-px w-5 bg-[#7A2267]/30" />
            <p className={`${josefin.className} text-[9px] uppercase tracking-[0.2em] font-semibold text-[#7A2267]/60`}>
              {property.type === "building" ? "Building & Suites" : "Private Cottage"}
            </p>
          </div>

          <h3 className={`${lora.className} text-[1.1rem] text-[#1a1309] group-hover:text-[#7A2267]
            transition-colors duration-200 mb-1 leading-snug`}>
            {property.name}
          </h3>

          {property.tagline && (
            <p className={`${josefin.className} text-[12px] font-light text-[#7a6a52] mb-3 line-clamp-2 leading-relaxed`}>
              {property.tagline}
            </p>
          )}

          {property.location && (
            <p className={`${josefin.className} text-[11px] text-[#9b8e78] flex items-center gap-1.5 mb-3`}>
              <svg viewBox="0 0 12 16" width="9" height="11" fill="none">
                <path d="M6 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S1 9.5 1 6a5 5 0 0 1 5-5Z"
                  stroke="currentColor" strokeWidth="1.3" />
                <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              </svg>
              {property.location}
            </p>
          )}

          {/* Amenity chips */}
          {property.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {property.amenities.slice(0, 4).map((a) => (
                <span key={a} className={`${josefin.className} text-[9.5px] font-light
                  text-[#7A2267]/70 bg-[#7A2267]/5 border border-[#7A2267]/15 px-2.5 py-0.5 rounded-full`}>
                  {a}
                </span>
              ))}
              {property.amenities.length > 4 && (
                <span className={`${josefin.className} text-[9.5px] text-[#9b8e78]
                  bg-[#f0ebe0] border border-[#ede5d8] px-2.5 py-0.5 rounded-full`}>
                  +{property.amenities.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-[#f0ebe0] flex items-center justify-between">
            {property.type === "building" ? (
              <span className={`${josefin.className} text-[11.5px] text-[#6b5e4a]`}>
                {property.roomStats?.available ?? 0} rooms available
              </span>
            ) : (
              <span className={`${josefin.className} text-[12px] font-semibold text-[#1a1309]`}>
                {property.pricePerNight > 0
                  ? `৳${property.pricePerNight.toLocaleString()}/night`
                  : "Contact for pricing"}
              </span>
            )}
            <div className={`${josefin.className} flex items-center gap-1 text-[#7A2267]
              group-hover:gap-2 transition-all duration-200`}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">View</span>
              <svg viewBox="0 0 14 10" width="10" height="10" fill="none"
                className="group-hover:translate-x-0.5 transition-transform duration-200">
                <path d="M1 5h12M8 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function AccommodationContent({ buildings = [], cottages = [] }) {
  const heroRef      = useRef(null);
  const heroImgRef   = useRef(null);
  const buildingsRef = useRef(null);
  const cottagesRef  = useRef(null);
  const ctaRef       = useRef(null);

  const buildingsInView = useInView(buildingsRef, { once: true, margin: "-60px" });
  const cottagesInView  = useInView(cottagesRef,  { once: true, margin: "-60px" });
  const ctaInView       = useInView(ctaRef,       { once: true, margin: "-60px" });

  useGSAP(() => {
    if (!heroImgRef.current || !heroRef.current) return;
    gsap.fromTo(
      heroImgRef.current,
      { yPercent: 0 },
      {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  });

  const totalRooms     = buildings.reduce((s, b) => s + (b.roomStats?.total     ?? 0), 0);
  const totalAvailable = buildings.reduce((s, b) => s + (b.roomStats?.available ?? 0), 0);

  const allProperties = [...buildings, ...cottages];

  return (
    <main className="overflow-x-hidden">

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef}
        className="relative min-h-[88vh] md:min-h-[90vh] flex flex-col justify-end overflow-hidden">

        <div ref={heroImgRef} className="absolute inset-0 scale-110">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80"
            alt="Amber Nivaas accommodation"
            fill priority sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b
          from-[#1a1309]/35 via-[#1a1309]/45 to-[#1a1309]/90 z-[1]" />
        <div className="absolute inset-x-0 top-0 h-40
          bg-gradient-to-b from-[#1a1309]/45 to-transparent z-[2]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12
          pb-16 md:pb-20 lg:pb-24 pt-32">

          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl text-center mx-auto">

            <motion.h1 variants={fadeUp}
              className={`${lora.className} text-[2.8rem] sm:text-[3.8rem] lg:text-[5rem]
                text-white leading-[1.1] tracking-[-0.02em]`}>
              Where Every Space{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>
                Is a Sanctuary
              </em>
            </motion.h1>



          </motion.div>
        </div>
      </section>

      {/* ══ STATS STRIP ════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#1a1309]">
        <motion.div
          variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10
            grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 border-b border-white/10"
        >
          {[
            { value: buildings.length > 0 ? String(buildings.length) : "—", label: "Signature Buildings" },
            { value: cottages.length  > 0 ? String(cottages.length)  : "—", label: "Private Cottages"    },
            { value: totalRooms     > 0 ? String(totalRooms)     : "—", label: "Total Rooms"          },
            { value: totalAvailable > 0 ? String(totalAvailable) : "—", label: "Available Now"        },
          ].map((s, i, arr) => (
            <motion.div key={s.label} variants={fadeUp}
              className="flex flex-col items-center text-center relative">
              {i < arr.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2
                  h-8 w-px bg-white/10 hidden md:block" />
              )}
              <span className={`${lora.className} text-[2.4rem] sm:text-[2.8rem]
                font-semibold text-white leading-none`}>
                {s.value}
              </span>
              <span className={`${josefin.className} text-[9.5px] uppercase
                tracking-[0.22em] text-white/35 mt-2 font-medium`}>
                {s.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══ BUILDINGS ══════════════════════════════════════════════════════════ */}
      {buildings.length > 0 && (
        <section ref={buildingsRef} className="bg-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={buildingsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-5"
            >
              <SectionLabel text="Buildings & Suites" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={buildingsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center mb-14"
            >
              <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
                text-[#1a1309] leading-[1.15]`}>
                Grand Buildings,{" "}
                <em className={`${lora.className} italic text-[#7A2267]`}>Curated for You</em>
              </h2>
              <p className={`${josefin.className} text-[13.5px] font-light text-[#6b5e4a]
                mt-4 max-w-xl mx-auto leading-[1.85]`}>
                Explore our signature buildings — each offering multiple room categories, premium
                amenities, and panoramic views of the resort's natural surroundings.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={buildingsInView ? "show" : "hidden"}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {buildings.map((p) => <PropertyCard key={p._id} property={p} />)}
            </motion.div>

          </div>
        </section>
      )}

      {/* ══ COTTAGES ═══════════════════════════════════════════════════════════ */}
      {cottages.length > 0 && (
        <section ref={cottagesRef} className="bg-[#f9f6f2] py-20 md:py-28">
          <div className="pointer-events-none absolute left-0 w-[500px] h-[500px]
            rounded-full bg-[#7A2267]/[0.05] blur-[100px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={cottagesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-5"
            >
              <SectionLabel text="Private Cottages" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={cottagesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center mb-14"
            >
              <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
                text-[#1a1309] leading-[1.15]`}>
                Intimate Escapes,{" "}
                <em className={`${lora.className} italic text-[#7A2267]`}>Complete Privacy</em>
              </h2>
              <p className={`${josefin.className} text-[13.5px] font-light text-[#6b5e4a]
                mt-4 max-w-xl mx-auto leading-[1.85]`}>
                Standalone cottages nestled within the resort's natural greenery — your
                own private world, exactly as you imagine it.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate={cottagesInView ? "show" : "hidden"}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {cottages.map((p) => <PropertyCard key={p._id} property={p} />)}
            </motion.div>

          </div>
        </section>
      )}

      {/* Empty state */}
      {allProperties.length === 0 && (
        <section className="bg-white py-32">
          <div className="text-center max-w-md mx-auto px-5">
            <p className={`${josefin.className} text-[9.5px] uppercase tracking-[0.28em]
              text-[#7A2267]/60 font-semibold mb-4`}>
              Coming Soon
            </p>
            <h2 className={`${lora.className} text-[1.8rem] text-[#1a1309] mb-3`}>
              Accommodation listings are being prepared
            </h2>
            <p className={`${josefin.className} text-[13px] font-light text-[#7a6a52] leading-relaxed`}>
              Please check back soon or contact us directly for enquiries.
            </p>
          </div>
        </section>
      )}

      {/* ══ CTA BANNER ═════════════════════════════════════════════════════════ */}
      <section ref={ctaRef}
        className="relative overflow-hidden min-h-[420px] flex items-center justify-center py-24">
        <Image
          src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1920&q=80"
          alt="Resort pool evening" fill sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0
          bg-gradient-to-br from-[#1a1309]/82 via-[#1a1309]/65 to-[#7A2267]/25" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.div
            variants={stagger} initial="hidden"
            animate={ctaInView ? "show" : "hidden"}
            className="flex flex-col items-center gap-6"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <div className="h-px w-10 bg-[#7A2267]/60" />
              <p className={`${josefin.className} text-[10px] uppercase tracking-[0.3em]
                font-semibold text-[#7A2267]`}>
                Ready to Book?
              </p>
              <div className="h-px w-10 bg-[#7A2267]/60" />
            </motion.div>

            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[3rem] lg:text-[3.6rem]
                text-white leading-[1.12]`}>
              Your Perfect Room
              <br />
              <em className={`${lora.className} italic text-[#7A2267]`}>
                Is Waiting for You
              </em>
            </motion.h2>

            <motion.p variants={fadeUp}
              className={`${lora.className} text-[1.1rem] italic text-white/60 max-w-md`}>
              Reserve today and experience the warmth, luxury, and serenity of Amber Nivaas.
            </motion.p>

            <motion.div variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-4 mt-2">
              <Link href="/booking"
                className={`${josefin.className} inline-flex items-center gap-3
                  px-8 py-3.5 rounded-full bg-white text-[#1a1309]
                  text-[12px] font-semibold uppercase tracking-[0.18em]
                  hover:bg-[#f9f6f2] transition-all duration-300 group
                  shadow-[0_8px_30px_-6px_rgba(255,255,255,0.25)]`}>
                Book Your Stay
                <svg viewBox="0 0 16 10" width="13" height="13" fill="none"
                  className="group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/contact"
                className={`${josefin.className} inline-flex items-center gap-2
                  px-8 py-3.5 rounded-full border border-white/35 text-white
                  text-[12px] font-semibold uppercase tracking-[0.18em]
                  hover:bg-white/10 hover:border-white/60 transition-all duration-300`}>
                Enquire
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
