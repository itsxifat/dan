"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ── Static fallback photos (used when DB is empty) ───────────────────────────
const STATIC_PHOTOS = [
  {
    _id: "s1", category: "Swimming Pool",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
    title: "Iconic Infinity Pool", altText: "Infinity pool with nature backdrop",
  },
  {
    _id: "s2", category: "Nature",
    image: "https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=900&q=80",
    title: "Panoramic Landscape", altText: "Resort scenic landscape view",
  },
  {
    _id: "s3", category: "Rooms",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
    title: "Luxury Suite", altText: "Cosy resort bedroom",
  },
  {
    _id: "s4", category: "Events",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
    title: "Grand Event Hall", altText: "Corporate events",
  },
  {
    _id: "s5", category: "Dining",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    title: "Curated Dining", altText: "Resort dining and lounge area",
  },
  {
    _id: "s6", category: "Amenities",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    title: "Resort Amenities", altText: "Resort pool and garden",
  },
  {
    _id: "s7", category: "Nature",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
    title: "Valley Sunrise", altText: "Misty mountain landscape",
  },
  {
    _id: "s8", category: "Rooms",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=600&q=80",
    title: "Premium Room", altText: "Luxury hotel room interior",
  },
  {
    _id: "s9", category: "Swimming Pool",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80",
    title: "Evening Pool", altText: "Resort evening pool ambiance",
  },
];

// ── Grid item animation ───────────────────────────────────────────────────────
const itemAnim = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// ── Single photo tile ─────────────────────────────────────────────────────────
function PhotoTile({ photo, featured = false }) {
  return (
    <motion.div
      layout
      variants={itemAnim}
      className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-[#e8e0d4]
        ${featured ? "col-span-2 aspect-[16/9]" : "col-span-1 aspect-[4/3]"}`}
    >
      <Image
        src={photo.image}
        alt={photo.altText || photo.title || "Gallery photo"}
        fill
        sizes={featured
          ? "(max-width: 768px) 100vw, 66vw"
          : "(max-width: 768px) 50vw, 33vw"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Gradient overlay — always subtle, stronger on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0
        opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      {/* Category pill — top left, fades in on hover */}
      <div className="absolute top-3.5 left-3.5 opacity-0 group-hover:opacity-100
        translate-y-1 group-hover:translate-y-0 transition-all duration-300">
        <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.18em] font-semibold
          px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20`}>
          {photo.category}
        </span>
      </div>

      {/* Title — bottom, slides up on hover */}
      {photo.title && (
        <div className="absolute bottom-0 inset-x-0 p-4
          translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
          transition-all duration-350 ease-out">
          <p className={`${lora.className} text-white text-[${featured ? "1.1rem" : "0.9rem"}]
            font-medium leading-tight drop-shadow-lg`}>
            {photo.title}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GallerySection({ photos = [] }) {
  const headerRef  = useRef(null);
  const isInView   = useInView(headerRef, { once: true, margin: "-60px" });

  const source = photos.length > 0 ? photos : STATIC_PHOTOS;

  // Build category list from actual photos
  const categories = ["All", ...Array.from(new Set(source.map((p) => p.category))).sort()];

  const [active, setActive] = useState("All");

  const filtered = active === "All" ? source : source.filter((p) => p.category === active);

  return (
    <section className="relative bg-[#f8f4ee] py-20 md:py-28 lg:py-32 overflow-hidden">

      {/* Very subtle noise texture bg */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* ── Header ── */}
        <div ref={headerRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-10"
          >
            <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
              font-500 text-[#1a1309] leading-[1.15]`}>
              Spaces That{" "}
              <em className={`${lora.className} not-italic text-[#7A2267]`}>Speak for Themselves</em>
            </h2>
          </motion.div>
        </div>

        {/* ── Category Filter Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="flex items-center gap-1 mb-10 overflow-x-auto pb-1 -mx-1 px-1
            scrollbar-none [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`${josefin.className} relative shrink-0 px-4 py-2 text-[10.5px] uppercase
                tracking-[0.16em] font-medium transition-colors duration-200
                ${active === cat ? "text-[#1a1309]" : "text-[#aaa] hover:text-[#555]"}`}
            >
              {cat}
              {active === cat && (
                <motion.span
                  layoutId="galleryTab"
                  className="absolute bottom-0 inset-x-2 h-[1.5px] rounded-full bg-[#7A2267]"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          ))}

          {/* Photo count */}
          <span className={`${josefin.className} ml-auto shrink-0 text-[9.5px] text-[#bbb] pl-4`}>
            {filtered.length} photo{filtered.length !== 1 ? "s" : ""}
          </span>
        </motion.div>

        {/* ── Photo Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Desktop: spotlight-first 3-col grid */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0 } } }}
              initial="hidden"
              animate="show"
              className="hidden md:grid grid-cols-3 gap-3"
            >
              {filtered.map((photo, i) => (
                <PhotoTile
                  key={photo._id}
                  photo={photo}
                  featured={i === 0 && filtered.length > 1}
                />
              ))}
            </motion.div>

            {/* Mobile: 2-col grid, all square */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0 } } }}
              initial="hidden"
              animate="show"
              className="grid md:hidden grid-cols-2 gap-2.5"
            >
              {filtered.map((photo) => (
                <motion.div
                  key={photo._id}
                  variants={itemAnim}
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-[#e8e0d4]"
                >
                  <Image
                    src={photo.image}
                    alt={photo.altText || photo.title || "Gallery photo"}
                    fill
                    sizes="50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {photo.title && (
                    <div className="absolute bottom-0 inset-x-0 p-3
                      translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
                      transition-all duration-300">
                      <p className={`${josefin.className} text-white text-[10px] font-medium`}>
                        {photo.title}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className={`${josefin.className} text-[12px] text-[#aaa]`}>
                  No photos in this category yet.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Footer hint ── */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-10"
          >
            <p className={`${josefin.className} text-[10px] uppercase tracking-[0.22em] text-[#ccc]`}>
              Scroll to explore more
            </p>
            <div className="flex justify-center mt-2">
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-px h-5 bg-[#7A2267]/30"
              />
            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
}
