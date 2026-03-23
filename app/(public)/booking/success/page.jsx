import Link from "next/link";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";

export const metadata = { title: "Booking Confirmed — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ searchParams }) {
  const params = await searchParams;
  const ref    = params?.ref;
  const method = params?.method; // "desk" if pay-at-desk

  let booking = null;
  if (ref) {
    await dbConnect();
    booking = await Booking.findOne({ bookingNumber: ref })
      .populate("property", "name location")
      .populate("category", "name")
      .lean();
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "";
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg viewBox="0 0 32 32" width="36" height="36" fill="none">
              <path d="M5 17l7 7L27 9" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-neutral-800 mb-2">
            {method === "desk" ? "Booking Confirmed!" : "Payment Successful!"}
          </h1>
          <p className="text-[14px] text-neutral-500">
            {method === "desk"
              ? "Your reservation is confirmed. Please pay at the front desk upon arrival."
              : "Your payment has been processed and your booking is confirmed."
            }
          </p>
        </div>

        {booking && (
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 text-left space-y-3 shadow-sm">
            <div className="text-center pb-3 border-b border-neutral-100">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1">Booking Number</p>
              <p className="text-[22px] font-bold text-[#7A2267] font-mono">{booking.bookingNumber}</p>
            </div>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Property</dt>
                <dd className="font-medium text-neutral-700">{booking.property?.name}</dd>
              </div>
              {booking.category && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Category</dt>
                  <dd className="font-medium text-neutral-700">{booking.category.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">Check-in</dt>
                <dd className="font-medium text-neutral-700">{fmtDate(booking.checkIn)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Check-out</dt>
                <dd className="font-medium text-neutral-700">{fmtDate(booking.checkOut)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Nights</dt>
                <dd className="font-medium text-neutral-700">{booking.nights}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 font-bold">
                <dt className="text-neutral-700">Total</dt>
                <dd className="text-[#7A2267]">৳{booking.totalAmount?.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[12px] text-neutral-400">
            A confirmation has been sent to <strong className="text-neutral-600">{booking?.primaryGuest?.email}</strong>
          </p>
          <Link href="/accommodation"
            className="block w-full py-3 rounded-xl bg-[#7A2267] text-white text-[13.5px] font-semibold
              hover:bg-[#8e2878] transition-colors duration-200">
            Browse More Accommodation
          </Link>
          <Link href="/" className="block text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
