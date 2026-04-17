import CorporateContent from "./CorporateContent";
import {
  getPublishedCorporateEvents,
  getPublishedVenues,
  getPublishedBrands,
} from "@/actions/corporate/corporateActions";

export const metadata = {
  title: "Corporate Events & Venues — Dhali's Amber Nivaas",
  description:
    "World-class corporate event venues at Dhali's Amber Nivaas — from intimate boardrooms to grand outdoor fields for 15,000 guests, full catering, and dedicated event coordinators.",
};

export default async function CorporatePage() {
  const [events, venues, brands] = await Promise.all([
    getPublishedCorporateEvents({ limit: 12 }),
    getPublishedVenues(),
    getPublishedBrands(),
  ]);
  return <CorporateContent events={events} venues={venues} brands={brands} />;
}
