import EventsManager from "./EventsManager";
import { getCorporateEvents } from "@/actions/corporate/corporateActions";

export const metadata = { title: "Corporate Events Gallery — Admin" };

export default async function CorporateEventsPage() {
  const data = await getCorporateEvents({ page: 1, limit: 50 });
  return <EventsManager initialData={data} />;
}
