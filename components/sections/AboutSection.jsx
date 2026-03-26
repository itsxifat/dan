"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Cormorant, DM_Sans, Cormorant_Garamond } from "next/font/google";

const cinzel    = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans      = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["italic", "normal"] });

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

function FeatureCard({ number, title, desc }) {
  return (
    <motion.div variants={fadeUp}
      className="group pl-5 border-l-2 border-[#7A2267]/20 hover:border-[#7A2267] transition-colors duration-300"
    >
      <p className={`${cormorant.className} text-[11px] text-[#7A2267]/50 tracking-widest mb-1 font-normal`}>{number}</p>
      <p className={`${sans.className} text-[13px] font-semibold text-[#1a1309] mb-1`}>{title}</p>
      <p className={`${sans.className} text-[12px] font-light text-[#7a6a52] leading-relaxed`}>{desc}</p>
    </motion.div>
  );
}

export default function AboutSection() {
  const ref      = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative bg-[#f8f4ee] overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-20 md:pt-28 pb-12 md:pb-16 text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex flex-col items-center gap-5"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <div className="h-px w-10 bg-[#7A2267]/40" />
            <span className={`${sans.className} text-[10px] uppercase tracking-[0.35em] text-[#7A2267] font-medium`}>
              Our Story
            </span>
            <div className="h-px w-10 bg-[#7A2267]/40" />
          </motion.div>

          {/* Heading */}
          <motion.h2 variants={fadeUp}
            className={`${cinzel.className} text-[2.6rem] sm:text-[3.4rem] lg:text-[4rem] xl:text-[4.4rem]
              font-400 text-[#1a1309] leading-[1.1] tracking-[-0.02em] max-w-3xl`}>
            Where Nature Becomes{" "}
            <em className={`${cormorant.className} italic text-[#7A2267] font-500`}>Your Sanctuary</em>
          </motion.h2>

          {/* Sub */}
          <motion.p variants={fadeUp}
            className={`${sans.className} text-[13.5px] font-light text-[#9b8e78] max-w-md leading-relaxed`}>
            Dhali&apos;s Amber Nivaas — a halal-friendly retreat where every detail is an act of care.
          </motion.p>
        </motion.div>
      </div>

      {/* ── IMAGE TRIPTYCH ──────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12"
      >
        {/* Mobile: single hero image */}
        <motion.div variants={scaleIn}
          className="sm:hidden relative rounded-2xl overflow-hidden h-70">
          <Image
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80"
            alt="Resort exterior"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#1a1309]/60 via-transparent to-transparent" />
          <div className="absolute bottom-5 inset-x-0 text-center">
            <p className={`${cormorant.className} text-[1.05rem] italic text-white/80`}>
              &ldquo;A sanctuary of serenity&rdquo;
            </p>
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5">
            <p className={`${sans.className} text-[8px] uppercase tracking-[0.28em] text-white whitespace-nowrap`}>Est. 2015</p>
          </div>
        </motion.div>

        {/* SM+: Full triptych */}
        <div className="hidden sm:flex items-end gap-3 sm:gap-4 h-90 lg:h-115">

          {/* Left — shorter, bottom-aligned */}
          <motion.div variants={scaleIn}
            className="relative flex-1 h-4/5 rounded-2xl sm:rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
              alt="Luxury room interior"
              fill
              sizes="(max-width: 1024px) 33vw, 28vw"
              className="object-cover hover:scale-105 transition-transform duration-[2.5s] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/55 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className={`${sans.className} text-[9px] uppercase tracking-widest text-white/70`}>Accommodation</p>
            </div>
          </motion.div>

          {/* Center — full height */}
          <motion.div variants={scaleIn}
            className="relative flex-[1.2] h-full rounded-2xl sm:rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
              alt="Resort exterior"
              fill
              sizes="(max-width: 1024px) 40vw, 34vw"
              className="object-cover hover:scale-105 transition-transform duration-[2.5s] ease-out"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/40 via-transparent to-transparent" />
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/15 border border-white/20 rounded-full px-5 py-2">
              <p className={`${sans.className} text-[9px] uppercase tracking-[0.28em] text-white whitespace-nowrap`}>Est. 2015</p>
            </div>
            <div className="absolute bottom-5 inset-x-0 text-center">
              <p className={`${cormorant.className} text-[1.05rem] italic text-white/80`}>
                &ldquo;A sanctuary of serenity&rdquo;
              </p>
            </div>
          </motion.div>

          {/* Right — shorter, bottom-aligned */}
          <motion.div variants={scaleIn}
            className="relative flex-1 h-4/5 rounded-2xl sm:rounded-3xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"
              alt="Resort garden and recreation"
              fill
              sizes="(max-width: 1024px) 33vw, 28vw"
              className="object-cover hover:scale-105 transition-transform duration-[2.5s] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1309]/55 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className={`${sans.className} text-[9px] uppercase tracking-widest text-white/70`}>Recreation</p>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* ── STORY + FEATURES ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — Quote + body + CTA */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            className="space-y-7"
          >
            <motion.blockquote variants={fadeUp}
              className={`${cormorant.className} text-[1.5rem] sm:text-[1.75rem] lg:text-[1.95rem]
                italic text-[#1a1309] leading-[1.45] font-400`}>
              &ldquo;Where the stillness of nature meets the warmth of heartfelt service.&rdquo;
            </motion.blockquote>

            <motion.div variants={fadeUp} className="h-px bg-gradient-to-r from-[#7A2267]/30 to-transparent" />

            <motion.p variants={fadeUp}
              className={`${sans.className} text-[13.5px] font-light text-[#6b5e4a] leading-[1.95]`}>
              Nestled amid serene landscapes, Dhali&apos;s Amber Nivaas was born from a simple vision —
              to create a retreat that honours the beauty of nature and the values of every guest.
              We are a proudly halal-certified resort, where every meal, every experience, and every
              corner of our property reflects our unwavering commitment to inclusivity and excellence.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-1">
              <a href="/accommodation"
                className={`${sans.className} inline-flex items-center gap-3
                  px-6 py-3 rounded-full bg-[#1a1309] text-white
                  text-[11px] font-semibold uppercase tracking-[0.2em]
                  hover:bg-[#7A2267] transition-all duration-300 group shadow-md`}>
                Explore Rooms
                <svg viewBox="0 0 16 10" width="12" height="12" fill="none"
                  className="group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="/booking"
                className={`${sans.className} inline-flex items-center px-6 py-3 rounded-full
                  border border-[#1a1309]/25 text-[#1a1309]
                  text-[11px] font-semibold uppercase tracking-[0.2em]
                  hover:border-[#7A2267] hover:text-[#7A2267] transition-all duration-300`}>
                Book a Stay
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Feature grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={isInView ? "show" : "hidden"}
            className="grid grid-cols-1 sm:grid-cols-2 gap-7 lg:pt-2"
          >
            <FeatureCard number="01" title="Peaceful Surroundings"
              desc="Far from city noise, wrapped in nature's undisturbed calm and fresh air." />
            <FeatureCard number="02" title="Halal Certified"
              desc="Every meal is 100% halal — a promise we keep without compromise." />
            <FeatureCard number="03" title="Premium Accommodation"
              desc="Thoughtfully appointed suites crafted for rest, comfort, and beauty." />
            <FeatureCard number="04" title="Curated Experiences"
              desc="Nature walks, recreation, and local discoveries tailored for you." />
          </motion.div>

        </div>
      </div>

      {/* ── STATS STRIP ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-5 sm:mx-8 lg:mx-12 mb-16 md:mb-24 max-w-7xl lg:mx-auto"
      >
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=50"
              alt=""
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#1a1309]/88" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:py-10
            grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0">
            {[
              { value: "500+",  label: "Happy Guests" },
              { value: "4.9★", label: "Average Rating" },
              { value: "10+",  label: "Years of Service" },
              { value: "100%", label: "Halal Certified" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex flex-col items-center text-center relative">
                {i < arr.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-px bg-white/10 hidden sm:block" />
                )}
                <span className={`${cinzel.className} text-[2rem] sm:text-[2.4rem] font-semibold text-white leading-none`}>
                  {s.value}
                </span>
                <span className={`${sans.className} text-[9.5px] uppercase tracking-[0.22em] text-white/60 mt-2 font-medium`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </section>
  );
}
