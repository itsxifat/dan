import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAllMenuItems } from "@/actions/dining/diningActions";
import MenuManager from "./MenuManager";

export const metadata = { title: "Menu Manager — Admin" };
export const dynamic  = "force-dynamic";

export default async function DiningAdminPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "dining.read")) redirect("/admin/dashboard");

  const menuItems = await getAllMenuItems();
  return <MenuManager initialItems={menuItems} />;
}
