import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import RoomCategory from "@/models/RoomCategory";
import { getAllRooms } from "@/actions/accommodation/roomActions";
import RoomsManager from "./RoomsManager";

export const metadata = { title: "Rooms — Admin" };
export const dynamic  = "force-dynamic";

export default async function RoomsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.read")) redirect("/admin/dashboard");

  const params = await searchParams;
  const filterPropertyId = params?.property ?? null;
  const filterCategoryId = params?.category ?? null;

  await dbConnect();
  const [properties, categories, rooms] = await Promise.all([
    Property.find({}).sort({ name: 1 }).lean(),
    RoomCategory.find(filterPropertyId ? { property: filterPropertyId } : {})
      .sort({ name: 1 }).lean(),
    getAllRooms({ propertyId: filterPropertyId, categoryId: filterCategoryId }),
  ]);

  const canWrite = hasPermission(session.user.role, "accommodation.write");

  return (
    <div className="p-5 sm:p-7 max-w-7xl">
      <RoomsManager
        rooms={rooms}
        properties={JSON.parse(JSON.stringify(properties))}
        categories={JSON.parse(JSON.stringify(categories))}
        filterPropertyId={filterPropertyId}
        filterCategoryId={filterCategoryId}
        canWrite={canWrite}
      />
    </div>
  );
}
