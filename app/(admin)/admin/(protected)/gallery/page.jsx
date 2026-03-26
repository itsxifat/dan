import GalleryManager from "./GalleryManager";
import { getAllGalleryPhotos } from "@/actions/gallery/galleryActions";

export const metadata = { title: "Gallery Manager — Admin" };

export default async function GalleryPage() {
  const data = await getAllGalleryPhotos({ page: 1, limit: 48 });
  return <GalleryManager initialData={data} />;
}
