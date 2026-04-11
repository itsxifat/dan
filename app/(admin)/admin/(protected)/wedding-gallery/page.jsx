import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAllWeddingPhotos } from "@/actions/wedding/weddingActions";
import WeddingGalleryManager from "./WeddingGalleryManager";

export const metadata = { title: "Wedding Gallery — Admin" };
export const dynamic  = "force-dynamic";

export default async function WeddingGalleryPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "dashboard.read")) redirect("/admin/login");

  const data = await getAllWeddingPhotos({ page: 1, limit: 48 });
  return <WeddingGalleryManager initialData={data} />;
}
