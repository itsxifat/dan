import { getSettings } from "@/actions/accommodation/settingsActions";
import BookingWizard from "@/components/booking/BookingWizard";
import { Cormorant_Garamond, Montserrat } from "next/font/google";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = { title: "Book Your Stay — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }) {
  const params   = await searchParams;
  const settings = await getSettings();

  const preselect = {
    propertyId: params?.property  ?? null,
    categoryId: params?.category  ?? null,
    mode:       params?.mode      ?? null,   // "day_long" | "night_stay" from hero
    date:       params?.date      ?? null,   // single date for day long
    checkIn:    params?.checkIn   ?? null,
    checkOut:   params?.checkOut  ?? null,
    adults:     params?.adults    ? Number(params.adults)   : null,
    children:   params?.children  ? Number(params.children) : null,
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      {/* Hero banner */}
      <div className="relative bg-[#0f0a0d] pt-32 pb-20 px-4 overflow-hidden">
        {/* Background texture layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#3d0a30_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#1a0516_0%,_transparent_70%)]" />
        {/* Thin gold top line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#c9a96e]/70 to-transparent" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#c9a96e]/50" />
            <p className={`${sans.className} text-[9px] uppercase tracking-[0.38em] text-[#c9a96e] font-semibold`}>
              Reserve Your Stay
            </p>
            <div className="h-px w-8 bg-[#c9a96e]/50" />
          </div>
          <h1 className={`text-[2.8rem] sm:text-[3.6rem] font-light text-white leading-[1.1] ${cormorant.className}`}>
            Book Your{" "}
            <em className="italic text-[#D4A8E0]">Perfect</em>{" "}
            Escape
          </h1>
          <p className={`${sans.className} mt-4 text-[12.5px] text-white/35 font-light max-w-sm mx-auto leading-relaxed`}>
            Choose your accommodation, select dates, and complete your reservation in minutes.
          </p>
          {/* Trust badges */}
          <div className={`${sans.className} flex items-center justify-center gap-6 mt-8 text-[10px] text-white/30 uppercase tracking-[0.14em]`}>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 12 14" width="10" height="11" fill="none">
                <path d="M6 1L1 3.5v4C1 10.5 3.2 12.9 6 13.5c2.8-.6 5-3 5-6V3.5L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Secure Booking
            </span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4.5v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Instant Confirmation
            </span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 14 12" width="11" height="10" fill="none">
                <path d="M1 6h12M8 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Free Cancellation
            </span>
          </div>
        </div>
      </div>

      {/* Wizard — wider container to accommodate property/category images */}
      <div className="max-w-3xl mx-auto px-4 py-10 -mt-5">
        <BookingWizard
          settings={JSON.parse(JSON.stringify(settings))}
          preselect={preselect}
        />
      </div>
    </div>
  );
}
