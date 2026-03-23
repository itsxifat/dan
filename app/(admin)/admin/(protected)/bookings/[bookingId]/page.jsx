import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getBookingById } from "@/actions/accommodation/bookingActions";
import BookingDetailClient from "./BookingDetailClient";

export const dynamic = "force-dynamic";

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "–";
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">{label}</p>
      <p className="text-[13px] text-white/70">{value || "–"}</p>
    </div>
  );
}

const STATUS_STYLE = {
  pending:     "bg-amber-400/10 text-amber-400 border-amber-400/25",
  confirmed:   "bg-blue-400/10 text-blue-400 border-blue-400/25",
  checked_in:  "bg-emerald-400/10 text-emerald-400 border-emerald-400/25",
  checked_out: "bg-white/5 text-white/40 border-white/15",
  cancelled:   "bg-red-400/10 text-red-400 border-red-400/25",
  no_show:     "bg-red-900/20 text-red-400/60 border-red-400/15",
};

const PAYMENT_COLOR = {
  paid: "text-emerald-400",
  unpaid: "text-amber-400",
  failed: "text-red-400",
  refunded: "text-white/40",
};

export default async function BookingDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) redirect("/admin/bookings");

  const { bookingId } = await params;
  const booking = await getBookingById(bookingId);
  if (!booking) notFound();

  const canWrite = hasPermission(session.user.role, "bookings.write");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-[18px] font-semibold text-white/85 font-mono">{booking.bookingNumber}</h2>
            <span className={`text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[booking.status]}`}>
              {booking.status.replace("_", " ")}
            </span>
            <span className={`text-[9.5px] font-semibold capitalize ${PAYMENT_COLOR[booking.paymentStatus]}`}>
              {booking.paymentStatus}
            </span>
          </div>
          <p className="text-[11px] text-white/25">
            Created {fmtDate(booking.createdAt)}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="text-[11.5px] text-white/30 hover:text-white/60 flex items-center gap-1.5 transition-colors"
        >
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
            <path d="M8 10 4 6l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Bookings
        </Link>
      </div>

      {/* Property & Dates */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
        <Field label="Property"    value={booking.property?.name} />
        <Field label="Category"    value={booking.category?.name || (booking.bookingType === "cottage" ? "Cottage" : "–")} />
        <Field label="Room"        value={booking.room?.roomNumber || "–"} />
        <Field label="Nights"      value={`${booking.nights} nights`} />
        <Field label="Check In"    value={fmtDate(booking.checkIn)} />
        <Field label="Check Out"   value={fmtDate(booking.checkOut)} />
        <Field label="Total"       value={`৳${booking.totalAmount?.toLocaleString()}`} />
        <Field label="Payment Method" value={booking.paymentMethod?.replace("_", " ")} />
      </div>

      {/* Guest Info */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Primary Guest</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Name"    value={booking.primaryGuest?.name} />
          <Field label="Email"   value={booking.primaryGuest?.email} />
          <Field label="Phone"   value={booking.primaryGuest?.phone} />
          <Field label="WhatsApp" value={booking.primaryGuest?.whatsapp} />
          <Field label="Gender"  value={booking.primaryGuest?.gender} />
          <Field label="Age"     value={booking.primaryGuest?.age} />
        </div>

        {booking.isCoupleBooking && (
          <div className="mt-4 pt-4 border-t border-white/[0.05]">
            <p className="text-[11px] uppercase tracking-wider text-amber-400/60 font-semibold mb-2">Couple Booking</p>
            <Field label="Document Method" value={booking.coupleDocMethod} />
            {booking.coupleDocumentUrl && (
              <div className="mt-2">
                <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Document</p>
                <a href={booking.coupleDocumentUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-[#c05aae] hover:text-[#d870c0] underline underline-offset-2 transition-colors">
                  View Document ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Guests */}
      {booking.guests?.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
            Additional Guests ({booking.guests.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {["Name", "Age", "Gender", "Type"].map((h) => (
                    <th key={h} className="pb-2 text-left text-[9.5px] uppercase tracking-wider text-white/25 font-semibold pr-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {booking.guests.map((g, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="py-2 pr-6 text-white/60">{g.name || "–"}</td>
                    <td className="py-2 pr-6 text-white/40">{g.age}</td>
                    <td className="py-2 pr-6 text-white/40 capitalize">{g.gender}</td>
                    <td className="py-2 pr-6">
                      <span className={`text-[10px] uppercase tracking-wide font-medium
                        ${g.type === "child" ? "text-amber-400/70" : "text-white/40"}`}>
                        {g.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Info */}
      {(booking.valId || booking.bankTxnId) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <h3 className="col-span-full text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Payment Details</h3>
          <Field label="Transaction ID" value={booking.transactionId} />
          <Field label="Val ID"         value={booking.valId} />
          <Field label="Bank Txn ID"    value={booking.bankTxnId} />
          <Field label="Card Type"      value={booking.cardType} />
          <Field label="Paid Amount"    value={booking.paidAmount ? `৳${booking.paidAmount?.toLocaleString()}` : null} />
        </div>
      )}

      {/* Status + Notes (client actions) */}
      {canWrite && (
        <BookingDetailClient booking={booking} />
      )}
    </div>
  );
}
