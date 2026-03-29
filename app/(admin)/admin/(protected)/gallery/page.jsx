import GalleryManager from "./GalleryManager";
import { getAllGalleryPhotos, getGalleryCategories } from "@/actions/gallery/galleryActions";

export const metadata = { title: "Gallery Manager — Admin" };

export default async function GalleryPage() {
  const [data, categories] = await Promise.all([
    getAllGalleryPhotos({ page: 1, limit: 48 }),
    getGalleryCategories(),
  ]);
  return <GalleryManager initialData={data} initialCategories={categories} />;
}
