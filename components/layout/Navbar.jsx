"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"],
});
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

const EASE = [0.16, 1, 0.3, 1];

const navLinks = [
  { name: "Home",          href: "/" },
  { name: "Accommodation", href: "/accommodation" },
  { name: "Facilities",    href: "/facilities" },
  { name: "Gallery",       href: "/gallery" },
  { name: "Contact",       href: "/contact" },
];

const DARK_HERO_ROUTES = ["/", "/accommodation", "/facilities", "/gallery", "/booking"];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdown] = useState(false);
  const pathname  = usePathname();
  const { data: session, status } = useSession();
  const dropRef = useRef(null);

  const hiddenRoutes = ["/login", "/signup"];
  if (hiddenRoutes.some((r) => pathname.startsWith(r))) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
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

  // Scrolled: always warm white, dark text
  // At top on dark hero: transparent, white text
  // At top on light pages: transparent, dark text
  const useDarkText = scrolled || (!scrolled && !isDarkHero);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ease-out ${inter.className}`}
      >
        {/* Background */}
        <div
          className={`absolute inset-0 transition-all duration-500
            ${scrolled
              ? "bg-[#FEFCFA]/96 backdrop-blur-xl border-b border-[#1C1C1C]/[0.07] shadow-[0_1px_24px_rgba(0,0,0,0.06)]"
              : "bg-transparent"
            }`}
        />

        <div className="relative max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="flex items-center justify-between h-16 sm:h-[76px]">

            {/* Logo */}
            <Link href="/" className="shrink-0 group">
              <Image
                src="/logo.png"
                alt="Dhali's Amber Nivaas"
                width={118}
                height={38}
                className={`object-contain transition-all duration-400
                  ${useDarkText
                    ? "brightness-0 opacity-85 group-hover:opacity-100"
                    : "brightness-0 invert opacity-85 group-hover:opacity-100"
                  }`}
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative group text-[10.5px] tracking-[0.15em] uppercase font-medium
                      transition-colors duration-300 py-1
                      ${isActive
                        ? useDarkText ? "text-[#7A2267]" : "text-white"
                        : useDarkText
                          ? "text-[#6B6B6B] hover:text-[#1C1C1C]"
                          : "text-white/50 hover:text-white"
                      }`}
                  >
                    {link.name}
                    <span className="absolute -bottom-0.5 inset-x-0 flex justify-center">
                      {isActive ? (
                        <motion.span
                          layoutId="navLine"
                          className={`h-px w-full rounded-full ${useDarkText ? "bg-[#7A2267]/60" : "bg-white/50"}`}
                          transition={{ duration: 0.35, ease: EASE }}
                        />
                      ) : (
                        <span className={`h-px w-0 group-hover:w-full rounded-full transition-all duration-300
                          ${useDarkText ? "bg-[#1C1C1C]/20" : "bg-white/25"}`} />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-6">
              {/* Auth */}
              {status === "loading" ? (
                <div className="w-7 h-7 rounded-full bg-black/10 animate-pulse" />
              ) : session?.user ? (
                <div ref={dropRef} className="relative">
                  <button
                    onClick={() => setDropdown((v) => !v)}
                    className="flex items-center gap-2.5 focus:outline-none group"
                  >
                    <Image
                      src={session.user.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                      alt="Profile"
                      width={30}
                      height={30}
                      className={`rounded-full object-cover border transition-all duration-200
                        ${useDarkText ? "border-black/15 group-hover:border-black/30" : "border-white/25 group-hover:border-white/50"}`}
                    />
                    <motion.svg
                      animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
                      viewBox="0 0 10 6" width="8" height="8" fill="none"
                      className={useDarkText ? "text-[#9B8B7E]" : "text-white/35"}
                    >
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="absolute right-0 top-[calc(100%+14px)] min-w-[210px]
                          bg-[#FEFCFA]/98 backdrop-blur-2xl border border-[#E8E0D8]
                          rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
                      >
                        <div className="px-4 py-3.5 border-b border-[#F0EBE6]">
                          <p className="text-[9px] text-[#C4B5A8] uppercase tracking-widest mb-0.5">Signed in as</p>
                          <p className="text-[12.5px] text-[#1C1C1C] font-medium truncate">{session.user.name}</p>
                          <p className="text-[10.5px] text-[#9B8B7E] truncate mt-0.5">{session.user.email}</p>
                        </div>
                        <div className="py-1.5">
                          <Link href="/account" onClick={() => setDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[10.5px] uppercase tracking-widest
                              text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F7F4F0] transition-all duration-200">
                            My Account
                          </Link>
                          <button
                            onClick={() => { signOut({ callbackUrl: "/" }); setDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[10.5px] uppercase
                              tracking-widest text-red-400/70 hover:text-red-500 hover:bg-red-50/60
                              transition-all duration-200">
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login"
                  className={`text-[10.5px] tracking-[0.16em] uppercase font-medium transition-colors duration-300
                    ${useDarkText ? "text-[#6B6B6B] hover:text-[#1C1C1C]" : "text-white/45 hover:text-white"}`}>
                  Login
                </Link>
              )}

              {/* Book Now */}
              <Link
                href="/booking"
                className={`group relative flex items-center gap-2.5 overflow-hidden
                  px-5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold
                  transition-all duration-300
                  ${useDarkText
                    ? "bg-[#7A2267] text-white hover:bg-[#8e2878] shadow-[0_4px_16px_rgba(122,34,103,0.25)]"
                    : "bg-white/12 text-white border border-white/25 hover:bg-white hover:text-[#1C1C1C] backdrop-blur-sm"
                  }`}
              >
                <span>Reserve</span>
                <svg viewBox="0 0 10 10" width="8" height="8" fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className={`lg:hidden relative z-[110] w-9 h-9 flex items-center justify-center focus:outline-none
                ${mobileOpen ? "text-white" : useDarkText ? "text-[#1C1C1C]" : "text-white"}`}
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" overflow="visible">
                <motion.line
                  x1="3" y1="7" x2="21" y2="7"
                  animate={mobileOpen ? { x1: 5, y1: 5, x2: 19, y2: 19 } : { x1: 3, y1: 7, x2: 21, y2: 7 }}
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  transition={{ duration: 0.3 }}
                />
                <motion.line
                  x1="3" y1="17" x2="14" y2="17"
                  animate={mobileOpen ? { x1: 19, y1: 5, x2: 5, y2: 19 } : { x1: 3, y1: 17, x2: 14, y2: 17 }}
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  transition={{ duration: 0.3 }}
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Fullscreen */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={`fixed inset-0 z-[99] flex flex-col ${inter.className}`}
          >
            <div className="absolute inset-0 bg-[#FEFCFA]/98 backdrop-blur-2xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#7A2267]/40 to-transparent" />

            <div className="relative flex flex-col h-full">
              <div className="h-16 sm:h-[76px] shrink-0" />

              <nav className="flex-1 flex flex-col justify-center px-8 sm:px-12">
                <div className="space-y-0">
                  {navLinks.map((link, i) => {
                    const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <motion.div key={link.href}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.06, duration: 0.4, ease: EASE }}
                      >
                        <Link href={link.href}
                          className="group flex items-center justify-between py-4 sm:py-5 border-b border-[#E8E0D8]">
                          <div className="flex items-center gap-4">
                            <span className={`w-0.75 h-5 rounded-full transition-all duration-300
                              ${isActive ? "bg-[#7A2267] opacity-100" : "opacity-0"}`} />
                            <span className={`font-light text-[2rem] sm:text-[2.3rem] tracking-tight leading-none
                              transition-colors duration-300
                              ${isActive ? "text-[#1C1C1C]" : "text-[#C4B5A8] group-hover:text-[#6B6B6B]"}`}
                              style={cormorant.style}
                            >
                              {link.name}
                            </span>
                          </div>
                          <svg viewBox="0 0 14 14" width="12" height="12" fill="none"
                            className={`shrink-0 transition-all duration-300 group-hover:translate-x-0.5
                              ${isActive ? "text-[#7A2267]/50" : "text-[#D4C9BE] group-hover:text-[#9B8B7E]"}`}>
                            <path d="M1 7h11M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: EASE }}
                className="px-8 sm:px-12 pb-10 sm:pb-14 shrink-0 space-y-4"
              >
                <div className="h-px bg-[#E8E0D8]" />
                {session?.user ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={session.user.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                        alt="Profile" width={32} height={32}
                        className="rounded-full object-cover border border-[#E8E0D8] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] text-[#1C1C1C] font-medium truncate">{session.user.name}</p>
                        <p className="text-[10px] text-[#9B8B7E] truncate">{session.user.email}</p>
                      </div>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/" })}
                      className="shrink-0 text-[10px] uppercase tracking-widest text-red-400/70 hover:text-red-500 transition-colors">
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-[#C4B5A8] uppercase tracking-widest">Not signed in</span>
                    <Link href="/login"
                      className="text-[10px] uppercase tracking-widest text-[#7A2267] hover:underline transition-colors">
                      Login
                    </Link>
                  </div>
                )}
                <Link href="/booking"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl
                    bg-[#7A2267] text-white text-[10.5px] uppercase tracking-[0.22em] font-semibold
                    hover:bg-[#8e2878] transition-colors duration-300 shadow-[0_4px_20px_rgba(122,34,103,0.25)]">
                  Reserve Your Stay
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
