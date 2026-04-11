import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getCorporateEvents } from "@/actions/corporate/corporateActions";
import EventsManager from "./EventsManager";

export const metadata = { title: "Events Gallery — Admin" };
export const dynamic  = "force-dynamic";

export default async function CorporateEventsPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "corporate.read")) redirect("/admin/dashboard");

  const data = await getCorporateEvents({ page: 1, limit: 50 });
  return <EventsManager initialData={data} />;
}
