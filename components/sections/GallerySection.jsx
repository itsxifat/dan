"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";
import { PLACEMENT_ORDER, IMAGE_SIZES } from "@/lib/galleryConstants";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ── Static fallback photos ────────────────────────────────────────────────────
const STATIC_PHOTOS = [
  { _id:"p01", category:"Swimming Pool", placement:"hero",   imageSize:"square",    title:"Iconic Infinity Pool",   altText:"Infinity pool",      image:"https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80" },
  { _id:"p02", category:"Swimming Pool", placement:"banner", imageSize:"landscape", title:"Evening Pool Glow",      altText:"Pool at dusk",        image:"https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80" },
  { _id:"p03", category:"Swimming Pool", placement:"wide",   imageSize:"landscape", title:"Serene Lap Pool",        altText:"Lap pool",            image:"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80" },
  { _id:"p04", category:"Swimming Pool", placement:"square", imageSize:"portrait",  title:"Sky Reflection Pool",    altText:"Sky reflection",      image:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80" },
  { _id:"p05", category:"Swimming Pool", placement:"square", imageSize:"landscape", title:"Family Pool",            altText:"Family swim area",    image:"https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=900&q=80" },
  { _id:"p06", category:"Swimming Pool", placement:"none",   imageSize:"landscape", title:"Poolside Lounge",        altText:"Poolside loungers",   image:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80" },
  { _id:"p07", category:"Swimming Pool", placement:"none",   imageSize:"portrait",  title:"Tropical Pool View",     altText:"Tropical pool",       image:"https://images.unsplash.com/photo-1540541338537-1220059a7e9a?auto=format&fit=crop&w=900&q=80" },
  { _id:"p08", category:"Swimming Pool", placement:"none",   imageSize:"square",    title:"Waterfall Feature Pool", altText:"Waterfall pool",      image:"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80" },
  { _id:"r01", category:"Rooms",         placement:"square", imageSize:"landscape", title:"Luxury Suite",           altText:"Luxury bedroom",      image:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80" },
  { _id:"r02", category:"Rooms",         placement:"square", imageSize:"square",    title:"Premium Double Room",    altText:"Double room",         image:"https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=900&q=80" },
  { _id:"r03", category:"Rooms",         placement:"square", imageSize:"portrait",  title:"Deluxe King Room",       altText:"King bedroom",        image:"https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80" },
  { _id:"r04", category:"Rooms",         placement:"square", imageSize:"landscape", title:"Garden View Room",       altText:"Garden view",         image:"https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80" },
  { _id:"r05", category:"Rooms",         placement:"none",   imageSize:"square",    title:"Modern Twin Room",       altText:"Twin beds",           image:"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80" },
  { _id:"r06", category:"Rooms",         placement:"none",   imageSize:"portrait",  title:"Amber Suite Bathroom",   altText:"En-suite bathroom",   image:"https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80" },
  { _id:"d01", category:"Dining",        placement:"none",   imageSize:"landscape", title:"Curated Dining",         altText:"Dining lounge",       image:"https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80" },
  { _id:"d02", category:"Dining",        placement:"none",   imageSize:"wide",      title:"Amber Restaurant",       altText:"Restaurant area",     image:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80" },
  { _id:"d03", category:"Dining",        placement:"none",   imageSize:"square",    title:"Breakfast Spread",       altText:"Breakfast buffet",    image:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80" },
  { _id:"d04", category:"Dining",        placement:"none",   imageSize:"portrait",  title:"Private Dining",         altText:"Private dining",      image:"https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=900&q=80" },
  { _id:"n01", category:"Nature",        placement:"none",   imageSize:"wide",      title:"Panoramic Landscape",    altText:"Scenic landscape",    image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80" },
  { _id:"n02", category:"Nature",        placement:"none",   imageSize:"landscape", title:"Valley Sunrise",         altText:"Misty mountains",     image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80" },
  { _id:"n03", category:"Nature",        placement:"none",   imageSize:"portrait",  title:"Garden Bloom",           altText:"Garden flowers",      image:"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80" },
  { _id:"e01", category:"Events",        placement:"none",   imageSize:"wide",      title:"Grand Event Hall",       altText:"Event hall",          image:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80" },
  { _id:"e02", category:"Events",        placement:"none",   imageSize:"landscape", title:"Wedding Ceremony",       altText:"Wedding setup",       image:"https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80" },
  { _id:"e03", category:"Events",        placement:"none",   imageSize:"portrait",  title:"Outdoor Gathering",      altText:"Outdoor event",       image:"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80" },
];

// ── Animation variants ────────────────────────────────────────────────────────
const itemAnim = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// ── Hierarchical layout: [colSpan, rowSpan] for each of 9 positions ───────────
const LAYOUT = [
  [2, 2], // hero
  [3, 1], // banner
  [2, 1], // wide
  [1, 1], // small
  [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], // row 3
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0
        opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
      <div className="absolute top-3.5 left-3.5 opacity-0 group-hover:opacity-100
        translate-y-1 group-hover:translate-y-0 transition-all duration-300">
        <span className={`${josefin.className} text-[8.5px] uppercase tracking-[0.18em] font-semibold
          px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20`}>
          {photo.category}
        </span>
      </div>
      {photo.title && (
        <div className="absolute bottom-0 inset-x-0 p-4
          translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
          transition-all duration-350 ease-out">
          <p className={`${lora.className} text-white font-medium leading-tight drop-shadow-lg
            ${colSpan >= 2 ? "text-[1.05rem]" : "text-[0.8rem]"}`}>
            {photo.title}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GallerySection({ photos = [], categories = [] }) {
  const headerRef = useRef(null);
  const isInView  = useInView(headerRef, { once: true, margin: "-60px" });

  const isRealData = photos.length > 0;
  const source = isRealData ? photos : STATIC_PHOTOS;

  // Categories: from DB + from source photos
  const allCatNames = Array.from(
    new Set([...categories, ...source.map((p) => p.category).filter(Boolean)])
  ).sort();

  const tabs = ["All", ...allCatNames];
  const [active, setActive] = useState("All");
  const isAllTab = active === "All";

  // Placed photos sorted for the hierarchical homepage grid
  const placedPhotos = [...source]
    .filter((p) => p.placement && p.placement !== "none")
    .sort((a, b) => {
      const pa = PLACEMENT_ORDER[a.placement] ?? 4;
      const pb = PLACEMENT_ORDER[b.placement] ?? 4;
      if (pa !== pb) return pa - pb;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    })
    .slice(0, 9);

  // Use hierarchical grid only when placed photos exist
  const useHierarchical = isAllTab && placedPhotos.length > 0;

  // What actually renders: placed photos when available, all source photos as fallback for "All"
  const filtered = isAllTab
    ? (placedPhotos.length > 0 ? placedPhotos : source)
    : source.filter((p) => p.category === active);

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

        {/* ── Dummy data hint ── */}
        {!isRealData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className={`${josefin.className} text-[9px] uppercase tracking-[0.22em] text-[#bbb]`}>
              Upload one image to load real data
            </span>
          </motion.div>
        )}

        <>
            {/* ── Category Tabs ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              className="flex items-center gap-1 mb-10 overflow-x-auto pb-1 -mx-1 px-1
                scrollbar-none [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {tabs.map((cat) => (
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
                {useHierarchical ? (
                  /* 5-col × 3-row hierarchical placement grid */
                  <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden" animate="show"
                    className="hidden md:grid gap-3"
                    style={{ gridTemplateColumns: "repeat(5, 1fr)", gridTemplateRows: "220px 220px 200px" }}
                  >
                    {filtered.map((photo, i) => {
                      const [colSpan, rowSpan] = LAYOUT[i] ?? [1, 1];
                      return <PhotoTile key={photo._id} photo={photo} colSpan={colSpan} rowSpan={rowSpan} />;
                    })}
                  </motion.div>
                ) : (
                  /* 4-col auto grid driven by imageSize (category tab or no-placement fallback) */
                  <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    initial="hidden" animate="show"
                    className="hidden md:grid gap-3"
                    style={{ gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "200px" }}
                  >
                    {filtered.map((photo) => {
                      const size = IMAGE_SIZES[photo.imageSize] || IMAGE_SIZES.square;
                      return <PhotoTile key={photo._id} photo={photo} colSpan={size.colSpan} rowSpan={size.rowSpan} />;
                    })}
                  </motion.div>
                )}

                {/* Mobile: 2-col square grid */}
                <motion.div
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden" animate="show"
                  className="grid md:hidden grid-cols-2 gap-2.5"
                >
                  {filtered.map((photo) => (
                    <motion.div
                      key={photo._id}
                      variants={itemAnim}
                      className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-[#e8e0d4]"
                    >
                      <Image src={photo.image} alt={photo.altText || photo.title || "Gallery photo"}
                        fill sizes="50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {photo.title && (
                        <div className="absolute bottom-0 inset-x-0 p-3
                          translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100
                          transition-all duration-300">
                          <p className={`${josefin.className} text-white text-[10px] font-medium`}>{photo.title}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Per-tab empty state */}
                {filtered.length === 0 && (
                  <div className="text-center py-16">
                    <p className={`${josefin.className} text-[12px] text-[#aaa]`}>
                      No photos in &ldquo;{active}&rdquo; yet.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
        </>

      </div>
    </section>
  );
}
