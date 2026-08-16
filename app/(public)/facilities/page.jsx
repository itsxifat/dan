import { getContactInfo } from "@/actions/contact/contactActions";
import FooterSection from "@/components/sections/FooterSection";
import FacilitiesContent from "./FacilitiesContent";

export const metadata = {
  title: "Facilities & Amenities — Dhali's Amber Nivaas",
  description:
    "Discover the facilities at Dhali's Amber Nivaas — swimming pools, indoor entertainment, kids' play zones, and the Amber Restaurant and Café.",
};

export const dynamic = "force-dynamic";

export default async function FacilitiesPage() {
  const contactInfo = await getContactInfo().catch(() => ({}));

  return (
    <>
      <FacilitiesContent />
      <FooterSection contactInfo={contactInfo} />
    </>
  );
}
