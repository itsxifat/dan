import CorporateContent from "./CorporateContent";
import { getPublishedCorporateEvents } from "@/actions/corporate/corporateActions";

export const metadata = {
  title: "Corporate Events & Venues — Dhali's Amber Nivaas",
  description:
    "World-class corporate event venues at Dhali's Amber Nivaas — from intimate boardrooms to grand outdoor fields for 15,000 guests, full catering, and dedicated event coordinators.",
};

export default async function CorporatePage() {
  const events = await getPublishedCorporateEvents({ limit: 12 });
  return <CorporateContent events={events} />;
}
