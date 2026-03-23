import { getSettings } from "@/actions/accommodation/settingsActions";
import BookingWizard from "@/components/booking/BookingWizard";

export const metadata = { title: "Book Your Stay — Dhali's Amber Nivaas" };
export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }) {
  const params   = await searchParams;
  const settings = await getSettings();

  // Optional: pre-select a property/category from the "Book Now" buttons on property pages
  const preselect = {
    propertyId: params?.property ?? null,
    categoryId: params?.category ?? null,
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <p className="text-[9.5px] uppercase tracking-[0.3em] text-[#7A2267] font-semibold mb-2">Reservation</p>
          <h1 className="text-[26px] font-bold text-neutral-800">Book Your Stay</h1>
          <p className="text-[13px] text-neutral-400 mt-1">
            Choose your accommodation, dates, and complete your booking in minutes.
          </p>
        </div>

        <BookingWizard
          settings={JSON.parse(JSON.stringify(settings))}
          preselect={preselect}
        />
      </div>
    </main>
  );
}
