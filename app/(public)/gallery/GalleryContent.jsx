"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";
import { IMAGE_SIZES } from "@/lib/galleryConstants";

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

// Desktop (4-col) and mobile (2-col) span maps
// "dense" grid auto-flow fills gaps — no manual placement needed.
const DESKTOP = {
  square:    { col: 1, row: 1 },
  landscape: { col: 2, row: 1 },
  portrait:  { col: 1, row: 2 },
  wide:      { col: 4, row: 1 },
};
const MOBILE = {
  square:    { col: 1, row: 1 },
  landscape: { col: 2, row: 1 },
  portrait:  { col: 1, row: 2 },
  wide:      { col: 2, row: 1 }, // cap at 2 on mobile
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   onPrev();
      if (e.key === "ArrowRight")  onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

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
          width={1200} height={800}
          className="object-contain max-h-[85vh] w-auto"
          priority
        />
        {(photo.title || photo.category) && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
            {photo.title && (
              <p className={`${playfair.className} text-white text-[1rem] font-medium`}>{photo.title}</p>
            )}
            {photo.category && (
              <p className={`${sans.className} text-white/55 text-[9.5px] uppercase tracking-wider mt-0.5`}>{photo.category}</p>
            )}
          </div>
        )}
      </motion.div>

      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
            bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30
            flex items-center justify-center text-white transition-all duration-200">
          <svg viewBox="0 0 10 16" width="8" height="8" fill="none">
            <path d="M8 1L2 8l6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {index < photos.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
            bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30
            flex items-center justify-center text-white transition-all duration-200">
          <svg viewBox="0 0 10 16" width="8" height="8" fill="none">
            <path d="M2 1l6 7-6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full
          bg-white/10 hover:bg-white/20 border border-white/15
          flex items-center justify-center text-white transition-all duration-200">
        <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div className={`${sans.className} absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/40 tracking-widest`}>
        {index + 1} / {photos.length}
      </div>
    </motion.div>
  );
}

