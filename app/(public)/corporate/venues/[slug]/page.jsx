import { notFound } from "next/navigation";
import { getVenueBySlug, getPublishedVenues } from "@/actions/corporate/corporateActions";
import VenueDetailContent from "./VenueDetailContent";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return { title: "Venue Not Found" };
  return {
    title: `${venue.name} — Corporate Venues · Dhali's Amber Nivaas`,
    description: venue.description || `Explore ${venue.name} for your next corporate event at Dhali's Amber Nivaas.`,
  };
}

export default async function CorporateVenuePage({ params }) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();
  return <VenueDetailContent venue={venue} />;
}
