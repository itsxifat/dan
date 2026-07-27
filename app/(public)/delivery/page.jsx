import { getLegalDocument } from "@/actions/legal/legalActions";
import { getContactInfo } from "@/actions/contact/contactActions";
import DeliveryContent from "./DeliveryContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Delivery Policy — Dhali's Amber Nivaas",
  description:
    "Learn how booking confirmations are delivered and how your reserved stay or package is fulfilled at Dhali's Amber Nivaas.",
};

export default async function DeliveryPage() {
  const [doc, contactInfo] = await Promise.all([
    getLegalDocument("delivery"),
    getContactInfo().catch(() => ({})),
  ]);
  return <DeliveryContent doc={doc} contactInfo={contactInfo} />;
}
