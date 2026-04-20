import { getProperties } from "@/actions/accommodation/propertyActions";
import AccommodationContent from "./AccommodationContent";

export const metadata = {
  title: "Accommodation — Dhali's Amber Nivaas",
  description: "Explore our premium buildings, suites, and private cottages. Every space crafted for luxury and comfort.",
};

export const dynamic = "force-dynamic";

export default async function AccommodationListPage() {
  const { properties } = await getProperties({ onlyActive: true, limit: 50 });

  const buildings = properties.filter((p) => p.type === "building");
  const cottages  = properties.filter((p) => p.type === "cottage");

  return (
    <AccommodationContent
      buildings={JSON.parse(JSON.stringify(buildings))}
      cottages={JSON.parse(JSON.stringify(cottages))}
    />
  );
}
