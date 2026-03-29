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

// ── Static fallback ───────────────────────────────────────────────────────────
const STATIC_PHOTOS = [
  // Swimming Pool (8)
  { _id: "p01", category: "Swimming Pool", title: "Iconic Infinity Pool",   altText: "Infinity pool with nature backdrop",     image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80" },
  { _id: "p02", category: "Swimming Pool", title: "Evening Pool Glow",      altText: "Resort pool lit at dusk",                image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80" },
  { _id: "p03", category: "Swimming Pool", title: "Serene Lap Pool",        altText: "Calm lap pool surrounded by greenery",   image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80" },
  { _id: "p04", category: "Swimming Pool", title: "Sky Reflection Pool",    altText: "Pool reflecting the open sky",           image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
  { _id: "p05", category: "Swimming Pool", title: "Family Pool",            altText: "Wide family swimming area",              image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=900&q=80" },
  { _id: "p06", category: "Swimming Pool", title: "Poolside Lounge",        altText: "Loungers beside the pool",               image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80" },
  { _id: "p07", category: "Swimming Pool", title: "Tropical Pool View",     altText: "Pool surrounded by tropical palms",      image: "https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=900&q=80" },
  { _id: "p08", category: "Swimming Pool", title: "Waterfall Feature Pool", altText: "Pool with decorative waterfall",         image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80" },

  // Rooms (9)
  { _id: "r01", category: "Rooms", title: "Luxury Suite",         altText: "Cosy luxury resort bedroom",         image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80" },
  { _id: "r02", category: "Rooms", title: "Premium Double Room",  altText: "Premium hotel double room interior", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=900&q=80" },
  { _id: "r03", category: "Rooms", title: "Deluxe King Room",     altText: "Spacious king bedroom",              image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80" },
  { _id: "r04", category: "Rooms", title: "Garden View Room",     altText: "Room with garden view window",       image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80" },
  { _id: "r05", category: "Rooms", title: "Modern Twin Room",     altText: "Contemporary twin bed setup",        image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80" },
  { _id: "r06", category: "Rooms", title: "Amber Suite Bathroom", altText: "Elegant en-suite bathroom",          image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80" },
  { _id: "r07", category: "Rooms", title: "Executive Room",       altText: "Executive-class hotel room",         image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80" },
  { _id: "r08", category: "Rooms", title: "Hillside Cabin Room",  altText: "Wooden cabin-style resort room",     image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=900&q=80" },
  { _id: "r09", category: "Rooms", title: "Heritage Suite",       altText: "Heritage-themed luxury suite",       image: "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=900&q=80" },

  // Dining (8)
  { _id: "d01", category: "Dining", title: "Curated Dining",        altText: "Resort dining lounge",               image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80" },
  { _id: "d02", category: "Dining", title: "Amber Restaurant",      altText: "Main restaurant dining area",        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80" },
  { _id: "d03", category: "Dining", title: "Breakfast Spread",      altText: "Morning breakfast buffet",           image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80" },
  { _id: "d04", category: "Dining", title: "Outdoor Café Seating",  altText: "Open-air café with garden view",     image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80" },
  { _id: "d05", category: "Dining", title: "Private Dining Room",   altText: "Intimate private dining setup",      image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=80" },
  { _id: "d06", category: "Dining", title: "Fresh Dessert Counter", altText: "Artisan dessert and pastry station", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80" },
  { _id: "d07", category: "Dining", title: "Chef's Table",          altText: "Chef preparing fresh dishes",        image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=900&q=80" },
  { _id: "d08", category: "Dining", title: "Poolside Refreshments", altText: "Drinks and snacks by the pool",      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80" },

  // Nature (9)
  { _id: "n01", category: "Nature", title: "Panoramic Landscape",  altText: "Resort scenic landscape view",        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80" },
  { _id: "n02", category: "Nature", title: "Valley Sunrise",       altText: "Misty mountain landscape",            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80" },
  { _id: "n03", category: "Nature", title: "Forest Trail",         altText: "Lush green forest pathway",           image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80" },
  { _id: "n04", category: "Nature", title: "Garden Bloom",         altText: "Colourful resort garden flowers",     image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80" },
  { _id: "n05", category: "Nature", title: "Hilltop View",         altText: "Scenic hilltop overlooking valley",   image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80" },
  { _id: "n06", category: "Nature", title: "Waterfall Walk",       altText: "Natural waterfall in resort grounds", image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80" },
  { _id: "n07", category: "Nature", title: "Bird's Eye Greenery",  altText: "Aerial view of green resort",         image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=80" },
  { _id: "n08", category: "Nature", title: "Sunrise Mist",         altText: "Early morning mist over hills",       image: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=900&q=80" },
  { _id: "n09", category: "Nature", title: "Evening Sky",          altText: "Golden hour sunset over resort",      image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=900&q=80" },

  // Events (7)
  { _id: "e01", category: "Events", title: "Grand Event Hall",     altText: "Large decorated event hall",          image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80" },
  { _id: "e02", category: "Events", title: "Corporate Conference", altText: "Professional conference setup",       image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80" },
  { _id: "e03", category: "Events", title: "Wedding Ceremony",     altText: "Elegant outdoor wedding setup",       image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80" },
  { _id: "e04", category: "Events", title: "Banquet Hall",         altText: "Decorated banquet dining hall",       image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80" },
  { _id: "e05", category: "Events", title: "Outdoor Gathering",    altText: "Guests at an outdoor garden event",   image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80" },
  { _id: "e06", category: "Events", title: "Family Celebration",   altText: "Joyful family gathering event",       image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80" },
  { _id: "e07", category: "Events", title: "Stage & Podium",       altText: "Stage setup for event presentation",  image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80" },
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
  const source = photos.length >= 9 ? photos : STATIC_PHOTOS;
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
