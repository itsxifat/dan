import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";

export async function POST(req) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const tran_id = params.get("tran_id");

    if (tran_id) {
      await dbConnect();
      const booking = await Booking.findOneAndUpdate(
        { transactionId: tran_id, paymentStatus: { $ne: "paid" } },
        { paymentStatus: "failed", updatedAt: new Date() },
        { new: true }
      );

      if (booking) {
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
