"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lora, Josefin_Sans } from "next/font/google";
import { submitContactForm } from "@/actions/contact/contactActions";

gsap.registerPlugin(ScrollTrigger);

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.13, delayChildren: 0.04 } },
};

const SUBJECTS = [
  "General Enquiry",
  "Room Booking",
  "Corporate Event",
  "Destination Wedding",
  "Group Stay",
  "Feedback",
  "Other",
];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3L14 12.5l4 1.5v3c0 1.1-.9 2-2 2C8.4 19 3 13.6 3 7c0-1.66.9-3 2-3z"/>
    </svg>
  );
}
function EmailIcon() {
  return (
    <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
      <path d="M2 6l9 6 9-6"/>
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 1C7.13 1 4 4.13 4 8c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="11" cy="8" r="2.5"/>
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 22 22" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="9"/>
      <path d="M11 6v5l3 3"/>
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ContactContent({ info = {}, mapsApiKey = "" }) {
  const heroRef    = useRef(null);
  const heroImgRef = useRef(null);
  const infoRef    = useRef(null);
  const formRef    = useRef(null);
  const closingRef = useRef(null);

  const infoInView    = useInView(infoRef,    { once: true, margin: "-80px" });
  const formInView    = useInView(formRef,    { once: true, margin: "-80px" });
  const closingInView = useInView(closingRef, { once: true, margin: "-80px" });

  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useGSAP(() => {
    gsap.to(heroImgRef.current, {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, { scope: heroRef });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await submitContactForm(form);
        setSent(true);
      } catch (err) {
        setError(err.message || "Something went wrong. Please try again.");
      }
    });
  }

  // ── derive display data from info ─────────────────────────────────────────
  const phones    = info.phones   || [];
  const emails    = info.emails   || [];
  const directions = info.directions || [];

  const INFO_CARDS = [
    {
      title: "Visit Us",
      lines: [info.addressLine1, info.addressLine2].filter(Boolean),
      sub:   info.addressNote || "",
      icon:  <PinIcon />,
    },
    {
      title: "Call Us",
      lines: phones.map((p) => p.label ? `${p.label}: ${p.number}` : p.number).filter(Boolean),
      sub:   info.phoneHours || "",
      icon:  <PhoneIcon />,
    },
    {
      title: "Email Us",
      lines: emails.map((e) => e.address).filter(Boolean),
      sub:   info.emailNote || "",
      icon:  <EmailIcon />,
    },
    {
      title: "Hours",
      lines: [
        info.checkInTime  ? `Check-in: ${info.checkInTime}`  : null,
        info.checkOutTime ? `Check-out: ${info.checkOutTime}` : null,
      ].filter(Boolean),
      sub:  info.frontDeskHours || "",
      icon: <ClockIcon />,
    },
  ];

  const sidebarContacts = [
    { label: "Reservations",       value: info.reservationPhone },
    { label: "Events & Weddings",  value: info.eventsPhone },
    { label: "Email",              value: info.sidebarEmail },
  ].filter((c) => c.value);

  // map
  const mapLat = info.mapLat || 23.9;
  const mapLng = info.mapLng || 90.2;
  const mapsOpenUrl = `https://www.google.com/maps?q=${mapLat},${mapLng}`;
  const embedSrc = info.mapEmbedUrl || (() => {
    if (info.mapEmbedMode === "official") {
      return mapsApiKey
        ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${mapLat},${mapLng}&zoom=15`
        : null;
    }
    return `https://maps.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`;
  })();

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] overflow-hidden">
        <div ref={heroImgRef} className="absolute inset-0 scale-110 will-change-transform">
          <Image
            src="/section/about/middle.png"
            alt="Dhali's Amber Nivaas — Contact"
            fill sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0905]/65 via-[#0d0905]/30 to-[#0d0905]/75" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-5">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/40 mb-7`}
          >
            Dhali&apos;s Amber Nivaas
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.05, delay: 0.4, ease: EASE }}
            className={`${lora.className} text-[2.8rem] sm:text-[3.8rem] lg:text-[5.2rem]
              text-white font-400 leading-[1.08] max-w-4xl`}
          >
            We&apos;d Love to{" "}
            <em className={`${lora.className} italic`}>Hear From You</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.75 }}
            className={`${josefin.className} text-[13px] font-light text-white/50 mt-7 max-w-sm leading-relaxed`}
          >
            Whether you&apos;re planning a stay, an event, or simply curious — we&apos;re here.
          </motion.p>
        </div>
      </section>

      {/* ── INFO CARDS ───────────────────────────────────────────────────── */}
      <section ref={infoRef} className="relative bg-white overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px]
          rounded-full bg-[#7A2267]/[0.03] blur-[120px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <motion.div variants={stagger} initial="hidden" animate={infoInView ? "show" : "hidden"}
            className="text-center mb-16">
            <motion.p variants={fadeUp}
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60 mb-4`}>
              Get in Touch
            </motion.p>
            <motion.h2 variants={fadeUp}
              className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
              Find Us,{" "}
              <em className={`${lora.className} italic text-[#7A2267]`}>reach us.</em>
            </motion.h2>
            <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30 mx-auto mt-6" />
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate={infoInView ? "show" : "hidden"}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INFO_CARDS.map((card) => (
              <motion.div key={card.title} variants={fadeUp}
                className="flex flex-col gap-5 p-7 rounded-2xl border border-[#ede5d8] bg-[#faf8f5]
                  hover:border-[#7A2267]/30 hover:shadow-md hover:shadow-black/5
                  transition-all duration-300 group">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#ede5d8]
                  flex items-center justify-center text-[#7A2267]
                  group-hover:bg-[#7A2267] group-hover:text-white group-hover:border-[#7A2267]
                  transition-all duration-300">
                  {card.icon}
                </div>
                <div>
                  <p className={`${lora.className} text-[1rem] font-500 text-[#1a1309] leading-snug mb-3`}>
                    {card.title}
                  </p>
                  {card.lines.map((line, i) => (
                    <p key={i} className={`${josefin.className} text-[12.5px] font-light text-[#5a4e42] leading-[1.9]`}>
                      {line}
                    </p>
                  ))}
                  {card.sub && (
                    <p className={`${josefin.className} text-[11px] font-light text-[#7A2267]/70 mt-2 leading-relaxed`}>
                      {card.sub}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FORM ─────────────────────────────────────────────────────────── */}
      <section ref={formRef} className="bg-[#1a1309] py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 xl:gap-28 items-start">

            {/* Left: text */}
            <motion.div variants={stagger} initial="hidden" animate={formInView ? "show" : "hidden"}
              className="flex flex-col gap-7 lg:pt-4">
              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-white/30`}>
                Send a Message
              </motion.p>
              <motion.h2 variants={fadeUp}
                className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3.2rem]
                  font-400 text-white leading-[1.12] tracking-[-0.01em]`}>
                Tell us how we<br />
                <em className={`${lora.className} italic text-[#7A2267]`}>can help.</em>
              </motion.h2>
              <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/40" />
              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[13.5px] font-light text-white/40 leading-[1.95]`}>
                Our team reads every message and will get back to you within 24 hours.
                For urgent queries, please call us directly.
              </motion.p>
              {sidebarContacts.length > 0 && (
                <motion.div variants={fadeUp} className="flex flex-col gap-4 pt-2">
                  {sidebarContacts.map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <div className="w-px h-6 bg-[#7A2267]/50" />
                      <div>
                        <p className={`${josefin.className} text-[9px] uppercase tracking-[0.3em] text-white/25 mb-0.5`}>
                          {item.label}
                        </p>
                        <p className={`${josefin.className} text-[13px] font-light text-white/60`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Right: form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
            >
              {sent ? (
                <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#7A2267]/20 border border-[#7A2267]/30
                    flex items-center justify-center text-[#7A2267]">
                    <svg viewBox="0 0 22 22" width="26" height="26" fill="none" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <div>
                    <p className={`${lora.className} text-[1.4rem] text-white font-400 mb-3`}>
                      Message Received
                    </p>
                    <p className={`${josefin.className} text-[13px] font-light text-white/40 max-w-xs leading-relaxed`}>
                      Thank you for reaching out. We&apos;ll be in touch within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                    className={`${josefin.className} text-[10px] uppercase tracking-[0.25em] text-[#7A2267]/70
                      hover:text-[#7A2267] transition-colors duration-200`}>
                    Send another →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className={`${josefin.className} text-[9px] uppercase tracking-[0.3em] text-white/30`}>
                        Full Name <span className="text-[#7A2267]">*</span>
                      </label>
                      <input
                        name="name" value={form.name} onChange={handleChange}
                        placeholder="Your name"
                        className={`${josefin.className} text-[13px] font-light text-white placeholder-white/20
                          bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5
                          focus:outline-none focus:border-[#7A2267]/50 focus:bg-white/[0.08]
                          transition-all duration-200`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={`${josefin.className} text-[9px] uppercase tracking-[0.3em] text-white/30`}>
                        Email Address <span className="text-[#7A2267]">*</span>
                      </label>
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="you@example.com"
                        className={`${josefin.className} text-[13px] font-light text-white placeholder-white/20
                          bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5
                          focus:outline-none focus:border-[#7A2267]/50 focus:bg-white/[0.08]
                          transition-all duration-200`}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className={`${josefin.className} text-[9px] uppercase tracking-[0.3em] text-white/30`}>
                        Phone Number
                      </label>
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+880 ..."
                        className={`${josefin.className} text-[13px] font-light text-white placeholder-white/20
                          bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5
                          focus:outline-none focus:border-[#7A2267]/50 focus:bg-white/[0.08]
                          transition-all duration-200`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={`${josefin.className} text-[9px] uppercase tracking-[0.3em] text-white/30`}>
                        Subject
                      </label>
                      <select
                        name="subject" value={form.subject} onChange={handleChange}
                        className={`${josefin.className} text-[13px] font-light text-white
                          bg-[#1a1309] border border-white/10 rounded-xl px-4 py-3.5
                          focus:outline-none focus:border-[#7A2267]/50
                          transition-all duration-200 appearance-none`}
                      >
                        <option value="" className="bg-[#1a1309] text-white/40">Select a topic</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s} className="bg-[#1a1309] text-white">{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`${josefin.className} text-[9px] uppercase tracking-[0.3em] text-white/30`}>
                      Message <span className="text-[#7A2267]">*</span>
                    </label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange}
                      rows={5}
                      placeholder="Tell us about your enquiry..."
                      className={`${josefin.className} text-[13px] font-light text-white placeholder-white/20
                        bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 resize-none
                        focus:outline-none focus:border-[#7A2267]/50 focus:bg-white/[0.08]
                        transition-all duration-200`}
                    />
                  </div>

                  {error && (
                    <p className={`${josefin.className} text-[11px] text-red-400/80 font-light`}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    className={`${josefin.className} inline-flex items-center justify-center gap-3
                      px-8 py-4 rounded-full bg-[#7A2267] text-white
                      text-[11px] font-semibold uppercase tracking-[0.2em]
                      hover:bg-[#8a256f] transition-all duration-300 group
                      shadow-[0_4px_22px_rgba(122,34,103,0.28)]
                      hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]
                      disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
                  >
                    {pending ? "Sending…" : (
                      <>
                        Send Message
                        <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                          className="group-hover:translate-x-1 transition-transform duration-300">
                          <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── DIRECTIONS ───────────────────────────────────────────────────── */}
      <section className="relative bg-[#f9f6f2] overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(122,34,103,0.04) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.0, ease: EASE }}
              className="relative rounded-2xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(13,9,5,0.18)]
                aspect-[4/3] bg-[#ede5d8] flex items-center justify-center"
            >
              {embedSrc ? (
                <iframe
                  src={embedSrc}
                  width="100%" height="100%"
                  style={{ border: 0, filter: "grayscale(20%) contrast(0.95)" }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full"
                  title="Dhali's Amber Nivaas location"
                />
              ) : (
                <a href={mapsOpenUrl} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 text-[#7a6a52]/60 hover:text-[#7A2267] transition-colors">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  <span className="text-[11px] uppercase tracking-wider font-semibold">View on Google Maps</span>
                </a>
              )}
            </motion.div>

            {/* Directions text */}
            <motion.div variants={stagger} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="flex flex-col gap-7">
              <motion.p variants={fadeUp}
                className={`${josefin.className} text-[9.5px] uppercase tracking-[0.45em] text-[#7A2267]/60`}>
                How to Find Us
              </motion.p>
              <motion.h2 variants={fadeUp}
                className={`${lora.className} text-[2.2rem] sm:text-[2.8rem] lg:text-[3rem]
                  font-400 text-[#1a1309] leading-[1.12] tracking-[-0.01em]`}>
                Your escape is<br />
                <em className={`${lora.className} italic text-[#7A2267]`}>closer than you think.</em>
              </motion.h2>
              <motion.div variants={fadeUp} className="h-px w-14 bg-[#7A2267]/30" />

              {directions.length > 0 && (
                <motion.div variants={stagger} className="flex flex-col gap-5">
                  {directions.map((item, i) => (
                    <motion.div key={i} variants={fadeUp} className="flex gap-4">
                      <div className="w-1 shrink-0 bg-[#7A2267]/20 rounded-full" />
                      <div>
                        <p className={`${josefin.className} text-[12px] font-semibold text-[#1a1309] mb-1`}>
                          {item.label}
                        </p>
                        <p className={`${josefin.className} text-[12.5px] font-light text-[#7a6a52] leading-[1.85]`}>
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
                <a
                  href={mapsOpenUrl}
                  target="_blank" rel="noopener noreferrer"
                  className={`${josefin.className} inline-flex items-center gap-3
                    px-7 py-3.5 rounded-full bg-[#1a1309] text-white
                    text-[11px] font-semibold uppercase tracking-[0.18em]
                    hover:bg-[#7A2267] transition-all duration-300 group
                    shadow-[0_4px_16px_rgba(26,19,9,0.18)]`}>
                  Open in Maps
                  <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                    className="group-hover:translate-x-1 transition-transform duration-300">
                    <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <Link href="/booking"
                  className={`${josefin.className} inline-flex items-center
                    px-7 py-3.5 rounded-full border border-[#1a1309]/20 text-[#1a1309]
                    text-[11px] font-semibold uppercase tracking-[0.18em]
                    hover:border-[#7A2267] hover:text-[#7A2267] transition-all duration-300`}>
                  Book a Stay
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CLOSING ──────────────────────────────────────────────────────── */}
      <section ref={closingRef} className="relative bg-[#1a1309] overflow-hidden py-28 md:py-36">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(122,34,103,0.15) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            animate={closingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.95, ease: EASE }}
            className={`${lora.className} text-[1.55rem] sm:text-[1.95rem] lg:text-[2.3rem]
              italic text-white/80 leading-[1.55] font-400`}
          >
            &ldquo;Every great stay begins with a single conversation.&rdquo;
          </motion.blockquote>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={closingInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.55, delay: 0.35, ease: EASE }}
            className="h-px w-14 bg-[#7A2267]/50 mx-auto my-9 origin-center"
          />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={closingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/booking"
              className={`${josefin.className} inline-flex items-center gap-3
                px-8 py-4 rounded-full bg-[#7A2267] text-white
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:bg-[#8a256f] transition-all duration-300 group
                shadow-[0_4px_22px_rgba(122,34,103,0.28)]
                hover:shadow-[0_6px_28px_rgba(122,34,103,0.4)]`}>
              Reserve Your Stay
              <svg viewBox="0 0 16 10" width="11" height="11" fill="none"
                className="group-hover:translate-x-1 transition-transform duration-300">
                <path d="M1 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/about"
              className={`${josefin.className} inline-flex items-center
                px-8 py-4 rounded-full border border-white/15 text-white/60
                text-[11px] font-semibold uppercase tracking-[0.2em]
                hover:border-[#7A2267]/50 hover:text-white transition-all duration-300`}>
              Our Story
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
