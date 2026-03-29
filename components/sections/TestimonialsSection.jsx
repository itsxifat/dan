"use client";

import { useRef } from "react";
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

const testimonials = [
  {
    quote:
      "The peace and quiet of Amber Nivaas is unlike anything I've experienced. Woke up to birdsong and a view of endless green. Truly restored my soul.",
    name: "Rahul Sharma",
    stayed: "January 2025",
    initials: "RS",
    avatarColor: "#7A2267",
  },
  {
    quote:
      "The staff remembered our names from day one. Every detail was taken care of — from the room temperature to surprise flower arrangements. Exceptional service.",
    name: "Priya & Vikash M.",
    stayed: "December 2024",
    initials: "PV",
    avatarColor: "#c9a96e",
  },
  {
    quote:
      "We visited for the day-long package and ended up booking a 3-night stay on the spot. The rooms are gorgeous and the dining is world-class.",
    name: "Tanvir Ahmed",
    stayed: "February 2025",
    initials: "TA",
    avatarColor: "#4a7a56",
  },
];

function StarRating() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 stars">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="text-[#9d3a8a] text-base leading-none">★</span>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <motion.div
      variants={itemUp}
      className="bg-white border border-[#ede5d8] rounded-3xl px-7 py-8 flex flex-col gap-5
        shadow-[0_4px_20px_-4px_rgba(26,19,9,0.07)]
        hover:border-[#7A2267]/50 hover:shadow-[0_12px_40px_-8px_rgba(122,34,103,0.18)]
        transition-all duration-300
        flex-shrink-0 w-[88vw] sm:w-[360px] md:w-auto snap-start"
    >
      {/* Stars */}
      <StarRating />

      {/* Opening quote mark */}
      <div
        className={`${lora.className} text-[5rem] leading-none text-[#9d3a8a] font-400 -mb-6 -mt-2 select-none`}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      {/* Quote */}
      <p className={`${lora.className} text-[1.05rem] italic text-[#3d3427] leading-[1.75]`}>
        {testimonial.quote}
      </p>

      {/* Divider */}
      <div className="h-px bg-[#ede5d8]" />

      {/* Guest info */}
      <div className="flex items-center gap-4">
        {/* Avatar circle with initials */}
        <div
          className={`${lora.className} w-11 h-11 rounded-full flex items-center justify-center
            text-white font-semibold text-sm shrink-0`}
          style={{ backgroundColor: testimonial.avatarColor }}
          aria-hidden="true"
        >
          {testimonial.initials}
        </div>
        <div>
          <p className={`${josefin.className} text-[13px] font-semibold text-[#1a1309]`}>
            {testimonial.name}
          </p>
          <p className={`${josefin.className} text-[11px] font-light text-[#9b8e78] mt-0.5`}>
            Stayed: {testimonial.stayed}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const ref    = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative bg-white overflow-hidden py-20 md:py-28 lg:py-32">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(122,34,103,0.05) 0%, transparent 65%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <h2 className={`${lora.className} text-[2rem] sm:text-[2.6rem] lg:text-[3rem]
            font-500 text-[#1a1309] leading-[1.15]`}>
            Words From Our{" "}
            <em className={`${lora.className} not-italic text-[#7A2267]`}>Happy Guests</em>
          </h2>
        </motion.div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible
            pb-4 md:pb-0 -mx-5 md:mx-0 px-5 md:px-0
            snap-x snap-mandatory md:snap-none"
          style={{ scrollbarWidth: "none" }}
        >
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
