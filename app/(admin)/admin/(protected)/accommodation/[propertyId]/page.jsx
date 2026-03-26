import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { getCategoriesByProperty } from "@/actions/accommodation/categoryActions";
import { getRoomsByCategory } from "@/actions/accommodation/roomActions";
import PropertyEditTabs from "./PropertyEditTabs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { propertyId } = await params;
  await dbConnect();
  const p = await Property.findById(propertyId).lean();
  return { title: `${p?.name ?? "Property"} — Admin` };
}

export default async function PropertyEditPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "accommodation.read")) redirect("/admin/accommodation");

  const { propertyId } = await params;

  await dbConnect();
  const property = await Property.findById(propertyId).lean();
  if (!property) notFound();

  const canWrite = hasPermission(session.user.role, "accommodation.write");
  const serialised = JSON.parse(JSON.stringify(property));

  // For buildings, load categories + all rooms
  let categories = [];
  let roomsByCategory = {};

  if (property.type === "building") {
    categories = await getCategoriesByProperty(propertyId);
    const allRooms = await Promise.all(
      categories.map((cat) => getRoomsByCategory(cat._id))
    );
    categories.forEach((cat, i) => {
      roomsByCategory[cat._id] = allRooms[i];
    });
  }

  const serialisedCategories   = JSON.parse(JSON.stringify(categories));
  const serialisedRoomsByCategory = JSON.parse(JSON.stringify(roomsByCategory));

  return (
    <div className="p-6 lg:p-8">
      <PropertyEditTabs
        property={serialised}
        categories={serialisedCategories}
        roomsByCategory={serialisedRoomsByCategory}
        canWrite={canWrite}
      />
    </div>
  );
}
