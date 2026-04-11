import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAllVenues } from "@/actions/wedding/venueActions";
import WeddingVenueManager from "./WeddingVenueManager";

export const metadata = { title: "Wedding Venues — Admin" };
export const dynamic  = "force-dynamic";

export default async function WeddingVenuesPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "dashboard.read")) redirect("/admin/login");

  const venues = await getAllVenues();
  return <WeddingVenueManager initialVenues={venues} />;
}
