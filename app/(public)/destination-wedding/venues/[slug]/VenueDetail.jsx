"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400","500","600","700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300","400","500","600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300","400","500","600"], style: ["italic","normal"] });

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

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="relative max-w-3xl w-full max-h-[80vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[current]}
          alt=""
          width={900}
          height={600}
          className="w-full h-full object-contain"
        />
      </motion.div>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50
              flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80
              transition-all duration-200 border border-white/10">
            <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
              <path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50
              flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80
              transition-all duration-200 border border-white/10">
            <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
              <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </>
      )}

      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center
          text-white/60 hover:text-white hover:bg-black/80 transition-all duration-200 border border-white/10">
        <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VenueDetail({ venue }) {
  const heroRef    = useRef(null);
  const heroBgRef  = useRef(null);
  const contentRef = useRef(null);
  const featRef    = useRef(null);
  const galleryRef = useRef(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const allImages = [
    ...(venue.coverImage ? [venue.coverImage] : []),
    ...(venue.images || []).filter((img) => img !== venue.coverImage),
  ];

  useGSAP(() => {
    // Hero parallax
    gsap.to(heroBgRef.current, {
      y: "25%",
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Content reveal
    gsap.fromTo(contentRef.current?.querySelectorAll(".rev"),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: contentRef.current, start: "top 82%", once: true } }
    );

    // Features reveal
    if (featRef.current) {
      gsap.fromTo(featRef.current.querySelectorAll(".feat-item"),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, stagger: 0.08, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: featRef.current, start: "top 85%", once: true } }
      );
    }

    // Gallery reveal
    if (galleryRef.current) {
      gsap.fromTo(galleryRef.current.querySelectorAll(".gal-item"),
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, stagger: 0.07, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: galleryRef.current, start: "top 85%", once: true } }
      );
    }
  }, { scope: heroRef });

  return (
    <div className={sans.className} style={{ background: "#0e0710", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div ref={heroRef} className="relative h-[55vh] sm:h-[65vh] lg:h-[70vh] overflow-hidden flex items-end">
        {/* BG */}
        <div ref={heroBgRef} className="absolute inset-0 will-change-transform" style={{ top: "-15%" }}>
          {venue.coverImage ? (
            <Image
              src={venue.coverImage}
              alt={venue.name}
              fill priority
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="w-full h-full"
              style={{ background: "linear-gradient(135deg, #1a0d2e 0%, #0e0710 100%)" }} />
          )}
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0710] via-[#0e0710]/50 to-[#0e0710]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0710]/60 via-transparent to-transparent" />

        {/* Back link */}
        <Link
          href="/destination-wedding#venues"
          className={`${sans.className} absolute top-6 left-5 sm:left-8 lg:left-12 z-20
            inline-flex items-center gap-2 text-[9.5px] uppercase tracking-[0.22em] font-semibold
            text-white/40 hover:text-[#C9956C] transition-colors duration-200`}
        >
          <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
            <path d="M9 5H2M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Venues
        </Link>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-12 w-full">
          {venue.badge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-4"
            >
              <span className={`${sans.className} inline-block bg-[#C9956C] text-[#0e0710]
                text-[8.5px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.18em]`}>
                {venue.badge}
              </span>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className={`${playfair.className} text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem]
              font-semibold text-white leading-[1.08] mb-3`}>
              {venue.name}
            </h1>
          </motion.div>
          {venue.capacity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center gap-2"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" className="text-[#C9956C]">
                <path d="M13 14s1 0 1-1-1-4-6-4-6 3-6 4 1 1 1 1h10z" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <span className={`${sans.className} text-[12px] text-[#C9956C] font-medium`}>
                {venue.capacity}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-12 py-16 md:py-20">

        {/* Description */}
        {venue.description && (
          <div ref={contentRef} className="mb-14">
            <p className={`rev ${sans.className} text-[10px] uppercase tracking-[0.3em]
              text-[#C9956C]/55 font-semibold mb-3`} style={{ opacity: 0 }}>
              About This Venue
            </p>
            <OrnamentalDivider />
            <p className={`rev ${sans.className} text-[15px] sm:text-[16px] text-white/55
              leading-[1.85] font-light mt-6 max-w-3xl`} style={{ opacity: 0 }}>
              {venue.description}
            </p>
          </div>
        )}

        {/* Features */}
        {venue.features?.length > 0 && (
          <div ref={featRef} className="mb-14">
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.3em]
              text-[#C9956C]/55 font-semibold mb-5`}>
              Highlights
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {venue.features.map((feat, i) => (
                <div
                  key={i}
                  className="feat-item flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    opacity: 0,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(201,149,108,0.1)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9956C]/60 shrink-0" />
                  <span className={`${sans.className} text-[12.5px] text-white/60 font-light`}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {allImages.length > 0 && (
          <div className="mb-16">
            <p className={`${sans.className} text-[10px] uppercase tracking-[0.3em]
              text-[#C9956C]/55 font-semibold mb-5`}>
              Gallery
            </p>
            <div ref={galleryRef}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allImages.map((img, i) => (
                <motion.div
                  key={i}
                  className="gal-item relative rounded-xl overflow-hidden cursor-pointer group"
                  style={{ opacity: 0, aspectRatio: "4/3" }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setLightboxIdx(i)}
                >
                  <Image src={img} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <svg viewBox="0 0 20 20" width="20" height="20" fill="none"
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <path d="M10 2h8v8M18 2L10 10M2 10v8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-12 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(122,34,103,0.08) 0%, rgba(201,149,108,0.05) 100%)",
            border: "1px solid rgba(201,149,108,0.1)",
          }}>
          <OrnamentalDivider />
          <h2 className={`${playfair.className} text-[1.8rem] sm:text-[2.2rem] font-semibold
            text-white leading-tight mt-4 mb-3`}>
            Book This{" "}
            <em className={`${cormorant.className} italic text-[#C9956C]`}>Venue</em>
          </h2>
          <p className={`${sans.className} text-[12.5px] text-white/35 font-light max-w-sm mx-auto mb-7`}>
            Speak with our dedicated wedding team to check availability and begin planning.
          </p>
          <Link
            href={`/destination-wedding#enquiry`}
            className={`${sans.className} inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full
              text-[10.5px] uppercase tracking-[0.2em] font-semibold text-white
              transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group`}
            style={{
              background: "linear-gradient(135deg, #7A2267 0%, #9A3087 100%)",
              boxShadow: "0 4px 24px rgba(122,34,103,0.4)",
            }}
          >
            <span className="relative z-10">Send Enquiry</span>
            <svg viewBox="0 0 10 10" width="8" height="8" fill="none" className="relative z-10
              transition-transform duration-300 group-hover:translate-x-0.5">
              <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full
              transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Link>
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="py-8 border-t" style={{ background: "#0e0710", borderColor: "rgba(201,149,108,0.08)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/destination-wedding"
            className={`${sans.className} inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em]
              text-white/20 hover:text-[#C9956C] font-semibold transition-colors duration-200`}>
            <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
              <path d="M9 5H2M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Wedding Page
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            images={allImages}
            index={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
