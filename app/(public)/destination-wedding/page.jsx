import WeddingContent from "./WeddingContent";
import FooterSection from "@/components/sections/FooterSection";
import { getPublishedWeddingPhotos } from "@/actions/wedding/weddingActions";
import { getPublishedVenues } from "@/actions/wedding/venueActions";
import { getContactInfo } from "@/actions/contact/contactActions";

export const metadata = {
  title: "Destination Wedding — Dhali's Amber Nivaas",
  description:
    "Celebrate your dream wedding at Dhali's Amber Nivaas — stunning venues for Nikah, Holud, and grand receptions, bespoke halal catering, on-site accommodation, and dedicated wedding planners.",
};

export default async function DestinationWeddingPage() {
  const [photos, venues, contactInfo] = await Promise.all([
    getPublishedWeddingPhotos({ limit: 60 }),
    getPublishedVenues(),
    getContactInfo().catch(() => ({})),
  ]);
  return (
    <>
      <WeddingContent photos={photos} venues={venues} />
      <FooterSection contactInfo={contactInfo} />
    </>
  );
}
