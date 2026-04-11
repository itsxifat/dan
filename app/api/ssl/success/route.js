import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { createAdminNotification } from "@/actions/notifications/adminNotificationActions";
import { incrementCouponUsage } from "@/actions/discount/discountActions";
import { sendBookingConfirmationEmail } from "@/lib/email";

async function validateTransaction(val_id) {
  const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
  const base = isLive
    ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

  const url = `${base}?val_id=${val_id}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASSWORD}&format=json`;
  const res = await fetch(url);
  return res.json();
}

export async function POST(req) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const val_id       = params.get("val_id");
    const tran_id      = params.get("tran_id");
    const bank_tran_id = params.get("bank_tran_id");
    const card_type    = params.get("card_type");
    const amount       = params.get("amount");

    await dbConnect();
    const booking = await Booking.findOne({ transactionId: tran_id })
      .populate("property", "name")
      .populate("roomBookings.room", "roomNumber");

    if (!booking) {
      return NextResponse.redirect(new URL("/booking/fail", process.env.NEXT_PUBLIC_BASE_URL));
    }

    const validation = await validateTransaction(val_id);

    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      const paid = parseFloat(amount || "0");

      if (booking.paymentStatus !== "paid") {
        // Determine if this is a partial payment:
        // Use the actual paid amount vs total amount rather than advancePercent
        // to correctly handle any edge cases with settings changes.
        const isPartial = paid < booking.totalAmount - 1; // 1 BDT tolerance for rounding

        await Booking.findByIdAndUpdate(booking._id, {
          paymentStatus:   isPartial ? "partial" : "paid",
          status:          "confirmed",
          valId:           val_id,
          bankTxnId:       bank_tran_id,
          cardType:        card_type,
          paidAmount:      paid,
          remainingAmount: isPartial ? Math.max(0, booking.totalAmount - paid) : 0,
          updatedAt:       new Date(),
        });

        // Increment coupon usage counter if a coupon was applied
        if (booking.couponId) {
          incrementCouponUsage(booking.couponId.toString()).catch(() => {});
        }

        // Send booking confirmation email to guest
        const guestEmail = booking.primaryGuest?.email;
        if (guestEmail) {
          const rooms = (booking.roomBookings || [])
            .map((rb) => rb.room?.roomNumber ? `#${rb.room.roomNumber}` : null)
            .filter(Boolean);

          const totalSaved =
            (booking.dayLongDiscount  ?? 0) +
            (booking.offerDiscount    ?? 0) +
            (booking.couponDiscount   ?? 0);

          sendBookingConfirmationEmail({
            to:              guestEmail,
            guestName:       booking.primaryGuest.name  || "Guest",
            bookingNumber:   booking.bookingNumber,
            bookingId:       booking._id.toString(),
            propertyName:    booking.property?.name     || "Dhali's Amber Nivaas",
            checkIn:         booking.checkIn,
            checkOut:        booking.checkOut,
            nights:          booking.nights             ?? 0,
            bookingMode:     booking.bookingMode,
            rooms,
            subtotal:        booking.subtotal           ?? 0,
            taxes:           booking.taxes              ?? 0,
            dayLongDiscount: booking.dayLongDiscount    ?? 0,
            offerDiscount:   booking.offerDiscount      ?? 0,
            couponDiscount:  booking.couponDiscount     ?? 0,
            couponCode:      booking.couponCode         || "",
            totalAmount:     booking.totalAmount        ?? 0,
            paidAmount:      paid,
            remainingAmount: isPartial ? Math.max(0, (booking.totalAmount ?? 0) - paid) : 0,
            isPartial,
            totalSaved,
            baseUrl:         process.env.NEXT_PUBLIC_BASE_URL,
          }).catch((err) => console.error("Booking confirmation email failed:", err));
        }

        // Notify admin
        createAdminNotification({
          type:    "payment",
          title:   `Payment received: ${booking.bookingNumber}`,
          message: `৳${paid.toLocaleString("en-BD")} via ${card_type || "Online"}${isPartial ? " (partial)" : ""}`,
          link:    "/admin/bookings",
          metadata: { bookingId: booking._id.toString(), bookingNumber: booking.bookingNumber, paid },
        }).catch(() => {});
      }
    }

    return NextResponse.redirect(
      new URL(`/booking/success?ref=${booking.bookingNumber}`, process.env.NEXT_PUBLIC_BASE_URL)
    );
  } catch (err) {
    console.error("SSL success error:", err);
    return NextResponse.redirect(new URL("/booking/fail", process.env.NEXT_PUBLIC_BASE_URL));
  }
}
