import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { settleBookingPayment } from "@/lib/settleBookingPayment";

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
    const booking = await Booking.findOne({ transactionId: tran_id }).select("bookingNumber").lean();

    if (!booking) {
      return NextResponse.redirect(new URL("/booking/fail", process.env.NEXT_PUBLIC_BASE_URL));
    }

    const validation = await validateTransaction(val_id);

    if (validation.status === "VALID" || validation.status === "VALIDATED") {
      // Shared with the IPN handler — whichever arrives first settles the
      // booking and sends the confirmation; the other is a no-op.
      await settleBookingPayment({
        tranId:    tran_id,
        valId:     val_id,
        bankTxnId: bank_tran_id,
        cardType:  card_type,
        amount,
      });
    }

    return NextResponse.redirect(
      new URL(`/booking/success?ref=${booking.bookingNumber}`, process.env.NEXT_PUBLIC_BASE_URL)
    );
  } catch (err) {
    console.error("SSL success error:", err);
    return NextResponse.redirect(new URL("/booking/fail", process.env.NEXT_PUBLIC_BASE_URL));
  }
}
