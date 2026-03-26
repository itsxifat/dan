import VisitsManager from "./VisitsManager";
import { getVisitRequests } from "@/actions/corporate/corporateActions";

export const metadata = { title: "Corporate Visit Requests — Admin" };

export default async function VisitsPage({ searchParams }) {
  const params = await searchParams;
  const page   = Number(params?.page)   || 1;
  const status = params?.status || "";
  const data   = await getVisitRequests({ page, limit: 20, status });
  return <VisitsManager initialData={data} initialStatus={status} />;
}
