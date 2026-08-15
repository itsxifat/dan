// IPN — Instant Payment Notification (server-to-server, no redirect).
//
// This is the only notification we get when a guest closes the tab after paying,
// so it must do everything the success redirect does: confirm the booking, send
// the confirmation email, count the coupon and release the room hold. Both paths
// share settleBookingPayment(), which guarantees that happens exactly once.
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";
import { settleBookingPayment } from "@/lib/settleBookingPayment";
import { releaseLocksForBooking } from "@/lib/releaseBookingLocks";

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
    const params  = new URLSearchParams(text);
    const val_id  = params.get("val_id");
    const tran_id = params.get("tran_id");
    const status  = params.get("status");
    const amount  = params.get("amount");
    const bank_tran_id = params.get("bank_tran_id");
    const card_type    = params.get("card_type");

    await dbConnect();

    if (status === "VALID" || status === "VALIDATED") {
      const validation = await validateTransaction(val_id);

      if (validation.status === "VALID" || validation.status === "VALIDATED") {
        await settleBookingPayment({
          tranId:    tran_id,
          valId:     val_id,
          bankTxnId: bank_tran_id,
          cardType:  card_type,
          amount,
        });
      }
    } else if (status === "FAILED") {
      // Drop the booking — it was never confirmed. Only ever an untouched
      // pending booking: a "partial" status means real money was taken.
      const booking = await Booking.findOneAndDelete({
        transactionId: tran_id,
        status:        "pending",
        paymentStatus: "unpaid",
      });
      // Hand the rooms straight back rather than holding them until the TTL.
      if (booking) await releaseLocksForBooking(booking).catch(() => {});
    }

    // SSLCommerz requires HTTP 200 response
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("SSL IPN error:", err);
    return new Response("OK", { status: 200 }); // always 200 to prevent retries
  }
}
