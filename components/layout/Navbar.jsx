"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Lora, Josefin_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications/notificationActions";

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

// ─── Notification helpers ─────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

const NOTIF_CFG = {
  booking_update: {
    color: "bg-violet-100 text-violet-600",
    icon: (
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1.5 6h13M5.5 1v3M10.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  payment: {
    color: "bg-emerald-100 text-emerald-600",
    icon: (
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 7.5h14" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="3" y="9.5" width="4" height="1.5" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  alert: {
    color: "bg-red-100 text-red-500",
    icon: (
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <path d="M7.13 2.23L1.34 12a1 1 0 0 0 .87 1.5h11.58A1 1 0 0 0 14.66 12L8.87 2.23a1 1 0 0 0-1.74 0z"
          stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  coupon: {
    color: "bg-amber-100 text-amber-600",
    icon: (
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <circle cx="5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  message: {
    color: "bg-blue-100 text-blue-500",
    icon: (
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <path d="M2 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V4a1 1 0 0 1 1-1z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
  system: {
    color: "bg-[#F0E8F4] text-[#7A2267]",
    icon: (
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
};

// ─── Client Notification Bell ─────────────────────────────────────────────────

function ClientNotifBell() {
  const [open,    setOpen]    = useState(false);
  const [count,   setCount]   = useState(0);
  const [notifs,  setNotifs]  = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  useEffect(() => {
    const load = () => getUnreadNotificationCount().then(setCount).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      getUserNotifications()
        .then((d) => {
          setNotifs((d.notifications || []).slice(0, 25));
          setCount(d.unreadCount ?? 0);
          setLoaded(true);
        })
        .catch(() => {});
    }
  }

  function markRead(id) {
    startTransition(async () => {
      await markNotificationRead(id).catch(() => {});
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setCount((c) => Math.max(0, c - 1));
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead().catch(() => {});
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    });
  }

  const cfg = (type) => NOTIF_CFG[type] || NOTIF_CFG.system;

  return (
    <div className="relative flex items-center">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Notifications"
        aria-label="Notifications"
        className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
          ${open
            ? "bg-[#F5EEF8] text-[#7A2267]"
            : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#333]"
          }`}
      >
        <svg viewBox="0 0 22 22" width="19" height="19" fill="none">
          <path
            d="M11 2C8.24 2 6 4.24 6 7v5.5L4 14.5h14l-2-2V7c0-2.76-2.24-5-5-5z"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d="M9 14.5a2 2 0 0 0 4 0"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
          />
        </svg>
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center
            text-[8px] font-bold bg-[#7A2267] text-white rounded-full px-1 leading-none pointer-events-none
            shadow-[0_1px_4px_rgba(122,34,103,0.4)]">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="
            lg:absolute lg:right-0 lg:top-[calc(100%+10px)]
            max-lg:fixed max-lg:top-[62px] max-lg:right-3 sm:max-lg:top-[70px]
            w-[340px] max-w-[calc(100vw-24px)]
            bg-white border border-[#ebebeb] rounded-2xl
            shadow-[0_12px_48px_rgba(0,0,0,0.11)]
            overflow-hidden z-[200]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f3f3]">
            <div>
              <p className={`text-[12px] font-semibold text-[#1a1a1a] ${josefin.className}`}>
                Notifications
              </p>
              {count > 0 && (
                <p className="text-[9px] text-[#bbb] mt-0.5">{count} unread</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {count > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={isPending}
                  className="text-[9.5px] font-semibold text-[#7A2267] hover:text-[#8e2878]
                    transition-colors disabled:opacity-40"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[9.5px] text-[#bbb] hover:text-[#666] transition-colors"
              >
                See all
              </Link>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto overscroll-contain">
            {!loaded ? (
              <div className="py-10 flex justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-[#f0e8f4] border-t-[#7A2267] animate-spin block" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-[#F5EEF8] flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 22 22" width="18" height="18" fill="none">
                    <path d="M11 2C8.24 2 6 4.24 6 7v5.5L4 14.5h14l-2-2V7c0-2.76-2.24-5-5-5z"
                      stroke="#C4B3CE" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 14.5a2 2 0 0 0 4 0"
                      stroke="#C4B3CE" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[11px] text-[#ccc]">No notifications yet</p>
              </div>
            ) : (
              notifs.map((n) => {
                const c = cfg(n.type);
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markRead(n._id)}
                    className={`flex gap-3 px-4 py-3.5 border-b border-[#f8f8f8]
                      transition-colors duration-150 cursor-pointer
                      ${n.isRead
                        ? "hover:bg-[#fafafa] opacity-65"
                        : "hover:bg-[#fdf8fc]"
                      }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${c.color}`}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between mb-0.5">
                        <p className="text-[11px] font-semibold text-[#1a1410] leading-snug">
                          {n.header}
                        </p>
                        <span className="text-[8.5px] text-[#ccc] shrink-0 mt-px">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#9B8BAB] leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7A2267] shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {loaded && notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#f3f3f3] text-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-[9.5px] font-semibold text-[#7A2267] hover:text-[#8e2878] transition-colors"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdown]     = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const dropRef = useRef(null);

  const hiddenRoutes = ["/login", "/signup"];
  const isHidden = hiddenRoutes.some((r) => pathname.startsWith(r));

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
      {/* ── Sticky header ── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: EASE }}
        className={`sticky top-0 inset-x-0 z-[100] ${josefin.className}
          bg-white shadow-[0_1px_0_rgba(0,0,0,0.06),0_2px_16px_rgba(0,0,0,0.05)]`}
      >
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

            {/* Desktop right: bell + auth + reserve */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              {status === "loading" ? (
                <div className="w-9 h-9 rounded-full bg-[#f0f0f0] animate-pulse" />
              ) : session?.user ? (
                <>
                  <ClientNotifBell />

                  {/* User dropdown */}
                  <div ref={dropRef} className="relative">
                    <button
                      onClick={() => setDropdown((v) => !v)}
                      className="flex items-center gap-2 focus:outline-none group"
                    >
                      <Image
                        src={session.user.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                        alt="Profile" width={30} height={30}
                        className="rounded-full object-cover border border-[#e0e0e0] group-hover:border-[#7A2267]/30 transition-colors duration-200"
                      />
                      <motion.svg
                        animate={{ rotate: dropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        viewBox="0 0 10 6" width="7" height="7" fill="none"
                        className="text-[#aaa]"
                      >
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
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
                </>
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
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Mobile: bell (if logged in) + hamburger */}
            <div className="lg:hidden flex items-center gap-0.5">
              {session?.user && <ClientNotifBell />}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="relative z-[110] flex flex-col items-end justify-center gap-[5px] w-9 h-9
                  rounded-full hover:bg-[#f5f5f5] transition-colors duration-200 focus:outline-none"
                aria-label="Toggle menu"
              >
                <motion.span
                  animate={mobileOpen ? { rotate: 45, y: 5, width: "18px" } : { rotate: 0, y: 0, width: "18px" }}
                  transition={{ duration: 0.25 }}
                  className="block h-px rounded-full bg-[#333] origin-center mx-auto"
                  style={{ width: 18 }}
                />
                <motion.span
                  animate={mobileOpen ? { opacity: 0, x: 6 } : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.18 }}
                  className="block h-px rounded-full bg-[#333] mx-auto"
                  style={{ width: 12 }}
                />
                <motion.span
                  animate={mobileOpen ? { rotate: -45, y: -5, width: "18px" } : { rotate: 0, y: 0, width: "18px" }}
                  transition={{ duration: 0.25 }}
                  className="block h-px rounded-full bg-[#333] origin-center mx-auto"
                  style={{ width: 18 }}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile fullscreen menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[98] bg-black/20 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              key="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.38, ease: EASE }}
              className={`fixed top-0 right-0 bottom-0 w-[min(340px,100vw)] z-[99] flex flex-col
                bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.12)] ${josefin.className}`}
            >
              {/* Panel header */}
              <div className="shrink-0 flex items-center justify-between px-6 py-4
                border-b border-[#f0f0f0]">
                <Image
                  src="/logo.png" alt="Dhali's Amber Nivaas"
                  width={82} height={24}
                  className="object-contain opacity-80"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full
                    text-[#aaa] hover:text-[#333] hover:bg-[#f5f5f5] transition-all duration-200"
                >
                  <svg viewBox="0 0 20 20" width="15" height="15" fill="none"
                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M4 4l12 12M16 4L4 16"/>
                  </svg>
                </button>
              </div>

              {/* Decorative brand strip */}
              <div className="shrink-0 h-[3px]"
                style={{ background: "linear-gradient(to right, #7A2267, #C9963A, #7A2267)" }} />

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-3">
                {navLinks.map((link, i) => {
                  const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035 + 0.05, duration: 0.3, ease: EASE }}
                    >
                      <Link
                        href={link.href}
                        className={`group flex items-center justify-between px-6 py-3.5
                          border-b border-[#f6f6f6] transition-all duration-200
                          ${isActive ? "bg-[#faf5f9]" : "hover:bg-[#fdf9fc]"}`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Index number */}
                          <span className={`text-[9px] font-semibold tracking-widest
                            transition-colors duration-200 w-5
                            ${isActive ? "text-[#C9963A]" : "text-[#ddd] group-hover:text-[#ccc]"}`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {/* Link name */}
                          <span
                            className={`text-[13px] font-light tracking-wide transition-colors duration-200
                              ${isActive ? "text-[#7A2267]" : "text-[#444] group-hover:text-[#1a1a1a]"}`}
                            style={lora.style}
                          >
                            {link.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7A2267]/50" />
                          )}
                          <svg viewBox="0 0 16 16" width="10" height="10" fill="none"
                            className={`shrink-0 transition-all duration-300 group-hover:translate-x-0.5
                              ${isActive ? "text-[#7A2267]/50" : "text-[#ddd] group-hover:text-[#bbb]"}`}>
                            <path d="M2 8h11M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4"
                              strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Bottom section */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.35, ease: EASE }}
                className="shrink-0 border-t border-[#f0f0f0]"
              >
                {/* Auth row */}
                <div className="px-6 pt-4 pb-3">
                  {session?.user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <Image
                          src={session.user.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name)}&background=7A2267&color=fff`}
                          alt="Profile" width={32} height={32}
                          className="rounded-full object-cover border-2 border-[#f0e8f4] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#1a1a1a] font-semibold truncate">{session.user.name}</p>
                          <p className="text-[9px] text-[#aaa] truncate mt-0.5">{session.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <Link
                          href="/account"
                          onClick={() => setMobileOpen(false)}
                          className="text-[9px] uppercase tracking-wider text-[#7A2267] font-medium
                            hover:text-[#8e2878] transition-colors duration-200"
                        >
                          Account
                        </Link>
                        <span className="w-px h-3 bg-[#e8e8e8]" />
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="text-[9px] uppercase tracking-wider text-red-400
                            hover:text-red-500 transition-colors duration-200">
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-[9px] text-[#ccc] uppercase tracking-wider">Guest visitor</span>
                      <Link href="/login" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider
                          font-semibold text-[#7A2267] hover:text-[#8e2878] transition-colors duration-200">
                        Login
                        <svg viewBox="0 0 10 10" width="6" height="6" fill="none">
                          <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="px-6 pb-8 pt-1">
                  <Link
                    href="/booking"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl
                      text-[10px] uppercase tracking-[0.2em] font-semibold text-white
                      transition-all duration-300
                      shadow-[0_4px_20px_rgba(122,34,103,0.3)]
                      hover:shadow-[0_6px_24px_rgba(122,34,103,0.4)]"
                    style={{
                      background: "linear-gradient(135deg, #7A2267 0%, #9B3080 50%, #7A2267 100%)",
                    }}
                  >
                    Reserve Your Stay
                    <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                      <path d="M1 5h7M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
