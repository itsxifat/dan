"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const PAGE_META = {
  "/admin/dashboard":        { title: "Dashboard",      sub: "Overview & analytics"           },
  "/admin/users":            { title: "Users",           sub: "Manage accounts & permissions"  },
  "/admin/users/add":        { title: "Add Admin",       sub: "Grant admin access"             },
  "/admin/accommodation":    { title: "Accommodation",   sub: "Manage properties & rooms"      },
  "/admin/rooms":            { title: "Rooms",            sub: "All rooms across properties"     },
  "/admin/accommodation/new":{ title: "New Property",    sub: "Add a building or cottage"      },
  "/admin/bookings":         { title: "Bookings",        sub: "Reservations & payment status"  },
  "/admin/media":            { title: "Media Library",   sub: "Manage uploaded images"         },
  "/admin/settings":         { title: "Settings",        sub: "Hotel-wide configuration"       },
};

export default function AdminHeader({ onMenuToggle }) {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const meta =
    PAGE_META[pathname] ??
    (pathname.startsWith("/admin/accommodation/") ? { title: "Edit Property", sub: "Update details, categories & rooms" } : null) ??
    (pathname.startsWith("/admin/bookings/") ? { title: "Booking Detail", sub: "Reservation info & payment" } : null) ??
    { title: "Admin", sub: "" };

  return (
    <header className="sticky top-0 z-50 flex items-center gap-4
      bg-[#0a0a0a]/90 backdrop-blur-xl
      border-b border-white/5
      px-4 sm:px-6 lg:px-8 py-3.5">

      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-1.5 rounded-xl text-white/35
          hover:text-white hover:bg-white/6 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 18 18" width="17" height="17" fill="none">
          <path d="M2 4.5h14M2 9h14M2 13.5h14"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-semibold text-white leading-none truncate">
          {meta.title}
        </h1>
        {meta.sub && (
          <p className="text-[9.5px] text-white/25 uppercase tracking-wider mt-0.75">
            {meta.sub}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Back to site */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider
            text-white/25 hover:text-white/60 transition-colors duration-200 border border-white/[0.07]
            hover:border-white/15 rounded-full px-3 py-1.5"
        >
          <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
            <path d="M7 1h4v4M11 1 6.5 5.5M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View Site
        </Link>

        {/* Avatar */}
        <div className="relative">
          <Image
            src={
              session?.user?.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || "A")}&background=7A2267&color=fff`
            }
            alt="Profile"
            width={30}
            height={30}
            className="rounded-full border border-white/15 object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#0a0a0a]" />
        </div>
      </div>
    </header>
  );
}
