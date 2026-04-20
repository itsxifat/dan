import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getWeddingEnquiries } from "@/actions/wedding/weddingActions";
import EnquiriesManager from "./EnquiriesManager";

export const metadata = { title: "Wedding Enquiries — Admin" };
export const dynamic  = "force-dynamic";

export default async function WeddingEnquiriesPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "settings.write")) redirect("/admin/dashboard");

  const params = await searchParams;
  const status = params?.status || "";

  const data = await getWeddingEnquiries({ page: 1, limit: 50, status });
  return <EnquiriesManager initialData={data} initialStatus={status} />;
}
