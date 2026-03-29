"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const itemUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

const PLACEHOLDER_PROPERTIES = [
  {
    _id: "placeholder-1",
    name: "The Garden Villa",
    slug: "garden-villa",
    type: "cottage",
    tagline: "A serene retreat surrounded by tropical greenery and birdsong.",
    coverImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    roomStats: { total: 0, available: 0 },
  },
  {
    _id: "placeholder-2",
    name: "Amber View Suite",
    slug: "amber-view-suite",
    type: "building",
    tagline: "Panoramic nature views from a thoughtfully appointed luxury suite.",
    coverImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe2e2?auto=format&fit=crop&w=800&q=80",
    roomStats: { total: 6, available: 3 },
  },
  {
    _id: "placeholder-3",
    name: "Forest Bungalow",
    slug: "forest-bungalow",
    type: "cottage",
    tagline: "Wake up to forest sounds in this cosy, private woodland escape.",
    coverImage: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    roomStats: { total: 0, available: 0 },
  },
];

function TypeBadge({ type }) {
  const label = type === "building" ? "Building" : "Cottage";
  return (
    <span className={`${josefin.className} text-[9px] uppercase tracking-[0.2em] font-semibold
      px-2.5 py-1 rounded-full backdrop-blur-md
      bg-[#1a1309]/60 text-[#c084b8] border border-[#7A2267]/30`}>
      {label}
    </span>
  );
}

function PropertyCard({ property }) {
  const imgSrc = property.coverImage || FALLBACK_IMAGE;
  const isBuilding = property.type === "building";
  const roomCount = property.roomStats?.available ?? 0;
  const totalRooms = property.roomStats?.total ?? 0;

  return (
    <motion.div
      variants={itemUp}
      className="group relative bg-white rounded-2xl overflow-hidden
        shadow-[0_4px_20px_-4px_rgba(26,19,9,0.10)]
        hover:shadow-[0_20px_50px_-10px_rgba(26,19,9,0.22)]
        transition-all duration-500 hover:-translate-y-1.5
        flex-shrink-0 w-[85vw] sm:w-[380px] md:w-auto"
    >
      {/* Image */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={imgSrc}
          alt={property.name}
          className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/40 via-transparent to-transparent" />
        {/* Type badge */}
        <div className="absolute top-4 right-4">
          <TypeBadge type={property.type} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-3">
        {/* Property name */}
        <h3 className={`${lora.className} text-[1.25rem] font-500 text-[#1a1309] leading-snug`}>
          {property.name}
        </h3>

        {/* Tagline */}
        {property.tagline && (
          <p className={`${lora.className} text-[15px] italic text-[#7a6a52] leading-relaxed`}>
            {property.tagline}
          </p>
        )}

        {/* Room hint */}
        <p className={`${josefin.className} text-[11px] font-medium text-[#9b8e78] uppercase tracking-[0.15em]`}>
          {isBuilding
            ? totalRooms > 0
              ? `${roomCount} of ${totalRooms} rooms available`
              : "Rooms available"
            : "Private cottage"}
        </p>

        {/* Divider */}
        <div className="h-px bg-[#e8e0d4]" />

        {/* CTA */}
        <Link
          href={`/accommodation/${property.slug}`}
          className={`${josefin.className} inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em]
            font-semibold text-[#7A2267] hover:text-[#1a1309] transition-colors duration-200 group/link`}
        >
          Explore
          <svg viewBox="0 0 16 10" width="12" height="12" fill="none"
            className="group-hover/link:translate-x-1 transition-transform duration-200">
            <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

export default function RoomsSection({ properties }) {
  const ref    = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const displayProperties =
    Array.isArray(properties) && properties.length > 0
      ? properties
      : PLACEHOLDER_PROPERTIES;

  return (
    <section ref={ref} className="relative bg-white overflow-hidden py-20 md:py-28 lg:py-32">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(122,34,103,0.05) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Heading & description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-4"
        >
          <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
            font-500 text-[#1a1309] leading-[1.15]`}>
            Choose Your{" "}
            <em className={`${lora.className} not-italic text-[#7A2267]`}>Perfect Sanctuary</em>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className={`${josefin.className} text-center text-[13.5px] font-light text-[#7a6a52] max-w-xl mx-auto mb-14 leading-[1.85]`}
        >
          From private cottages nestled in greenery to suite-style rooms with sweeping views —
          each stay is crafted for comfort, elegance, and lasting memories.
        </motion.p>

        {/* Cards — horizontal scroll on mobile, 3-col grid on desktop */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible
            pb-4 md:pb-0 -mx-5 md:mx-0 px-5 md:px-0
            snap-x snap-mandatory md:snap-none scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {displayProperties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </motion.div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mt-12"
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
    </section>
  );
}
