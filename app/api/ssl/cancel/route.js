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
      // Delete the pending booking — user cancelled so it was never confirmed
      const booking = await Booking.findOneAndDelete({
        transactionId: tran_id,
        paymentStatus: { $ne: "paid" },
      });

      if (booking) {
        return NextResponse.redirect(
          new URL(`/booking/cancel?ref=${booking.bookingNumber}`, process.env.NEXT_PUBLIC_BASE_URL)
        );
      }
    }

    return NextResponse.redirect(new URL("/booking/cancel", process.env.NEXT_PUBLIC_BASE_URL));
  } catch (err) {
    console.error("SSL cancel error:", err);
    return NextResponse.redirect(new URL("/booking/cancel", process.env.NEXT_PUBLIC_BASE_URL));
  }
}
