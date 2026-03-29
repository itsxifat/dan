// IPN — Instant Payment Notification (server-to-server, no redirect)
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";

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
        const paid = parseFloat(amount || "0");
        const booking = await Booking.findOne({ transactionId: tran_id });
        if (booking && booking.paymentStatus !== "paid") {
          const isPartial = booking.advancePercent < 100;
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
        }
      }
    } else if (status === "FAILED") {
      // Delete the pending booking — it was never confirmed
      await Booking.findOneAndDelete({
        transactionId: tran_id,
        paymentStatus: { $ne: "paid" },
      });
    }

    // SSLCommerz requires HTTP 200 response
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("SSL IPN error:", err);
    return new Response("OK", { status: 200 }); // always 200 to prevent retries
  }
}
