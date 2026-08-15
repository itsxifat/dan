import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { releaseLocksForBooking } from "@/lib/releaseBookingLocks";

export async function POST(req) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const tran_id = params.get("tran_id");

    if (tran_id) {
      await dbConnect();
      // Drop the booking — payment failed so it was never real. Only ever an
      // untouched pending booking: a "partial" status means real money was
      // taken and that record must survive.
      const booking = await Booking.findOneAndDelete({
        transactionId: tran_id,
        status:        "pending",
        paymentStatus: "unpaid",
      });

      if (booking) {
        // Hand the rooms straight back rather than holding them until the TTL.
        await releaseLocksForBooking(booking).catch(() => {});
        return NextResponse.redirect(
          new URL(`/booking/fail?ref=${booking.bookingNumber}`, process.env.NEXT_PUBLIC_BASE_URL)
        );
      }
    }

    return NextResponse.redirect(new URL("/booking/fail", process.env.NEXT_PUBLIC_BASE_URL));
  } catch (err) {
    console.error("SSL fail error:", err);
    return NextResponse.redirect(new URL("/booking/fail", process.env.NEXT_PUBLIC_BASE_URL));
  }
}
