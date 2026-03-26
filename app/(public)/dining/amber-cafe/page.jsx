import { getMenuByVenue } from "@/actions/dining/diningActions";
import CafeContent from "./CafeContent";

export const metadata = {
  title: "Amber Café — Dhali's Amber Nivaas",
  description: "A warm and cosy café serving freshly brewed beverages, homemade pastries, and light halal bites throughout the day.",
};

export default async function AmberCafePage() {
  const menuItems = await getMenuByVenue("cafe");
  return <CafeContent menuItems={menuItems} />;
}
