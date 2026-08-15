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

function DocViewer({ url, label }) {
  if (!url) return null;
  const isPdf = url.toLowerCase().endsWith(".pdf");
  return (
    <div className="space-y-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-[12px] text-[#c05aae] hover:text-[#d870c0]
          underline underline-offset-2 transition-colors"
      >
        <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
          <path d="M2 12L12 2M8 2h4v4" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label} ↗
      </a>
      {!isPdf && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="block w-40 rounded-xl overflow-hidden border border-white/10 hover:border-[#7A2267]/40 transition-colors">
          <img src={url} alt={label} className="w-full h-28 object-cover" />
        </a>
      )}
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
  paid:     "text-emerald-400",
  partial:  "text-blue-400",
  unpaid:   "text-amber-400",
  failed:   "text-red-400",
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
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-5">
        <Field label="Property"    value={booking.property?.name} />
        <Field label="Category"    value={booking.category?.name || (booking.bookingType === "cottage" ? "Cottage" : "–")} />
        <Field label="Room"        value={booking.room?.roomNumber || (booking.roomBookings?.map(rb => rb.room?.roomNumber).filter(Boolean).join(", ") || "–")} />
        <Field label="Stay Type"   value={booking.bookingMode === "day_long" ? "Day Long" : `${booking.nights} night${booking.nights !== 1 ? "s" : ""}`} />
        <Field label="Check In"    value={fmtDate(booking.checkIn)} />
        <Field label="Check Out"   value={fmtDate(booking.checkOut)} />
        <Field label="Payment Method" value={booking.paymentMethod?.replace(/_/g, " ")} />
        <Field label="Booking Mode" value={booking.bookingMode?.replace("_", " ")} />
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold mb-4">Pricing Breakdown</h3>
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-white/40">Subtotal</span>
            <span className="text-white/70">৳{booking.subtotal?.toLocaleString()}</span>
          </div>
          {booking.taxes > 0 && (
            <div className="flex justify-between">
              <span className="text-white/40">Tax</span>
              <span className="text-white/70">৳{booking.taxes?.toLocaleString()}</span>
            </div>
          )}
          {booking.dayLongDiscount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Package discount</span>
              <span>−৳{booking.dayLongDiscount?.toLocaleString()}</span>
            </div>
          )}
          {booking.offerDiscount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                Auto-offer discount
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Offer</span>
              </span>
              <span>−৳{booking.offerDiscount?.toLocaleString()}</span>
            </div>
          )}
          {booking.couponDiscount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                Coupon discount
                {booking.couponCode && (
                  <code className="text-[9px] bg-white/[0.06] border border-white/10 px-1.5 py-0.5 rounded font-mono">{booking.couponCode}</code>
                )}
              </span>
              <span>−৳{booking.couponDiscount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-white/5 font-bold">
            <span className="text-white/70">Total</span>
            <span className="text-[#c05aae] text-[15px]">৳{booking.totalAmount?.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment status breakdown */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-[12px]">
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Advance %</p>
            <p className="text-white/60">{booking.advancePercent ?? 100}%</p>
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Advance Amount</p>
            <p className="text-white/60">৳{booking.advanceAmount?.toLocaleString() ?? "–"}</p>
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Paid Amount</p>
            <p className={booking.paidAmount > 0 ? "text-emerald-400 font-semibold" : "text-white/40"}>
              {booking.paidAmount > 0 ? `৳${booking.paidAmount?.toLocaleString()}` : "৳0"}
            </p>
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Remaining Due</p>
            <p className={booking.remainingAmount > 0 ? "text-amber-400 font-semibold" : "text-white/40"}>
              {booking.remainingAmount > 0 ? `৳${booking.remainingAmount?.toLocaleString()}` : "Paid in full"}
            </p>
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Payment Status</p>
            <span className={`text-[10.5px] font-semibold capitalize ${PAYMENT_COLOR[booking.paymentStatus]}`}>
              {booking.paymentStatus}
            </span>
          </div>
          {booking.transactionId && (
            <div>
              <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Transaction ID</p>
              <p className="text-white/50 text-[11px] font-mono break-all">{booking.transactionId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Guest Info */}
      <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-5">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Primary Guest</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Name"    value={booking.primaryGuest?.name} />
          <Field label="Email"   value={booking.primaryGuest?.email} />
          <Field label="Phone"   value={booking.primaryGuest?.phone} />
          <Field label="WhatsApp" value={booking.primaryGuest?.whatsapp} />
          <Field label="Gender"  value={booking.primaryGuest?.gender} />
          <Field label="Age"     value={booking.primaryGuest?.age} />
        </div>

        {/* NID document */}
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-2">NID / Passport</p>
            {booking.nidUrl ? (
              <DocViewer url={booking.nidUrl} label="View NID" />
            ) : (
              <p className="text-[12px] text-amber-400">Will present original at desk</p>
            )}
            {booking.nidNumber && (
              <p className="text-[11.5px] text-white/50 font-mono mt-2">{booking.nidNumber}</p>
            )}
          </div>
          <div>
            <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-2">Document Handover</p>
            <p className="text-[12px] text-white/70">
              {booking.guestDocsMethod === "upload_now" ? "Uploaded during booking" : "Originals at check-in"}
            </p>
            <p className={`text-[11px] mt-1 ${booking.guestDocsConsent ? "text-emerald-400" : "text-amber-400"}`}>
              {booking.guestDocsConsent ? "Guest consent recorded" : "No consent recorded"}
            </p>
          </div>
        </div>
      </div>

      {/* Per-room guests & documents — verify these at the desk */}
      {booking.roomBookings?.length > 0 && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 space-y-5">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">
            Guests &amp; Documents ({booking.totalGuests ?? booking.allGuests?.length ?? 0})
          </h3>

          {booking.roomBookings.map((rb, ri) => (
            <div key={ri} className="rounded-xl border border-white/6 overflow-hidden">
              <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-2.5 bg-white/2">
                <p className="text-[12px] text-white/70 font-semibold">
                  Room {rb.room?.roomNumber ? `#${rb.room.roomNumber}` : "–"}
                  {rb.category?.name && <span className="text-white/25 font-normal ml-2">{rb.category.name}</span>}
                </p>
                {rb.requiresMarriageCert ? (
                  <span className={`text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border
                    ${rb.coupleDocumentUrl
                      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/25"
                      : "bg-amber-400/10 text-amber-400 border-amber-400/25"}`}>
                    {rb.coupleDocumentUrl ? "Certificate on file" : "Certificate due at desk"}
                  </span>
                ) : rb.ownChildDeclared ? (
                  <span className="text-[9.5px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border bg-blue-400/10 text-blue-400 border-blue-400/25">
                    Own child declared — verify child present
                  </span>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Name", "Age", "Gender", "Type", "NID"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-[9.5px] uppercase tracking-wider text-white/25 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(rb.guests || []).map((g, i) => (
                      <tr key={i} className="border-b border-white/3">
                        <td className="px-4 py-2 text-white/60">{g.name || "–"}</td>
                        <td className="px-4 py-2 text-white/40">{g.age}</td>
                        <td className="px-4 py-2 text-white/40 capitalize">{g.gender}</td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] uppercase tracking-wide font-medium
                            ${g.type === "child" ? "text-amber-400/70" : "text-white/40"}`}>
                            {g.type}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {g.type === "child" ? (
                            <span className="text-[10.5px] text-white/25">Not required</span>
                          ) : g.nidUrl ? (
                            <a href={g.nidUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-[#c05aae] hover:text-[#d870c0] underline underline-offset-2">
                              View{g.nidNumber ? ` · ${g.nidNumber}` : ""} ↗
                            </a>
                          ) : g.nidNumber ? (
                            <span className="text-[11px] text-white/50 font-mono">{g.nidNumber}</span>
                          ) : (
                            <span className="text-[10.5px] text-amber-400">Verify at desk</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rb.coupleDocumentUrl && (
                <div className="px-4 py-3 border-t border-white/5">
                  <p className="text-[9.5px] uppercase tracking-wider text-white/25 font-semibold mb-1">Marriage Certificate</p>
                  <DocViewer url={rb.coupleDocumentUrl} label="View Certificate" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Online Payment Gateway Details */}
      {(booking.valId || booking.bankTxnId) && (
        <div className="bg-white/2 border border-white/6 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
          <h3 className="col-span-full text-[11px] uppercase tracking-[0.18em] text-white/30 font-semibold">Online Payment Details</h3>
          <Field label="Val ID"      value={booking.valId} />
          <Field label="Bank Txn ID" value={booking.bankTxnId} />
          <Field label="Card Type"   value={booking.cardType} />
        </div>
      )}

      {/* Status + Notes (client actions) */}
      {canWrite && (
        <BookingDetailClient booking={booking} />
      )}
    </div>
  );
}
