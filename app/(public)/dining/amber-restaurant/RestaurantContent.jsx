"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";

const playfair  = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const sans      = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["italic"] });

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22,1,0.36,1] } } };
const stagger= { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.02 } } };

// Static fallback menu
const STATIC_MENU = [
  { _id:"r1",  category:"Starters",   name:"Chicken Shorba",          description:"Slow-cooked aromatic chicken broth with herbs and spices",   price:180, isPopular:true},
  { _id:"r2",  category:"Starters",   name:"Garden Salad",            description:"Fresh seasonal greens with house lemon dressing",             price:150, isPopular:false},
  { _id:"r3",  category:"Starters",   name:"Beef Seekh Kebab",        description:"Minced beef patties grilled over charcoal, served with chutney", price:280, isPopular:true},
  { _id:"r4",  category:"Starters",   name:"Paneer Tikka",            description:"Marinated cottage cheese cubes flame-grilled to perfection",   price:220, isPopular:false},
  { _id:"r5",  category:"Main Course", name:"Kacchi Biryani",         description:"Slow-cooked layered rice with tender mutton and saffron",       price:420, isPopular:true},
  { _id:"r6",  category:"Main Course", name:"Chicken Rezala",         description:"Aromatic white curry with yogurt, cream and whole spices",      price:350, isPopular:true},
  { _id:"r7",  category:"Main Course", name:"Grilled Fish Fillet",    description:"Fresh catch marinated with herbs and grilled to perfection",    price:480, isPopular:false},
  { _id:"r8",  category:"Main Course", name:"Lamb Rogan Josh",        description:"Kashmiri-style lamb braised in a rich tomato-onion masala",     price:520, isPopular:true},
  { _id:"r9",  category:"Main Course", name:"Mixed Vegetable Handi",  description:"Seasonal vegetables slow-cooked with fragrant spices",         price:280, isPopular:false},
  { _id:"r10", category:"Main Course", name:"Beef Haleem",            description:"Slow-cooked wheat and beef stew, a house speciality",          price:380, isPopular:false},
  { _id:"r11", category:"Desserts",   name:"Shahi Firni",             description:"Chilled rose-scented rice pudding in clay cups",               price:150, isPopular:true},
  { _id:"r12", category:"Desserts",   name:"Mango Kulfi",             description:"Traditional Indian ice cream with alphonso mango",             price:160, isPopular:true},
  { _id:"r13", category:"Desserts",   name:"Gulab Jamun",             description:"Soft milk dumplings in warm rose syrup",                       price:120, isPopular:false},
  { _id:"r14", category:"Desserts",   name:"Kheer",                   description:"Creamy slow-cooked rice pudding with cardamom and nuts",        price:130, isPopular:false},
  { _id:"r15", category:"Beverages",  name:"Fresh Lime Juice",        description:"Chilled pressed lime with a hint of sea salt",                 price:100, isPopular:false},
  { _id:"r16", category:"Beverages",  name:"Sugarcane Juice",         description:"Freshly pressed seasonal sugarcane with ginger",               price:90,  isPopular:true},
];

