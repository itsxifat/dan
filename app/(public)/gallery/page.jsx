import GalleryContent from "./GalleryContent";
import FooterSection from "@/components/sections/FooterSection";
import { getPublishedGalleryPhotos, getGalleryCategories } from "@/actions/gallery/galleryActions";
import { getContactInfo } from "@/actions/contact/contactActions";

export const metadata = {
  title: "Gallery — Dhali's Amber Nivaas",
  description:
    "Explore the beauty of Dhali's Amber Nivaas through our gallery — nature, events, iconic swimming pool, dining, rooms, and amenities captured in every frame.",
};

export default async function GalleryPage() {
  const [photos, cats, contactInfo] = await Promise.all([
    getPublishedGalleryPhotos({ limit: 100 }),
    getGalleryCategories(),
    getContactInfo().catch(() => ({})),
  ]);
  return (
    <>
      <GalleryContent photos={photos} categories={cats.map((c) => c.name)} />
      <FooterSection contactInfo={contactInfo} />
    </>
  );
}
