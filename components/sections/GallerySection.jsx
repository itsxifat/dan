"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ── Static fallback photos ─────────────────────────────────────────────────────
const STATIC_PHOTOS = [
  // ── Swimming Pool (8 photos) ──────────────────────────────────────────────
  { _id: "p01", category: "Swimming Pool", title: "Iconic Infinity Pool",    altText: "Infinity pool with nature backdrop",     image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80" },
  { _id: "p02", category: "Swimming Pool", title: "Evening Pool Glow",       altText: "Resort pool lit at dusk",                image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80" },
  { _id: "p03", category: "Swimming Pool", title: "Serene Lap Pool",         altText: "Calm lap pool surrounded by greenery",   image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80" },
  { _id: "p04", category: "Swimming Pool", title: "Sky Reflection Pool",     altText: "Pool reflecting the open sky",           image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
  { _id: "p05", category: "Swimming Pool", title: "Family Pool",             altText: "Wide family swimming area",              image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=900&q=80" },
  { _id: "p06", category: "Swimming Pool", title: "Poolside Lounge",         altText: "Loungers beside the pool",               image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80" },
  { _id: "p07", category: "Swimming Pool", title: "Tropical Pool View",      altText: "Pool surrounded by tropical palms",      image: "https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=900&q=80" },
  { _id: "p08", category: "Swimming Pool", title: "Waterfall Feature Pool",  altText: "Pool with decorative waterfall",         image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80" },

  // ── Rooms (9 photos) ──────────────────────────────────────────────────────
  { _id: "r01", category: "Rooms", title: "Luxury Suite",          altText: "Cosy luxury resort bedroom",          image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80" },
  { _id: "r02", category: "Rooms", title: "Premium Double Room",   altText: "Premium hotel double room interior",  image: "https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=900&q=80" },
  { _id: "r03", category: "Rooms", title: "Deluxe King Room",      altText: "Spacious king bedroom",               image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80" },
  { _id: "r04", category: "Rooms", title: "Garden View Room",      altText: "Room with garden view window",        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80" },
  { _id: "r05", category: "Rooms", title: "Modern Twin Room",      altText: "Contemporary twin bed setup",         image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80" },
  { _id: "r06", category: "Rooms", title: "Amber Suite Bathroom",  altText: "Elegant en-suite bathroom",           image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80" },
  { _id: "r07", category: "Rooms", title: "Executive Room",        altText: "Executive-class hotel room",          image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=900&q=80" },
  { _id: "r08", category: "Rooms", title: "Hillside Cabin Room",   altText: "Wooden cabin-style resort room",      image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=900&q=80" },
  { _id: "r09", category: "Rooms", title: "Heritage Suite",        altText: "Heritage-themed luxury suite",        image: "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=900&q=80" },

  // ── Dining (8 photos) ────────────────────────────────────────────────────
  { _id: "d01", category: "Dining", title: "Curated Dining",         altText: "Resort dining lounge",               image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80" },
  { _id: "d02", category: "Dining", title: "Amber Restaurant",       altText: "Main restaurant dining area",        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80" },
  { _id: "d03", category: "Dining", title: "Breakfast Spread",       altText: "Morning breakfast buffet",           image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80" },
  { _id: "d04", category: "Dining", title: "Outdoor Café Seating",   altText: "Open-air café with garden view",     image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80" },
  { _id: "d05", category: "Dining", title: "Private Dining Room",    altText: "Intimate private dining setup",      image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=80" },
  { _id: "d06", category: "Dining", title: "Fresh Dessert Counter",  altText: "Artisan dessert and pastry station", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80" },
  { _id: "d07", category: "Dining", title: "Chef's Table",           altText: "Chef preparing fresh dishes",        image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=900&q=80" },
  { _id: "d08", category: "Dining", title: "Poolside Refreshments",  altText: "Drinks and snacks by the pool",      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80" },

  // ── Nature (9 photos) ────────────────────────────────────────────────────
  { _id: "n01", category: "Nature", title: "Panoramic Landscape",   altText: "Resort scenic landscape view",       image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80" },
  { _id: "n02", category: "Nature", title: "Valley Sunrise",        altText: "Misty mountain landscape",           image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80" },
  { _id: "n03", category: "Nature", title: "Forest Trail",          altText: "Lush green forest pathway",          image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80" },
  { _id: "n04", category: "Nature", title: "Garden Bloom",          altText: "Colourful resort garden flowers",    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80" },
  { _id: "n05", category: "Nature", title: "Hilltop View",          altText: "Scenic hilltop overlooking valley",  image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80" },
  { _id: "n06", category: "Nature", title: "Waterfall Walk",        altText: "Natural waterfall in resort grounds",image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80" },
  { _id: "n07", category: "Nature", title: "Bird's Eye Greenery",   altText: "Aerial view of green resort",        image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=900&q=80" },
  { _id: "n08", category: "Nature", title: "Sunrise Mist",          altText: "Early morning mist over hills",      image: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=900&q=80" },
  { _id: "n09", category: "Nature", title: "Evening Sky",           altText: "Golden hour sunset over resort",     image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=900&q=80" },

  // ── Events (7 photos) ────────────────────────────────────────────────────
  { _id: "e01", category: "Events", title: "Grand Event Hall",      altText: "Large decorated event hall",         image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80" },
  { _id: "e02", category: "Events", title: "Corporate Conference",  altText: "Professional conference setup",      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80" },
  { _id: "e03", category: "Events", title: "Wedding Ceremony",      altText: "Elegant outdoor wedding setup",      image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80" },
  { _id: "e04", category: "Events", title: "Banquet Hall",          altText: "Decorated banquet dining hall",      image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80" },
  { _id: "e05", category: "Events", title: "Outdoor Gathering",     altText: "Guests at an outdoor garden event",  image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80" },
  { _id: "e06", category: "Events", title: "Family Celebration",    altText: "Joyful family gathering event",      image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80" },
  { _id: "e07", category: "Events", title: "Stage & Podium",        altText: "Stage setup for event presentation", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80" },
];

// ── Animation variants ────────────────────────────────────────────────────────
const itemAnim = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// ── Hierarchical layout config: [colSpan, rowSpan] for each of the 9 positions ─
// Grid is 5 columns × 3 rows
// Pos 0: large hero (2col × 2row) — top-left
// Pos 1: wide   (3col × 1row) — top-right
// Pos 2: medium (2col × 1row) — middle-right
// Pos 3: small  (1col × 1row) — middle far-right
// Pos 4-8: 5 equal cells across row 3
const LAYOUT = [
  [2, 2], // big hero
  [3, 1], // wide top-right
  [2, 1], // medium mid-right
  [1, 1], // small mid far-right
  [1, 1], // row3 col1
  [1, 1], // row3 col2
  [1, 1], // row3 col3
  [1, 1], // row3 col4
  [1, 1], // row3 col5
];

// ── Single photo tile ─────────────────────────────────────────────────────────
function PhotoTile({ photo, colSpan, rowSpan }) {
  return (
    <motion.div
      variants={itemAnim}
      className="group relative overflow-hidden rounded-2xl cursor-pointer bg-[#e8e0d4]"
      style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
    >
      <Image
        src={photo.image}
        alt={photo.altText || photo.title || "Gallery photo"}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0
        opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      {/* Category pill */}
      <div className="absolute top-3.5 left-3.5 opacity-0 group-hover:opacity-100
        translate-y-1 group-hover:translate-y-0 transition-all duration-300">
        <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.18em] font-semibold
          px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20`}>
          {photo.category}
        </span>
      </div>

      {/* Title */}
      {photo.title && (
        <div className="absolute bottom-0 inset-x-0 p-4
          translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
          transition-all duration-350 ease-out">
<<<<<<< HEAD
          <p className={`${cinzel.className} text-white font-medium leading-tight drop-shadow-lg
            ${colSpan >= 2 ? "text-[1.05rem]" : "text-[0.8rem]"}`}>
=======
          <p className={`${lora.className} text-white text-[${featured ? "1.1rem" : "0.9rem"}]
            font-medium leading-tight drop-shadow-lg`}>
>>>>>>> 7eef8cd6ca348c1200fd589268c5fde405d90434
            {photo.title}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GallerySection({ photos = [] }) {
  const headerRef = useRef(null);
  const isInView  = useInView(headerRef, { once: true, margin: "-60px" });

  const source = photos.length >= 9 ? photos : STATIC_PHOTOS;

  const categories = ["All", ...Array.from(new Set(source.map((p) => p.category))).sort()];
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? source : source.filter((p) => p.category === active);

  // Always show up to 9 items for the hierarchical layout
  const grid = filtered.slice(0, 9);

  return (
    <section className="relative bg-[#f8f4ee] py-20 md:py-28 lg:py-32 overflow-hidden">

      {/* Noise texture */}
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

        {/* ── Category Names (horizontal) ── */}
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

<<<<<<< HEAD
          <span className={`${sans.className} ml-auto shrink-0 text-[9.5px] text-[#bbb] pl-4`}>
=======
          {/* Photo count */}
          <span className={`${josefin.className} ml-auto shrink-0 text-[9.5px] text-[#bbb] pl-4`}>
>>>>>>> 7eef8cd6ca348c1200fd589268c5fde405d90434
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
            {/* Desktop: 5-col × 3-row hierarchical grid */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              initial="hidden"
              animate="show"
              className="hidden md:grid gap-3"
              style={{
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "220px 220px 200px",
              }}
            >
              {grid.map((photo, i) => {
                const [colSpan, rowSpan] = LAYOUT[i] ?? [1, 1];
                return (
                  <PhotoTile
                    key={photo._id}
                    photo={photo}
                    colSpan={colSpan}
                    rowSpan={rowSpan}
                  />
                );
              })}
            </motion.div>

            {/* Mobile: 2-col grid */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
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
