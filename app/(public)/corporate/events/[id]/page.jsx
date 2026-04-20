import { notFound } from "next/navigation";
import { getCorporateEventById } from "@/actions/corporate/corporateActions";
import EventDetailContent from "./EventDetailContent";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await getCorporateEventById(id);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} — Corporate Events | Dhali's Amber Nivaas`,
    description: event.description || `${event.title} — a corporate event hosted at Dhali's Amber Nivaas.`,
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const event = await getCorporateEventById(id);
  if (!event) notFound();
  return <EventDetailContent event={event} />;
}
