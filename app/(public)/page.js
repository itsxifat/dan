import Hero from "../../components/ui/Hero";
import AboutSection from "../../components/sections/AboutSection";
import RoomsSection from "../../components/sections/RoomsSection";
import ExperienceSection from "../../components/sections/ExperienceSection";
import GallerySection from "../../components/sections/GallerySection";
import TestimonialsSection from "../../components/sections/TestimonialsSection";
import PackagesSection from "../../components/sections/PackagesSection";
import CorporateSection from "../../components/sections/CorporateSection";
import DiningSection from "../../components/sections/DiningSection";
import CtaSection from "../../components/sections/CtaSection";
import FooterSection from "../../components/sections/FooterSection";
import { getProperties } from "@/actions/accommodation/propertyActions";
import { getPublishedGalleryPhotos } from "@/actions/gallery/galleryActions";

export default async function Home() {
  const [{ properties }, galleryPhotos] = await Promise.all([
    getProperties({ onlyActive: true, limit: 6 }),
    getPublishedGalleryPhotos({ limit: 24 }),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <AboutSection />
      <RoomsSection properties={properties} />
      <ExperienceSection />
      <GallerySection photos={galleryPhotos} />
      <TestimonialsSection />
      <PackagesSection />
      <CorporateSection />
      <DiningSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
