"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLE_STYLES, ROLE_LABELS, hasPermission } from "@/lib/permissions";

const EASE = [0.16, 1, 0.3, 1];

const NAV = [
  {
    group: "Menu",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        permission: "dashboard.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
          </svg>
        ),
      },
      {
        label: "Users",
        href: "/admin/users",
        permission: "users.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <circle cx="6.5" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <path d="M1 15.5c0-3.038 2.462-5.5 5.5-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="13.5" cy="11.5" r="2.3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <path d="M11 17c0-1.933 1.119-3.5 2.5-3.5s2.5 1.567 2.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Add Admin",
        href: "/admin/users/add",
        permission: "admin.add",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <path d="M1.5 15.5c0-3.038 2.462-5.5 5.5-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M14.5 10v6M11.5 13h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Property",
    items: [
      {
        label: "Accommodation",
        href: "/admin/accommodation",
        permission: "accommodation.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M2 16V8.5L9 3l7 5.5V16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <rect x="6.5" y="11" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.15" : "0"} />
          </svg>
        ),
      },
      {
        label: "Bookings",
        href: "/admin/bookings",
        permission: "bookings.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="2" y="3.5" width="14" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <path d="M2 7.5h14" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M5.5 11h3M5.5 13.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              opacity={active ? "1" : "0.6"} />
          </svg>
        ),
      },
      {
        label: "Room Management",
        href: "/admin/rooms",
        permission: "bookings.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="1.5" y="5" width="7" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.1" : "0"} />
            <rect x="9.5" y="5" width="7" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.1" : "0"} />
            <path d="M4.5 5V3.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1V5" stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round" />
            <circle cx="5" cy="10" r="1" fill={active ? "currentColor" : "none"}
              fillOpacity={active ? "0.6" : "0"} stroke="currentColor" strokeWidth="1" />
            <circle cx="13" cy="10" r="1" fill={active ? "currentColor" : "none"}
              fillOpacity={active ? "0.6" : "0"} stroke="currentColor" strokeWidth="1" />
          </svg>
        ),
      },
      {
        label: "Amenities",
        href: "/admin/amenities",
        permission: "accommodation.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M9 1l2.09 4.26L16 6.18l-3.5 3.41.83 4.82L9 12.15 5.67 14.41l.83-4.82L3 6.18l4.91-.92L9 1z"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} />
          </svg>
        ),
      },
      {
        label: "Day Long Packages",
        href: "/admin/daylong-packages",
        permission: "accommodation.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Corporate",
    items: [
      {
        label: "Visit Requests",
        href: "/admin/corporate/visits",
        permission: "corporate.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <path d="M5 6h8M5 9h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              opacity={active ? "1" : "0.6"} />
            <circle cx="13" cy="13" r="3" fill={active ? "currentColor" : "none"}
              fillOpacity={active ? "0.25" : "0"} stroke="currentColor" strokeWidth="1.2" />
            <path d="M12 13h2M13 12v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Corporate Manager",
        href: "/admin/corporate/manage",
        permission: "corporate.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="1.5" y="2" width="15" height="14" rx="1.8" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <path d="M5 6h8M5 9h5M5 12h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              opacity={active ? "1" : "0.6"} />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Dining",
    items: [
      {
        label: "Menu Manager",
        href: "/admin/dining",
        permission: "dining.read",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M3 2v6a3 3 0 0 0 3 3v5M6 2v6M9 2v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
              opacity={active ? "1" : "0.8"} />
            <path d="M13 2c0 0 0 7-1.5 7.5V16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.1" : "0"} />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Content",
    items: [
      {
        label: "Gallery",
        href: "/admin/gallery",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="1.5" y="1.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <rect x="10" y="1.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <rect x="1.5" y="10" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <rect x="10" y="10" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
          </svg>
        ),
      },
      {
        label: "Wedding Gallery",
        href: "/admin/wedding-gallery",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M9 2C9 2 4 5.5 4 10a5 5 0 0 0 10 0C14 5.5 9 2 9 2z" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} strokeLinejoin="round" />
            <path d="M6.5 10a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Wedding Venues",
        href: "/admin/wedding-venues",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M2 16V9L9 3l7 6v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <rect x="6" y="10" width="6" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.2"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.15" : "0"} />
            <path d="M9 10v6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity={active ? "1" : "0.5"} />
          </svg>
        ),
      },
    ],
  },
  {
    group: "Marketing",
    items: [
      {
        label: "Discounts",
        href: "/admin/discounts",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <circle cx="5" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.25" : "0"} />
            <circle cx="13" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.25" : "0"} />
            <path d="M3 15L15 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.05" : "0"} />
          </svg>
        ),
      },
      {
        label: "Notifications",
        href: "/admin/send-notification",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M9 1.5C6.5 1.5 4.5 3.5 4.5 6v4.5l-1.5 2h12l-1.5-2V6C13.5 3.5 11.5 1.5 9 1.5z"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} />
            <path d="M7.5 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "System",
    items: [
      {
        label: "Media",
        href: "/admin/media",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <rect x="1.5" y="3.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
            <circle cx="6" cy="7.5" r="1.3" stroke="currentColor" strokeWidth="1.2"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.25" : "0"} />
            <path d="M1.5 12.5l3.5-3 3 2.5 2.5-2 4 3" stroke="currentColor" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: "About Page",
        href: "/admin/about",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.15" : "0"} />
            <path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: "Contact",
        href: "/admin/contact",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <path d="M3 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6l-3 3V4a1 1 0 0 1 1-1z"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.08" : "0"} />
          </svg>
        ),
      },
      {
        label: "Settings",
        href: "/admin/settings",
        permission: "settings.write",
        Icon: ({ active }) => (
          <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
            <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.3"
              fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.18" : "0"} />
            <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.57 3.57l1.42 1.42M13.01 13.01l1.42 1.42M3.57 14.43l1.42-1.42M13.01 4.99l1.42-1.42"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];

function SidebarContent({ onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <div className="flex flex-col h-full select-none">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.05]">
        <Link href="/admin/dashboard" onClick={onClose} className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Admin"
            width={82}
            height={26}
            className="object-contain brightness-0 invert opacity-75 group-hover:opacity-100 transition-opacity duration-300"
            priority
          />
          <span className="text-[7.5px] uppercase tracking-[0.2em] font-semibold text-white/20
            border border-white/[0.07] px-2 py-[3px] rounded-full">
            Panel
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-4">
        {NAV.map((group) => {
          const visibleItems = group.items.filter((item) =>
            hasPermission(userRole, item.permission)
          );
          if (!visibleItems.length) return null;

          return (
            <div key={group.group}>
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/18 font-semibold px-2.5 mb-1.5">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-colors duration-200 group
                        ${isActive
                          ? "text-white"
                          : "text-white/32 hover:text-white/75 hover:bg-white/[0.035]"
                        }`}
                    >
                      {isActive && (
                        <>
                          <motion.span
                            layoutId="sidebarHighlight"
                            className="absolute inset-0 rounded-xl bg-white/6"
                            transition={{ duration: 0.3, ease: EASE }}
                          />
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5
                            bg-[#7A2267] rounded-r-full" />
                        </>
                      )}
                      <span className="relative z-10 shrink-0">
                        <item.Icon active={isActive} />
                      </span>
                      <span className="relative z-10 text-[11.5px] font-medium tracking-wide">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-2.5 pb-5 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl">
          <div className="relative flex-shrink-0">
            <Image
              src={
                session?.user?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "A")}&background=7A2267&color=fff`
              }
              alt="Profile"
              width={28}
              height={28}
              className="rounded-full object-cover border border-white/15"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#0d0d0d]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-white/85 truncate leading-tight">
              {session?.user?.name}
            </p>
            <span className={`inline-flex items-center text-[8px] uppercase tracking-wider font-semibold
              px-1.5 py-[2px] rounded-full mt-[2px] ${ROLE_STYLES[userRole]}`}>
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
            className="flex-shrink-0 p-1.5 rounded-lg text-white/20 hover:text-red-400
              hover:bg-red-500/10 transition-all duration-200"
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
              <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-[215px] xl:w-[230px] bg-[#0d0d0d]
        border-r border-white/[0.05] h-screen sticky top-0 flex-shrink-0">
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-[210] w-[230px]
                bg-[#0d0d0d] border-r border-white/[0.05]"
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
