"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Lora, Josefin_Sans } from "next/font/google";
import FooterSection from "@/components/sections/FooterSection";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const EASE = [0.22, 1, 0.36, 1];

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 22 22" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2.5l7.5 4.3v8.4L11 19.5l-7.5-4.3V6.8L11 2.5z" />
      <path d="M3.5 6.8L11 11l7.5-4.2M11 11v8.5" />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3v14M6 13l4 4 4-4" />
    </svg>
  );
}

// Delivery windows quoted to the payment gateway — kept in code (not the CMS)
// so they are always present on the page.
const DELIVERY_WINDOWS = [
  { zone: "Inside Dhaka",  window: "Within 5 days",  note: "Dhaka metropolitan area" },
  { zone: "Outside Dhaka", window: "Within 10 days", note: "All other districts of Bangladesh" },
];

function DeliveryTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="mb-12 rounded-2xl border border-[#7A2267]/15 bg-[#7A2267]/[0.04] p-6 sm:p-7"
    >
      <div className="flex items-center gap-2.5 mb-2 text-[#7A2267]">
        <DeliveryIcon />
        <h2 className={`${josefin.className} text-[10px] uppercase tracking-[0.24em] font-semibold`}>
          Delivery Time
        </h2>
      </div>

      <p className={`${josefin.className} text-[12.5px] font-light text-[#5a4e42] leading-[1.9] mb-6`}>
        Booking confirmations, e-vouchers and invoices are delivered by email and SMS
        immediately after a successful payment. Where a physical document or item has to be
        couriered, it is despatched within the timeframes below, counted from the date of
        confirmed payment.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DELIVERY_WINDOWS.map(({ zone, window: win, note }) => (
          <div key={zone} className="rounded-xl bg-white border border-[#ede5d8] px-5 py-4">
            <p className={`${josefin.className} text-[9px] uppercase tracking-[0.22em]
              font-semibold text-[#9d8d7a] mb-2`}>
              {zone}
            </p>
            <p className={`${lora.className} text-[1.3rem] font-500 text-[#1a1309] leading-none mb-2`}>
              {win}
            </p>
            <p className={`${josefin.className} text-[11px] font-light text-[#7a6a52]`}>
              {note}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SectionItem({ section, index, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl
        transition-all duration-200
        ${isActive
          ? "bg-[#7A2267]/08 text-[#7A2267]"
          : "text-[#5a4e42] hover:text-[#1a1309] hover:bg-black/[0.03]"
        }`}
    >
      <span className={`text-[9px] font-semibold tracking-wider shrink-0 mt-0.5
        ${isActive ? "text-[#7A2267]" : "text-[#9d8d7a]"}`}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className={`${josefin.className} text-[11.5px] font-medium leading-snug`}>
        {section.title}
      </span>
    </button>
  );
}

export default function DeliveryContent({ doc = {}, contactInfo = {} }) {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef([]);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  const title         = doc.title         || "Delivery Policy";
  const effectiveDate = doc.effectiveDate || "";
  const intro         = doc.intro         || "";
  const sections      = doc.sections      || [];

  const lastUpdated = doc.updatedAt
    ? new Date(doc.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  function scrollToSection(idx) {
    setActiveSection(idx);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef}
        className="relative bg-[#0d0905] overflow-hidden py-28 md:py-36">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]
          rounded-full bg-[#7A2267]/[0.12] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[350px] h-[350px]
          rounded-full bg-[#7A2267]/[0.06] blur-[100px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 lg:px-14 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-[#7A2267]/15 border border-[#7A2267]/20
              flex items-center justify-center mx-auto mb-8 text-[#c084b8]"
          >
            <DeliveryIcon />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`${josefin.className} text-[9px] uppercase tracking-[0.45em] text-white/30 mb-6`}
          >
            Dhali&apos;s Amber Nivaas
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.95, delay: 0.3, ease: EASE }}
            className={`${lora.className} text-[2.6rem] sm:text-[3.4rem] lg:text-[4.2rem]
              text-white font-400 leading-[1.1] mb-6`}
          >
            {title}
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={heroInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="h-px w-16 bg-gradient-to-r from-transparent via-[#7A2267] to-transparent mx-auto mb-6 origin-center"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.6 }}
            className={`${josefin.className} text-[12.5px] font-light text-white/40 max-w-sm mx-auto leading-relaxed mb-6`}
          >
            How your booking confirmation and reserved stay are delivered to you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
          >
            {effectiveDate && (
              <p className={`${josefin.className} text-[11px] font-light text-white/35`}>
                Effective: <span className="text-white/55">{effectiveDate}</span>
              </p>
            )}
            {lastUpdated && (
              <p className={`${josefin.className} text-[11px] font-light text-white/35`}>
                Last updated: <span className="text-white/55">{lastUpdated}</span>
              </p>
            )}
          </motion.div>

          {sections.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.75 }}
              onClick={() => scrollToSection(0)}
              className={`${josefin.className} mt-10 inline-flex items-center gap-2
                text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/40
                hover:text-[#c084b8] transition-colors duration-200`}
            >
              Read Policy
              <ScrollIcon />
            </motion.button>
          )}
        </div>
      </section>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#fcfcfc] min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-14 py-16 md:py-20">
          <div className="flex gap-12 xl:gap-16">

            {/* ── TOC Sidebar ─────────────────────────────────────────────── */}
            {sections.length > 0 && (
              <aside className="hidden lg:block w-[240px] xl:w-[260px] shrink-0">
                <div className="sticky top-24">
                  <p className={`${josefin.className} text-[9px] uppercase tracking-[0.28em]
                    font-semibold text-[#9d8d7a] mb-4 px-3`}>
                    Contents
                  </p>
                  <nav className="space-y-0.5">
                    {sections.map((sec, i) => (
                      <SectionItem
                        key={i}
                        section={sec}
                        index={i}
                        isActive={activeSection === i}
                        onClick={() => scrollToSection(i)}
                      />
                    ))}
                  </nav>

                  {/* Quick reference badge */}
                  <div className="mt-8 mx-3 p-4 rounded-xl bg-[#7A2267]/[0.05] border border-[#7A2267]/10">
                    <div className="flex items-center gap-2.5 mb-2 text-[#7A2267]">
                      <DeliveryIcon />
                      <span className={`${josefin.className} text-[10px] font-semibold text-[#7A2267]`}>
                        Instant Confirmation
                      </span>
                    </div>
                    <p className={`${josefin.className} text-[10.5px] font-light text-[#7a6a52] leading-[1.7]`}>
                      Booking confirmations are delivered by email/SMS right after payment.
                      Couriered items: within 5 days inside Dhaka, 10 days outside Dhaka.
                    </p>
                  </div>
                </div>
              </aside>
            )}

            {/* ── Main Content ────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 max-w-3xl">

              {/* Delivery time (fixed — required on every render) */}
              <DeliveryTimeline />

              {/* Intro */}
              {intro && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="mb-12 pb-10 border-b border-[#e8e0d8]"
                >
                  <p className={`${josefin.className} text-[14px] sm:text-[15px] font-light
                    text-[#5a4e42] leading-[2] tracking-wide`}>
                    {intro}
                  </p>
                </motion.div>
              )}

              {/* Sections */}
              <div className="space-y-10">
                {sections.map((sec, i) => (
                  <motion.div
                    key={i}
                    ref={(el) => { sectionRefs.current[i] = el; }}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.65, ease: EASE }}
                    onViewportEnter={() => setActiveSection(i)}
                    className="scroll-mt-28"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span className={`${josefin.className} text-[9px] font-semibold
                        tracking-widest text-[#7A2267]/50 mt-1 shrink-0 w-6`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className={`${lora.className} text-[1.25rem] sm:text-[1.4rem]
                        font-500 text-[#1a1309] leading-snug`}>
                        {sec.title}
                      </h2>
                    </div>

                    <div className="h-px bg-gradient-to-r from-[#7A2267]/20 to-transparent mb-5 ml-10" />

                    <div className="ml-10">
                      <p className={`${josefin.className} text-[13.5px] font-light
                        text-[#5a4e42] leading-[2] whitespace-pre-line`}>
                        {sec.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer note */}
              {sections.length > 0 && (
                <div className="mt-16 pt-10 border-t border-[#e8e0d8]">
                  <p className={`${josefin.className} text-[11.5px] font-light text-[#9d8d7a] leading-[1.9]`}>
                    Didn&apos;t receive your booking confirmation? Contact us at{" "}
                    <a href="mailto:info@ambernivaas.com"
                      className="text-[#7A2267] hover:underline transition-all duration-200">
                      info@ambernivaas.com
                    </a>{" "}
                    with your transaction ID.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      <FooterSection contactInfo={contactInfo} />
    </>
  );
}
