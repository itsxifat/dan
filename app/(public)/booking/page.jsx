import { getSettings } from "@/actions/accommodation/settingsActions";
import BookingWizard from "@/components/booking/BookingWizard";
import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });

export const metadata = { title: "Book Your Stay — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }) {
  const params   = await searchParams;
  const settings = await getSettings();

  const preselect = {
    propertyId: params?.property ?? null,
    categoryId: params?.category ?? null,
  };

  return (
    <div className="min-h-screen bg-[#F7F4F0]">
      {/* Hero banner */}
      <div className="relative bg-[#0f0c0e] pt-28 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/uploads/')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-linear-to-b from-[#0f0c0e]/60 via-[#0f0c0e]/40 to-[#0f0c0e]/80" />
        {/* Decorative accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#7A2267]/60 to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#D4A8E0] font-medium mb-3">Reserve Your Stay</p>
          <h1 className={`text-[2.6rem] sm:text-[3.2rem] font-light text-white leading-[1.15] ${cormorant.className}`}>
            Book Your <em className="italic text-[#D4A8E0]">Perfect</em> Escape
          </h1>
          <p className="mt-3 text-[13px] text-white/45 font-light">
            Choose your accommodation, select dates, and complete your reservation.
          </p>
        </div>
      </div>

      {/* Wizard */}
      <div className="max-w-2xl mx-auto px-4 py-10 -mt-6">
        <BookingWizard
          settings={JSON.parse(JSON.stringify(settings))}
          preselect={preselect}
        />
      </div>
    </div>
  );
}
