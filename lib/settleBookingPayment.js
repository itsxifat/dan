import Booking from "@/models/Booking";
import Settings from "@/models/Settings";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { createAdminNotification } from "@/actions/notifications/adminNotificationActions";
import { incrementCouponUsage } from "@/actions/discount/discountActions";
import { summariseFromBooking } from "@/lib/guestDocs";
import { releaseLocksForBooking } from "@/lib/releaseBookingLocks";

/**
 * Settle a successful SSLCommerz payment, exactly once.
 *
 * SSLCommerz notifies us twice for the same transaction — via the browser
 * redirect to /api/ssl/success AND via the server-to-server IPN — and either can
 * arrive first (or alone, if the guest closes the tab). Both call this, and the
 * conditional update below decides which one actually settles the booking, so
 * the guest never gets two confirmation emails and a coupon is never counted
 * twice. The loser is a silent no-op.
 *
 * Callers must have connected to the DB already.
 *
 * @returns {{ booking: object|null, settled: boolean }}
 *   `settled` is true only for the caller that won the claim.
 */
export async function settleBookingPayment({ tranId, valId, bankTxnId, cardType, amount }) {
  if (!tranId) return { booking: null, settled: false };

  const existing = await Booking.findOne({ transactionId: tranId }).lean();
  if (!existing) return { booking: null, settled: false };

  const paid  = parseFloat(amount || "0");
  const total = existing.totalAmount ?? 0;
  // Compare against the amount actually received, not advancePercent — the
  // percentage is a stale intent and disagrees with what the gateway charged.
  // 1 BDT tolerance absorbs rounding.
  const isPartial  = paid < total - 1;
  const remaining  = isPartial ? Math.max(0, total - paid) : 0;

  // Atomically claim the settlement. Only the first caller matches "unpaid".
  const booking = await Booking.findOneAndUpdate(
    { _id: existing._id, paymentStatus: "unpaid" },
    {
      paymentStatus:   isPartial ? "partial" : "paid",
      status:          "confirmed",
      valId:           valId     || "",
      bankTxnId:       bankTxnId || "",
      cardType:        cardType  || "",
      paidAmount:      paid,
      remainingAmount: remaining,
      updatedAt:       new Date(),
    },
    { returnDocument: "after" }
  )
    .populate("property", "name")
    .populate("roomBookings.room", "roomNumber")
    .lean();

  // Someone else already settled it — nothing further to do.
  if (!booking) return { booking: existing, settled: false };

  // The confirmed booking now blocks the room by itself; the hold is redundant.
  releaseLocksForBooking(booking).catch(() => {});

  if (booking.couponId) {
    incrementCouponUsage(booking.couponId.toString()).catch(() => {});
  }

  createAdminNotification({
    type:    "payment",
    title:   `Payment received: ${booking.bookingNumber}`,
    message: `৳${paid.toLocaleString("en-BD")} via ${cardType || "Online"}${isPartial ? " (partial)" : ""}`,
    link:    "/admin/bookings",
    metadata: { bookingId: booking._id.toString(), bookingNumber: booking.bookingNumber, paid },
  }).catch(() => {});

  if (booking.primaryGuest?.email) {
    const rooms = (booking.roomBookings || [])
      .map((rb) => (rb.room?.roomNumber ? `#${rb.room.roomNumber}` : null))
      .filter(Boolean);
    const totalSaved =
      (booking.dayLongDiscount ?? 0) + (booking.offerDiscount ?? 0) + (booking.couponDiscount ?? 0);
    const settings = await Settings.findOne().lean() || {};

    sendBookingConfirmationEmail({
      to:              booking.primaryGuest.email,
      guestName:       booking.primaryGuest.name || "Guest",
      bookingNumber:   booking.bookingNumber,
      bookingId:       booking._id.toString(),
      propertyName:    booking.property?.name    || "Dhali's Amber Nivaas",
      checkIn:         booking.checkIn,
      checkOut:        booking.checkOut,
      nights:          booking.nights            ?? 0,
      bookingMode:     booking.bookingMode,
      rooms,
      subtotal:        booking.subtotal          ?? 0,
      taxes:           booking.taxes             ?? 0,
      dayLongDiscount: booking.dayLongDiscount   ?? 0,
      offerDiscount:   booking.offerDiscount     ?? 0,
      couponDiscount:  booking.couponDiscount    ?? 0,
      couponCode:      booking.couponCode        || "",
      totalAmount:     total,
      paidAmount:      paid,
      remainingAmount: remaining,
      isPartial,
      totalSaved,
      docSummary:      summariseFromBooking(booking, settings),
      baseUrl:         process.env.NEXT_PUBLIC_BASE_URL,
    }).catch((err) => console.error("Booking confirmation email failed:", err));
  }

  return { booking, settled: true };
}
