import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAllGalleryPhotos, getGalleryCategories } from "@/actions/gallery/galleryActions";
import GalleryManager from "./GalleryManager";

export const metadata = { title: "Gallery — Admin" };
export const dynamic  = "force-dynamic";

export default async function GalleryPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "dashboard.read")) redirect("/admin/login");

  const [data, categories] = await Promise.all([
    getAllGalleryPhotos({ page: 1, limit: 48 }),
    getGalleryCategories(),
  ]);

  return <GalleryManager initialData={data} initialCategories={categories} />;
}
