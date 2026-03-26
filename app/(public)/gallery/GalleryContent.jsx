"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";
import { GALLERY_CATEGORIES } from "@/lib/galleryConstants";

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

// ── Static fallback (same set used in homepage GallerySection) ───────────────
const STATIC_PHOTOS = [
  { _id: "s1", category: "Swimming Pool",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
    title: "Iconic Infinity Pool", altText: "Infinity pool" },
  { _id: "s2", category: "Nature",
    image: "https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=900&q=80",
    title: "Panoramic Landscape", altText: "Resort scenic landscape" },
  { _id: "s3", category: "Rooms",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
    title: "Luxury Suite", altText: "Cosy resort bedroom" },
  { _id: "s4", category: "Events",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
    title: "Grand Event Hall", altText: "Corporate events" },
  { _id: "s5", category: "Dining",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    title: "Curated Dining", altText: "Resort dining" },
  { _id: "s6", category: "Amenities",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    title: "Resort Amenities", altText: "Resort pool and garden" },
  { _id: "s7", category: "Nature",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
    title: "Valley Sunrise", altText: "Misty mountain" },
  { _id: "s8", category: "Rooms",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=600&q=80",
    title: "Premium Room", altText: "Luxury hotel room" },
  { _id: "s9", category: "Swimming Pool",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80",
    title: "Evening Pool", altText: "Resort evening ambiance" },
  { _id: "s10", category: "Amenities",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    title: "Spa & Wellness", altText: "Spa area" },
  { _id: "s11", category: "Dining",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    title: "Fine Dining", altText: "Restaurant interior" },
  { _id: "s12", category: "Events",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
    title: "Banquet Hall", altText: "Event banquet hall" },
];

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];

  // keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Image */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.image}
          alt={photo.altText || photo.title || "Gallery"}
          width={1200}
          height={800}
          className="object-contain max-h-[85vh] w-auto"
          priority
        />

        {/* Caption */}
        {(photo.title || photo.category) && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent
            px-5 py-4">
            {photo.title && (
              <p className={`${playfair.className} text-white text-[1rem] font-medium`}>
                {photo.title}
              </p>
            )}
            {photo.category && (
              <p className={`${sans.className} text-white/55 text-[9.5px] uppercase tracking-wider mt-0.5`}>
                {photo.category}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
            bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30
            flex items-center justify-center text-white transition-all duration-200"
        >
          <svg viewBox="0 0 10 16" width="8" height="8" fill="none">
            <path d="M8 1L2 8l6 7" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Next */}
      {index < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
            bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30
            flex items-center justify-center text-white transition-all duration-200"
        >
          <svg viewBox="0 0 10 16" width="8" height="8" fill="none">
            <path d="M2 1l6 7-6 7" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full
          bg-white/10 hover:bg-white/20 border border-white/15
          flex items-center justify-center text-white transition-all duration-200"
      >
        <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" />
        </svg>
      </button>

      {/* Counter */}
      <div className={`${sans.className} absolute bottom-4 left-1/2 -translate-x-1/2
        text-[10px] text-white/40 tracking-widest`}>
        {index + 1} / {photos.length}
      </div>
    </motion.div>
  );
}

// ── Photo tile ────────────────────────────────────────────────────────────────
const tileAnim = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function PhotoTile({ photo, featured, onClick }) {
  return (
    <motion.div
      variants={tileAnim}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-[#e8e0d4]
        ${featured ? "col-span-2 aspect-[16/9]" : "col-span-1 aspect-[4/3]"}`}
    >
      <Image
        src={photo.image}
        alt={photo.altText || photo.title || "Gallery"}
        fill
        sizes={featured
          ? "(max-width: 768px) 100vw, 66vw"
          : "(max-width: 768px) 50vw, 33vw"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0
        opacity-0 group-hover:opacity-100 transition-opacity duration-350" />

      <div className="absolute top-3.5 left-3.5 opacity-0 group-hover:opacity-100
        translate-y-1 group-hover:translate-y-0 transition-all duration-300">
        <span className={`${sans.className} text-[8.5px] uppercase tracking-[0.18em] font-semibold
          px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20`}>
          {photo.category}
        </span>
      </div>

      {photo.title && (
        <div className="absolute bottom-0 inset-x-0 p-4
          translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
          transition-all duration-300 ease-out">
          <p className={`${playfair.className} text-white font-medium leading-tight drop-shadow-lg
            ${featured ? "text-[1.05rem]" : "text-[0.875rem]"}`}>
            {photo.title}
          </p>
        </div>
      )}

      {/* Expand icon */}
      <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100
        transition-opacity duration-300">
        <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm border border-white/20
          flex items-center justify-center">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"
              stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GalleryContent({ photos = [] }) {
  const source = photos.length > 0 ? photos : STATIC_PHOTOS;
  const tabs   = ["All", ...Array.from(new Set(source.map((p) => p.category))).sort()];

  const [active, setActive]         = useState("All");
  const [lightbox, setLightbox]     = useState(null); // index into `filtered`

  const filtered = active === "All" ? source : source.filter((p) => p.category === active);

  function openLightbox(i) { setLightbox(i); }
  function closeLightbox() { setLightbox(null); }
  function prevPhoto() { setLightbox((i) => Math.max(0, i - 1)); }
  function nextPhoto() { setLightbox((i) => Math.min(filtered.length - 1, i + 1)); }

  return (
    <>
      {/* ── Page hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#f8f4ee] py-16 md:py-20 overflow-hidden border-b border-[#ede5d8]">

        <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px]
          rounded-full bg-[#c9a96e]/[0.07] blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          {/* Breadcrumb */}
          <div className={`${sans.className} flex items-center gap-2 text-[9.5px] uppercase
            tracking-[0.18em] text-[#9b8e78] mb-8`}>
            <Link href="/" className="hover:text-[#555] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#555]">Gallery</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4 mb-3"
              >
                <div className="h-px w-10 bg-[#c9a96e]/50" />
                <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
                  Photo Gallery
                </p>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`${playfair.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                  text-[#1a1309] leading-[1.12]`}
              >
                Spaces That{" "}
                <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Speak for Themselves</em>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`${sans.className} text-[11.5px] text-[#9b8e78] max-w-xs leading-[1.75] font-light`}
            >
              {source.length} curated photographs across {tabs.length - 1} categories.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Gallery body ──────────────────────────────────────────────────── */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          {/* Category tabs */}
          <div className="flex items-center gap-0.5 mb-10 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ scrollbarWidth: "none" }}>
            {tabs.map((cat) => {
              const count = cat === "All" ? source.length : source.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`${sans.className} relative shrink-0 px-4 py-2 text-[10.5px] uppercase
                    tracking-[0.16em] font-medium transition-colors duration-200 whitespace-nowrap
                    ${active === cat ? "text-[#1a1309]" : "text-[#aaa] hover:text-[#555]"}`}
                >
                  {cat}
                  <span className={`${sans.className} ml-1.5 text-[8.5px]
                    ${active === cat ? "text-[#c9a96e]" : "text-[#ccc]"}`}>
                    {count}
                  </span>
                  {active === cat && (
                    <motion.span
                      layoutId="galleryPageTab"
                      className="absolute bottom-0 inset-x-2 h-[1.5px] rounded-full bg-[#c9a96e]"
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Desktop: spotlight-first grid */}
              <motion.div
                variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: 0 } } }}
                initial="hidden"
                animate="show"
                className="hidden md:grid grid-cols-3 gap-3"
              >
                {filtered.map((photo, i) => (
                  <PhotoTile
                    key={photo._id}
                    photo={photo}
                    featured={i === 0 && filtered.length > 1}
                    onClick={() => openLightbox(i)}
                  />
                ))}
              </motion.div>

              {/* Mobile: 2-col grid */}
              <motion.div
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                initial="hidden"
                animate="show"
                className="grid md:hidden grid-cols-2 gap-2.5"
              >
                {filtered.map((photo, i) => (
                  <motion.div
                    key={photo._id}
                    variants={tileAnim}
                    onClick={() => openLightbox(i)}
                    className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-[#e8e0d4]"
                  >
                    <Image
                      src={photo.image}
                      alt={photo.altText || photo.title || "Gallery"}
                      fill sizes="50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {photo.title && (
                      <p className={`${sans.className} absolute bottom-2.5 left-3 right-3
                        text-white text-[10px] font-medium opacity-0 group-hover:opacity-100
                        translate-y-1 group-hover:translate-y-0 transition-all duration-300`}>
                        {photo.title}
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <p className={`${sans.className} text-[12px] text-[#aaa]`}>
                    No photos in this category yet.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            photos={filtered}
            index={lightbox}
            onClose={closeLightbox}
            onPrev={prevPhoto}
            onNext={nextPhoto}
          />
        )}
      </AnimatePresence>
    </>
  );
}
