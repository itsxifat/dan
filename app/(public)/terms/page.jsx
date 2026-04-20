import { getLegalDocument } from "@/actions/legal/legalActions";
import { getContactInfo } from "@/actions/contact/contactActions";
import TermsContent from "./TermsContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms & Conditions — Dhali's Amber Nivaas",
  description:
    "Read the Terms & Conditions governing your use of Dhali's Amber Nivaas services, bookings, and website.",
};

export default async function TermsPage() {
  const [doc, contactInfo] = await Promise.all([
    getLegalDocument("terms"),
    getContactInfo().catch(() => ({})),
  ]);
  return <TermsContent doc={doc} contactInfo={contactInfo} />;
}
