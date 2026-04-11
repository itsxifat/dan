"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef, useTransition } from "react";
import {
  getAdminUnreadCount,
  getAdminNotificationFeed,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/actions/notifications/adminNotificationActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const TYPE_CONFIG = {
  booking: {
    bg:   "bg-blue-500/15",
    text: "text-blue-400",
    dot:  "bg-blue-400",
    icon: (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1.5 6h13M5.5 1v3M10.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  review: {
    bg:   "bg-amber-500/15",
    text: "text-amber-400",
    dot:  "bg-amber-400",
    icon: (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4-2.9-2.8 4-.6z"
          stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  corporate: {
    bg:   "bg-violet-500/15",
    text: "text-violet-400",
    dot:  "bg-violet-400",
    icon: (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M2 9.5h12" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  payment: {
    bg:   "bg-emerald-500/15",
    text: "text-emerald-400",
    dot:  "bg-emerald-400",
    icon: (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M1 7.5h14" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="3" y="9.5" width="4" height="1.5" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  system: {
    bg:   "bg-white/8",
    text: "text-white/45",
    dot:  "bg-white/30",
    icon: (
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

// ─── Admin Notification Panel ─────────────────────────────────────────────────

function AdminNotifBell() {
  const [open,    setOpen]    = useState(false);
  const [count,   setCount]   = useState(0);
  const [notifs,  setNotifs]  = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef(null);
  const btnRef   = useRef(null);

  // Poll unread count every 60 s
  useEffect(() => {
    const load = () => getAdminUnreadCount().then(setCount).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
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
      getAdminNotificationFeed({ limit: 40 })
        .then((d) => {
          setNotifs(d.notifications);
          setCount(d.unreadCount);
          setLoaded(true);
        })
        .catch(() => {});
    }
  }

  function markRead(id) {
    startTransition(async () => {
      await markAdminNotificationRead(id).catch(() => {});
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setCount((c) => Math.max(0, c - 1));
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllAdminNotificationsRead().catch(() => {});
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    });
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Activity Feed"
        className={`relative p-2 rounded-xl transition-all duration-200
          ${open
            ? "bg-white/10 text-white/80"
            : "text-white/32 hover:text-white/70 hover:bg-white/[0.06]"
          }`}
      >
        <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
          <path d="M9 1.5C6.5 1.5 4.5 3.5 4.5 6v4.5L3 12.5h12l-1.5-2V6C13.5 3.5 11.5 1.5 9 1.5z"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.5 12.5a1.5 1.5 0 0 0 3 0"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center
            text-[8px] font-bold bg-[#7A2267] text-white rounded-full px-1 leading-none pointer-events-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+10px)]
            w-[360px] max-w-[calc(100vw-24px)]
            bg-[#131313] border border-white/[0.07] rounded-2xl
            shadow-[0_20px_60px_rgba(0,0,0,0.6)]
            overflow-hidden z-[300]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
            <div>
              <p className="text-[12.5px] font-semibold text-white/80 leading-none">Activity Feed</p>
              <p className="text-[9px] text-white/25 mt-1 uppercase tracking-wider">
                {count > 0 ? `${count} unread` : "All caught up"}
              </p>
            </div>
            {count > 0 && (
              <button
                onClick={markAllRead}
                disabled={isPending}
                className="text-[9.5px] text-[#9a3285] hover:text-[#b040a0]
                  transition-colors disabled:opacity-40"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto overscroll-contain">
            {!loaded ? (
              <div className="py-10 flex justify-center">
                <span className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/50 animate-spin block" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 18 18" width="16" height="16" fill="none">
                    <path d="M9 1.5C6.5 1.5 4.5 3.5 4.5 6v4.5L3 12.5h12l-1.5-2V6C13.5 3.5 11.5 1.5 9 1.5z"
                      stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.5 12.5a1.5 1.5 0 0 0 3 0"
                      stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[11px] text-white/20">No activity yet</p>
              </div>
            ) : (
              notifs.map((n) => {
                const cfg = getTypeConfig(n.type);
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markRead(n._id)}
                    className={`group flex gap-3 px-4 py-3.5 border-b border-white/[0.04]
                      cursor-pointer transition-all duration-150
                      ${n.isRead
                        ? "hover:bg-white/[0.02] opacity-50"
                        : "hover:bg-white/[0.04]"
                      }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <p className="text-[11.5px] font-medium text-white/75 leading-snug">
                          {n.title}
                        </p>
                        <span className="text-[9px] text-white/22 shrink-0 mt-px">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {n.message && (
                        <p className="text-[10.5px] text-white/32 mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                          className="mt-1.5 inline-flex items-center gap-1 text-[9.5px]
                            text-[#7A2267] hover:text-[#9a3285] transition-colors"
                        >
                          View
                          <svg viewBox="0 0 8 8" width="6" height="6" fill="none">
                            <path d="M1 4h5.5M4 1.5L6.5 4 4 6.5"
                              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {loaded && notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/[0.05]">
              <p className="text-[8.5px] text-white/15 text-center uppercase tracking-wider">
                Showing last {notifs.length} activities
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page Meta ────────────────────────────────────────────────────────────────

const PAGE_META = {
  "/admin/dashboard":              { title: "Dashboard",           sub: "Overview & analytics"                },
  "/admin/users":                  { title: "Users",               sub: "Manage accounts & permissions"       },
  "/admin/users/add":              { title: "Add Admin",           sub: "Grant admin access"                  },
  "/admin/accommodation":          { title: "Accommodation",       sub: "Manage properties & rooms"           },
  "/admin/accommodation/new":      { title: "New Property",        sub: "Add a building or cottage"           },
  "/admin/rooms":                  { title: "Rooms",               sub: "All rooms across properties"         },
  "/admin/amenities":              { title: "Amenities",           sub: "Icons & feature tags for properties" },
  "/admin/daylong-packages":       { title: "Day-Long Packages",   sub: "Manage day trip packages"            },
  "/admin/bookings":               { title: "Bookings",            sub: "Reservations & payment status"       },
  "/admin/corporate/visits":       { title: "Visit Requests",      sub: "Corporate inquiry management"        },
  "/admin/corporate/events":       { title: "Events Gallery",      sub: "Corporate event images"              },
  "/admin/dining":                 { title: "Menu Manager",        sub: "Food & beverage offerings"           },
  "/admin/gallery":                { title: "Gallery",             sub: "Main photo gallery"                  },
  "/admin/wedding-gallery":        { title: "Wedding Gallery",     sub: "Wedding photos & albums"             },
  "/admin/wedding-venues":         { title: "Wedding Venues",      sub: "Venue listings & details"            },
  "/admin/discounts":              { title: "Discounts & Coupons", sub: "Offers, coupon codes & gift cards"   },
  "/admin/send-notification":      { title: "Notifications",       sub: "Send messages & alerts to guests"    },
  "/admin/media":                  { title: "Media Library",       sub: "Upload & organise images"            },
  "/admin/settings":               { title: "Settings",            sub: "Hotel-wide configuration"            },
};

function resolveMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/admin/accommodation/") && pathname !== "/admin/accommodation/new")
    return { title: "Edit Property",  sub: "Update details, categories & rooms" };
  if (pathname.startsWith("/admin/bookings/"))
    return { title: "Booking Detail", sub: "Reservation info & payment"         };
  if (pathname.startsWith("/admin/users/"))
    return { title: "User Profile",   sub: "Account details & permissions"      };
  if (pathname.startsWith("/admin/corporate/"))
    return { title: "Corporate",      sub: ""                                   };
  return { title: "Admin", sub: "" };
}

// ─── AdminHeader ──────────────────────────────────────────────────────────────

export default function AdminHeader({ onMenuToggle }) {
  const pathname          = usePathname();
  const { data: session } = useSession();
  const meta              = resolveMeta(pathname);

  const avatarSrc =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "A")}&background=7A2267&color=fff`;

  return (
    <header
      className="sticky top-0 z-50 flex items-center gap-3
        bg-[#0a0a0a]/90 backdrop-blur-xl
        border-b border-white/[0.05]
        px-4 sm:px-6 lg:px-8 py-3"
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-1.5 rounded-xl text-white/35
          hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 18 18" width="17" height="17" fill="none">
          <path d="M2 4.5h14M2 9h14M2 13.5h14"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[13.5px] font-semibold text-white/85 leading-none truncate">
          {meta.title}
        </h1>
        {meta.sub && (
          <p className="text-[9.5px] text-white/22 uppercase tracking-wider mt-0.5 truncate">
            {meta.sub}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Admin activity-feed bell */}
        <AdminNotifBell />

        {/* View site */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider
            text-white/22 hover:text-white/55 transition-colors duration-200
            border border-white/[0.07] hover:border-white/12 rounded-full px-3 py-1.5"
        >
          <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
            <path d="M7 1h4v4M11 1 6.5 5.5M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          View Site
        </Link>

        {/* Avatar */}
        <div className="relative">
          <Image
            src={avatarSrc}
            alt={session?.user?.name || "Profile"}
            width={30}
            height={30}
            className="rounded-full border border-white/12 object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#0a0a0a]" />
        </div>
      </div>
    </header>
  );
}
