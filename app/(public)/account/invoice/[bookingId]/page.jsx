import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Cormorant_Garamond } from "next/font/google";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import PrintButton from "./PrintButton";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const dynamic = "force-dynamic";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function Row({ label, value, bold = false, large = false }) {
  return (
    <div className={`flex justify-between items-baseline py-2 border-b border-[#F0EAF4] last:border-0 ${bold ? "font-semibold" : ""}`}>
      <span className={`text-[#9B8BAB] ${bold ? "text-[13px]" : "text-[12.5px]"}`}>{label}</span>
      <span className={`text-[#1C1C1C] text-right ${large ? "text-[20px] font-bold text-[#7A2267]" : bold ? "text-[14px]" : "text-[13px]"}`}>
        {value}
      </span>
    </div>
  );
}

const PAYMENT_STATUS_LABELS = {
  unpaid:   { text: "Unpaid",           color: "text-amber-700 bg-amber-50 border-amber-200" },
  partial:  { text: "Partially Paid",   color: "text-orange-700 bg-orange-50 border-orange-200" },
  paid:     { text: "Paid",             color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  refunded: { text: "Refunded",         color: "text-blue-700 bg-blue-50 border-blue-200" },
  failed:   { text: "Failed",           color: "text-red-700 bg-red-50 border-red-200" },
};

const BOOKING_STATUS_LABELS = {
  pending:     "Pending",
  confirmed:   "Confirmed",
  checked_in:  "Checked In",
  checked_out: "Checked Out",
  cancelled:   "Cancelled",
  no_show:     "No Show",
};

export default async function InvoicePage({ params }) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?redirect=/account");

  await dbConnect();
  const booking = await Booking.findById(bookingId)
    .populate("property", "name location")
    .populate("category", "name")
    .populate("room", "roomNumber floor")
    .populate("roomBookings.room", "roomNumber floor")
    .populate("roomBookings.category", "name")
    .lean();

  if (!booking) notFound();

  // Verify ownership (unless admin)
  const isAdmin = ["owner", "admin", "moderator"].includes(session.user.role);
  if (!isAdmin && booking.bookedBy?.toString() !== session.user.id) {
    redirect("/account");
  }

  const b = JSON.parse(JSON.stringify(booking));
  const pStatus    = PAYMENT_STATUS_LABELS[b.paymentStatus] || PAYMENT_STATUS_LABELS.unpaid;
  const balanceDue = Math.max(0, (b.totalAmount || 0) - (b.paidAmount || 0));
  const isDayLong  = b.bookingMode === "day_long";
  const isMultiRoom = b.roomBookings?.length > 0;

  return (
    <div className="min-h-screen bg-[#F7F4F0] print:bg-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Actions bar (hidden when printing) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <a href="/account?tab=invoices" className="flex items-center gap-1.5 text-[12.5px] text-[#9B8BAB] hover:text-[#7A2267] transition-colors">
            <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
              <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Invoices
          </a>
          <PrintButton />
        </div>

        {/* Invoice card */}
        <div className="bg-white border border-[#EDE5F0] rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(122,34,103,0.08)] print:shadow-none print:rounded-none print:border-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#2a1024] to-[#4a1a40] px-8 py-8 print:bg-[#2a1024]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.35em] text-[#D4A8E0] font-medium mb-1">Invoice</p>
                <h1 className={`text-[2rem] font-light text-white ${cormorant.className}`}>
                  Dhali&apos;s Amber Nivaas
                </h1>
                <p className="text-white/40 text-[12px] mt-0.5">
                  {b.property?.location || "Bangladesh"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-1">Invoice No.</p>
                <p className="text-[15px] font-bold text-white font-mono">{b.bookingNumber}</p>
                <p className="text-[11px] text-white/50 mt-1">{fmtDate(b.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7 space-y-7">
            {/* Guest & booking info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#B8A4C2] font-semibold mb-3">Billed To</p>
                <p className="text-[14px] font-semibold text-[#1C1C1C]">{b.primaryGuest.name}</p>
                <p className="text-[12.5px] text-[#9B8BAB]">{b.primaryGuest.email}</p>
                <p className="text-[12.5px] text-[#9B8BAB]">{b.primaryGuest.phone}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#B8A4C2] font-semibold mb-3">Booking Details</p>
                <p className="text-[12.5px] text-[#1C1C1C] font-medium">{b.property?.name}</p>
                <p className="text-[11px] font-semibold text-[#9B8BAB] uppercase tracking-wide mt-0.5">
                  {isDayLong ? "☀ Day Long" : "🌙 Night Stay"}
                </p>
                {isMultiRoom ? (
                  b.roomBookings.map((rb, i) => (
                    <p key={i} className="text-[12px] text-[#9B8BAB]">
                      {rb.room?.roomNumber ? `Room #${rb.room.roomNumber}` : `Room ${i + 1}`}
                      {rb.category?.name ? ` · ${rb.category.name}` : ""}
                    </p>
                  ))
                ) : (
                  <>
                    {b.category && <p className="text-[12px] text-[#9B8BAB]">{b.category.name}</p>}
                    {b.room && (
                      <p className="text-[12px] text-[#9B8BAB]">
                        Room #{b.room.roomNumber} · Floor {b.room.floor}
                      </p>
                    )}
                  </>
                )}
                <p className="text-[11px] text-[#9B8BAB] mt-1.5">
                  Status:{" "}
                  <span className="font-semibold text-[#1C1C1C]">{BOOKING_STATUS_LABELS[b.status] || b.status}</span>
                </p>
              </div>
            </div>

            {/* Stay dates */}
            <div className="bg-[#F7F4F0] rounded-xl px-5 py-4">
              {isDayLong ? (
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-[0.15em] text-[#B8A4C2] font-semibold mb-1">Date</p>
                  <p className="text-[14px] font-semibold text-[#1C1C1C]">{fmtDate(b.checkIn)}</p>
                  <p className="text-[11px] text-[#9B8BAB] mt-0.5">Day Long Package</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#B8A4C2] font-semibold mb-1">Check-in</p>
                    <p className="text-[13px] font-semibold text-[#1C1C1C]">{fmtDate(b.checkIn)}</p>
                  </div>
                  <div className="border-x border-[#EDE5F0]">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#B8A4C2] font-semibold mb-1">Duration</p>
                    <p className="text-[13px] font-semibold text-[#7A2267]">
                      {b.nights} night{b.nights !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-[#B8A4C2] font-semibold mb-1">Check-out</p>
                    <p className="text-[13px] font-semibold text-[#1C1C1C]">{fmtDate(b.checkOut)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#B8A4C2] font-semibold mb-3">Price Breakdown</p>
              <div className="space-y-0">
                {isMultiRoom ? (
                  b.roomBookings.map((rb, i) => {
                    const price = isDayLong ? (rb.pricePerDay || 0) : (rb.pricePerNight || 0);
                    return (
                      <Row
                        key={i}
                        label={`${rb.room?.roomNumber ? `Room #${rb.room.roomNumber}` : `Room ${i + 1}`}${rb.category?.name ? ` (${rb.category.name})` : ""} × ${isDayLong ? "1 day" : `${b.nights}N`}`}
                        value={`৳${(price * (isDayLong ? 1 : b.nights)).toLocaleString()}`}
                      />
                    );
                  })
                ) : (
                  <Row
                    label={isDayLong
                      ? `Day Long × ৳${(b.basePrice || 0).toLocaleString()}`
                      : `${b.nights} night${b.nights !== 1 ? "s" : ""} × ৳${(b.basePrice || 0).toLocaleString()}`}
                    value={`৳${(b.subtotal || 0).toLocaleString()}`}
                  />
                )}
                {isMultiRoom && b.subtotal && (
                  <Row label="Subtotal" value={`৳${(b.subtotal || 0).toLocaleString()}`} />
                )}
                {b.taxes > 0 && (
                  <Row label="Taxes & Fees" value={`৳${b.taxes.toLocaleString()}`} />
                )}
                <Row label="Total Amount" value={`৳${(b.totalAmount || 0).toLocaleString()}`} bold />
                {b.advanceAmount > 0 && (
                  <Row label="Advance Paid (online)" value={`৳${b.advanceAmount.toLocaleString()}`} />
                )}
                {b.paidAmount > 0 && b.paidAmount !== b.advanceAmount && (
                  <Row label="Amount Paid" value={`৳${b.paidAmount.toLocaleString()}`} />
                )}
                <Row label="Balance Due at Property" value={`৳${balanceDue.toLocaleString()}`} bold large={balanceDue > 0} />
              </div>
            </div>

            {/* Payment status */}
            <div className="flex items-center justify-between pt-2 border-t border-[#EDE5F0]">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#B8A4C2] font-semibold mb-1">Payment Method</p>
                <p className="text-[13px] font-medium text-[#1C1C1C]">
                  {b.paymentMethod === "sslcommerz" ? "Online (SSLCommerz)"
                    : b.paymentMethod === "partial" ? "Partial Online + Desk"
                    : "Pay at Desk"}
                </p>
                {b.transactionId && (
                  <p className="text-[11px] text-[#9B8BAB] font-mono mt-0.5">{b.transactionId}</p>
                )}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${pStatus.color}`}>
                {pStatus.text}
              </span>
            </div>

            {/* Footer */}
            <div className="border-t border-[#EDE5F0] pt-5 text-center">
              <p className={`text-[1.2rem] font-light text-[#7A2267] ${cormorant.className}`}>
                Thank you for choosing Dhali&apos;s Amber Nivaas
              </p>
              <p className="text-[11px] text-[#9B8BAB] mt-1">
                For support, contact us at our front desk or via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
