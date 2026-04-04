import { notFound } from "next/navigation";
import { getVenueBySlug, getPublishedVenues } from "@/actions/wedding/venueActions";
import VenueDetail from "./VenueDetail";

export async function generateStaticParams() {
  const venues = await getPublishedVenues();
  return venues.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return { title: "Venue Not Found" };
  return {
    title: `${venue.name} — Destination Wedding · Dhali's Amber Nivaas`,
    description: venue.description || `Explore ${venue.name} at Dhali's Amber Nivaas.`,
  };
}

export default async function VenuePage({ params }) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();
  return <VenueDetail venue={venue} />;
}
