"use client";

import Link from "next/link";
import { Cormorant, DM_Sans } from "next/font/google";

const cinzel = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans   = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

// ── Social Icons ──────────────────────────────────────────────────────────────
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 2a10 10 0 0 0-8.646 15.002L2 22l5.12-1.338A10 10 0 1 0 12 2z"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 16 20" width="12" height="14" fill="none" aria-hidden="true">
      <path d="M8 1C4.686 1 2 3.686 2 7c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z"
        stroke="#9d3a8a" strokeWidth="1.4"/>
      <circle cx="8" cy="7" r="2" stroke="#9d3a8a" strokeWidth="1.4"/>
    </svg>
  );
}

const quickLinks = [
  { label: "Home",          href: "/" },
  { label: "About",         href: "/about" },
  { label: "Accommodation", href: "/accommodation" },
  { label: "Booking",       href: "/booking" },
  { label: "Contact",       href: "/contact" },
];

const stayLinks = [
  { label: "Our Rooms",          href: "/accommodation" },
  { label: "Night Packages",     href: "/packages/night" },
  { label: "Day Long Packages",  href: "/packages/day" },
  { label: "Private Cottages",   href: "/accommodation?type=cottage" },
];

export default function FooterSection() {
  return (
    <footer className="bg-[#0d0a05] pt-16 md:pt-20">

      {/* ── Top 4-column grid ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-14 md:pb-16">

        {/* ── Col 1: Brand ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:col-span-1">
          {/* Resort name */}
          <div>
            <p className={`${cinzel.className} text-[1.2rem] font-600 text-white leading-snug`}>
              Dhali&apos;s Amber Nivaas
            </p>
            {/* Gold decorative line */}
            <div className="mt-3 h-px w-16 bg-gradient-to-r from-[#7A2267] to-transparent" />
          </div>

          {/* Tagline */}
          <p className={`${sans.className} text-[12.5px] font-light text-white/40 leading-[1.8]`}>
            A sanctuary where nature meets luxury. Your perfect escape from the ordinary.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white/30 hover:text-white transition-colors duration-200"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/30 hover:text-white transition-colors duration-200"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="text-white/30 hover:text-white transition-colors duration-200"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        {/* ── Col 2: Quick Links ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <p className={`${sans.className} text-[10px] uppercase tracking-[0.22em] font-semibold text-white/50`}>
            Quick Links
          </p>
          <ul className="flex flex-col gap-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${sans.className} text-[13px] font-light text-white/35
                    hover:text-[#c084b8] transition-colors duration-200`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 3: Accommodation ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <p className={`${sans.className} text-[10px] uppercase tracking-[0.22em] font-semibold text-white/50`}>
            Stay With Us
          </p>
          <ul className="flex flex-col gap-3">
            {stayLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${sans.className} text-[13px] font-light text-white/35
                    hover:text-[#c084b8] transition-colors duration-200`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 4: Contact ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <p className={`${sans.className} text-[10px] uppercase tracking-[0.22em] font-semibold text-white/50`}>
            Find Us
          </p>
          <ul className="flex flex-col gap-4">
            {/* Address */}
            <li>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0"><MapPinIcon /></span>
                <p className={`${sans.className} text-[12.5px] font-light text-white/35 leading-[1.75]`}>
                  Dhali&apos;s Amber Nivaas Resort,<br />
                  Gazipur, Dhaka District,<br />
                  Bangladesh
                </p>
              </div>
            </li>
            {/* Phone */}
            <li>
              <a
                href="tel:+880XXXXXXXXX"
                className={`${sans.className} text-[12.5px] font-light text-white/35
                  hover:text-[#c084b8] transition-colors duration-200`}
              >
                +880 XXX XXX XXXX
              </a>
            </li>
            {/* Email */}
            <li>
              <a
                href="mailto:info@dhalisambernivaas.com"
                className={`${sans.className} text-[12.5px] font-light text-white/35
                  hover:text-[#c084b8] transition-colors duration-200 break-all`}
              >
                info@dhalisambernivaas.com
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-5
          flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className={`${sans.className} text-[11px] text-white/30`}>
            &copy; 2025 Dhali&apos;s Amber Nivaas. All rights reserved.
          </p>
          <p className={`${sans.className} text-[11px] text-white/30`}>
            Designed with care for your experience.
          </p>
        </div>
      </div>

    </footer>
  );
}
