import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getPropertyRoomStats, getRoomsOverview, getTodayMovements } from "@/actions/admin/roomManagementActions";
import { getProperties } from "@/actions/accommodation/propertyActions";
import PageHeader from "@/components/admin/PageHeader";
import RoomManagementClient from "./RoomManagementClient";

export const metadata = { title: "Room Management — Admin" };
export const dynamic  = "force-dynamic";

export default async function RoomManagementPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "bookings.read")) redirect("/admin/dashboard");

  const params     = await searchParams;
  const propertyId = params?.property || "";
  const status     = params?.status   || "";
  const floor      = params?.floor    || "";
  const block      = params?.block    || "";
  const categoryId = params?.category || "";
  const canWrite   = hasPermission(session.user.role, "bookings.write");

  const [{ properties }, stats, rooms, { arrivals, departures }] = await Promise.all([
    getProperties({ limit: 100 }),
    getPropertyRoomStats(propertyId || null),
    getRoomsOverview({ propertyId: propertyId || null, status, floor, block, categoryId }),
    getTodayMovements(propertyId || null),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Room Management"
        subtitle="Live occupancy, offline bookings & full room control"
        count={`${stats.total} rooms`}
      />
      <RoomManagementClient
        initialRooms={rooms}
        stats={stats}
        arrivals={arrivals}
        departures={departures}
        properties={properties}
        selectedProperty={propertyId}
        selectedStatus={status}
        selectedFloor={floor}
        selectedBlock={block}
        selectedCategory={categoryId}
        canWrite={canWrite}
      />
    </div>
  );
}
