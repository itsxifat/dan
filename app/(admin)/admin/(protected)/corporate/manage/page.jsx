import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import {
  getCorporateEvents,
  getCorporateVenues,
  getCorporateBrands,
} from "@/actions/corporate/corporateActions";
import CorporateManager from "./CorporateManager";

export const metadata = { title: "Corporate Manager — Admin" };
export const dynamic  = "force-dynamic";

export default async function CorporateManagePage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "corporate.read")) redirect("/admin/dashboard");

  const [eventsData, venues, brands] = await Promise.all([
    getCorporateEvents({ page: 1, limit: 50 }),
    getCorporateVenues(),
    getCorporateBrands(),
  ]);

  return (
    <CorporateManager
      initialEvents={eventsData?.events || []}
      initialVenues={venues || []}
      initialBrands={brands || []}
    />
  );
}
