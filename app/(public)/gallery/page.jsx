import GalleryContent from "./GalleryContent";
import { getPublishedGalleryPhotos, getGalleryCategories } from "@/actions/gallery/galleryActions";

export const metadata = {
  title: "Gallery — Dhali's Amber Nivaas",
  description:
    "Explore the beauty of Dhali's Amber Nivaas through our gallery — nature, events, iconic swimming pool, dining, rooms, and amenities captured in every frame.",
};

export default async function GalleryPage() {
  const [photos, cats] = await Promise.all([
    getPublishedGalleryPhotos({ limit: 100 }),
    getGalleryCategories(),
  ]);
  return <GalleryContent photos={photos} categories={cats.map((c) => c.name)} />;
}
