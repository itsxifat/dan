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
  { _id:"c1", category:"Hot Beverages", name:"Kashmiri Chai", description:"Aromatic pink tea with milk and cardamom", price:120, isPopular:true, isVeg:true },
  { _id:"c2", category:"Hot Beverages", name:"Masala Tea", description:"Classic spiced milk tea", price:80, isPopular:false, isVeg:true },
  { _id:"c3", category:"Hot Beverages", name:"Café Latte", description:"Smooth espresso with steamed milk", price:150, isPopular:true, isVeg:true },
  { _id:"c4", category:"Hot Beverages", name:"Ginger Honey Tea", description:"Soothing blend of ginger root and pure honey", price:100, isPopular:false, isVeg:true },
  { _id:"c5", category:"Cold Beverages", name:"Mango Lassi", description:"Chilled mango blended with yogurt", price:130, isPopular:true, isVeg:true },
  { _id:"c6", category:"Cold Beverages", name:"Fresh Lime Soda", description:"Zesty citrus with sparkling water", price:90, isPopular:false, isVeg:true },
  { _id:"c7", category:"Cold Beverages", name:"Watermelon Cooler", description:"Fresh watermelon juice with mint", price:110, isPopular:false, isVeg:true },
  { _id:"c8", category:"Snacks & Bites", name:"Chicken Shawarma Roll", description:"Tender grilled chicken with garlic sauce in flatbread", price:220, isPopular:true, isVeg:false },
  { _id:"c9", category:"Snacks & Bites", name:"Vegetable Samosa", description:"Crispy pastry with spiced potato filling", price:80, isPopular:false, isVeg:true },
  { _id:"c10",category:"Snacks & Bites", name:"Club Sandwich", description:"Toasted bread with grilled chicken, lettuce and cheese", price:200, isPopular:true, isVeg:false },
  { _id:"c11",category:"Snacks & Bites", name:"French Fries", description:"Golden crispy fries with dipping sauce", price:120, isPopular:false, isVeg:true },
  { _id:"c12",category:"Desserts", name:"Chocolate Lava Cake", description:"Warm chocolate cake with molten centre", price:180, isPopular:true, isVeg:true },
  { _id:"c13",category:"Desserts", name:"Gulab Jamun", description:"Soft milk dumplings in rose syrup", price:100, isPopular:false, isVeg:true },
  { _id:"c14",category:"Desserts", name:"Mango Cheesecake", description:"Creamy cheesecake with mango coulis", price:200, isPopular:true, isVeg:true },
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
      className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#ede5d8]
        hover:border-[#c9a96e]/40 hover:shadow-md hover:shadow-black/5
        transition-all duration-300 group">
      {item.image ? (
        <div className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#f0ebe0]">
          <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div className="shrink-0 w-16 h-16 rounded-xl bg-[#f0ebe0] flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"
              stroke="#c9a96e" strokeWidth="1.4"/>
            <path d="M6 1v3M10 1v3M14 1v3" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`${sans.className} text-[13px] font-semibold text-[#1a1309] leading-snug`}>
              {item.name}
            </p>
            {item.isPopular && (
              <span className={`${sans.className} text-[8px] uppercase tracking-wider font-semibold
                px-2 py-0.5 rounded-full bg-[#c9a96e]/15 text-[#a07a3a] border border-[#c9a96e]/25`}>
                Popular
              </span>
            )}
            {item.isVeg && (
              <span className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </span>
            )}
          </div>
          <p className={`${sans.className} text-[13px] font-semibold text-[#c9a96e] shrink-0`}>
            ৳{item.price}
          </p>
        </div>
        {item.description && (
          <p className={`${sans.className} text-[11px] font-light text-[#7a6a52] mt-1 leading-relaxed`}>
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function CafeContent({ menuItems = [] }) {
  const source  = menuItems.length > 0 ? menuItems : STATIC_MENU;
  const grouped = groupByCategory(source);
  const cats    = Object.keys(grouped);
  const [active, setActive] = useState("All");

  const displayCats = ["All", ...cats];
  const displayItems = active === "All" ? source : (grouped[active] || []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative min-h-[55vh] flex flex-col justify-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80"
          alt="Amber Café" fill priority sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1309]/20 via-[#1a1309]/40 to-[#1a1309]/80" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-12 md:pb-16 pt-28">
          <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl">
            <motion.div variants={fadeUp}
              className={`${sans.className} flex items-center gap-2 text-[10.5px] text-white/40 mb-5`}>
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/facilities" className="hover:text-white/70 transition-colors">Facilities</Link>
              <span>/</span>
              <span className="text-[#c9a96e]">Amber Café</span>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-4">
              <div className="h-px w-10 bg-[#c9a96e]/60" />
              <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.3em] font-semibold text-[#c9a96e]`}>
                Casual & Cosy
              </p>
            </motion.div>

            <motion.h1 variants={fadeUp}
              className={`${playfair.className} text-[2.6rem] sm:text-[3.4rem] lg:text-[4.2rem]
                text-white leading-[1.1] tracking-[-0.01em]`}>
              Amber{" "}
              <em className={`${cormorant.className} not-italic text-[#c9a96e]`}>Café</em>
            </motion.h1>

            <motion.p variants={fadeUp}
              className={`${sans.className} text-[13px] font-light text-white/60 leading-[1.85] mt-4 max-w-lg`}>
              A warm corner to unwind with freshly brewed beverages, homemade pastries, and halal-certified bites — all day, every day.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Info strip ── */}
      <section className="bg-[#1a1309]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-6
          grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
          {[
            { label: "Hours", value: "7 AM – 11 PM" },
            { label: "Seating", value: "Indoor & Terrace" },
            { label: "Kitchen", value: "Halal Certified" },
            { label: "Order", value: "Dine-in & Takeaway" },
          ].map((s, i, arr) => (
            <div key={s.label} className={`flex flex-col items-center text-center relative
              ${i < arr.length - 1 ? "md:border-r md:border-white/10" : ""}`}>
              <p className={`${playfair.className} text-[1.35rem] text-white`}>{s.value}</p>
              <p className={`${sans.className} text-[9px] uppercase tracking-[0.2em] text-white/35 mt-1`}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Menu ── */}
      <section className="bg-[#f8f4ee] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

          {/* Header */}
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="h-px w-10 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.28em] font-semibold text-[#c9a96e]`}>
              Our Menu
            </p>
            <div className="h-px w-10 bg-[#c9a96e]/50" />
          </div>
          <h2 className={`${playfair.className} text-[1.9rem] sm:text-[2.4rem] text-[#1a1309] text-center mb-10 leading-[1.2]`}>
            What We Serve
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
                    ? "bg-[#1a1309] text-[#c9a96e]"
                    : "text-[#aaa] hover:text-[#555] hover:bg-white/60"
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
            <p className={`${sans.className} text-center text-[13px] text-[#aaa] py-16`}>
              No items in this category yet.
            </p>
          )}

          {/* Halal note */}
          <div className="mt-12 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-emerald-50 border border-emerald-200">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                <path d="M8 1.5l5 2v4.5c0 3-2.333 5.667-5 6.5-2.667-0.833-5-3.5-5-6.5V3.5l5-2z"
                  fill="none" stroke="#16a34a" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M5.5 8l2 2 3-3" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.18em] text-emerald-700 font-semibold`}>
                100% Halal Certified Kitchen
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Also visit ── */}
      <section className="bg-white py-14 md:py-18">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
          <p className={`${sans.className} text-[9.5px] uppercase tracking-[0.28em] text-[#c9a96e] font-semibold mb-3`}>
            Also at Amber Nivaas
          </p>
          <h2 className={`${playfair.className} text-[1.8rem] sm:text-[2.2rem] text-[#1a1309] mb-6`}>
            Experience Fine Dining at{" "}
            <em className={`${cormorant.className} not-italic text-[#7A2267]`}>Amber Restaurant</em>
          </h2>
          <p className={`${sans.className} text-[13px] font-light text-[#7a6a52] max-w-md mx-auto mb-8 leading-[1.85]`}>
            For an elevated dining experience with panoramic garden views and curated seasonal menus.
          </p>
          <Link href="/dining/amber-restaurant"
            className={`${sans.className} inline-flex items-center gap-3 px-8 py-3.5 rounded-full
              bg-[#7A2267] text-white text-[11px] font-semibold uppercase tracking-[0.18em]
              hover:bg-[#8a256f] transition-colors duration-300 group`}>
            View Amber Restaurant
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