function groupByCategory(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

function MenuCard({ item }) {
  return (
    <motion.div variants={fadeUp}
      className="flex items-start gap-4 p-4 rounded-2xl bg-[#1a1309]/50 border border-white/[0.06]
        hover:border-[#c9a96e]/30 hover:bg-[#1a1309]/70
        transition-all duration-300 group">
      {item.image ? (
        <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#2a1f10]">
          <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-16 h-16 rounded-xl bg-[#2a1f10] border border-white/[0.06]
          flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M3 2v7c0 2.2 1.8 4 4 4v9M7 2v7M11 2v7" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M17 2c0 0 0 9-2 10v8" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`${sans.className} text-[13px] font-semibold text-white leading-snug`}>
              {item.name}
            </p>
            {item.isPopular && (
              <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold
                px-2 py-0.5 rounded-full bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/25`}>
                Chef's Pick
              </span>
            )}
          </div>
          <p className={`${sans.className} text-[13px] font-semibold text-[#c9a96e] shrink-0`}>
            ৳{item.price}
          </p>
        </div>
        {item.description && (
          <p className={`${sans.className} text-[11px] font-light text-white/40 mt-1 leading-relaxed`}>
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function RestaurantContent({ menuItems = [] }) {
  const source  = menuItems.length > 0 ? menuItems : STATIC_MENU;
  const grouped = groupByCategory(source);
  const cats    = Object.keys(grouped);
  const [active, setActive] = useState("All");

  const displayCats  = ["All", ...cats];
  const displayItems = active === "All" ? source : (grouped[active] || []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] flex flex-col justify-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80"
          alt="Amber Restaurant" fill priority sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1309]/30 via-[#1a1309]/55 to-[#1a1309]/90" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-14 md:pb-20 pt-28">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl">
<motion.h1 variants={fadeUp}
              className={`${playfair.className} text-[2.6rem] sm:text-[3.4rem] lg:text-[4.2rem]
                text-white leading-[1.1] tracking-[-0.01em]`}>
              Amber{" "}
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Restaurant</em>
            </motion.h1>

            <motion.p variants={fadeUp}
              className={`${sans.className} text-[13px] font-light text-white/55 leading-[1.85] mt-4 max-w-lg`}>
              An elevated dining experience where local flavours meet artisan cooking — crafted with seasonal
              ingredients, genuine care, and panoramic garden views.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Info strip ── */}
      <section className="bg-[#0e0a05] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-5
          flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:gap-x-14">
          {[
            {
              label: "Opening Hours", value: "7 AM – 10 PM",
              icon: <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5v4l2.5 2.5"/></svg>,
            },
            {
              label: "Seating", value: "Indoor & Garden",
              icon: <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-3a6 6 0 0 1 12 0v3M1 14h16M6 14v2M12 14v2"/></svg>,
            },
            {
              label: "Kitchen", value: "100% Halal",
              icon: <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1l6 2.5v5.5c0 3.5-2.7 6.5-6 7.5-3.3-1-6-4-6-7.5V3.5L9 1z"/><path d="M6.5 9l2 2 3-3"/></svg>,
            },
            {
              label: "Reservations", value: "Recommended",
              icon: <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="14" height="13" rx="2"/><path d="M6 1v3M12 1v3M2 8h14"/></svg>,
            },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <div className="text-white/25">{s.icon}</div>
              <div>
                <p className={`${sans.className} text-[8.5px] uppercase tracking-[0.22em] text-white/30 leading-none mb-0.5`}>{s.label}</p>
                <p className={`${sans.className} text-[12px] font-medium text-white/70`}>{s.value}</p>
              </div>
              {i < arr.length - 1 && <div className="hidden md:block w-px h-6 bg-white/10 ml-8 md:ml-14" style={{marginLeft: 0}} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Menu ── */}
      <section className="bg-[#1a1309] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          {/* Header */}
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="h-px w-10 bg-[#c9a96e]/40" />
            <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
              Our Menu
            </p>
            <div className="h-px w-10 bg-[#c9a96e]/40" />
          </div>
          <h2 className={`${playfair.className} text-[1.9rem] sm:text-[2.4rem] text-white text-center mb-10 leading-[1.2]`}>
            A Curated{" "}
            <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Selection</em>
          </h2>

          {/* Category tabs */}
          <div className="flex items-center gap-0.5 mb-10 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ scrollbarWidth:"none" }}>
            {displayCats.map((cat) => (
              <button key={cat}
                onClick={() => setActive(cat)}
                className={`${sans.className} relative shrink-0 px-4 py-2.5 text-[10.5px] uppercase
                  tracking-[0.15em] font-medium transition-colors duration-200 whitespace-nowrap rounded-lg
                  ${active === cat
                    ? "bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30"
                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
                  }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <AnimatePresence mode="wait">
            <motion.div key={active}
              variants={stagger} initial="hidden" animate="show" exit={{ opacity:0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayItems.map((item) => (
                <MenuCard key={item._id} item={item} />
              ))}
            </motion.div>
          </AnimatePresence>

          {displayItems.length === 0 && (
            <p className={`${sans.className} text-center text-[13px] text-white/30 py-16`}>
              No items in this category yet.
            </p>
          )}

          {/* Halal note */}
          <div className="mt-14 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-emerald-900/30 border border-emerald-700/30">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                <path d="M8 1.5l5 2v4.5c0 3-2.333 5.667-5 6.5-2.667-0.833-5-3.5-5-6.5V3.5l5-2z"
                  fill="none" stroke="#16a34a" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M5.5 8l2 2 3-3" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.18em] text-emerald-400 font-semibold`}>
                100% Halal Certified Kitchen
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Also visit ── */}
      <section className="bg-[#0e0a05] py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.28em] text-[#c9a96e] font-semibold mb-3`}>
            Also at Amber Nivaas
          </p>
          <h2 className={`${playfair.className} text-[1.8rem] sm:text-[2.2rem] text-white mb-6`}>
            Unwind at{" "}
            <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Amber Café</em>
          </h2>
          <p className={`${sans.className} text-[13px] font-light text-white/40 max-w-md mx-auto mb-8 leading-[1.85]`}>
            For a relaxed coffee, homemade pastries, and light bites — all day, every day.
          </p>
          <Link href="/dining/amber-cafe"
            className={`${sans.className} inline-flex items-center gap-3 px-8 py-3.5 rounded-full
              bg-[#c9a96e]/10 text-[#c9a96e] text-[11px] font-semibold uppercase tracking-[0.18em]
              border border-[#c9a96e]/25 hover:bg-[#c9a96e]/20 transition-colors duration-300 group`}>
            Visit Amber Café
            <svg viewBox="0 0 14 10" width="11" height="11" fill="none"
              className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M1 5h12M8 1l5 4-5 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
