import WeddingContent from "./WeddingContent";
import { getPublishedWeddingPhotos } from "@/actions/wedding/weddingActions";
import { getPublishedVenues } from "@/actions/wedding/venueActions";

export const metadata = {
  title: "Destination Wedding — Dhali's Amber Nivaas",
  description:
    "Celebrate your dream wedding at Dhali's Amber Nivaas — stunning venues for Nikah, Holud, and grand receptions, bespoke halal catering, on-site accommodation, and dedicated wedding planners.",
};

export default async function DestinationWeddingPage() {
  const [photos, venues] = await Promise.all([
    getPublishedWeddingPhotos({ limit: 60 }),
    getPublishedVenues(),
  ]);
  return <WeddingContent photos={photos} venues={venues} />;
}
