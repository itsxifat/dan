import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function fmtBDT(n) {
  if (n === null || n === undefined) return "—";
  return "৳" + Number(n).toLocaleString("en-BD");
}
function fmtMethod(method, cardType) {
  if (cardType) return `Online — ${cardType}`;
  if (method === "sslcommerz" || method === "partial") return "Online (SSL Commerz)";
  return method || "—";
}

const BOOKING_STATUS_LABELS = {
  pending:     "Pending",
  confirmed:   "Confirmed",
  checked_in:  "Checked In",
  checked_out: "Checked Out",
  cancelled:   "Cancelled",
  no_show:     "No Show",
};

// ─── Invoice line row ─────────────────────────────────────────────────────────
function LineRow({ label, sub, amount, discount, dimmed, total }) {
  return (
    <tr
      style={{
        borderBottom: total ? "none" : "1px solid #F0EAF4",
      }}
    >
      <td
        style={{
          padding: "10px 0",
          fontSize: "12.5px",
          color: dimmed ? "#B8A5C8" : discount ? "#059669" : "#2A1B3D",
          fontWeight: total ? "700" : "400",
        }}
      >
        {label}
        {sub && (
          <span style={{ fontSize: "11px", color: "#B8A5C8", marginLeft: "6px" }}>
            ({sub})
          </span>
        )}
      </td>
      <td
        style={{
          padding: "10px 0",
          textAlign: "right",
          fontSize: total ? "15px" : "13px",
          fontWeight: total ? "700" : "500",
          color: total ? "#7A2267" : discount ? "#059669" : "#2A1B3D",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {amount}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

  const isAdmin = ["owner", "admin", "moderator"].includes(session.user.role);
  if (!isAdmin && booking.bookedBy?.toString() !== session.user.id) {
    redirect("/account");
  }

  const b = JSON.parse(JSON.stringify(booking));

  // ── Data extraction ──────────────────────────────────────────────────────────
  const isDayLong   = b.bookingMode === "day_long";
  const isMultiRoom = b.roomBookings?.length > 0;
  const isPartial   = b.paymentStatus === "partial";
  const isPaid      = b.paymentStatus === "paid";
  const isUnpaid    = b.paymentStatus === "unpaid" || !b.paymentStatus;

  const subtotal    = b.subtotal    || 0;
  const taxes       = b.taxes       || 0;
  const dayDisc     = b.dayLongDiscount || 0;
  const offerDisc   = b.offerDiscount   || 0;
  const couponDisc  = b.couponDiscount  || 0;
  const totalAmount = b.totalAmount || 0;
  const paidAmount  = b.paidAmount  || 0;
  // Use stored remainingAmount (computed at payment time) for accuracy
  const remaining   = b.remainingAmount ?? Math.max(0, totalAmount - paidAmount);
  const totalSaved  = dayDisc + offerDisc + couponDisc;
  const hasDiscount = totalSaved > 0;

  const paymentStatusConfig = {
    paid:     { label: "Paid in Full",       bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
    partial:  { label: "Partial Payment",    bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA" },
    unpaid:   { label: "Payment Pending",    bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
    refunded: { label: "Refunded",           bg: "#EFF6FF", color: "#1E40AF", border: "#BFDBFE" },
    failed:   { label: "Payment Failed",     bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  };
  const pStatus = paymentStatusConfig[b.paymentStatus] || paymentStatusConfig.unpaid;

  // Invoice number: format the booking number nicely
  const invoiceNum = b.bookingNumber || `INV-${bookingId.slice(-8).toUpperCase()}`;

  return (
    <>
      {/* ── Print + page CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Montserrat', sans-serif; }

        @media print {
          @page {
            size: A4;
            margin: 12mm 14mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .invoice-wrapper {
            background: white !important;
            padding: 0 !important;
          }
          .invoice-card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div
        className="invoice-wrapper"
        style={{
          minHeight: "100vh",
          background: "#F7F4F0",
          padding: "32px 16px 48px",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>

          {/* ── Action bar (hidden in print) ── */}
          <div
            className="no-print"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}
          >
            <a
              href="/account"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12.5px",
                color: "#9B8BAB",
                textDecoration: "none",
              }}
            >
              <svg viewBox="0 0 8 14" width="7" height="12" fill="none">
                <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Account
            </a>
            <PrintButton />
          </div>

          {/* ── Invoice card ── */}
          <div
            className="invoice-card"
            style={{
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 40px rgba(122,34,103,0.10)",
              border: "1px solid #EDE5F0",
            }}
          >

            {/* ── Header ── */}
            <div
              style={{
                background: "#1a0c17",
                padding: "32px 40px",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                {/* Brand */}
                <div>
                  {/* Monogram */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "rgba(122,34,103,0.5)",
                      border: "1px solid rgba(212,168,224,0.25)",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#D4A8E0",
                        letterSpacing: "1px",
                      }}
                    >
                      DAN
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.3em",
                      color: "rgba(212,168,224,0.7)",
                      fontWeight: "500",
                      marginBottom: "4px",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Invoice
                  </p>
                  <h1
                    style={{
                      fontSize: "22px",
                      fontWeight: "300",
                      color: "#fff",
                      margin: "0 0 4px 0",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Dhali&apos;s Amber Nivaas
                  </h1>
                  {b.property?.location && (
                    <p style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                      {b.property.location}
                    </p>
                  )}
                </div>

                {/* Invoice meta */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.22em",
                      color: "rgba(255,255,255,0.4)",
                      margin: "0 0 4px 0",
                    }}
                  >
                    Invoice No.
                  </p>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#fff",
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                      margin: "0 0 8px 0",
                    }}
                  >
                    {invoiceNum}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.4)",
                      margin: "0 0 3px 0",
                    }}
                  >
                    Issued: {fmtDate(b.createdAt)}
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: pStatus.bg,
                      border: `1px solid ${pStatus.border}`,
                      fontSize: "9.5px",
                      fontWeight: "700",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: pStatus.color,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                      marginTop: "4px",
                    }}
                  >
                    {pStatus.label}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: "32px 40px" }}>

              {/* ── Bill to + Booking info ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "32px",
                  marginBottom: "28px",
                }}
              >
                {/* Bill to */}
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.25em",
                      color: "#B8A5C8",
                      fontWeight: "600",
                      marginBottom: "10px",
                      margin: "0 0 10px 0",
                    }}
                  >
                    Billed To
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#1C1C1C", margin: "0 0 3px 0" }}>
                    {b.primaryGuest?.name || "—"}
                  </p>
                  {b.primaryGuest?.email && (
                    <p style={{ fontSize: "12px", color: "#9B8BAB", margin: "0 0 2px 0" }}>
                      {b.primaryGuest.email}
                    </p>
                  )}
                  {b.primaryGuest?.phone && (
                    <p style={{ fontSize: "12px", color: "#9B8BAB", margin: 0 }}>
                      {b.primaryGuest.phone}
                    </p>
                  )}
                </div>

                {/* Booking details */}
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.25em",
                      color: "#B8A5C8",
                      fontWeight: "600",
                      marginBottom: "10px",
                      margin: "0 0 10px 0",
                    }}
                  >
                    Booking Details
                  </p>
                  {b.property?.name && (
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#1C1C1C", margin: "0 0 3px 0" }}>
                      {b.property.name}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "10.5px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: isDayLong ? "#D97706" : "#7A2267",
                      margin: "0 0 5px 0",
                    }}
                  >
                    {isDayLong ? "Day Long Package" : "Night Stay"}
                  </p>

                  {isMultiRoom
                    ? b.roomBookings.map((rb, i) => (
                        <p key={i} style={{ fontSize: "12px", color: "#9B8BAB", margin: "0 0 2px 0" }}>
                          {rb.room?.roomNumber ? `Room #${rb.room.roomNumber}` : `Room ${i + 1}`}
                          {rb.room?.floor ? ` · Floor ${rb.room.floor}` : ""}
                          {rb.category?.name ? ` · ${rb.category.name}` : ""}
                        </p>
                      ))
                    : (
                      <>
                        {b.room && (
                          <p style={{ fontSize: "12px", color: "#9B8BAB", margin: "0 0 2px 0" }}>
                            Room #{b.room.roomNumber} · Floor {b.room.floor}
                          </p>
                        )}
                        {b.category?.name && (
                          <p style={{ fontSize: "12px", color: "#9B8BAB", margin: "0 0 2px 0" }}>
                            {b.category.name}
                          </p>
                        )}
                      </>
                    )
                  }

                  <p style={{ fontSize: "11px", color: "#9B8BAB", marginTop: "6px", marginBottom: 0 }}>
                    Status:{" "}
                    <span style={{ color: "#1C1C1C", fontWeight: "600" }}>
                      {BOOKING_STATUS_LABELS[b.status] || b.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* ── Stay period ── */}
              <div
                style={{
                  background: "#F9F5FB",
                  borderRadius: "12px",
                  padding: "18px 24px",
                  marginBottom: "28px",
                  border: "1px solid #EDE5F0",
                }}
              >
                {isDayLong ? (
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontSize: "9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        color: "#B8A5C8",
                        fontWeight: "600",
                        margin: "0 0 4px 0",
                      }}
                    >
                      Date
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "#1C1C1C", margin: 0 }}>
                      {fmtDate(b.checkIn)}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#B8A5C8",
                          fontWeight: "600",
                          margin: "0 0 4px 0",
                        }}
                      >
                        Check-in
                      </p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#1C1C1C", margin: 0 }}>
                        {fmtDate(b.checkIn)}
                      </p>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 20px",
                        borderLeft: "1px solid #EDE5F0",
                        borderRight: "1px solid #EDE5F0",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#B8A5C8",
                          fontWeight: "600",
                          margin: "0 0 4px 0",
                        }}
                      >
                        Duration
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: "700", color: "#7A2267", margin: 0 }}>
                        {b.nights} night{b.nights !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#B8A5C8",
                          fontWeight: "600",
                          margin: "0 0 4px 0",
                        }}
                      >
                        Check-out
                      </p>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#1C1C1C", margin: 0 }}>
                        {fmtDate(b.checkOut)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Charges table ── */}
              <div style={{ marginBottom: "28px" }}>
                <p
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.25em",
                    color: "#B8A5C8",
                    fontWeight: "600",
                    marginBottom: "12px",
                    margin: "0 0 12px 0",
                  }}
                >
                  Charges & Breakdown
                </p>

                {/* Table header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "2px solid #EDE5F0",
                    marginBottom: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#B8A5C8",
                      fontWeight: "600",
                    }}
                  >
                    Description
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "#B8A5C8",
                      fontWeight: "600",
                    }}
                  >
                    Amount
                  </span>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {/* Room charges */}
                    {isMultiRoom
                      ? b.roomBookings.map((rb, i) => {
                          const unitPrice = isDayLong ? (rb.pricePerDay || 0) : (rb.pricePerNight || 0);
                          const lineTotal = unitPrice * (isDayLong ? 1 : (b.nights || 1));
                          const label = rb.room?.roomNumber
                            ? `Room #${rb.room.roomNumber}${rb.category?.name ? ` · ${rb.category.name}` : ""}`
                            : `Room ${i + 1}`;
                          const desc = isDayLong
                            ? `${label} — 1 day × ${fmtBDT(unitPrice)}`
                            : `${label} — ${b.nights}N × ${fmtBDT(unitPrice)}`;
                          return (
                            <LineRow key={i} label={desc} amount={fmtBDT(lineTotal)} />
                          );
                        })
                      : (() => {
                          const desc = isDayLong
                            ? `Day long package${b.category?.name ? ` · ${b.category.name}` : ""}`
                            : `${b.nights} night${b.nights !== 1 ? "s" : ""}${b.category?.name ? ` · ${b.category.name}` : ""}`;
                          return <LineRow label={desc} amount={fmtBDT(subtotal)} />;
                        })()
                    }

                    {/* Multi-room subtotal */}
                    {isMultiRoom && subtotal > 0 && (
                      <LineRow label="Subtotal" amount={fmtBDT(subtotal)} dimmed />
                    )}

                    {/* Discounts */}
                    {dayDisc > 0 && (
                      <LineRow label="Package Discount" amount={`−${fmtBDT(dayDisc)}`} discount />
                    )}
                    {offerDisc > 0 && (
                      <LineRow label="Promotional Offer" amount={`−${fmtBDT(offerDisc)}`} discount />
                    )}
                    {couponDisc > 0 && (
                      <LineRow
                        label="Coupon Discount"
                        sub={b.couponCode || undefined}
                        amount={`−${fmtBDT(couponDisc)}`}
                        discount
                      />
                    )}

                    {/* Tax */}
                    {taxes > 0 && (
                      <LineRow label="Tax & Charges" amount={fmtBDT(taxes)} dimmed />
                    )}

                    {/* Savings callout */}
                    {hasDiscount && (
                      <tr>
                        <td colSpan={2} style={{ padding: "6px 0 2px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "10.5px",
                              fontWeight: "600",
                              color: "#065F46",
                              background: "#ECFDF5",
                              border: "1px solid #A7F3D0",
                              borderRadius: "20px",
                              padding: "3px 10px",
                              WebkitPrintColorAdjust: "exact",
                              printColorAdjust: "exact",
                            }}
                          >
                            You saved {fmtBDT(totalSaved)} on this booking
                          </span>
                        </td>
                      </tr>
                    )}

                    {/* Divider */}
                    <tr>
                      <td colSpan={2} style={{ padding: "8px 0 0" }}>
                        <div
                          style={{
                            height: "2px",
                            background: "linear-gradient(90deg, #7A2267, #a3388d)",
                            borderRadius: "2px",
                            WebkitPrintColorAdjust: "exact",
                            printColorAdjust: "exact",
                          }}
                        />
                      </td>
                    </tr>

                    {/* Total */}
                    <LineRow label="Total Amount" amount={fmtBDT(totalAmount)} total />
                  </tbody>
                </table>
              </div>

              {/* ── Payment summary ── */}
              <div
                style={{
                  background: "#F9F5FB",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  border: "1px solid #EDE5F0",
                  marginBottom: "28px",
                }}
              >
                <p
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.25em",
                    color: "#B8A5C8",
                    fontWeight: "600",
                    margin: "0 0 14px 0",
                  }}
                >
                  Payment Summary
                </p>

                {/* Method */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "10px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid #EDE5F0",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#9B8BAB" }}>Payment Method</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#2A1B3D" }}>
                    {fmtMethod(b.paymentMethod, b.cardType)}
                  </span>
                </div>

                {/* Transaction ID */}
                {b.bankTxnId && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: "10px",
                      paddingBottom: "10px",
                      borderBottom: "1px solid #EDE5F0",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#9B8BAB" }}>Transaction ID</span>
                    <span style={{ fontSize: "11.5px", fontFamily: "monospace", color: "#9B8BAB", letterSpacing: "0.04em" }}>
                      {b.bankTxnId}
                    </span>
                  </div>
                )}

                {/* Paid / Remaining breakdown */}
                {isPaid ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#9B8BAB" }}>Amount Paid</span>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#065F46" }}>
                      {fmtBDT(paidAmount)}
                    </span>
                  </div>
                ) : isPartial ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1px 1fr",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#059669", fontWeight: "700", margin: "0 0 3px 0" }}>
                        Paid Online
                      </p>
                      <p style={{ fontSize: "17px", fontWeight: "700", color: "#059669", margin: 0 }}>
                        {fmtBDT(paidAmount)}
                      </p>
                    </div>
                    <div style={{ width: "1px", height: "40px", background: "#EDE5F0" }} />
                    <div>
                      <p style={{ fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#EA580C", fontWeight: "700", margin: "0 0 3px 0" }}>
                        Due at Check-in
                      </p>
                      <p style={{ fontSize: "17px", fontWeight: "700", color: "#EA580C", margin: 0 }}>
                        {fmtBDT(remaining)}
                      </p>
                    </div>
                  </div>
                ) : isUnpaid ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#9B8BAB" }}>Amount Due</span>
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#D97706" }}>
                      {fmtBDT(totalAmount)}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* ── Guests list (optional) ── */}
              {b.allGuests?.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <p
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.25em",
                      color: "#B8A5C8",
                      fontWeight: "600",
                      margin: "0 0 10px 0",
                    }}
                  >
                    Guests ({b.totalGuests})
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {b.allGuests.map((g, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "11.5px",
                          color: "#5C4A6E",
                          background: "#F5EDF7",
                          border: "1px solid #EDE5F0",
                          borderRadius: "20px",
                          padding: "3px 10px",
                        }}
                      >
                        {g.name}
                        {g.type === "child" && (
                          <span style={{ color: "#B8A5C8", marginLeft: "4px", fontSize: "10px" }}>
                            (child)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Special requests ── */}
              {b.specialRequests && (
                <div style={{ marginBottom: "24px" }}>
                  <p
                    style={{
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.25em",
                      color: "#B8A5C8",
                      fontWeight: "600",
                      margin: "0 0 6px 0",
                    }}
                  >
                    Special Requests
                  </p>
                  <p style={{ fontSize: "12px", color: "#5C4A6E", lineHeight: "1.6", margin: 0 }}>
                    {b.specialRequests}
                  </p>
                </div>
              )}

              {/* ── Footer ── */}
              <div
                style={{
                  borderTop: "1px solid #EDE5F0",
                  paddingTop: "24px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: "300",
                    color: "#7A2267",
                    margin: "0 0 6px 0",
                    fontStyle: "italic",
                    letterSpacing: "0.01em",
                  }}
                >
                  Thank you for choosing Dhali&apos;s Amber Nivaas
                </p>
                <p style={{ fontSize: "11px", color: "#B8A5C8", margin: "0 0 2px 0" }}>
                  We hope you enjoy your stay. For any questions, please contact our front desk.
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#C4B3CE",
                    margin: "10px 0 0 0",
                  }}
                >
                  This is a computer-generated invoice — no signature required
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
