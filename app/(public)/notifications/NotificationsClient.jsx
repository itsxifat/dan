"use client";

import { useState, useTransition } from "react";
import { Lora, Josefin_Sans } from "next/font/google";
import Link from "next/link";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/notifications/notificationActions";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

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
  booking_update: {
    color: "bg-violet-100 text-violet-600",
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1.5 6h13M5.5 1v3M10.5 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  payment: {
    color: "bg-emerald-100 text-emerald-600",
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <rect x="1" y="4" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 7.5h14" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="3" y="9.5" width="4" height="1.5" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  alert: {
    color: "bg-red-100 text-red-500",
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <path d="M7.13 2.23L1.34 12a1 1 0 0 0 .87 1.5h11.58A1 1 0 0 0 14.66 12L8.87 2.23a1 1 0 0 0-1.74 0z" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  coupon: {
    color: "bg-amber-100 text-amber-600",
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
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
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <path d="M2 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
  system: {
    color: "bg-[#F0E8F4] text-[#7A2267]",
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({ notif, onRead }) {
  const cfg = getTypeConfig(notif.type);

  return (
    <div
      onClick={() => !notif.isRead && onRead(notif._id)}
      className={`group relative flex gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer
        ${notif.isRead
          ? "bg-white border-[#EDE5F0]/60 opacity-80"
          : "bg-white border-[#EDE5F0] shadow-[0_2px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]"}`}>
      {/* Unread dot */}
      {!notif.isRead && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-[#7A2267] rounded-full" />
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`text-[13px] font-semibold text-[#1a1410] leading-snug ${!notif.isRead ? "" : "text-[#4a3a40]"}`}>
            {notif.header}
          </p>
          <span className={`${josefin.className} text-[9.5px] text-[#C4B3CE] shrink-0 mt-0.5`}>
            {timeAgo(notif.createdAt)}
          </span>
        </div>
        <p className={`${josefin.className} text-[12px] text-[#9B8BAB] leading-relaxed`}>{notif.body}</p>

        {/* Image */}
        {notif.image && (
          <img src={notif.image} alt="" className="mt-3 rounded-xl w-full max-h-36 object-cover" />
        )}

        {/* Linked coupon */}
        {notif.linkedDiscount && (
          <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
              <circle cx="4" cy="4" r="1.3" stroke="#d97706" strokeWidth="1.1"/>
              <circle cx="10" cy="10" r="1.3" stroke="#d97706" strokeWidth="1.1"/>
              <path d="M2 12L12 2" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] text-amber-700 font-semibold">
              {notif.linkedDiscount.code
                ? <code className="font-mono tracking-wider">{notif.linkedDiscount.code}</code>
                : notif.linkedDiscount.name}
            </span>
          </div>
        )}

        {/* Booking link */}
        {notif.metadata?.bookingId && (
          <Link href={`/account/bookings/${notif.metadata.bookingId}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#7A2267] hover:text-[#8e2878] transition-colors">
            View booking
            <svg viewBox="0 0 10 10" width="9" height="9" fill="none">
              <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Client Component ─────────────────────────────────────────────────────────
export default function NotificationsClient({ initialNotifications, initialUnreadCount }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount]     = useState(initialUnreadCount);
  const [isPending, startTransition]       = useTransition();

  function markRead(id) {
    startTransition(async () => {
      await markNotificationRead(id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  }

  const unread = notifications.filter((n) => !n.isRead);
  const read   = notifications.filter((n) =>  n.isRead);

  return (
    <div className={josefin.className}>
      {/* Toolbar */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11.5px] text-[#9B8BAB]">
            <span className="font-semibold text-[#1a1410]">{unreadCount}</span> unread
          </p>
          <button onClick={markAllRead} disabled={isPending}
            className="text-[11.5px] font-semibold text-[#7A2267] hover:text-[#8e2878] transition-colors disabled:opacity-50">
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#F0E8F4] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path d="M12 2C9 2 6.5 4.5 6.5 7.5v6L5 15.5h14L17.5 13.5v-6C17.5 4.5 15 2 12 2z"
                stroke="#C4B3CE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 15.5a2 2 0 0 0 4 0" stroke="#C4B3CE" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className={`text-[18px] font-medium text-[#1a1410] mb-2 ${lora.className}`}>All caught up</h3>
          <p className="text-[12.5px] text-[#9B8BAB]">No notifications yet. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Unread section */}
          {unread.length > 0 && (
            <>
              <p className="text-[9.5px] uppercase tracking-[0.22em] text-[#9B8BAB] font-semibold px-1 mb-2">New</p>
              {unread.map((n) => (
                <NotifCard key={n._id} notif={n} onRead={markRead} />
              ))}
            </>
          )}

          {/* Read section */}
          {read.length > 0 && (
            <>
              {unread.length > 0 && (
                <p className="text-[9.5px] uppercase tracking-[0.22em] text-[#9B8BAB] font-semibold px-1 mt-6 mb-2">Earlier</p>
              )}
              {read.map((n) => (
                <NotifCard key={n._id} notif={n} onRead={markRead} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
