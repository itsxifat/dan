import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getDayLongPackages } from "@/actions/accommodation/dayLongPackageActions";
import DayLongPackagesManager from "@/components/admin/DayLongPackagesManager";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Day-Long Packages — Admin" };
export const dynamic  = "force-dynamic";

export default async function DayLongPackagesPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.read")) redirect("/admin/dashboard");

  const packages = await getDayLongPackages();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <PageHeader
        title="Day-Long Packages"
        subtitle="Manage entry, swimming and experience packages offered to guests"
        count={`${packages.length} package${packages.length !== 1 ? "s" : ""}`}
      />
      <DayLongPackagesManager packages={packages} />
    </div>
  );
}
