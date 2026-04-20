"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtBDT(n) {
  if (n === null || n === undefined) return "—";
  return "৳" + Number(n).toLocaleString("en-BD");
}
function fmtMethod(method, cardType) {
  if (cardType) return cardType;
  if (method === "sslcommerz" || method === "partial") return "SSL Commerz";
  return method || "—";
}

export default function SuccessClient({ booking }) {
  const [go, setGo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGo(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!booking) {
    return (
      <main className={`${josefin.className} min-h-dvh bg-[#F7F4F0] flex items-center justify-center px-4`}>
        <div className="text-center space-y-3">
          <p className="text-[#9B8BAB] text-[13px]">Booking not found.</p>
          <Link href="/" className="inline-block text-[12px] text-[#7A2267] font-semibold hover:underline">Return to home</Link>
        </div>
      </main>
    );
  }

  const paidNow  = booking.paidAmount      ?? 0;
  const remaining = booking.remainingAmount ?? 0;
  const total     = booking.totalAmount     ?? 0;
  const isPartial = booking.paymentStatus === "partial" ||
    (paidNow > 0 && total > 0 && paidNow < total - 1);
  const displayRemaining = remaining > 0 ? remaining : Math.max(0, total - paidNow);

  const dayDisc   = booking.dayLongDiscount ?? 0;
  const offerDisc = booking.offerDiscount   ?? 0;
  const couponDisc = booking.couponDiscount ?? 0;
  const totalSaved = dayDisc + offerDisc + couponDisc;

  const nights = booking.nights ?? 0;
  const mode   = booking.bookingMode;
  const rooms  = (booking.roomBookings ?? [])
    .map((rb) => rb.room?.roomNumber ? `#${rb.room.roomNumber}` : null)
    .filter(Boolean);

  // Staggered animation helper
  const s = (delay) => ({
    opacity:   go ? 1 : 0,
    transform: go ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.42s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                 transform 0.42s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <main className={`${josefin.className} min-h-dvh bg-[#F7F4F0] flex flex-col`}>
      <style>{`
        @keyframes circleIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 38; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.35; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>


      {/* Centered scroll area — fills remaining height */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 overflow-y-auto">
        <div className="max-w-[380px] mx-auto w-full">

          {/* ── Hero ── */}
          <div className="text-center mb-5">

            {/* Animated check circle */}
            <div className="flex justify-center mb-4" style={{ position: "relative" }}>
              {/* Ripple ring */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  margin: "auto",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(122,34,103,0.18)",
                  animation: go ? "ripple 1.1s cubic-bezier(0.22,1,0.36,1) 0.55s forwards" : "none",
                }}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7A2267 0%, #a3388d 100%)",
                  boxShadow: "0 6px 28px rgba(122,34,103,0.30)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "circleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
                }}
              >
                <svg viewBox="0 0 30 30" width="26" height="26" fill="none">
                  <path
                    d="M6 16l6 6 12-13"
                    stroke="white"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 38,
                      strokeDashoffset: 38,
                      animation: "drawCheck 0.45s cubic-bezier(0.16,1,0.3,1) 0.38s forwards",
                    }}
                  />
                </svg>
              </div>
            </div>

            {/* Status + title */}
            <p
              className={`${josefin.className} text-[9.5px] uppercase tracking-[0.28em] font-semibold mb-1`}
              style={{ color: "#9B6E00", ...s(200) }}
            >
              {isPartial ? "Advance Payment Received" : "Payment Successful"}
            </p>
            <h1
              className={`${lora.className} text-[2.1rem] sm:text-[2.4rem] font-light text-[#1a1410] leading-tight mb-1`}
              style={s(280)}
            >
              <em className="italic" style={{ color: "#7A2267" }}>Booking Confirmed</em>
            </h1>
            <p
              className={`${josefin.className} text-[11px] text-[#9B8BAB] leading-relaxed`}
              style={s(340)}
            >
              {isPartial
                ? `${fmtBDT(paidNow)} paid · ${fmtBDT(displayRemaining)} due at check-in`
                : "We look forward to welcoming you."}
            </p>
          </div>

          {/* ── Main card ── */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
              ...s(380),
            }}
          >
            {/* Booking ref */}
            <div className="text-center px-5 py-3 border-b border-[#F5F0F7]">
              <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.22em] text-[#C4B3CE] font-semibold mb-0.5`}>
                Booking Reference
              </p>
              <p className="text-[20px] font-bold text-[#7A2267] tracking-[0.18em]" style={{ fontFamily: "monospace" }}>
                {booking.bookingNumber}
              </p>
            </div>

            {/* Stay info — compact single lines */}
            <div className="px-5 py-3 border-b border-[#F5F0F7] space-y-2">
              {booking.property?.name && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`${josefin.className} text-[11px] text-[#9B8BAB]`}>Property</span>
                  <span className={`${josefin.className} text-[11.5px] font-semibold text-[#1a1410] text-right`}>
                    {booking.property.name}
                  </span>
                </div>
              )}
              {mode === "night_stay" ? (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`${josefin.className} text-[11px] text-[#9B8BAB]`}>Dates</span>
                    <span className={`${josefin.className} text-[11.5px] font-semibold text-[#1a1410]`}>
                      {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`${josefin.className} text-[11px] text-[#9B8BAB]`}>Duration</span>
                    <span className={`${josefin.className} text-[11.5px] font-medium text-[#5C4A6E]`}>
                      {nights} night{nights !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`${josefin.className} text-[11px] text-[#9B8BAB]`}>Date</span>
                  <span className={`${josefin.className} text-[11.5px] font-semibold text-[#1a1410]`}>
                    {fmtDate(booking.checkIn)}
                  </span>
                </div>
              )}
              {rooms.length > 0 && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`${josefin.className} text-[11px] text-[#9B8BAB]`}>Room{rooms.length > 1 ? "s" : ""}</span>
                  <span className={`${josefin.className} text-[11.5px] font-semibold text-[#1a1410]`}>
                    {rooms.join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Payment — compact */}
            <div className="px-5 py-3">
              <div className="flex items-baseline justify-between mb-2.5">
                <span className={`${josefin.className} text-[11px] text-[#9B8BAB]`}>Total</span>
                <span className={`${josefin.className} text-[13.5px] font-bold text-[#7A2267]`}>{fmtBDT(total)}</span>
              </div>

              {isPartial ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl px-3 py-2.5" style={{ background: "#F8F0FC", border: "1px solid #E8D5F0" }}>
                    <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.12em] font-semibold mb-1`} style={{ color: "#7A2267" }}>
                      Paid Now
                    </p>
                    <p className={`${josefin.className} text-[16px] font-bold`} style={{ color: "#7A2267" }}>
                      {fmtBDT(paidNow)}
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5" style={{ background: "#FFF5EE", border: "1px solid #FFE0C8" }}>
                    <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.12em] font-semibold mb-1`} style={{ color: "#C05A00" }}>
                      At Check-in
                    </p>
                    <p className={`${josefin.className} text-[16px] font-bold`} style={{ color: "#C05A00" }}>
                      {fmtBDT(displayRemaining)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: "#F0FAF4", border: "1px solid #C8EDD7" }}>
                  <div>
                    <p className={`${josefin.className} text-[8.5px] uppercase tracking-[0.12em] text-emerald-700 font-semibold mb-0.5`}>
                      Paid in Full
                    </p>
                    <p className={`${josefin.className} text-[17px] font-bold text-emerald-700`}>{fmtBDT(paidNow)}</p>
                  </div>
                  <svg viewBox="0 0 20 20" width="20" height="20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#059669" strokeWidth="1.4" />
                    <path d="M6 10.5l3 3 5-6" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Via / Txn — tiny */}
              <div className="mt-2.5 flex items-center justify-between">
                <span className={`${josefin.className} text-[10px] text-[#C4B3CE]`}>
                  via {fmtMethod(booking.paymentMethod, booking.cardType)}
                </span>
                {booking.bankTxnId && (
                  <span className={`${josefin.className} text-[9.5px] font-mono text-[#C4B3CE] tracking-wide`}>
                    {booking.bankTxnId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Savings + email — tiny, below card ── */}
          <div className="flex items-center justify-between px-1 mt-2.5" style={s(460)}>
            {totalSaved > 0 ? (
              <span className={`${josefin.className} text-[10px] font-semibold`} style={{ color: "#1A7A45" }}>
                Saved {fmtBDT(totalSaved)}
              </span>
            ) : <span />}
            {booking.primaryGuest?.email && (
              <span className={`${josefin.className} text-[10px] text-[#C4B3CE]`}>
                Confirmation → {booking.primaryGuest.email}
              </span>
            )}
          </div>

          {/* ── CTAs ── */}
          <div className="mt-4 space-y-2" style={s(500)}>
            <Link
              href="/account?tab=bookings"
              className={`${josefin.className} flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white text-[13px] font-semibold`}
              style={{
                background: "linear-gradient(135deg, #7A2267 0%, #a3388d 100%)",
                boxShadow: "0 4px 18px rgba(122,34,103,0.22)",
              }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                <rect x="1.5" y="2.5" width="13" height="11.5" rx="1.5" stroke="white" strokeWidth="1.3" />
                <path d="M1.5 6.5h13M5.5 1v3M10.5 1v3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              View My Booking
            </Link>

            <Link
              href="/"
              className={`${josefin.className} flex items-center justify-center w-full py-3 rounded-xl text-[12px] font-medium text-[#9B8BAB] hover:text-[#7A2267] transition-colors duration-200`}
            >
              Return to Home
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
