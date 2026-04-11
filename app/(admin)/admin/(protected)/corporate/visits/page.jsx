import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getVisitRequests } from "@/actions/corporate/corporateActions";
import VisitsManager from "./VisitsManager";

export const metadata = { title: "Visit Requests — Admin" };
export const dynamic  = "force-dynamic";

export default async function VisitsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "corporate.read")) redirect("/admin/dashboard");

  const params = await searchParams;
  const page   = Number(params?.page) || 1;
  const status = params?.status || "";

  const data = await getVisitRequests({ page, limit: 20, status });
  return <VisitsManager initialData={data} initialStatus={status} />;
}
