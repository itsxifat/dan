import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import Settings from "@/models/Settings";

export async function POST(req) {
  try {
    const { bookingId } = await req.json();

    await dbConnect();
    const booking = await Booking.findById(bookingId)
      .populate("property", "name location")
      .populate("category", "name")
      .lean();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const tran_id = `DAN-${booking._id}-${Date.now()}`;
    const settings = await Settings.findOne().lean();
    const advancePct = settings?.advancePaymentPercent ?? 30;
    const advanceAmount = Math.ceil((booking.totalAmount * advancePct) / 100);
    await Booking.findByIdAndUpdate(bookingId, {
      transactionId: tran_id,
      advanceAmount,
      updatedAt: new Date(),
    });

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
      total_amount:     advanceAmount.toString(),
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

    return NextResponse.json({ GatewayPageURL: data.GatewayPageURL });
  } catch (err) {
    console.error("SSL initiate error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
