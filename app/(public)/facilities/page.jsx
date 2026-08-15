import { getContactInfo } from "@/actions/contact/contactActions";
import FooterSection from "@/components/sections/FooterSection";
import FacilitiesContent from "./FacilitiesContent";

const FOOTER_BG_URL = "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/2619f896-9fd9-4c28-9119-608bac7073b2.webp";

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
      <FooterSection contactInfo={contactInfo} backgroundImage={FOOTER_BG_URL} />
    </>
  );
}
