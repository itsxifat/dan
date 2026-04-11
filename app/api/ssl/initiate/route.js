import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import Room from "@/models/Room";
import RoomCategory from "@/models/RoomCategory";
import Settings from "@/models/Settings";

// ─── Pre-payment server-side validation ───────────────────────────────────────
async function validateBookingBeforePayment(booking) {
  const issues = [];

  // 1. Check each room is still available
  if (booking.roomBookings?.length > 0) {
    for (const rb of booking.roomBookings) {
      const room = await Room.findById(rb.room).lean();
      if (!room) {
        issues.push("One of your selected rooms no longer exists. Please start a new booking.");
        continue;
      }
      if (room.status === "maintenance") {
        issues.push(
          `Room #${room.roomNumber} is currently under maintenance and unavailable. Please start a new booking with a different room.`
        );
        continue;
      }

      // Check for conflicting confirmed bookings (excluding this booking)
      const conflict = await Booking.exists({
        "roomBookings.room": rb.room,
        _id: { $ne: booking._id },
        status: { $nin: ["cancelled", "no_show", "pending"] },
        checkIn:  { $lt: new Date(booking.checkOut) },
        checkOut: { $gt: new Date(booking.checkIn) },
      });
      if (conflict) {
        issues.push(
          `Room #${room.roomNumber} is no longer available for your selected dates — it was just booked by another guest. Please start a new booking.`
        );
      }
    }
  }

  // 2. Validate coupon still active and not expired
  if (booking.couponId) {
    const Discount = (await import("@/models/Discount")).default;
    const coupon = await Discount.findById(booking.couponId).lean();
    const now = new Date();

    if (!coupon || !coupon.isActive) {
      issues.push(
        `The coupon "${booking.couponCode}" is no longer active. Your booking total needs to be recalculated. Please start a new booking.`
      );
    } else if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
      issues.push(
        `The coupon "${booking.couponCode}" has expired. Please start a new booking without the coupon.`
      );
    } else if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      issues.push(
        `The coupon "${booking.couponCode}" has reached its maximum usage limit. Please start a new booking without the coupon.`
      );
    }
  }

  // 3. Validate auto-offer still active
  if (booking.offerId) {
    const Discount = (await import("@/models/Discount")).default;
    const offer = await Discount.findById(booking.offerId).lean();
    const now = new Date();

    if (!offer || !offer.isActive) {
      issues.push(
        "The promotional offer applied to your booking is no longer active. Your total has changed. Please start a new booking."
      );
    } else if (now < new Date(offer.validFrom) || now > new Date(offer.validTo)) {
      issues.push(
        "The promotional offer has expired. Please start a new booking."
      );
    }
  }

  return issues;
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingId, amount: requestedAmount } = body;

    await dbConnect();

    const booking = await Booking.findById(bookingId)
      .populate("property", "name location")
      .populate("category", "name")
      .lean();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "This booking has already been fully paid." }, { status: 400 });
    }
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "This booking has been cancelled and cannot be paid." }, { status: 400 });
    }

    // ── Run pre-payment validations ──────────────────────────────────────────
    const validationErrors = await validateBookingBeforePayment(booking);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: validationErrors[0],
          errors: validationErrors,
          validationFailed: true,
        },
        { status: 422 }
      );
    }

    // ── Determine charge amount ──────────────────────────────────────────────
    const tran_id = `DAN-${booking._id}-${Date.now()}`;

    let chargeAmount = requestedAmount;
    if (!chargeAmount || chargeAmount <= 0) {
      const settings = await Settings.findOne().lean();
      const advancePct = settings?.advancePaymentPercent ?? 30;
      chargeAmount = Math.ceil((booking.totalAmount * advancePct) / 100);
    }

    await Booking.findByIdAndUpdate(bookingId, {
      transactionId: tran_id,
      advanceAmount: chargeAmount,
      updatedAt: new Date(),
    });

    // ── Initiate SSL Commerz ────────────────────────────────────────────────
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
    const sslUrl = isLive
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

    const base = process.env.NEXT_PUBLIC_BASE_URL;
    const productName = booking.category
      ? `${booking.property?.name} - ${booking.category?.name}`
      : `${booking.property?.name} (Cottage)`;

    const params = new URLSearchParams({
      store_id:         process.env.SSLCOMMERZ_STORE_ID,
      store_passwd:     process.env.SSLCOMMERZ_STORE_PASSWORD,
      total_amount:     chargeAmount.toString(),
      currency:         "BDT",
      tran_id,
      success_url:      `${base}/api/ssl/success`,
      fail_url:         `${base}/api/ssl/fail`,
      cancel_url:       `${base}/api/ssl/cancel`,
      ipn_url:          `${base}/api/ssl/ipn`,
      cus_name:         booking.primaryGuest.name,
      cus_email:        booking.primaryGuest.email,
      cus_phone:        booking.primaryGuest.phone,
      cus_add1:         booking.property?.location || "Bangladesh",
      cus_city:         "Dhaka",
      cus_country:      "Bangladesh",
      ship_name:        booking.primaryGuest.name,
      ship_add1:        booking.property?.location || "Bangladesh",
      ship_city:        "Dhaka",
      ship_country:     "Bangladesh",
      product_name:     productName,
      product_category: "Hotel Booking",
      product_profile:  "non-physical-goods",
    });

    const res = await fetch(sslUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (data.status !== "SUCCESS") {
      return NextResponse.json(
        { error: data.failedreason || "Payment gateway error. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: data.GatewayPageURL });
  } catch (err) {
    console.error("SSL initiate error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
