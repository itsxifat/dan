import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAmenities } from "@/actions/accommodation/amenityActions";
import AmenityManager from "@/components/admin/accommodation/AmenityManager";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Amenities — Admin" };
export const dynamic  = "force-dynamic";

export default async function AmenitiesPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.write")) redirect("/admin/accommodation");

  const amenities = await getAmenities();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Amenities"
        subtitle="Define amenity icons here, then attach them to any property"
        count={`${amenities.length} defined`}
      />
      <AmenityManager initialAmenities={amenities} />
    </div>
  );
}
