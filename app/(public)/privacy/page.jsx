import { getLegalDocument } from "@/actions/legal/legalActions";
import { getContactInfo } from "@/actions/contact/contactActions";
import PrivacyContent from "./PrivacyContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy — Dhali's Amber Nivaas",
  description:
    "Learn how Dhali's Amber Nivaas collects, uses, and protects your personal information.",
};

export default async function PrivacyPage() {
  const [doc, contactInfo] = await Promise.all([
    getLegalDocument("privacy"),
    getContactInfo().catch(() => ({})),
  ]);
  return <PrivacyContent doc={doc} contactInfo={contactInfo} />;
}
