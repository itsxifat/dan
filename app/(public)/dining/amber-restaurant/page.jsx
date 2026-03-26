import { getMenuByVenue } from "@/actions/dining/diningActions";
import RestaurantContent from "./RestaurantContent";

export const metadata = {
  title: "Amber Restaurant — Dhali's Amber Nivaas",
  description: "Fine dining with panoramic garden views. Seasonal halal cuisine crafted with local ingredients and artisan care.",
};

export default async function AmberRestaurantPage() {
  const menuItems = await getMenuByVenue("restaurant");
  return <RestaurantContent menuItems={menuItems} />;
}
