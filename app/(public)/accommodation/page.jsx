import { getProperties } from "@/actions/accommodation/propertyActions";
import { getContactInfo } from "@/actions/contact/contactActions";
import FooterSection from "@/components/sections/FooterSection";
import AccommodationContent from "./AccommodationContent";

const FOOTER_BG_URL = "https://cdn.enfinito.cloud/d/6a251d4e32301ad14f20869a/f5262688-c246-4696-a5f5-0b171d8ad0ad.webp";

export const metadata = {
  title: "Accommodation — Dhali's Amber Nivaas",
  description: "Explore our premium buildings, suites, and private cottages. Every space crafted for luxury and comfort.",
};

export const dynamic = "force-dynamic";

export default async function AccommodationListPage() {
  const [{ properties }, contactInfo] = await Promise.all([
    getProperties({ onlyActive: true, limit: 50 }),
    getContactInfo().catch(() => ({})),
  ]);

  const buildings = properties.filter((p) => p.type === "building");
  const cottages  = properties.filter((p) => p.type === "cottage");

  return (
    <>
      <AccommodationContent
        buildings={JSON.parse(JSON.stringify(buildings))}
        cottages={JSON.parse(JSON.stringify(cottages))}
      />
      <FooterSection contactInfo={contactInfo} backgroundImage={FOOTER_BG_URL} />
    </>
  );
}
