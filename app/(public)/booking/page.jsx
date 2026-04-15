import { getSettings } from "@/actions/accommodation/settingsActions";
import BookingWizard from "@/components/booking/BookingWizard";

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
      {/* Wizard */}
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-10">
        <BookingWizard
          settings={JSON.parse(JSON.stringify(settings))}
          preselect={preselect}
        />
      </div>
    </div>
  );
}
