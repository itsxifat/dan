import { getAllMenuItems } from "@/actions/dining/diningActions";
import MenuManager from "./MenuManager";

export const metadata = {
  title: "Menu Manager — Admin",
};

export default async function DiningAdminPage() {
  const menuItems = await getAllMenuItems();
  return <MenuManager initialItems={menuItems} />;
}
