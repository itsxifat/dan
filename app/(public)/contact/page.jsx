import { getContactInfo } from "@/actions/contact/contactActions";
import ContactContent from "./ContactContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact Us — Dhali's Amber Nivaas",
  description:
    "Get in touch with Dhali's Amber Nivaas — reach us for reservations, corporate events, destination weddings, or general enquiries. We'd love to hear from you.",
};

export default async function ContactPage() {
  const info = await getContactInfo();
  return <ContactContent info={info} mapsApiKey={process.env.GOOGLE_MAPS_EMBED_API_KEY || ""} />;
}
