import { getLegalDocument } from "@/actions/legal/legalActions";
import { getContactInfo } from "@/actions/contact/contactActions";
import RefundContent from "./RefundContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Refund & Cancellation Policy — Dhali's Amber Nivaas",
  description:
    "Learn how cancellations, rescheduling, and refunds are handled for bookings made with Dhali's Amber Nivaas.",
};

export default async function RefundPage() {
  const [doc, contactInfo] = await Promise.all([
    getLegalDocument("refund"),
    getContactInfo().catch(() => ({})),
  ]);
  return <RefundContent doc={doc} contactInfo={contactInfo} />;
}
