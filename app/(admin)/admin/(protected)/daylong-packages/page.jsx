import { getDayLongPackages } from "@/actions/accommodation/dayLongPackageActions";
import DayLongPackagesManager from "@/components/admin/DayLongPackagesManager";

export const metadata = { title: "Day Long Packages — Admin" };
export const dynamic = "force-dynamic";

export default async function DayLongPackagesPage() {
  const packages = await getDayLongPackages();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-semibold text-white/90 mb-1">Day Long Packages</h1>
          <p className="text-[12.5px] text-white/30">
            Manage day-long experience packages (Entry, Swimming, etc.) offered to guests.
          </p>
        </div>
      </div>
      <DayLongPackagesManager packages={packages} />
    </div>
  );
}
