import WeddingVenueManager from "./WeddingVenueManager";
import { getAllVenues } from "@/actions/wedding/venueActions";

export const metadata = { title: "Wedding Venues — Admin" };

export default async function WeddingVenuesPage() {
  const venues = await getAllVenues();
  return <WeddingVenueManager initialVenues={venues} />;
}
