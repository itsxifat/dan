"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const EASE   = [0.22, 1, 0.36, 1];
const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } };
const stagger= { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } };

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [prev, next, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] bg-black/92 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-0 inset-x-0 h-[60px] sm:h-[68px] flex items-center justify-between px-6 z-10"
        onClick={(e) => e.stopPropagation()}>
        <span className={`${josefin.className} text-[10px] uppercase tracking-[0.25em] text-white/40`}>
          {idx + 1} / {images.length}
        </span>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full border border-white/15 bg-white/[0.06]
            hover:bg-white/[0.12] flex items-center justify-center text-white/55
            hover:text-white transition-all duration-200">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M1 1l10 10M11 1 1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 pt-[68px] pb-16" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img key={idx} src={images[idx]} alt={`Photo ${idx + 1}`}
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
            className="max-w-full max-h-[calc(100vh-160px)] mx-auto rounded-2xl object-contain shadow-2xl" />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
              border border-white/15 bg-white/[0.06] hover:bg-white/[0.14]
              flex items-center justify-center text-white/50 hover:text-white transition-all duration-200">
            <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
              <path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 sm:right-7 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
              border border-white/15 bg-white/[0.06] hover:bg-white/[0.14]
              flex items-center justify-center text-white/50 hover:text-white transition-all duration-200">
            <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
              <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
      {images.length > 1 && images.length <= 14 && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-200
                ${i === idx ? "w-6 h-1.5 bg-white/65" : "w-1.5 h-1.5 bg-white/22 hover:bg-white/45"}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EventDetailContent({ event }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const headerRef  = useRef(null);
  const bodyRef    = useRef(null);
  const galleryRef = useRef(null);
  const ctaRef     = useRef(null);

  const headerInView  = useInView(headerRef,  { once: true, margin: "-40px" });
  const bodyInView    = useInView(bodyRef,     { once: true, margin: "-60px" });
  const galleryInView = useInView(galleryRef,  { once: true, margin: "-60px" });
  const ctaInView     = useInView(ctaRef,      { once: true, margin: "-60px" });

  const allImages = [
    ...(event.image   ? [event.image]                          : []),
    ...(event.gallery ? event.gallery.filter(Boolean)          : []),
  ];

  return (
    <div className="min-h-screen bg-[#faf6f0]">

      {/* ══ TOP BAR ══════════════════════════════════════════════════ */}
      <div className="bg-[#faf6f0] border-b border-[#ede5d8] sticky top-[60px] sm:top-[68px] z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-12 flex items-center justify-between">
          <Link href="/corporate#events"
            className={`${josefin.className} inline-flex items-center gap-2 text-[9px] uppercase
              tracking-[0.22em] font-semibold text-[#7A2267]/50 hover:text-[#7A2267] transition-colors duration-200`}>
            <svg viewBox="0 0 10 10" width="7" height="7" fill="none">
              <path d="M8 5H2M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Events
          </Link>
          {allImages.length > 1 && (
            <button onClick={() => setLightboxIdx(0)}
              className={`${josefin.className} inline-flex items-center gap-1.5 text-[9px] uppercase
                tracking-[0.18em] text-[#1a1309]/35 hover:text-[#7A2267] transition-colors duration-200`}>
              <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="4" cy="5.5" r="1" stroke="currentColor" strokeWidth="1" />
                <path d="M1 9.5l2.5-2 2 1.5 2-2 3.5 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {allImages.length} Photos
            </button>
          )}
        </div>
      </div>

      {/* ══ EVENT HEADER ═════════════════════════════════════════════ */}
      <div ref={headerRef} className="bg-[#faf6f0] pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <motion.div variants={stagger} initial="hidden" animate={headerInView ? "show" : "hidden"}>

            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-[#7A2267]/25" />
              <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.32em] font-semibold text-[#7A2267]/60`}>
                Corporate Event
              </span>
            </motion.div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <div className="flex-1">
                {event.client && (
                  <motion.span variants={fadeUp}
                    className={`${josefin.className} inline-block mb-3
                      text-[8px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em]
                      bg-[#7A2267] text-white shadow-[0_2px_14px_rgba(122,34,103,0.3)]`}>
                    {event.client}
                  </motion.span>
                )}
                <motion.h1 variants={fadeUp}
                  className={`${lora.className} text-[2.2rem] sm:text-[2.9rem] lg:text-[3.5rem]
                    text-[#1a1309] leading-[1.06] tracking-[-0.01em]`}>
                  {event.title}
                </motion.h1>
              </div>

              <motion.div variants={fadeUp} className="flex items-center gap-3 shrink-0">
                {event.eventDate && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ede5d8] bg-white">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" className="text-[#7A2267]/60">
                      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M5 1.5v3M11 1.5v3M2 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span className={`${josefin.className} text-[11.5px] font-semibold text-[#1a1309]/70`}>
                      {event.eventDate}
                    </span>
                  </div>
                )}
                {allImages.length > 1 && (
                  <button onClick={() => setLightboxIdx(0)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ede5d8] bg-white
                      hover:border-[#7A2267]/30 hover:shadow-[0_2px_12px_rgba(122,34,103,0.08)] transition-all duration-200">
                    <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="text-[#7A2267]/60">
                      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="4" cy="5.5" r="1" stroke="currentColor" strokeWidth="1" />
                      <path d="M1 9.5l2.5-2 2 1.5 2-2 3.5 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                    <span className={`${josefin.className} text-[11px] font-semibold text-[#1a1309]/55`}>
                      {allImages.length} photos
                    </span>
                  </button>
                )}
              </motion.div>
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-5">
                {event.tags.map((tag) => (
                  <span key={tag}
                    className={`${josefin.className} text-[9px] uppercase tracking-wider font-semibold
                      px-3 py-1.5 rounded-full border border-[#7A2267]/15 bg-[#7A2267]/[0.06] text-[#7A2267]/70`}>
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ══ COVER IMAGE ══════════════════════════════════════════════ */}
      {event.image && (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EASE }}
            className="relative w-full rounded-3xl overflow-hidden cursor-pointer group shadow-[0_4px_40px_rgba(26,19,9,0.10)]"
            style={{ paddingBottom: "50%" }}
            onClick={() => setLightboxIdx(0)}>
            <img src={event.image} alt={event.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300
              flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-white/60
                flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300
                shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                <svg viewBox="0 0 14 14" width="11" height="11" fill="none" className="text-[#1a1309]/60">
                  <path d="M1 4V1h3M10 1h3v3M13 10v3h-3M4 13H1v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══ BODY ═════════════════════════════════════════════════════ */}
      <div ref={bodyRef} className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-16">
        <div className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-10 lg:gap-14">

          {/* Left: description */}
          <div>
            {event.description && (
              <motion.div
                initial={{ opacity: 0, y: 18 }} animate={bodyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7 }}
                className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-10 bg-[#7A2267]/25" />
                  <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.32em]
                    font-semibold text-[#7A2267]/60`}>About This Event</span>
                </div>
                <p className={`${lora.className} text-[1.15rem] sm:text-[1.25rem] leading-[1.85]
                  text-[#1a1309]/65 font-normal`}>
                  {event.description}
                </p>
              </motion.div>
            )}
          </div>

          {/* Right: sticky info card */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 24 }} animate={bodyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="sticky top-[124px]">

              <div className="bg-white rounded-2xl border border-[#ede5d8]
                shadow-[0_4px_32px_rgba(26,19,9,0.07)] overflow-hidden">

                <div className="px-5 pt-5 pb-4 border-b border-[#ede5d8]">
                  <p className={`${josefin.className} text-[7.5px] uppercase tracking-[0.28em]
                    text-[#1a1309]/30 mb-1.5`}>Event Details</p>
                  <p className={`${lora.className} text-[1.05rem] text-[#1a1309]/80 font-medium leading-snug`}>
                    {event.title}
                  </p>
                </div>

                <div className="px-5 py-4 space-y-3 border-b border-[#ede5d8]">
                  {event.client && (
                    <div className="flex items-center justify-between">
                      <span className={`${josefin.className} text-[10px] uppercase tracking-wider text-[#1a1309]/35`}>Client</span>
                      <span className={`${josefin.className} text-[11.5px] font-semibold text-[#7A2267]`}>{event.client}</span>
                    </div>
                  )}
                  {event.eventDate && (
                    <div className="flex items-center justify-between">
                      <span className={`${josefin.className} text-[10px] uppercase tracking-wider text-[#1a1309]/35`}>Date</span>
                      <span className={`${josefin.className} text-[11.5px] font-semibold text-[#1a1309]/55`}>{event.eventDate}</span>
                    </div>
                  )}
                  {event.tags?.length > 0 && (
                    <div className="flex items-start justify-between gap-3">
                      <span className={`${josefin.className} text-[10px] uppercase tracking-wider text-[#1a1309]/35 shrink-0`}>Tags</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {event.tags.map((t) => (
                          <span key={t} className={`${josefin.className} text-[9px] px-2 py-0.5 rounded-full
                            bg-[#7A2267]/[0.06] text-[#7A2267]/60 border border-[#7A2267]/10`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {allImages.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={`${josefin.className} text-[10px] uppercase tracking-wider text-[#1a1309]/35`}>Gallery</span>
                      <button onClick={() => setLightboxIdx(0)}
                        className={`${josefin.className} text-[11.5px] font-semibold text-[#7A2267]/70
                          hover:text-[#7A2267] transition-colors duration-200`}>
                        {allImages.length} photos →
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <Link href="/corporate#visit-form"
                    className={`${josefin.className} w-full flex items-center justify-center gap-2.5
                      px-5 py-3 rounded-xl bg-[#7A2267] hover:bg-[#8a256f] text-white
                      text-[9.5px] uppercase tracking-[0.2em] font-semibold
                      transition-all duration-300 shadow-[0_4px_18px_rgba(122,34,103,0.3)]
                      hover:shadow-[0_6px_24px_rgba(122,34,103,0.45)] hover:-translate-y-0.5`}>
                    Host a Similar Event
                    <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                      <path d="M1 5h8M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <p className={`${josefin.className} text-[9.5px] text-[#1a1309]/30 text-center mt-3 leading-[1.7]`}>
                    Request a site visit · No commitment
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ══ GALLERY ══════════════════════════════════════════════════ */}
      {allImages.length > 0 && (
        <div ref={galleryRef} className="bg-white border-t border-[#ede5d8] py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={galleryInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55 }}
              className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-[#7A2267]/25" />
                <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.32em]
                  font-semibold text-[#7A2267]/60`}>Event Gallery</span>
              </div>
              {allImages.length > 1 && (
                <button onClick={() => setLightboxIdx(0)}
                  className={`${josefin.className} inline-flex items-center gap-2 text-[9px] uppercase
                    tracking-[0.18em] text-[#1a1309]/30 hover:text-[#7A2267] transition-colors duration-200`}>
                  <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                    <path d="M1 4.5V1h3.5M7.5 1H11v3.5M11 7.5V11H7.5M4.5 11H1V7.5"
                      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  View Fullscreen
                </button>
              )}
            </motion.div>

            {allImages.length === 1 && (
              <motion.div
                initial={{ opacity: 0 }} animate={galleryInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.7 }}
                className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-[0_2px_24px_rgba(26,19,9,0.08)]"
                style={{ paddingBottom: "44%" }}
                onClick={() => setLightboxIdx(0)}>
                <img src={allImages[0]} alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
              </motion.div>
            )}

            {allImages.length === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {allImages.map((img, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 14 }} animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: i * 0.09 }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-[0_2px_20px_rgba(26,19,9,0.07)]"
                    style={{ paddingBottom: "63%" }}
                    onClick={() => setLightboxIdx(i)}>
                    <img src={img} alt={`Photo ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-600 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.06] transition-colors duration-300" />
                  </motion.div>
                ))}
              </div>
            )}

            {allImages.length >= 3 && (
              <div className="space-y-3">
                {/* Bento: large + 2 stacked */}
                <div className="grid grid-cols-12 gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 14 }} animate={galleryInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.05 }}
                    className="col-span-12 sm:col-span-8 relative rounded-2xl overflow-hidden cursor-pointer group
                      shadow-[0_2px_24px_rgba(26,19,9,0.08)]"
                    style={{ paddingBottom: "46%" }}
                    onClick={() => setLightboxIdx(0)}>
                    <img src={allImages[0]} alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.07] transition-colors duration-300" />
                  </motion.div>

                  <div className="col-span-12 sm:col-span-4 grid grid-rows-2 gap-3">
                    {allImages.slice(1, 3).map((img, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: 14 }} animate={galleryInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.12 + i * 0.09 }}
                        className="relative rounded-2xl overflow-hidden cursor-pointer group
                          shadow-[0_2px_16px_rgba(26,19,9,0.07)]"
                        style={{ paddingBottom: "0", minHeight: "110px" }}
                        onClick={() => setLightboxIdx(i + 1)}>
                        <img src={img} alt={`Photo ${i + 2}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-600 group-hover:scale-[1.04]" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.08] transition-colors duration-300" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Additional thumbnails */}
                {allImages.length > 3 && (
                  <motion.div
                    variants={stagger} initial="hidden" animate={galleryInView ? "show" : "hidden"}
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {allImages.slice(3).map((img, i) => (
                      <motion.div key={i} variants={fadeUp}
                        className="relative rounded-xl overflow-hidden cursor-pointer group
                          shadow-[0_2px_12px_rgba(26,19,9,0.06)]"
                        style={{ paddingBottom: "100%" }}
                        onClick={() => setLightboxIdx(i + 3)}>
                        <img src={img} alt={`Photo ${i + 4}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.09] transition-colors duration-250" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ CTA ══════════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="bg-[#faf6f0] border-t border-[#ede5d8] py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE }}
          className="max-w-2xl mx-auto px-6 text-center">

          <div className="flex items-center justify-center gap-4 mb-7">
            <div className="h-px w-12 bg-[#7A2267]/20" />
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" className="text-[#7A2267]/35">
              <path d="M8 1L9.5 5.5H14.5L10.5 8.5L12 13L8 10L4 13L5.5 8.5L1.5 5.5H6.5Z" fill="currentColor" />
            </svg>
            <div className="h-px w-12 bg-[#7A2267]/20" />
          </div>

          <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] text-[#1a1309] leading-[1.12] mb-4`}>
            Host a Similar Event{" "}
            <em className={`${lora.className} italic text-[#7A2267]`}>With Us</em>
          </h2>
          <p className={`${josefin.className} text-[12.5px] text-[#1a1309]/45 font-light leading-[1.9] mb-9 max-w-md mx-auto`}>
            Schedule a complimentary site visit and let our corporate team design an exceptional event experience for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/corporate#visit-form"
              className={`${josefin.className} inline-flex items-center gap-3 px-8 py-3.5 rounded-full
                bg-[#7A2267] hover:bg-[#8a256f] text-white font-semibold
                text-[9.5px] uppercase tracking-[0.22em]
                transition-all duration-300 shadow-[0_4px_22px_rgba(122,34,103,0.32)]
                hover:shadow-[0_8px_30px_rgba(122,34,103,0.45)] hover:-translate-y-0.5`}>
              Request a Site Visit
              <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                <path d="M1 5h8M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/corporate#events"
              className={`${josefin.className} inline-flex items-center gap-2 px-7 py-3.5 rounded-full
                border border-[#ede5d8] text-[#1a1309]/45 hover:text-[#7A2267] hover:border-[#7A2267]/30
                text-[9.5px] uppercase tracking-[0.2em] font-semibold bg-white
                transition-all duration-300 hover:shadow-[0_2px_12px_rgba(122,34,103,0.1)]`}>
              All Events
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ══ FOOTER STRIP ═════════════════════════════════════════════ */}
      <div className="bg-white border-t border-[#ede5d8] py-6">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/corporate"
            className={`${josefin.className} inline-flex items-center gap-2 text-[9px] uppercase
              tracking-[0.22em] text-[#1a1309]/30 hover:text-[#7A2267] font-semibold transition-colors duration-200`}>
            <svg viewBox="0 0 10 10" width="7" height="7" fill="none">
              <path d="M9 5H2M5 2L2 5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Corporate
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#7A2267]/15" />
            <span className={`${lora.className} italic text-[13px] text-[#7A2267]/30`}>
              Dhali&apos;s Amber Nivaas
            </span>
            <div className="h-px w-8 bg-[#7A2267]/15" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox images={allImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
