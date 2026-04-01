"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Lora, Josefin_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

const EASE = [0.16, 1, 0.3, 1];

const navLinks = [
  { name: "Home",                href: "/" },
  { name: "About",               href: "/about" },
  { name: "Accommodation",       href: "/accommodation" },
  { name: "Facilities",          href: "/facilities" },
  { name: "Corporate",           href: "/corporate" },
  { name: "Destination Wedding", href: "/destination-wedding" },
  { name: "Gallery",             href: "/gallery" },
  { name: "Contact",             href: "/contact" },
];

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdown]     = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const dropRef = useRef(null);

  const hiddenRoutes = ["/login", "/signup"];
  const isHidden = hiddenRoutes.some((r) => pathname.startsWith(r));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setDropdown(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isHidden) return null;

  return (
    <>
      {/* ── Desktop / sticky header ── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: EASE }}
        className={`sticky top-0 inset-x-0 z-[100] ${josefin.className}`}
      >
        {/* Background */}
        <div className={`absolute inset-0 transition-all duration-500
          ${scrolled
            ? "bg-white shadow-[0_1px_0_rgba(0,0,0,0.05),0_2px_20px_rgba(0,0,0,0.06)]"
            : "bg-white/88 backdrop-blur-md"
          }`}
        />
        {/* Purple hairline — only on scroll */}
        <div
          className={`absolute bottom-0 inset-x-0 h-px transition-opacity duration-500
            ${scrolled ? "opacity-100" : "opacity-0"}`}
          style={{ background: "linear-gradient(to right, transparent, rgba(122,34,103,0.22), transparent)" }}
        />

        <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="flex items-center justify-between h-[60px] sm:h-[68px]">

            {/* Logo */}
            <Link href="/" className="shrink-0 group">
              <Image
                src="/logo.png"
                alt="Dhali's Amber Nivaas"
                width={90}
                height={26}
                className="object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                priority
              />
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative group text-[10px] tracking-[0.14em] uppercase font-medium
                      transition-colors duration-200 py-1
                      ${isActive ? "text-[#7A2267]" : "text-[#555] hover:text-[#1a1a1a]"}`}
                  >
                    {link.name}
                    <span className="absolute -bottom-0.5 inset-x-0 flex justify-center">
                      {isActive ? (
                        <motion.span
                          layoutId="navLine"
                          className="h-px w-full rounded-full bg-[#7A2267]/45"
                          transition={{ duration: 0.3, ease: EASE }}
                        />
                      ) : (
                        <span className="h-px w-0 group-hover:w-full rounded-full transition-all duration-300 bg-[#1a1a1a]/12" />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop right: auth + reserve */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-5">
              {status === "loading" ? (
                <div className="w-7 h-7 rounded-full bg-[#f0f0f0] animate-pulse" />
              ) : session?.user ? (
                <div ref={dropRef} className="relative">
                  <button
                    onClick={() => setDropdown((v) => !v)}
                    className="flex items-center gap-2 focus:outline-none group"
                  >
                    <Image
                      src={session.user.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                      alt="Profile" width={28} height={28}
                      className="rounded-full object-cover border border-[#e0e0e0] group-hover:border-[#7A2267]/30 transition-colors duration-200"
                    />
                    <motion.svg
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      viewBox="0 0 10 6" width="7" height="7" fill="none"
                      className="text-[#aaa]"
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
                        transition={{ duration: 0.18, ease: EASE }}
                        className="absolute right-0 top-[calc(100%+12px)] min-w-[200px]
                          bg-white border border-[#ebebeb] rounded-xl
                          shadow-[0_8px_32px_rgba(0,0,0,0.09)] overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-[#f2f2f2]">
                          <p className="text-[8px] text-[#bbb] uppercase tracking-widest mb-0.5">Signed in as</p>
                          <p className="text-[12px] text-[#1a1a1a] font-semibold truncate">{session.user.name}</p>
                          <p className="text-[10px] text-[#888] truncate mt-0.5">{session.user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/account" onClick={() => setDropdown(false)}
                            className="flex items-center px-4 py-2.5 text-[10px] uppercase tracking-wider
                              text-[#555] hover:text-[#1a1a1a] hover:bg-[#fafafa] transition-colors duration-150">
                            My Account
                          </Link>
                          <button
                            onClick={() => { signOut({ callbackUrl: "/" }); setDropdown(false); }}
                            className="w-full flex items-center px-4 py-2.5 text-left text-[10px] uppercase
                              tracking-wider text-red-400 hover:text-red-500 hover:bg-red-50/40 transition-colors duration-150">
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login"
                  className="text-[10px] tracking-[0.14em] uppercase font-medium text-[#666] hover:text-[#1a1a1a] transition-colors duration-200">
                  Login
                </Link>
              )}

              <Link
                href="/booking"
                className="group flex items-center gap-2 px-4 py-2 rounded-full
                  text-[9.5px] uppercase tracking-[0.18em] font-semibold
                  bg-[#7A2267] text-white hover:bg-[#8a256f]
                  transition-all duration-300
                  shadow-[0_2px_12px_rgba(122,34,103,0.22)]
                  hover:shadow-[0_4px_18px_rgba(122,34,103,0.35)]"
              >
                <span>Reserve</span>
                <svg viewBox="0 0 10 10" width="7" height="7" fill="none"
                  className="transition-transform duration-300 group-hover:translate-x-0.5">
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden relative z-[110] flex flex-col items-end justify-center gap-[5px] w-8 h-8 focus:outline-none"
              aria-label="Toggle menu"
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 5, width: "20px" } : { rotate: 0, y: 0, width: "20px" }}
                transition={{ duration: 0.25 }}
                className="block h-px rounded-full bg-[#333] origin-center"
                style={{ width: 20 }}
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0, x: 6 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="block h-px rounded-full bg-[#333]"
                style={{ width: 14 }}
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -5, width: "20px" } : { rotate: 0, y: 0, width: "20px" }}
                transition={{ duration: 0.25 }}
                className="block h-px rounded-full bg-[#333] origin-center"
                style={{ width: 20 }}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile fullscreen menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.6 }}
            transition={{ duration: 0.38, ease: EASE }}
            className={`fixed inset-0 z-[99] flex flex-col bg-white ${josefin.className}`}
          >
            {/* Mobile header bar */}
            <div className="h-[60px] sm:h-[68px] shrink-0 flex items-center justify-between
              px-5 sm:px-8 border-b border-[#f0f0f0]">
              <Image
                src="/logo.png" alt="Dhali's Amber Nivaas"
                width={82} height={24}
                className="object-contain opacity-75"
              />
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#aaa] hover:text-[#333] transition-colors duration-200"
              >
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M4 4l12 12M16 4L4 16" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-6 sm:px-10 pt-4">
              {navLinks.map((link, i) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.04, duration: 0.35, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between py-4 border-b border-[#f4f4f4]"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-0.5 h-[18px] rounded-full transition-all duration-300
                          ${isActive ? "bg-[#7A2267]" : "bg-transparent group-hover:bg-[#7A2267]/25"}`} />
                        <span
                          className={`text-[1.6rem] sm:text-[1.85rem] font-light tracking-tight leading-none
                            transition-colors duration-200
                            ${isActive ? "text-[#1a1a1a]" : "text-[#ccc] group-hover:text-[#666]"}`}
                          style={lora.style}
                        >
                          {link.name}
                        </span>
                      </div>
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="none"
                        className={`shrink-0 transition-all duration-300 group-hover:translate-x-0.5
                          ${isActive ? "text-[#7A2267]/45" : "text-[#ddd] group-hover:text-[#aaa]"}`}>
                        <path d="M2 8h11M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Bottom: auth + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.38, ease: EASE }}
              className="shrink-0 px-6 sm:px-10 pt-4 pb-8 sm:pb-12 space-y-3 border-t border-[#f0f0f0]"
            >
              {session?.user ? (
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Image
                      src={session.user.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                      alt="Profile" width={30} height={30}
                      className="rounded-full object-cover border border-[#e8e8e8] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[11.5px] text-[#1a1a1a] font-medium truncate">{session.user.name}</p>
                      <p className="text-[9.5px] text-[#999] truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="shrink-0 text-[9px] uppercase tracking-wider text-red-400 hover:text-red-500 transition-colors duration-200">
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[9.5px] text-[#ccc] uppercase tracking-wider">Not signed in</span>
                  <Link href="/login"
                    className="text-[9.5px] uppercase tracking-wider font-medium text-[#7A2267] hover:underline">
                    Login →
                  </Link>
                </div>
              )}

              <Link
                href="/booking"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl
                  bg-[#7A2267] text-white text-[10px] uppercase tracking-[0.2em] font-semibold
                  hover:bg-[#8a256f] transition-colors duration-300
                  shadow-[0_4px_18px_rgba(122,34,103,0.2)]"
              >
                Reserve Your Stay
                <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                  <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
