"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtBDT(n) {
  if (!n && n !== 0) return "—";
  return "৳" + Number(n).toLocaleString();
}
function fmtMethod(method, cardType) {
  if (method === "pay_at_desk") return "Pay at Desk";
  if (method === "sslcommerz" || method === "partial") {
    if (cardType) return cardType;
    return "Online Payment";
  }
  return method || "—";
}

// ─── Animated check icon ─────────────────────────────────────────────────────
function CheckCircle() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings */}
      <span className="absolute w-36 h-36 rounded-full bg-emerald-400/8 animate-[ping_2s_ease-out_infinite]" />
      <span className="absolute w-28 h-28 rounded-full bg-emerald-400/12 animate-[ping_2s_ease-out_0.4s_infinite]" />

      {/* Main circle */}
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.45)] flex items-center justify-center">
        {/* Glow burst */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 to-transparent" />
        {/* Check */}
        <svg viewBox="0 0 44 44" width="44" height="44" fill="none" className="relative z-10">
          <path
            d="M9 23l9 9 17-19"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 44,
              strokeDashoffset: 0,
              animation: "drawCheck 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────
function Row({ label, value, highlight, large, strikethrough }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${large ? "pt-3 mt-3 border-t border-[#F0E8F4]" : ""}`}>
      <span className={`${sans.className} ${large ? "text-[13px] font-semibold text-[#1a1410]" : "text-[12px] text-[#9B8BAB]"}`}>
        {label}
      </span>
      <span className={`${sans.className} text-right
        ${large ? "text-[17px] font-bold" : "text-[13px] font-semibold"}
        ${highlight === "emerald" ? "text-emerald-600" : highlight === "amber" ? "text-amber-600" : large ? "text-[#7A2267]" : "text-[#1a1410]"}
        ${strikethrough ? "line-through text-[#C4B3CE] font-normal text-[12px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SuccessClient({ booking }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const isPartial      = booking?.advancePercent < 100;
  const isDesk         = booking?.paymentMethod === "pay_at_desk";
  const paidNow        = booking?.paidAmount        ?? 0;
  const remaining      = booking?.remainingAmount   ?? 0;
  const total          = booking?.totalAmount        ?? 0;
  const couponDiscount = booking?.couponDiscount     ?? 0;
  const dayDiscount    = booking?.dayLongDiscount    ?? 0;
  const hasDiscount    = couponDiscount > 0 || dayDiscount > 0;
  const subtotal       = booking?.subtotal           ?? 0;
  const taxes          = booking?.taxes              ?? 0;
  const nights         = booking?.nights             ?? 0;
  const mode           = booking?.bookingMode;
  const rooms          = booking?.roomBookings ?? [];

  return (
    <main className={`${sans.className} min-h-screen bg-[#F7F4F0] overflow-hidden`}>
      {/* keyframes injected via style tag */}
      <style>{`
        @keyframes drawCheck {
          from { stroke-dashoffset: 44; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

      {/* Decorative top band */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />

      <div className="max-w-lg mx-auto px-4 py-14 sm:py-20">

        {/* ── Hero section ── */}
        <div
          className="text-center mb-10"
          style={{ animation: visible ? "floatUp 0.6s cubic-bezier(0.16,1,0.3,1) both" : "none" }}
        >
          <div className="flex justify-center mb-7">
            <CheckCircle />
          </div>

          <p className={`${sans.className} text-[10px] uppercase tracking-[0.35em] text-emerald-600 font-semibold mb-3`}>
            {isDesk ? "Reservation Confirmed" : isPartial ? "Advance Paid" : "Payment Complete"}
          </p>

          <h1 className={`${cormorant.className} text-[2.6rem] sm:text-[3rem] font-light text-[#1a1410] leading-[1.1] mb-4`}>
            {isDesk ? (
              <>Your stay is <em className="italic text-[#7A2267]">reserved</em></>
            ) : (
              <>Booking <em className="italic text-[#7A2267]">confirmed!</em></>
            )}
          </h1>

          <p className={`${sans.className} text-[12.5px] text-[#9B8BAB] leading-relaxed max-w-sm mx-auto`}>
            {isDesk
              ? "Your room is held. Please settle the full amount at the front desk on arrival."
              : isPartial
              ? `You've paid the advance. The remaining ৳${remaining.toLocaleString()} is due at check-in.`
              : "Your payment was processed successfully. We look forward to welcoming you."}
          </p>
        </div>

        {booking && (
          <>
            {/* ── Booking reference card ── */}
            <div
              className="bg-white rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.08)] overflow-hidden mb-5"
              style={{ animation: visible ? "scaleIn 0.55s cubic-bezier(0.16,1,0.3,1) 0.15s both" : "none" }}
            >
              {/* Card top accent */}
              <div className="h-[3px] bg-gradient-to-r from-[#7A2267] via-[#a3388d] to-[#7A2267]" />

              {/* Booking number */}
              <div className="px-6 py-5 text-center border-b border-[#F5F0F7]">
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#C4B3CE] font-semibold mb-1.5">Booking Reference</p>
                <p className={`text-[26px] font-bold text-[#7A2267] font-mono tracking-widest`}>
                  {booking.bookingNumber}
                </p>
                <p className="text-[10.5px] text-[#C4B3CE] mt-1">
                  Save this reference for check-in
                </p>
              </div>

              {/* Stay details */}
              <div className="px-6 py-5 border-b border-[#F5F0F7] space-y-2.5">
                <p className="text-[9px] uppercase tracking-[0.22em] text-[#C4B3CE] font-semibold mb-3">Stay Details</p>

                {booking.property?.name && (
                  <Row label="Property" value={booking.property.name} />
                )}

                {mode === "night_stay" ? (
                  <>
                    <Row label="Check-in"  value={fmtDate(booking.checkIn)} />
                    <Row label="Check-out" value={fmtDate(booking.checkOut)} />
                    <Row label="Duration"  value={`${nights} night${nights !== 1 ? "s" : ""}`} />
                  </>
                ) : (
                  <Row label="Date" value={fmtDate(booking.checkIn)} />
                )}

                {rooms.length > 0 && (
                  <Row
                    label={rooms.length === 1 ? "Room" : "Rooms"}
                    value={rooms.map((rb) => `${rb.room?.roomNumber ?? "—"}`).join(", ")}
                  />
                )}

                <Row label="Guests" value={`${booking.totalGuests} guest${booking.totalGuests !== 1 ? "s" : ""}`} />
              </div>

              {/* Payment breakdown */}
              <div className="px-6 py-5 space-y-2.5">
                <p className="text-[9px] uppercase tracking-[0.22em] text-[#C4B3CE] font-semibold mb-3">Payment Details</p>

                {/* Room/package subtotal */}
                {subtotal > 0 && (hasDiscount || taxes > 0) && (
                  <Row label="Subtotal" value={fmtBDT(subtotal)} />
                )}

                {/* Discounts */}
                {dayDiscount > 0 && (
                  <Row label="Package discount" value={`−${fmtBDT(dayDiscount)}`} highlight="emerald" />
                )}
                {couponDiscount > 0 && (
                  <Row
                    label={`Coupon${booking.couponCode ? ` (${booking.couponCode})` : ""}`}
                    value={`−${fmtBDT(couponDiscount)}`}
                    highlight="emerald"
                  />
                )}

                {/* Tax */}
                {taxes > 0 && (
                  <Row label={`Tax`} value={fmtBDT(taxes)} />
                )}

                {/* Total */}
                <Row label="Booking Total" value={fmtBDT(total)} large />

                {/* Divider */}
                <div className="border-t border-dashed border-[#EDE5F0] my-1" />

                {/* What was actually paid */}
                {isDesk ? (
                  <Row label="Due at Desk" value={fmtBDT(total)} highlight="amber" />
                ) : isPartial ? (
                  <>
                    <div className="flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                      <div>
                        <p className="text-[9.5px] uppercase tracking-wider text-emerald-600 font-semibold">Paid Now</p>
                        <p className="text-[22px] font-bold text-emerald-600 mt-0.5">{fmtBDT(paidNow)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9.5px] uppercase tracking-wider text-amber-600 font-semibold">Due at Check-in</p>
                        <p className="text-[22px] font-bold text-amber-600 mt-0.5">{fmtBDT(remaining)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                    <p className="text-[9.5px] uppercase tracking-wider text-emerald-600 font-semibold">Amount Paid</p>
                    <p className="text-[22px] font-bold text-emerald-600">{fmtBDT(paidNow)}</p>
                  </div>
                )}

                {/* Payment method */}
                {!isDesk && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11.5px] text-[#9B8BAB]">Paid via</span>
                    <div className="flex items-center gap-1.5">
                      {/* card icon */}
                      <svg viewBox="0 0 18 12" width="16" height="11" fill="none">
                        <rect x="0.5" y="0.5" width="17" height="11" rx="2" stroke="#C4B3CE" strokeWidth="1"/>
                        <path d="M0.5 4h17" stroke="#C4B3CE" strokeWidth="1"/>
                        <rect x="2" y="6.5" width="5" height="1.5" rx="0.5" fill="#C4B3CE"/>
                      </svg>
                      <span className="text-[12px] font-semibold text-[#1a1410]">
                        {fmtMethod(booking.paymentMethod, booking.cardType)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bank / transaction ID */}
                {booking.bankTxnId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] text-[#9B8BAB]">Bank Txn ID</span>
                    <span className="text-[11px] font-mono text-[#9B8BAB] tracking-wider">{booking.bankTxnId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Email note ── */}
            {booking.primaryGuest?.email && (
              <div
                className="flex items-center gap-3 bg-white/60 border border-[#EDE5F0] rounded-2xl px-4 py-3.5 mb-5"
                style={{ animation: visible ? "floatUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.35s both" : "none" }}
              >
                <div className="w-8 h-8 rounded-full bg-[#F0E8F4] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 16 12" width="14" height="11" fill="none">
                    <rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke="#C4B3CE" strokeWidth="1.1"/>
                    <path d="M1 1l7 6 7-6" stroke="#C4B3CE" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[11.5px] text-[#9B8BAB] leading-snug">
                  Confirmation sent to{" "}
                  <span className="font-semibold text-[#1a1410]">{booking.primaryGuest.email}</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* ── CTA buttons ── */}
        <div
          className="space-y-3"
          style={{ animation: visible ? "floatUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.45s both" : "none" }}
        >
          {/* Primary: view bookings */}
          <Link
            href="/account"
            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-[#7A2267] hover:bg-[#8e2878] text-white font-semibold text-[13.5px] transition-all duration-200 shadow-[0_4px_24px_rgba(122,34,103,0.28)] hover:shadow-[0_6px_32px_rgba(122,34,103,0.38)] hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
              <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="white" strokeWidth="1.3"/>
              <path d="M1.5 6.5h13M5.5 1v3M10.5 1v3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M4.5 10h3M4.5 12.5h5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
            </svg>
            View My Bookings
          </Link>

          {/* Secondary: browse */}
          <Link
            href="/accommodation"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-[#EDE5F0] text-[#7A2267] font-semibold text-[13px] hover:border-[#C4B3CE] hover:bg-[#FAF7FC] transition-all duration-200"
          >
            Browse Accommodation
          </Link>

          {/* Tertiary: home */}
          <Link
            href="/"
            className="block text-center text-[12px] text-[#C4B3CE] hover:text-[#9B8BAB] transition-colors pt-1"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
