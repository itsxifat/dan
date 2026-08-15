import Link from "next/link";

export const metadata = { title: "Payment Failed — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingFailPage({ searchParams }) {
  const params = await searchParams;
  // The reference comes from the URL, not the database: /api/ssl/fail deletes
  // the unpaid booking before redirecting here, so looking it up would always
  // come back empty and the reference would never be shown.
  const ref = typeof params?.ref === "string" ? params.ref : "";

  return (
    <main className="min-h-screen bg-[#fcfcfc] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
              <path d="M8 8l16 16M24 8 8 24" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-neutral-800 mb-2">Payment Failed</h1>
          <p className="text-[14px] text-neutral-500">
            Your payment could not be processed and no charges have been made.
            The rooms have been released, so please start a new booking.
          </p>
        </div>

        {ref && (
          <div className="bg-white border border-neutral-100 rounded-2xl p-5 text-left">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
              Failed Reference
            </p>
            <p className="text-[18px] font-bold text-neutral-700 font-mono">{ref}</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-[12.5px] text-neutral-400">
            Your rooms are no longer held — please book again to secure them.
          </p>
          <Link href="/accommodation"
            className="block w-full py-3 rounded-xl bg-[#7A2267] text-white text-[13.5px] font-semibold
              hover:bg-[#8e2878] transition-colors duration-200">
            Try Another Room
          </Link>
          <Link href="/" className="block text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