// ── Photo tile ────────────────────────────────────────────────────────────────
const tileAnim = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show:   { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function PhotoTile({ photo, colSpan, rowSpan, onClick }) {
  return (
    <motion.div
      variants={tileAnim}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer bg-[#e8e0d4]"
      style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
    >
      <Image
        src={photo.image}
        alt={photo.altText || photo.title || "Gallery"}
        fill
        sizes={colSpan >= 4 ? "100vw" : colSpan >= 2 ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 25vw"}
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
          <p className={`${playfair.className} text-white font-medium leading-tight drop-shadow-lg text-[0.875rem]`}>
            {photo.title}
          </p>
        </div>
      )}

      <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

// ── Static fallback (shown when no real photos uploaded yet) ──────────────────
const STATIC_PHOTOS = [
  { _id:"p01", imageSize:"wide",      category:"Swimming Pool", title:"Iconic Infinity Pool",   image:"https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80" },
  { _id:"p02", imageSize:"square",    category:"Swimming Pool", title:"Evening Pool Glow",      image:"https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80" },
  { _id:"p03", imageSize:"portrait",  category:"Swimming Pool", title:"Serene Lap Pool",        image:"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=600&q=80" },
  { _id:"p04", imageSize:"square",    category:"Swimming Pool", title:"Sky Reflection Pool",    image:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
  { _id:"p05", imageSize:"landscape", category:"Swimming Pool", title:"Family Pool",            image:"https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=1200&q=80" },
  { _id:"p06", imageSize:"square",    category:"Swimming Pool", title:"Poolside Lounge",        image:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80" },
  { _id:"p07", imageSize:"landscape", category:"Swimming Pool", title:"Tropical Pool View",     image:"https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=1200&q=80" },
  { _id:"p08", imageSize:"square",    category:"Swimming Pool", title:"Waterfall Feature Pool", image:"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80" },
  { _id:"r01", imageSize:"landscape", category:"Rooms",         title:"Luxury Suite",           image:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80" },
  { _id:"r02", imageSize:"square",    category:"Rooms",         title:"Premium Double Room",    image:"https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=900&q=80" },
  { _id:"r03", imageSize:"portrait",  category:"Rooms",         title:"Deluxe King Room",       image:"https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80" },
  { _id:"r04", imageSize:"square",    category:"Rooms",         title:"Garden View Room",       image:"https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80" },
  { _id:"r05", imageSize:"landscape", category:"Rooms",         title:"Modern Twin Room",       image:"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80" },
  { _id:"r06", imageSize:"square",    category:"Rooms",         title:"Amber Suite Bathroom",   image:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80" },
  { _id:"r07", imageSize:"wide",      category:"Rooms",         title:"Executive Room",         image:"https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80" },
  { _id:"r08", imageSize:"square",    category:"Rooms",         title:"Hillside Cabin Room",    image:"https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=900&q=80" },
  { _id:"r09", imageSize:"landscape", category:"Rooms",         title:"Heritage Suite",         image:"https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=1200&q=80" },
  { _id:"d01", imageSize:"portrait",  category:"Dining",        title:"Curated Dining",         image:"https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80" },
  { _id:"d02", imageSize:"wide",      category:"Dining",        title:"Amber Restaurant",       image:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80" },
  { _id:"d03", imageSize:"landscape", category:"Dining",        title:"Breakfast Spread",       image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" },
  { _id:"d04", imageSize:"square",    category:"Dining",        title:"Outdoor Café Seating",   image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80" },
  { _id:"d05", imageSize:"square",    category:"Dining",        title:"Private Dining Room",    image:"https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=80" },
  { _id:"n01", imageSize:"wide",      category:"Nature",        title:"Panoramic Landscape",    image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80" },
  { _id:"n02", imageSize:"landscape", category:"Nature",        title:"Valley Sunrise",         image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80" },
  { _id:"n03", imageSize:"portrait",  category:"Nature",        title:"Forest Trail",           image:"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80" },
  { _id:"n04", imageSize:"square",    category:"Nature",        title:"Garden Bloom",           image:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80" },
  { _id:"n05", imageSize:"square",    category:"Nature",        title:"Hilltop View",           image:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80" },
  { _id:"e01", imageSize:"wide",      category:"Events",        title:"Grand Event Hall",       image:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80" },
  { _id:"e02", imageSize:"landscape", category:"Events",        title:"Corporate Conference",   image:"https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80" },
  { _id:"e03", imageSize:"portrait",  category:"Events",        title:"Wedding Ceremony",       image:"https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80" },
  { _id:"e04", imageSize:"landscape", category:"Events",        title:"Banquet Hall",           image:"https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80" },
  { _id:"e05", imageSize:"square",    category:"Events",        title:"Outdoor Gathering",      image:"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GalleryContent({ photos = [], categories = [] }) {
  const isRealData = photos.length > 0;
  const source = isRealData ? photos : STATIC_PHOTOS;

  const allCatNames = Array.from(
    new Set([...categories, ...source.map((p) => p.category).filter(Boolean)])
  ).sort();
  const tabs = ["All", ...allCatNames];

  const [active, setActive]     = useState("All");
  const [lightbox, setLightbox] = useState(null);

  const filtered = active === "All" ? source : source.filter((p) => p.category === active);

  function openLightbox(i) { setLightbox(i); }
  function closeLightbox() { setLightbox(null); }
  function prevPhoto()     { setLightbox((i) => Math.max(0, i - 1)); }
  function nextPhoto()     { setLightbox((i) => Math.min(filtered.length - 1, i + 1)); }

  return (
    <>
      {/* ── Page hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#f8f4ee] py-16 md:py-20 overflow-hidden border-b border-[#ede5d8]">
        <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px]
          rounded-full bg-[#c9a96e]/[0.07] blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
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
              {isRealData
                ? `${source.length} curated photograph${source.length !== 1 ? "s" : ""} across ${allCatNames.length} ${allCatNames.length !== 1 ? "categories" : "category"}.`
                : "Upload one image to load real data."}
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
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className={`${sans.className} text-[12px] text-[#aaa]`}>
                    No photos in this category yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Desktop: 4-col dense grid, 220px rows ── */}
                  <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.045 } } }}
                    initial="hidden"
                    animate="show"
                    className="hidden md:grid gap-3"
                    style={{
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gridAutoRows: "220px",
                      gridAutoFlow: "dense",
                    }}
                  >
                    {filtered.map((photo, i) => {
                      const size = DESKTOP[photo.imageSize] || DESKTOP.square;
                      return (
                        <PhotoTile
                          key={photo._id}
                          photo={photo}
                          colSpan={size.col}
                          rowSpan={size.row}
                          onClick={() => openLightbox(i)}
                        />
                      );
                    })}
                  </motion.div>

                  {/* ── Mobile: 2-col dense grid, 160px rows ── */}
                  <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    initial="hidden"
                    animate="show"
                    className="md:hidden grid gap-2"
                    style={{
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gridAutoRows: "160px",
                      gridAutoFlow: "dense",
                    }}
                  >
                    {filtered.map((photo, i) => {
                      const size = MOBILE[photo.imageSize] || MOBILE.square;
                      return (
                        <PhotoTile
                          key={photo._id}
                          photo={photo}
                          colSpan={size.col}
                          rowSpan={size.row}
                          onClick={() => openLightbox(i)}
                        />
                      );
                    })}
                  </motion.div>
                </>
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
