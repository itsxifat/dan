import Link from "next/link";
import dbConnect from "@/lib/db";
import Booking from "@/models/Booking";

export const metadata = { title: "Booking Cancelled — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingCancelPage({ searchParams }) {
  const params = await searchParams;
  const ref    = params?.ref;

  let booking = null;
  if (ref) {
    await dbConnect();
    booking = await Booking.findOne({ bookingNumber: ref })
      .populate("property", "name")
      .lean();
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <path d="M16 8v8M16 20v2" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M5 27h22L16 5 5 27Z" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-neutral-800 mb-2">Payment Cancelled</h1>
          <p className="text-[14px] text-neutral-500">
            You cancelled the payment. Your booking is still pending — you can retry or start a new booking.
          </p>
        </div>

        {booking && (
          <div className="bg-white border border-neutral-100 rounded-2xl p-5 text-left">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">Reference</p>
            <p className="text-[18px] font-bold text-neutral-700 font-mono">{booking.bookingNumber}</p>
            <p className="text-[12.5px] text-neutral-500 mt-1">{booking.property?.name}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/accommodation"
            className="block w-full py-3 rounded-xl bg-[#7A2267] text-white text-[13.5px] font-semibold
              hover:bg-[#8e2878] transition-colors duration-200">
            Browse Accommodation
          </Link>
          <Link href="/" className="block text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
