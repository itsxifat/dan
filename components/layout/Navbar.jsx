"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

// Premium serif for the wordmark / headings feel
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const EASE = [0.16, 1, 0.3, 1];

const navLinks = [
  { name: "Home",          href: "/"              },
  { name: "Accommodation", href: "/accommodation" },
  { name: "Facilities",    href: "/facilities"    },
  { name: "Gallery",       href: "/gallery"       },
  { name: "Contact",       href: "/contact"       },
];

// Pages with dark hero backgrounds → use white text always
const DARK_HERO_ROUTES = ["/", "/accommodation", "/facilities", "/gallery"];

export default function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dropdownOpen, setDropdown]     = useState(false);
  const pathname  = usePathname();
  const { data: session, status } = useSession();
  const dropRef = useRef(null);

  const hiddenRoutes = ["/login", "/signup"];
  if (hiddenRoutes.some((r) => pathname.startsWith(r))) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { setMobileOpen(false); setDropdown(false); }, [pathname]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDarkHero = DARK_HERO_ROUTES.some(
    (r) => r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  // Scrolled style: always solid dark
  // At top on dark hero: transparent white text
  // At top on light pages: transparent dark text
  const atTopOnDark  = !scrolled && isDarkHero;
  const atTopOnLight = !scrolled && !isDarkHero;

  return (
    <>
      {/* ─────────────── NAVBAR ─────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ease-out ${inter.className}`}
      >
        {/* Background layer */}
        <div
          className={`absolute inset-0 transition-all duration-500
            ${scrolled
              ? "bg-[#0a0a0a]/97 backdrop-blur-xl border-b border-white/5 shadow-[0_1px_40px_rgba(0,0,0,0.45)]"
              : isDarkHero
                ? "bg-transparent"
                : "bg-white/0 backdrop-blur-0"
            }`}
        />

        <div className="relative max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">

            {/* ── Logo ── */}
            <Link href="/" className="shrink-0 group">
              <Image
                src="/logo.png"
                alt="Dhali's Amber Nivaas"
                width={110}
                height={36}
                className={`object-contain transition-all duration-300
                  ${atTopOnLight
                    ? "brightness-0 opacity-80 group-hover:opacity-100"
                    : "brightness-0 invert opacity-80 group-hover:opacity-100"
                  }`}
                priority
              />
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative group text-[11px] tracking-[0.14em] uppercase font-medium
                      transition-colors duration-300 py-1
                      ${isActive
                        ? atTopOnLight ? "text-[#7A2267]" : "text-white"
                        : atTopOnLight
                          ? "text-neutral-500 hover:text-neutral-900"
                          : "text-white/45 hover:text-white"
                      }`}
                  >
                    {link.name}
                    {/* Animated underline */}
                    <span className="absolute -bottom-0.5 inset-x-0 flex justify-center">
                      {isActive ? (
                        <motion.span
                          layoutId="navLine"
                          className={`h-px w-full rounded-full ${atTopOnLight ? "bg-[#7A2267]/70" : "bg-white/50"}`}
                          transition={{ duration: 0.4, ease: EASE }}
                        />
                      ) : (
                        <span className={`h-px w-0 group-hover:w-full rounded-full transition-all duration-300
                          ${atTopOnLight ? "bg-neutral-400/40" : "bg-white/25"}`} />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* ── Desktop Right ── */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-6">

              {/* Auth */}
              {status === "loading" ? (
                <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
              ) : session?.user ? (
                <div ref={dropRef} className="relative">
                  <button
                    onClick={() => setDropdown((v) => !v)}
                    className="flex items-center gap-2 focus:outline-none group"
                  >
                    <div className="relative">
                      <Image
                        src={session.user.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                        alt="Profile"
                        width={30}
                        height={30}
                        className="rounded-full object-cover border border-white/20 group-hover:border-white/45 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full border border-[#0a0a0a]" />
                    </div>
                    <motion.svg
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      viewBox="0 0 10 6" width="8" height="8" fill="none"
                      className={`transition-colors duration-200 ${atTopOnLight ? "text-neutral-400" : "text-white/35"}`}
                    >
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="absolute right-0 top-[calc(100%+14px)] min-w-[200px]
                          bg-[#0f0f0f]/98 backdrop-blur-2xl border border-white/8
                          rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                      >
                        <div className="px-4 py-3.5 border-b border-white/[0.06]">
                          <p className="text-[9px] text-white/25 uppercase tracking-widest mb-0.5">Signed in as</p>
                          <p className="text-[12px] text-white font-medium truncate">{session.user.name}</p>
                          <p className="text-[10px] text-white/35 truncate mt-0.5">{session.user.email}</p>
                        </div>
                        <div className="py-1.5">
                          <Link
                            href="/account"
                            onClick={() => setDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[10.5px] uppercase tracking-widest
                              text-white/45 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            My Account
                          </Link>
                          <button
                            onClick={() => { signOut({ callbackUrl: "/" }); setDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[10.5px] uppercase
                              tracking-widest text-red-400/55 hover:text-red-400 hover:bg-red-500/6
                              transition-all duration-200"
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className={`text-[10.5px] tracking-[0.16em] uppercase font-medium transition-colors duration-300
                    ${atTopOnLight ? "text-neutral-500 hover:text-neutral-900" : "text-white/40 hover:text-white"}`}
                >
                  Login
                </Link>
              )}

              {/* Book Now */}
              <Link
                href="/booking"
                className={`group relative flex items-center gap-2.5 overflow-hidden
                  px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold
                  transition-all duration-300
                  ${atTopOnLight
                    ? "bg-[#0a0a0a] text-white hover:bg-[#7A2267] shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
                    : "bg-white text-[#0a0a0a] hover:bg-[#7A2267] hover:text-white shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
                  }`}
              >
                <span className="relative z-10">Book Now</span>
                <svg
                  viewBox="0 0 10 10" width="8" height="8" fill="none"
                  className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* ── Mobile Toggle ── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className={`lg:hidden relative z-[110] w-9 h-9 flex items-center justify-center focus:outline-none
                ${mobileOpen || !atTopOnLight ? "text-white" : "text-[#1a1a1a]"}`}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" overflow="visible">
                <motion.line
                  x1="3" y1="7" x2="21" y2="7"
                  animate={mobileOpen ? { x1: 5, y1: 5, x2: 19, y2: 19 } : { x1: 3, y1: 7, x2: 21, y2: 7 }}
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
                <motion.line
                  x1="3" y1="17" x2="14" y2="17"
                  animate={mobileOpen ? { x1: 19, y1: 5, x2: 5, y2: 19 } : { x1: 3, y1: 17, x2: 14, y2: 17 }}
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* ─────────────── MOBILE FULLSCREEN ─────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 z-[99] flex flex-col ${inter.className}`}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#080808]/97 backdrop-blur-2xl" />

            {/* Decorative top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7A2267]/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-40 bg-[#7A2267]/6
              rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col h-full">
              {/* Spacer for navbar height */}
              <div className="h-16 shrink-0" />

              {/* Links */}
              <nav className="flex-1 flex flex-col justify-center px-8 sm:px-12">
                <div className="space-y-0">
                  {navLinks.map((link, i) => {
                    const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.08, duration: 0.45, ease: EASE }}
                      >
                        <Link
                          href={link.href}
                          className="group flex items-center justify-between py-4 sm:py-5 border-b border-white/5"
                        >
                          <div className="flex items-center gap-4">
                            {/* Active indicator */}
                            <span className={`w-0.75 h-5 rounded-full transition-all duration-300
                              ${isActive ? "bg-[#7A2267] opacity-100" : "bg-transparent opacity-0"}`} />
                            <span className={`font-light text-[2rem] sm:text-[2.3rem] tracking-tight leading-none
                              transition-colors duration-300
                              ${isActive ? "text-white" : "text-white/30 group-hover:text-white/80"}`}
                              style={cormorant.style}
                            >
                              {link.name}
                            </span>
                          </div>
                          <svg
                            viewBox="0 0 14 14" width="13" height="13" fill="none"
                            className={`shrink-0 transition-all duration-300 group-hover:translate-x-0.5
                              ${isActive ? "text-white/35" : "text-white/12 group-hover:text-white/30"}`}
                          >
                            <path d="M1 7h11M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              {/* Bottom */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.45, ease: EASE }}
                className="px-8 sm:px-12 pb-10 sm:pb-14 shrink-0 space-y-4"
              >
                {/* Divider */}
                <div className="h-px bg-white/6" />

                {/* User */}
                {session?.user ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={session.user.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                        alt="Profile"
                        width={34}
                        height={34}
                        className="rounded-full object-cover shrink-0 border border-white/15"
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] text-white font-medium truncate">{session.user.name}</p>
                        <p className="text-[10px] text-white/30 truncate">{session.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="shrink-0 text-[10px] uppercase tracking-widest text-red-400/55 hover:text-red-400 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-white/25 uppercase tracking-widest">Not signed in</span>
                    <Link
                      href="/login"
                      className="text-[10px] uppercase tracking-widest text-white/55 hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                  </div>
                )}

                {/* Book Now CTA */}
                <Link
                  href="/booking"
                  className="group flex items-center justify-center gap-3
                    w-full py-4 rounded-2xl bg-[#7A2267] text-white
                    text-[10.5px] uppercase tracking-[0.22em] font-semibold
                    hover:bg-[#8e2878] transition-colors duration-300"
                >
                  Book Your Stay
                  <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
                    <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
